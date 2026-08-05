<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Application\Notification\Services\NotificationService;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\URL;

class EmailVerificationService
{
    private const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly Dispatcher $eventDispatcher,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Generate a verification URL for the user.
     */
    public function generateVerificationUrl(string $userId, string $email): string
    {
        $token = $this->generateVerificationToken($userId, $email);

        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addHours(self::VERIFICATION_TOKEN_EXPIRY_HOURS),
            [
                'id' => $userId,
                'token' => $token,
            ]
        );
    }

    /**
     * Send initial verification email after registration.
     */
    public function sendVerificationEmail(
        string $userId,
        string $email,
        ?string $userName = null,
    ): void {
        $verificationUrl = $this->generateVerificationUrl($userId, $email);

        $this->notificationService->sendEmailVerification(
            email: $email,
            verificationUrl: $verificationUrl,
            userName: $userName,
            expirationHours: self::VERIFICATION_TOKEN_EXPIRY_HOURS,
        );
    }

    /**
     * Verify user's email with token.
     */
    public function verify(string $userId, string $token): bool
    {
        $user = $this->userRepository->findById(Uuid::fromString($userId));

        if ($user === null) {
            return false;
        }

        if ($user->isEmailVerified()) {
            return true;
        }

        // Validate token
        $expectedToken = $this->generateVerificationToken($userId, $user->getEmail()->toString());

        if (!hash_equals($expectedToken, $token)) {
            return false;
        }

        // Mark as verified
        $user->verifyEmail();
        $this->userRepository->update($user);

        // Dispatch domain events
        foreach ($user->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return true;
    }

    /**
     * Resend verification email.
     */
    public function resend(string $userId): bool
    {
        $user = $this->userRepository->findById(Uuid::fromString($userId));

        if ($user === null) {
            return false;
        }

        if ($user->isEmailVerified()) {
            return false;
        }

        // Rate limit: check if we sent one recently
        $rateLimitKey = 'email_verification_sent:' . $userId;
        if (cache()->has($rateLimitKey)) {
            return false;
        }

        // Generate new URL and send email
        $verificationUrl = $this->generateVerificationUrl($userId, $user->getEmail()->toString());

        // Send email verification notification
        $this->notificationService->sendEmailVerification(
            email: $user->getEmail()->toString(),
            verificationUrl: $verificationUrl,
            userName: $user->getFullName(),
            expirationHours: self::VERIFICATION_TOKEN_EXPIRY_HOURS,
        );

        // Set rate limit (1 per 2 minutes)
        cache()->put($rateLimitKey, true, now()->addMinutes(2));

        return true;
    }

    /**
     * Generate verification token for user.
     */
    private function generateVerificationToken(string $userId, string $email): string
    {
        return hash_hmac(
            'sha256',
            $userId . '|' . $email,
            config('app.key')
        );
    }
}
