<?php

declare(strict_types=1);

namespace App\Application\Notification\Services;

use App\Mail\DepositConfirmedMail;
use App\Mail\PasswordResetMail;
use App\Mail\VerifyEmailMail;
use App\Mail\WelcomeMail;
use App\Mail\WithdrawalCompletedMail;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function __construct(
        private readonly Mailer $mailer,
    ) {}

    /**
     * Send email verification notification.
     */
    public function sendEmailVerification(
        string $email,
        string $verificationUrl,
        ?string $userName = null,
        int $expirationHours = 24,
    ): void {
        $this->sendMail(
            email: $email,
            mailable: new VerifyEmailMail(
                verificationUrl: $verificationUrl,
                userName: $userName,
                expirationHours: $expirationHours,
            ),
            context: [
                'type' => 'email_verification',
                'email' => $email,
            ],
        );
    }

    /**
     * Send password reset notification.
     */
    public function sendPasswordReset(
        string $email,
        string $resetUrl,
        ?string $userName = null,
        int $expirationHours = 1,
    ): void {
        $this->sendMail(
            email: $email,
            mailable: new PasswordResetMail(
                resetUrl: $resetUrl,
                userName: $userName,
                expirationHours: $expirationHours,
            ),
            context: [
                'type' => 'password_reset',
                'email' => $email,
            ],
        );
    }

    /**
     * Send welcome notification after registration.
     */
    public function sendWelcome(
        string $email,
        string $userName,
        ?string $dashboardUrl = null,
    ): void {
        $this->sendMail(
            email: $email,
            mailable: new WelcomeMail(
                userName: $userName,
                dashboardUrl: $dashboardUrl,
            ),
            context: [
                'type' => 'welcome',
                'email' => $email,
                'user_name' => $userName,
            ],
        );
    }

    /**
     * Send deposit confirmation notification.
     */
    public function sendDepositConfirmed(
        string $email,
        string $amount,
        string $transactionId,
        string $processedAt,
        ?string $userName = null,
        ?string $feeAmount = null,
        ?string $netAmount = null,
        ?string $currentBalance = null,
    ): void {
        $this->sendMail(
            email: $email,
            mailable: new DepositConfirmedMail(
                amount: $amount,
                transactionId: $transactionId,
                processedAt: $processedAt,
                userName: $userName,
                feeAmount: $feeAmount,
                netAmount: $netAmount,
                currentBalance: $currentBalance,
            ),
            context: [
                'type' => 'deposit_confirmed',
                'email' => $email,
                'transaction_id' => $transactionId,
                'amount' => $amount,
            ],
        );
    }

    /**
     * Send withdrawal completed notification.
     */
    public function sendWithdrawalCompleted(
        string $email,
        string $grossAmount,
        string $netAmount,
        string $pixKey,
        string $pixKeyType,
        string $transactionId,
        string $processedAt,
        ?string $userName = null,
        ?string $feeAmount = null,
        ?string $recipientName = null,
        ?string $endToEndId = null,
        ?string $currentBalance = null,
    ): void {
        $this->sendMail(
            email: $email,
            mailable: new WithdrawalCompletedMail(
                grossAmount: $grossAmount,
                netAmount: $netAmount,
                pixKey: $pixKey,
                pixKeyType: $pixKeyType,
                transactionId: $transactionId,
                processedAt: $processedAt,
                userName: $userName,
                feeAmount: $feeAmount,
                recipientName: $recipientName,
                endToEndId: $endToEndId,
                currentBalance: $currentBalance,
            ),
            context: [
                'type' => 'withdrawal_completed',
                'email' => $email,
                'transaction_id' => $transactionId,
                'net_amount' => $netAmount,
            ],
        );
    }

    /**
     * Send mail with logging and error handling.
     *
     * @param array<string, mixed> $context
     */
    private function sendMail(
        string $email,
        object $mailable,
        array $context = [],
    ): void {
        try {
            $this->mailer->to($email)->queue($mailable);

            Log::info('Email notification queued', array_merge($context, [
                'status' => 'queued',
            ]));
        } catch (\Throwable $e) {
            Log::error('Failed to queue email notification', array_merge($context, [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]));

            // Re-throw in non-production environments for debugging
            if (config('app.env') !== 'production') {
                throw $e;
            }
        }
    }

    /**
     * Send mail synchronously (for critical emails or testing).
     *
     * @param array<string, mixed> $context
     */
    public function sendMailSync(
        string $email,
        object $mailable,
        array $context = [],
    ): void {
        try {
            $this->mailer->to($email)->send($mailable);

            Log::info('Email notification sent', array_merge($context, [
                'status' => 'sent',
            ]));
        } catch (\Throwable $e) {
            Log::error('Failed to send email notification', array_merge($context, [
                'status' => 'failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]));

            if (config('app.env') !== 'production') {
                throw $e;
            }
        }
    }
}
