<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogRequestResponse
{
    /**
     * Headers that should not be logged.
     */
    private const SENSITIVE_HEADERS = [
        'authorization',
        'cookie',
        'x-csrf-token',
    ];

    /**
     * Fields that should be masked in request body.
     */
    private const SENSITIVE_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'secret',
        'api_key',
        'credit_card',
        'cvv',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Generate request ID
        $requestId = (string) Str::uuid();
        $request->headers->set('X-Request-ID', $requestId);

        $startTime = microtime(true);

        // Process request
        $response = $next($request);

        // Calculate duration
        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Add request ID to response
        $response->headers->set('X-Request-ID', $requestId);

        // Log request/response
        $this->logRequest($request, $response, $requestId, $duration);

        return $response;
    }

    private function logRequest(Request $request, Response $response, string $requestId, float $duration): void
    {
        $context = [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $request->user()?->id ?? null,
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
        ];

        // Add request body for non-GET requests (masked)
        if (!$request->isMethod('GET') && $request->isJson()) {
            $context['request_body'] = $this->maskSensitiveData($request->all());
        }

        // Add headers (filtered)
        $context['headers'] = $this->filterHeaders($request->headers->all());

        // Log level based on status code
        $statusCode = $response->getStatusCode();

        if ($statusCode >= 500) {
            Log::channel('api')->error('API Request', $context);
        } elseif ($statusCode >= 400) {
            Log::channel('api')->warning('API Request', $context);
        } else {
            Log::channel('api')->info('API Request', $context);
        }
    }

    private function maskSensitiveData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->maskSensitiveData($value);
            } elseif (in_array(strtolower($key), self::SENSITIVE_FIELDS, true)) {
                $data[$key] = '[REDACTED]';
            }
        }

        return $data;
    }

    private function filterHeaders(array $headers): array
    {
        $filtered = [];

        foreach ($headers as $name => $values) {
            if (in_array(strtolower($name), self::SENSITIVE_HEADERS, true)) {
                $filtered[$name] = ['[REDACTED]'];
            } else {
                $filtered[$name] = $values;
            }
        }

        return $filtered;
    }
}
