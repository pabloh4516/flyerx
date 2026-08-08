<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Application\Identity\DTOs\AuthResultDTO;
use App\Application\Identity\DTOs\DeviceInfoDTO;
use App\Application\Identity\DTOs\LoginDTO;
use App\Application\Identity\DTOs\RegisterUserDTO;
use App\Application\Identity\DTOs\UserDTO;
use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Events\UserLoggedIn;
use App\Domain\Identity\Events\UserLoggedOut;
use App\Domain\Identity\Events\UserLoginFailed;
use App\Domain\Identity\Events\UserRegistered;
use App\Domain\Identity\Exceptions\InvalidCredentialsException;
use App\Domain\Identity\Exceptions\TwoFactorRequiredException;
use App\Domain\Identity\Exceptions\UserBlockedException;
use App\Domain\Identity\Repositories\TwoFactorRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Identity\ValueObjects\PhoneNumber;
use App\Domain\Identity\ValueObjects\TaxNumber;
use App\Domain\Shared\ValueObjects\Uuid;
use DateTimeImmutable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

class AuthenticationService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly TwoFactorRepositoryInterface $twoFactorRepository,
        private readonly TokenService $tokenService,
        private readonly DeviceTrackingService $deviceTrackingService,
        private readonly Dispatcher $eventDispatcher,
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterUserDTO $dto, string $ipAddress): UserDTO
    {
        return DB::transaction(function () use ($dto, $ipAddress) {
            $email = Email::fromString($dto->email);
            $taxNumber = $dto->taxNumber ? TaxNumber::fromString($dto->taxNumber) : null;

            // Check for existing users
            if ($this->userRepository->existsByEmail($email)) {
                throw new \DomainException('Email already registered');
            }

            if ($taxNumber !== null && $this->userRepository->existsByTaxNumber($taxNumber)) {
                throw new \DomainException('Tax number already registered');
            }

            // Create user entity
            $userId = $this->userRepository->nextIdentity();
            $password = Password::fromPlainText($dto->password);

            $phoneNumber = $dto->phone ? PhoneNumber::fromString($dto->phone) : null;
            $birthDate = $dto->birthDate ? new DateTimeImmutable($dto->birthDate) : null;

            $user = User::register(
                id: $userId->toString(),
                email: $email,
                password: $password,
                fullName: $dto->fullName,
                taxNumber: $taxNumber,
                phoneNumber: $phoneNumber,
                birthDate: $birthDate,
            );

            // Persist user
            $this->userRepository->save($user);

            // Dispatch domain events
            foreach ($user->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }

            return UserDTO::fromEntity($user);
        });
    }

    /**
     * Authenticate a user with email and password.
     */
    public function login(LoginDTO $dto, string $ipAddress, ?string $userAgent = null): AuthResultDTO
    {
        $email = Email::fromString($dto->email);
        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            throw new InvalidCredentialsException();
        }

        // Check if user can login
        if (!$user->canLogin()) {
            if ($user->getStatus() === UserStatus::BLOCKED) {
                throw new UserBlockedException('Account is blocked');
            }

            if ($user->isLocked()) {
                throw new UserBlockedException('Account is temporarily locked due to too many failed login attempts');
            }

            throw new InvalidCredentialsException();
        }

        // Verify password
        if (!$user->getPassword()->verify($dto->password)) {
            $user->recordLoginAttempt(false, $ipAddress);
            $this->userRepository->update($user);

            // Dispatch login failed event for audit
            $this->eventDispatcher->dispatch(new UserLoginFailed(
                userId: $user->getId(),
                email: $dto->email,
                ipAddress: $ipAddress,
                reason: 'invalid_password',
                userAgent: $userAgent,
            ));

            throw new InvalidCredentialsException();
        }

        // Record successful login attempt
        $user->recordLoginAttempt(true, $ipAddress);
        $this->userRepository->update($user);

        // Check if 2FA is enabled
        if ($user->isTwoFactorEnabled()) {
            $twoFactorData = $this->twoFactorRepository->findActiveByUserId(
                Uuid::fromString($user->getId())
            );

            if ($twoFactorData !== null) {
                // Generate a temporary 2FA token
                $twoFactorToken = $this->generateTwoFactorToken($user->getId());

                throw new TwoFactorRequiredException($twoFactorToken);
            }
        }

        // Track device - this will register/update device and send notification for new devices
        $deviceId = $this->trackDeviceForLogin($user->getId(), $ipAddress, $userAgent, $dto);

        // Generate tokens with device ID
        $tokens = $this->tokenService->generateTokenPair(
            user: $user,
            ipAddress: $ipAddress,
            userAgent: $userAgent,
            deviceId: $deviceId,
        );

        // Dispatch successful login event for audit
        $this->eventDispatcher->dispatch(new UserLoggedIn(
            userId: $user->getId(),
            ipAddress: $ipAddress,
            userAgent: $userAgent,
            sessionId: $tokens['session_id'] ?? null,
        ));

        return new AuthResultDTO(
            accessToken: $tokens['access_token'],
            refreshToken: $tokens['refresh_token'],
            expiresIn: $tokens['expires_in'],
            user: UserDTO::fromEntity($user)->toArray(),
        );
    }

    /**
     * Track device during login.
     */
    private function trackDeviceForLogin(
        string $userId,
        string $ipAddress,
        ?string $userAgent,
        LoginDTO $dto
    ): ?string {
        try {
            $deviceInfo = new DeviceInfoDTO(
                userAgent: $userAgent ?? '',
                ipAddress: $ipAddress,
                fingerprint: $dto->deviceFingerprint,
                platform: $dto->devicePlatform,
                deviceName: $dto->deviceName,
            );

            return $this->deviceTrackingService->trackDevice($userId, $deviceInfo);
        } catch (\Throwable $e) {
            // Log error but don't fail login due to device tracking issues
            // Device tracking is a secondary concern
            report($e);

            return null;
        }
    }

    /**
     * Refresh access token using refresh token.
     */
    public function refreshToken(string $refreshToken, string $ipAddress): ?AuthResultDTO
    {
        $result = $this->tokenService->refreshToken($refreshToken, $ipAddress);

        if ($result === null) {
            return null;
        }

        $user = $this->userRepository->findById(Uuid::fromString($result['user_id']));

        if ($user === null || !$user->canLogin()) {
            return null;
        }

        return new AuthResultDTO(
            accessToken: $result['access_token'],
            refreshToken: $result['refresh_token'],
            expiresIn: $result['expires_in'],
            user: UserDTO::fromEntity($user)->toArray(),
        );
    }

    /**
     * Logout user and revoke session.
     */
    public function logout(string $sessionId, ?string $userId = null): void
    {
        $this->tokenService->revokeSession($sessionId, 'logout');

        // Dispatch logout event for audit
        if ($userId !== null) {
            $this->eventDispatcher->dispatch(new UserLoggedOut(
                userId: $userId,
                sessionId: $sessionId,
                reason: 'user_initiated',
            ));
        }
    }

    /**
     * Logout user from all devices.
     */
    public function logoutAll(string $userId, ?string $exceptSessionId = null): void
    {
        $this->tokenService->revokeAllUserSessions($userId, 'logout_all', $exceptSessionId);

        // Dispatch logout event for audit
        $this->eventDispatcher->dispatch(new UserLoggedOut(
            userId: $userId,
            sessionId: $exceptSessionId,
            reason: 'logout_all_devices',
        ));
    }

    /**
     * Get user by ID.
     */
    public function getUserById(string $userId): ?UserDTO
    {
        $user = $this->userRepository->findById(Uuid::fromString($userId));

        if ($user === null) {
            return null;
        }

        return UserDTO::fromEntity($user);
    }

    /**
     * Generate a temporary 2FA verification token.
     */
    private function generateTwoFactorToken(string $userId): string
    {
        $token = 'fyx_2fa_' . bin2hex(random_bytes(32));

        // Store in cache with short expiry (5 minutes)
        cache()->put(
            '2fa_pending:' . hash('sha256', $token),
            $userId,
            now()->addMinutes(5)
        );

        return $token;
    }
}
