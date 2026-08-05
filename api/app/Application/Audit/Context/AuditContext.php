<?php

declare(strict_types=1);

namespace App\Application\Audit\Context;

use Illuminate\Http\Request;

/**
 * Immutable context object that captures request context for audit logging.
 * This is essential for compliance and forensic analysis.
 */
final readonly class AuditContext
{
    public function __construct(
        private ?string $ipAddress = null,
        private ?string $userAgent = null,
        private ?string $requestId = null,
        private ?string $sessionId = null,
        private ?string $userId = null,
        private ?string $actorType = 'user',
    ) {}

    /**
     * Create context from the current HTTP request.
     */
    public static function fromRequest(?Request $request = null): self
    {
        $request = $request ?? request();

        return new self(
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
            requestId: $request->header('X-Request-ID') ?? self::generateRequestId(),
            sessionId: $request->header('X-Session-ID'),
            userId: $request->user()?->id,
            actorType: $request->user() ? 'user' : 'anonymous',
        );
    }

    /**
     * Create context for system/automated operations.
     */
    public static function system(string $source = 'system'): self
    {
        return new self(
            ipAddress: '127.0.0.1',
            userAgent: 'Flyerx-System/' . config('app.version', '1.0.0'),
            requestId: self::generateRequestId(),
            sessionId: null,
            userId: null,
            actorType: $source,
        );
    }

    /**
     * Create context for CLI operations.
     */
    public static function cli(string $command = 'artisan'): self
    {
        return new self(
            ipAddress: '127.0.0.1',
            userAgent: 'Flyerx-CLI/' . $command,
            requestId: self::generateRequestId(),
            sessionId: null,
            userId: null,
            actorType: 'cli',
        );
    }

    /**
     * Create context for webhook/provider callbacks.
     */
    public static function provider(string $providerName, ?string $ipAddress = null): self
    {
        return new self(
            ipAddress: $ipAddress ?? request()->ip(),
            userAgent: 'Provider/' . $providerName,
            requestId: request()->header('X-Request-ID') ?? self::generateRequestId(),
            sessionId: null,
            userId: null,
            actorType: 'provider',
        );
    }

    /**
     * Clone context with a specific user.
     */
    public function withUser(string $userId, string $actorType = 'user'): self
    {
        return new self(
            ipAddress: $this->ipAddress,
            userAgent: $this->userAgent,
            requestId: $this->requestId,
            sessionId: $this->sessionId,
            userId: $userId,
            actorType: $actorType,
        );
    }

    /**
     * Clone context with a session ID.
     */
    public function withSession(string $sessionId): self
    {
        return new self(
            ipAddress: $this->ipAddress,
            userAgent: $this->userAgent,
            requestId: $this->requestId,
            sessionId: $sessionId,
            userId: $this->userId,
            actorType: $this->actorType,
        );
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function getRequestId(): ?string
    {
        return $this->requestId;
    }

    public function getSessionId(): ?string
    {
        return $this->sessionId;
    }

    public function getUserId(): ?string
    {
        return $this->userId;
    }

    public function getActorType(): string
    {
        return $this->actorType;
    }

    /**
     * Convert to array for storage.
     */
    public function toArray(): array
    {
        return [
            'ip_address' => $this->ipAddress,
            'user_agent' => $this->userAgent,
            'request_id' => $this->requestId,
            'session_id' => $this->sessionId,
            'user_id' => $this->userId,
            'actor_type' => $this->actorType,
        ];
    }

    /**
     * Generate a unique request ID.
     */
    private static function generateRequestId(): string
    {
        return 'req_' . bin2hex(random_bytes(16));
    }
}
