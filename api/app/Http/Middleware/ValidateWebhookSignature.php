<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Exceptions\InvalidWebhookSignatureException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to validate webhook authentication.
 *
 * Supports:
 * - Basic Auth (Eulen): Authorization: Basic base64(secret:)
 *
 * Usage in routes:
 *   Route::post('/webhook', [WebhookController::class, 'handle'])
 *       ->middleware('webhook.signature:eulen');
 */
class ValidateWebhookSignature
{
    /**
     * Provider-specific configuration.
     * Each provider can have different auth methods and secrets.
     */
    private const PROVIDERS = [
        'eulen' => [
            'auth_method' => 'basic_auth',
            'secret_config' => 'eulen.webhook.secret',
            'enabled_config' => 'eulen.webhook.validate_signature',
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
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        // Validate based on auth method
        $authMethod = $config['auth_method'] ?? 'basic_auth';

        if ($authMethod === 'basic_auth') {
            $this->validateBasicAuth($request, $secret, $provider);
        } else {
            throw new \InvalidArgumentException("Unknown auth method: {$authMethod}");
        }

        return $next($request);
    }

    /**
     * Get provider-specific configuration.
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
     * Check if validation is enabled for the provider.
     */
    private function isValidationEnabled(array $config): bool
    {
        // Default to enabled in production
        $default = app()->environment('production');

        return (bool) config($config['enabled_config'], $default);
    }

    /**
     * Validate Basic Auth header.
     * Eulen format: Authorization: Basic base64(secret:)
     */
    private function validateBasicAuth(Request $request, string $secret, string $provider): void
    {
        $authHeader = $request->header('Authorization');

        if (empty($authHeader)) {
            $this->logInvalidAttempt($request, $provider, 'missing_authorization');
            throw InvalidWebhookSignatureException::missingSignature();
        }

        // Check if it's Basic auth
        if (!str_starts_with($authHeader, 'Basic ')) {
            $this->logInvalidAttempt($request, $provider, 'invalid_auth_type');
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        // Extract and decode credentials
        $encoded = substr($authHeader, 6); // Remove "Basic "
        $decoded = base64_decode($encoded, true);

        if ($decoded === false) {
            $this->logInvalidAttempt($request, $provider, 'invalid_base64');
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        // Eulen sends: secret: (username=secret, password=empty)
        // So decoded should be "secret:" or just match the secret as username
        $parts = explode(':', $decoded, 2);
        $username = $parts[0] ?? '';

        // Compare using timing-safe comparison
        if (!hash_equals($secret, $username)) {
            $this->logInvalidAttempt($request, $provider, 'secret_mismatch');
            throw InvalidWebhookSignatureException::invalidSignature();
        }

        Log::debug('Webhook Basic Auth validated successfully', [
            'provider' => $provider,
        ]);
    }

    /**
     * Log an invalid attempt for security monitoring.
     */
    private function logInvalidAttempt(
        Request $request,
        string $provider,
        string $reason,
        array $context = []
    ): void {
        Log::warning('Webhook authentication failed', array_merge([
            'provider' => $provider,
            'reason' => $reason,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
        ], $context));
    }
}
