<?php

declare(strict_types=1);

namespace Tests\Unit\Http\Middleware;

use App\Http\Exceptions\InvalidWebhookSignatureException;
use App\Http\Middleware\ValidateWebhookSignature;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ValidateWebhookSignatureTest extends TestCase
{
    private ValidateWebhookSignature $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new ValidateWebhookSignature();
    }

    #[Test]
    public function it_passes_when_validation_is_disabled(): void
    {
        Config::set('services.eulen.webhook_secret', 'some-secret');
        Config::set('services.eulen.webhook_signature_validation', false);

        $request = $this->createRequest([], []);

        $response = $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');

        $this->assertEquals('OK', $response->getContent());
    }

    #[Test]
    public function it_throws_when_secret_not_configured(): void
    {
        Config::set('services.eulen.webhook_secret', null);
        Config::set('services.eulen.webhook_signature_validation', true);

        $request = $this->createRequest([], []);

        $this->expectException(InvalidWebhookSignatureException::class);

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_signature_header_missing(): void
    {
        Config::set('services.eulen.webhook_secret', 'test-secret');
        Config::set('services.eulen.webhook_signature_validation', true);

        $request = $this->createRequest([], [
            'X-Eulen-Timestamp' => (string) time(),
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);
        $this->expectExceptionMessage('Missing webhook signature header');

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_timestamp_header_missing(): void
    {
        Config::set('services.eulen.webhook_secret', 'test-secret');
        Config::set('services.eulen.webhook_signature_validation', true);

        $request = $this->createRequest([], [
            'X-Eulen-Signature' => 'some-signature',
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);
        $this->expectExceptionMessage('Missing webhook timestamp header');

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_timestamp_is_not_numeric(): void
    {
        Config::set('services.eulen.webhook_secret', 'test-secret');
        Config::set('services.eulen.webhook_signature_validation', true);

        $request = $this->createRequest([], [
            'X-Eulen-Signature' => 'some-signature',
            'X-Eulen-Timestamp' => 'not-a-number',
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);
        $this->expectExceptionMessage('Invalid webhook timestamp format');

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_timestamp_is_too_old(): void
    {
        $secret = 'test-secret';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $oldTimestamp = time() - 400; // 6+ minutes ago
        $payload = '{"event":"test"}';
        $signature = hash_hmac('sha256', $oldTimestamp . '.' . $payload, $secret);

        $request = $this->createRequest($payload, [
            'X-Eulen-Signature' => $signature,
            'X-Eulen-Timestamp' => (string) $oldTimestamp,
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);
        $this->expectExceptionMessage('Webhook timestamp expired');

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_timestamp_is_too_far_in_future(): void
    {
        $secret = 'test-secret';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $futureTimestamp = time() + 400; // 6+ minutes in future
        $payload = '{"event":"test"}';
        $signature = hash_hmac('sha256', $futureTimestamp . '.' . $payload, $secret);

        $request = $this->createRequest($payload, [
            'X-Eulen-Signature' => $signature,
            'X-Eulen-Timestamp' => (string) $futureTimestamp,
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_throws_when_signature_is_invalid(): void
    {
        $secret = 'test-secret';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $timestamp = time();

        $request = $this->createRequest('{"event":"test"}', [
            'X-Eulen-Signature' => 'invalid-signature',
            'X-Eulen-Timestamp' => (string) $timestamp,
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);
        $this->expectExceptionMessage('Webhook signature verification failed');

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_passes_with_valid_signature(): void
    {
        $secret = 'test-secret-abc123';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $timestamp = time();
        $payload = '{"event":"test","data":{"id":"123"}}';
        $signature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        $request = $this->createRequest($payload, [
            'X-Eulen-Signature' => $signature,
            'X-Eulen-Timestamp' => (string) $timestamp,
        ]);

        $response = $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');

        $this->assertEquals('OK', $response->getContent());
    }

    #[Test]
    public function it_passes_with_timestamp_near_boundary(): void
    {
        $secret = 'test-secret';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        // 4 minutes and 59 seconds ago (just within 5 minute limit)
        $timestamp = time() - 299;
        $payload = '{"event":"test"}';
        $signature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        $request = $this->createRequest($payload, [
            'X-Eulen-Signature' => $signature,
            'X-Eulen-Timestamp' => (string) $timestamp,
        ]);

        $response = $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');

        $this->assertEquals('OK', $response->getContent());
    }

    #[Test]
    public function it_throws_for_unknown_provider(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown webhook provider: unknown');

        $request = $this->createRequest('{}', []);

        $this->middleware->handle($request, fn () => new Response('OK'), 'unknown');
    }

    #[Test]
    public function it_uses_timing_safe_comparison(): void
    {
        // This test verifies that hash_equals is used (timing-safe comparison)
        // We can't directly test timing, but we verify the middleware rejects
        // signatures that look similar but have 1 character difference

        $secret = 'test-secret';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $timestamp = time();
        $payload = '{"event":"test"}';
        $correctSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        // Change last character
        $almostCorrectSignature = substr($correctSignature, 0, -1) . 'x';

        $request = $this->createRequest($payload, [
            'X-Eulen-Signature' => $almostCorrectSignature,
            'X-Eulen-Timestamp' => (string) $timestamp,
        ]);

        $this->expectException(InvalidWebhookSignatureException::class);

        $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
    }

    #[Test]
    public function it_logs_invalid_attempts(): void
    {
        Log::shouldReceive('warning')
            ->once()
            ->withArgs(function ($message, $context) {
                return str_contains($message, 'Webhook signature validation failed')
                    && $context['provider'] === 'eulen'
                    && $context['reason'] === 'missing_signature';
            });

        Config::set('services.eulen.webhook_secret', 'test-secret');
        Config::set('services.eulen.webhook_signature_validation', true);

        $request = $this->createRequest('{}', [
            'X-Eulen-Timestamp' => (string) time(),
        ]);

        try {
            $this->middleware->handle($request, fn () => new Response('OK'), 'eulen');
        } catch (InvalidWebhookSignatureException) {
            // Expected
        }
    }

    /**
     * Create a mock request with the given payload and headers.
     *
     * @param string|array $payload
     * @param array<string, string> $headers
     * @return Request
     */
    private function createRequest(string|array $payload, array $headers): Request
    {
        if (is_array($payload)) {
            $payload = json_encode($payload);
        }

        $request = Request::create(
            '/api/webhooks/eulen',
            'POST',
            [],
            [],
            [],
            $this->transformHeadersToServer($headers),
            $payload
        );

        $request->headers->set('Content-Type', 'application/json');

        foreach ($headers as $name => $value) {
            $request->headers->set($name, $value);
        }

        return $request;
    }

    /**
     * Transform headers to SERVER format.
     *
     * @param array<string, string> $headers
     * @return array<string, string>
     */
    private function transformHeadersToServer(array $headers): array
    {
        $server = [];
        foreach ($headers as $name => $value) {
            $name = strtoupper(str_replace('-', '_', $name));
            $server['HTTP_' . $name] = $value;
        }
        return $server;
    }
}
