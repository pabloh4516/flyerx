<?php

declare(strict_types=1);

namespace App\Domain\Identity\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;

interface PasswordResetRepositoryInterface
{
    /**
     * Find a valid password reset by token hash.
     */
    public function findValidByTokenHash(string $tokenHash): ?array;

    /**
     * Find valid password resets for a user.
     */
    public function findValidByUserId(Uuid $userId): array;

    /**
     * Create a new password reset.
     */
    public function create(array $data): Uuid;

    /**
     * Mark a password reset as used.
     */
    public function markAsUsed(Uuid $id): void;

    /**
     * Invalidate all pending resets for a user.
     */
    public function invalidateAllForUser(Uuid $userId): void;

    /**
     * Delete expired password resets.
     */
    public function deleteExpired(): int;

    /**
     * Count recent password resets for a user (for rate limiting).
     */
    public function countRecentByUserId(Uuid $userId, int $minutes = 60): int;

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid;
}
