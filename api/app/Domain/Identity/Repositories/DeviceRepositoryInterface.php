<?php

declare(strict_types=1);

namespace App\Domain\Identity\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;

interface DeviceRepositoryInterface
{
    /**
     * Find a device by its unique identifier.
     *
     * @return array<string, mixed>|null
     */
    public function findById(Uuid $id): ?array;

    /**
     * Find a device by user ID and fingerprint.
     *
     * @return array<string, mixed>|null
     */
    public function findByUserIdAndFingerprint(Uuid $userId, string $fingerprint): ?array;

    /**
     * Find all devices for a user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAllByUserId(Uuid $userId): array;

    /**
     * Create a new device record.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Uuid;

    /**
     * Update the last seen timestamp and IP address.
     */
    public function updateLastSeen(Uuid $deviceId, string $ip, ?array $location = null): void;

    /**
     * Mark a device as trusted.
     */
    public function trustDevice(Uuid $deviceId): void;

    /**
     * Remove trust from a device.
     */
    public function untrustDevice(Uuid $deviceId): void;

    /**
     * Block a device.
     */
    public function blockDevice(Uuid $deviceId): void;

    /**
     * Unblock a device.
     */
    public function unblockDevice(Uuid $deviceId): void;

    /**
     * Delete a device record.
     */
    public function delete(Uuid $deviceId): void;

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid;
}
