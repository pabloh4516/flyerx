<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Application\Notification\Services\NotificationService;
use App\Domain\Identity\Repositories\PasswordResetRepositoryInterface;
use App\Domain\Identity\Repositories\SessionRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Shared\ValueObjects\Uuid;
use DateTimeImmutable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

class PasswordResetService
{
    private const TOKEN_EXPIRY_HOURS = 1;
    private const MAX_REQUESTS_PER_HOUR = 3;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly PasswordResetRepositoryInterface $passwordResetRepository,
        private readonly SessionRepositoryInterface $sessionRepository,
        private readonly Dispatcher $eventDispatcher,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Request a password reset.
     * Returns true if email was sent (or would be sent in production).
     * Always returns true to prevent email enumeration.
     */
    public function requestReset(string $email, string $ipAddress): bool
    {
        try {
            $emailVO = Email::fromString($email);
        } catch (\Exception) {
            // Invalid email format, but return true to prevent enumeration
            return true;
        }

        $user = $this->userRepository->findByEmail($emailVO);

        if ($user === null) {
            // User doesn't exist, but return true to prevent enumeration
            return true;
        }

        // Rate limit check
        $recentCount = $this->passwordResetRepository->countRecentByUserId(
            Uuid::fromString($user->getId()),
            60
        );

        if ($recentCount >= self::MAX_REQUESTS_PER_HOUR) {
            // Rate limited, but return true to prevent enumeration
            return true;
        }

        // Generate token
        $token = $this->generateToken();
        $tokenHash = $this->hashToken($token);

        // Calculate expiry
        $expiresAt = (new DateTimeImmutable())
            ->modify('+' . self::TOKEN_EXPIRY_HOURS . ' hours');

        // Invalidate any existing valid tokens
        $this->passwordResetRepository->invalidateAllForUser(
            Uuid::fromString($user->getId())
        );

        // Create new reset record
        $this->passwordResetRepository->create([
            'user_id' => $user->getId(),
            'token_hash' => $tokenHash,
            'ip_address' => $ipAddress,
            'expires_at' => $expiresAt,
        ]);

        // Generate reset URL
        $resetUrl = $this->generateResetUrl($token);

        // Send password reset email notification
        $this->notificationService->sendPasswordReset(
            email: $user->getEmail()->toString(),
            resetUrl: $resetUrl,
            userName: $user->getFullName(),
            expirationHours: self::TOKEN_EXPIRY_HOURS,
        );

        // Log the request for debugging (remove in production or use proper logging)
        if (config('app.debug')) {
            logger()->info('Password reset requested', [
                'user_id' => $user->getId(),
                'token' => $token, // Only log in debug mode!
                'reset_url' => $resetUrl,
            ]);
        }

        return true;
    }

    /**
     * Validate a password reset token.
     */
    public function validateToken(string $token): ?array
    {
        $tokenHash = $this->hashToken($token);
        $reset = $this->passwordResetRepository->findValidByTokenHash($tokenHash);

        if ($reset === null) {
            return null;
        }

        return [
            'id' => $reset['id'],
            'user_id' => $reset['user_id'],
            'expires_at' => $reset['expires_at'],
        ];
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(string $token, string $newPassword): bool
    {
        $tokenHash = $this->hashToken($token);
        $reset = $this->passwordResetRepository->findValidByTokenHash($tokenHash);

        if ($reset === null) {
            return false;
        }

        $user = $this->userRepository->findById(Uuid::fromString($reset['user_id']));

        if ($user === null) {
            return false;
        }

        return DB::transaction(function () use ($reset, $user, $newPassword) {
            // Create new password
            $password = Password::fromPlainText($newPassword);

            // Update user password
            $user->changePassword($password);
            $this->userRepository->update($user);

            // Mark reset token as used
            $this->passwordResetRepository->markAsUsed(Uuid::fromString($reset['id']));

            // Revoke all user sessions for security
            $this->sessionRepository->revokeAllForUser(
                Uuid::fromString($user->getId()),
                'password_reset'
            );

            // Dispatch domain events
            foreach ($user->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }

            return true;
        });
    }

    /**
     * Generate a secure random token.
     */
    private function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Hash a token for storage.
     */
    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Generate the password reset URL.
     */
    private function generateResetUrl(string $token): string
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));

        return $frontendUrl . '/reset-password?token=' . $token;
    }
}
