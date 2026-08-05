<?php

declare(strict_types=1);

namespace App\Domain\Identity\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;

interface TwoFactorRepositoryInterface
{
    /**
     * Find 2FA settings for a user by type.
     */
    public function findByUserIdAndType(Uuid $userId, string $type): ?array;

    /**
     * Find all 2FA settings for a user.
     */
    public function findAllByUserId(Uuid $userId): array;

    /**
     * Find active 2FA for a user.
     */
    public function findActiveByUserId(Uuid $userId): ?array;

    /**
     * Create 2FA settings.
     */
    public function create(array $data): Uuid;

    /**
     * Update 2FA settings.
     */
    public function update(Uuid $id, array $data): void;

    /**
     * Activate 2FA.
     */
    public function activate(Uuid $id): void;

    /**
     * Deactivate 2FA.
     */
    public function deactivate(Uuid $id): void;

    /**
     * Update backup codes.
     */
    public function updateBackupCodes(Uuid $id, string $encryptedCodes): void;

    /**
     * Record 2FA usage.
     */
    public function recordUsage(Uuid $id): void;

    /**
     * Delete 2FA settings.
     */
    public function delete(Uuid $id): void;

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid;
}
