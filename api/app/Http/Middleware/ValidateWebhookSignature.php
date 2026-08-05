<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Exceptions\InvalidWebhookSignatureException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to validate HMAC signatures for incoming webhooks.
 *
 * This middleware provides security for webhook endpoints by:
 * - Validating the HMAC-SHA256 signature of the request
 * - Protecting against replay attacks via timestamp validation
 * - Logging all invalid signature attempts for security monitoring
 *
 * Usage in routes:
 *   Route::post('/webhook', [WebhookController::class, 'handle'])
 *       ->middleware('webhook.signature:eulen');
 */
class ValidateWebhookSignature
{
    /**
     * Maximum age (in seconds) for webhook timestamps.
     * Requests with older timestamps are rejected to prevent replay attacks.
     */
    private const MAX_TIMESTAMP_AGE_SECONDS = 300; // 5 minutes

    /**
     * Provider-specific configuration.
     * Each provider can have different header names and secrets.
     */
    private const PROVIDERS = [
        'eulen' => [
            'signature_header' => 'X-Eulen-Signature',
            'timestamp_header' => 'X-Eulen-Timestamp',
            'secret_config' => 'services.eulen.webhook_secret',
            'enabled_config' => 'services.eulen.webhook_signature_validation',
        ],
    ];

    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @param string $provider The webhook provider identifier (e.g., 'eulen')
     * @return Response
     *
     * @throws InvalidWebhookSignatureException
     */
    public function handle(Request $request, Closure $next, string $provider = 'eulen'): Response
    {
        $config = $this->getProviderConfig($provider);

        // Check if validation is enabled
        if (!$this->isValidationEnabled($config)) {
            Log::warning('Webhook signature validation disabled', [
                'provider' => $provider,
                'ip' => $request->ip(),
            ]);
            return $next($request);
        }

        // Get the webhook secret
        $secret = config($config['secret_config']);

        if (empty($secret)) {
            Log::error('Webhook secret not configured', [
                'provider' => $provider,
                'config_key' => $config['secret_config'],
            ]);
            // In production, fail closed - require secret to be configured
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        // Validate the signature
        $this->validateSignature($request, $config, $secret, $provider);

        return $next($request);
    }

    /**
     * Get provider-specific configuration.
     *
     * @param string $provider
     * @return array{signature_header: string, timestamp_header: string, secret_config: string, enabled_config: string}
     *
     * @throws \InvalidArgumentException
     */
    private function getProviderConfig(string $provider): array
    {
        if (!isset(self::PROVIDERS[$provider])) {
            throw new \InvalidArgumentException(
                sprintf('Unknown webhook provider: %s', $provider)
            );
        }

        return self::PROVIDERS[$provider];
    }

    /**
     * Check if signature validation is enabled for the provider.
     *
     * @param array{enabled_config: string} $config
     * @return bool
     */
    private function isValidationEnabled(array $config): bool
    {
        // Default to enabled in production
        $default = app()->environment('production');

        return (bool) config($config['enabled_config'], $default);
    }

    /**
     * Validate the webhook signature.
     *
     * @param Request $request
     * @param array{signature_header: string, timestamp_header: string} $config
     * @param string $secret
     * @param string $provider
     *
     * @throws InvalidWebhookSignatureException
     */
    private function validateSignature(
        Request $request,
        array $config,
        string $secret,
        string $provider
    ): void {
        // Extract headers
        $signature = $request->header($config['signature_header']);
        $timestamp = $request->header($config['timestamp_header']);

        // Validate signature header presence
        if (empty($signature)) {
            $this->logInvalidAttempt($request, $provider, 'missing_signature');
            throw InvalidWebhookSignatureException::missingSignature();
        }

        // Validate timestamp header presence
        if (empty($timestamp)) {
            $this->logInvalidAttempt($request, $provider, 'missing_timestamp');
            throw InvalidWebhookSignatureException::missingTimestamp();
        }

        // Validate timestamp format (should be numeric Unix timestamp)
        if (!ctype_digit($timestamp)) {
            $this->logInvalidAttempt($request, $provider, 'invalid_timestamp_format', [
                'timestamp' => $timestamp,
            ]);
            throw InvalidWebhookSignatureException::invalidTimestamp();
        }

        $timestampInt = (int) $timestamp;

        // Validate timestamp age (replay attack protection)
        $currentTime = time();
        $age = abs($currentTime - $timestampInt);

        if ($age > self::MAX_TIMESTAMP_AGE_SECONDS) {
            $this->logInvalidAttempt($request, $provider, 'expired_timestamp', [
                'timestamp' => $timestampInt,
                'current_time' => $currentTime,
                'age_seconds' => $age,
            ]);
            throw InvalidWebhookSignatureException::expiredTimestamp($age);
        }

        // Calculate expected signature
        $payload = $request->getContent();
        $signedPayload = $timestamp . '.' . $payload;
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

        // Compare signatures using timing-safe comparison
        if (!hash_equals($expectedSignature, $signature)) {
            $this->logInvalidAttempt($request, $provider, 'signature_mismatch', [
                'payload_length' => strlen($payload),
            ]);
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        // Log successful validation (debug level)
        Log::debug('Webhook signature validated successfully', [
            'provider' => $provider,
            'timestamp' => $timestampInt,
        ]);
    }

    /**
     * Log an invalid signature attempt for security monitoring.
     *
     * @param Request $request
     * @param string $provider
     * @param string $reason
     * @param array<string, mixed> $context
     */
    private function logInvalidAttempt(
        Request $request,
        string $provider,
        string $reason,
        array $context = []
    ): void {
        Log::warning('Webhook signature validation failed', array_merge([
            'provider' => $provider,
            'reason' => $reason,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
        ], $context));
    }
}
