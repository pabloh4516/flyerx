<?php

declare(strict_types=1);

namespace App\Http\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Exception thrown when webhook signature validation fails.
 *
 * This exception is used to indicate that a webhook request could not be
 * authenticated due to an invalid or missing signature.
 */
final class InvalidWebhookSignatureException extends HttpException
{
    public const REASON_MISSING_SIGNATURE = 'missing_signature';
    public const REASON_MISSING_TIMESTAMP = 'missing_timestamp';
    public const REASON_INVALID_SIGNATURE = 'invalid_signature';
    public const REASON_EXPIRED_TIMESTAMP = 'expired_timestamp';
    public const REASON_INVALID_TIMESTAMP = 'invalid_timestamp';

    public function __construct(
        private readonly string $reason,
        string $message = 'Invalid webhook signature',
        ?\Throwable $previous = null
    ) {
        parent::__construct(401, $message, $previous);
    }

    /**
     * Get the reason for the signature validation failure.
     */
    public function getReason(): string
    {
        return $this->reason;
    }

    /**
     * Create exception for missing signature header.
     */
    public static function missingSignature(): self
    {
        return new self(
            self::REASON_MISSING_SIGNATURE,
            'Missing webhook signature header'
        );
    }

    /**
     * Create exception for missing timestamp header.
     */
    public static function missingTimestamp(): self
    {
        return new self(
            self::REASON_MISSING_TIMESTAMP,
            'Missing webhook timestamp header'
        );
    }

    /**
     * Create exception for invalid signature.
     */
    public static function invalidSignature(): self
    {
        return new self(
            self::REASON_INVALID_SIGNATURE,
            'Webhook signature verification failed'
        );
    }

    /**
     * Create exception for expired timestamp (replay attack protection).
     */
    public static function expiredTimestamp(int $ageSeconds): self
    {
        return new self(
            self::REASON_EXPIRED_TIMESTAMP,
            sprintf('Webhook timestamp expired (%d seconds old)', $ageSeconds)
        );
    }

    /**
     * Create exception for invalid timestamp format.
     */
    public static function invalidTimestamp(): self
    {
        return new self(
            self::REASON_INVALID_TIMESTAMP,
            'Invalid webhook timestamp format'
        );
    }
}
