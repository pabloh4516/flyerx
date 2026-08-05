<?php

declare(strict_types=1);

namespace App\Domain\Identity\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;

interface SessionRepositoryInterface
{
    /**
     * Find a session by token hash.
     */
    public function findByTokenHash(string $tokenHash): ?array;

    /**
     * Find a session by refresh token hash.
     */
    public function findByRefreshTokenHash(string $refreshTokenHash): ?array;

    /**
     * Find all active sessions for a user.
     */
    public function findActiveByUserId(Uuid $userId): array;

    /**
     * Create a new session.
     */
    public function create(array $data): Uuid;

    /**
     * Update session's last activity.
     */
    public function updateLastActivity(Uuid $sessionId): void;

    /**
     * Revoke a session.
     */
    public function revoke(Uuid $sessionId, string $reason): void;

    /**
     * Revoke all sessions for a user.
     */
    public function revokeAllForUser(Uuid $userId, string $reason, ?Uuid $exceptSessionId = null): void;

    /**
     * Delete expired sessions.
     */
    public function deleteExpired(): int;

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid;
}
