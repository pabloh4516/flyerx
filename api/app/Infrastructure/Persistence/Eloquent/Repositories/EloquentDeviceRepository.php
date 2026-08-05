<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Identity\Repositories\DeviceRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserDeviceModel;
use DateTimeImmutable;

class EloquentDeviceRepository implements DeviceRepositoryInterface
{
    /**
     * Find a device by its unique identifier.
     *
     * @return array<string, mixed>|null
     */
    public function findById(Uuid $id): ?array
    {
        $device = UserDeviceModel::find($id->toString());

        if ($device === null) {
            return null;
        }

        return $this->toArray($device);
    }

    /**
     * Find a device by user ID and fingerprint.
     *
     * @return array<string, mixed>|null
     */
    public function findByUserIdAndFingerprint(Uuid $userId, string $fingerprint): ?array
    {
        $device = UserDeviceModel::where('user_id', $userId->toString())
            ->where('device_fingerprint', $fingerprint)
            ->first();

        if ($device === null) {
            return null;
        }

        return $this->toArray($device);
    }

    /**
     * Find all devices for a user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findAllByUserId(Uuid $userId): array
    {
        $devices = UserDeviceModel::where('user_id', $userId->toString())
            ->orderByDesc('last_seen_at')
            ->get();

        return $devices->map(fn (UserDeviceModel $device) => $this->toArray($device))->toArray();
    }

    /**
     * Create a new device record.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Uuid
    {
        $id = $this->nextIdentity();

        UserDeviceModel::create([
            'id' => $id->toString(),
            'user_id' => $data['user_id'],
            'device_fingerprint' => $data['device_fingerprint'],
            'device_name' => $data['device_name'] ?? null,
            'device_type' => $data['device_type'],
            'os_name' => $data['os_name'] ?? null,
            'os_version' => $data['os_version'] ?? null,
            'browser_name' => $data['browser_name'] ?? null,
            'browser_version' => $data['browser_version'] ?? null,
            'app_version' => $data['app_version'] ?? null,
            'push_token' => $data['push_token'] ?? null,
            'is_trusted' => $data['is_trusted'] ?? false,
            'is_blocked' => $data['is_blocked'] ?? false,
            'first_seen_at' => $data['first_seen_at'] ?? now(),
            'last_seen_at' => $data['last_seen_at'] ?? now(),
            'last_ip' => $data['last_ip'] ?? null,
            'last_location' => $data['last_location'] ?? null,
        ]);

        return $id;
    }

    /**
     * Update the last seen timestamp and IP address.
     */
    public function updateLastSeen(Uuid $deviceId, string $ip, ?array $location = null): void
    {
        $updateData = [
            'last_seen_at' => now(),
            'last_ip' => $ip,
        ];

        if ($location !== null) {
            $updateData['last_location'] = $location;
        }

        UserDeviceModel::where('id', $deviceId->toString())->update($updateData);
    }

    /**
     * Mark a device as trusted.
     */
    public function trustDevice(Uuid $deviceId): void
    {
        UserDeviceModel::where('id', $deviceId->toString())->update([
            'is_trusted' => true,
        ]);
    }

    /**
     * Remove trust from a device.
     */
    public function untrustDevice(Uuid $deviceId): void
    {
        UserDeviceModel::where('id', $deviceId->toString())->update([
            'is_trusted' => false,
        ]);
    }

    /**
     * Block a device.
     */
    public function blockDevice(Uuid $deviceId): void
    {
        UserDeviceModel::where('id', $deviceId->toString())->update([
            'is_blocked' => true,
        ]);
    }

    /**
     * Unblock a device.
     */
    public function unblockDevice(Uuid $deviceId): void
    {
        UserDeviceModel::where('id', $deviceId->toString())->update([
            'is_blocked' => false,
        ]);
    }

    /**
     * Delete a device record.
     */
    public function delete(Uuid $deviceId): void
    {
        UserDeviceModel::where('id', $deviceId->toString())->delete();
    }

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid
    {
        return Uuid::generate();
    }

    /**
     * Convert model to array.
     *
     * @return array<string, mixed>
     */
    private function toArray(UserDeviceModel $device): array
    {
        return [
            'id' => $device->id,
            'user_id' => $device->user_id,
            'device_fingerprint' => $device->device_fingerprint,
            'device_name' => $device->device_name,
            'device_type' => $device->device_type,
            'os_name' => $device->os_name,
            'os_version' => $device->os_version,
            'browser_name' => $device->browser_name,
            'browser_version' => $device->browser_version,
            'app_version' => $device->app_version,
            'push_token' => $device->push_token,
            'is_trusted' => $device->is_trusted,
            'is_blocked' => $device->is_blocked,
            'first_seen_at' => $device->first_seen_at instanceof \DateTimeInterface
                ? DateTimeImmutable::createFromInterface($device->first_seen_at)
                : null,
            'last_seen_at' => $device->last_seen_at instanceof \DateTimeInterface
                ? DateTimeImmutable::createFromInterface($device->last_seen_at)
                : null,
            'last_ip' => $device->last_ip,
            'last_location' => $device->last_location,
            'display_name' => $device->display_name,
            'created_at' => $device->created_at instanceof \DateTimeInterface
                ? DateTimeImmutable::createFromInterface($device->created_at)
                : null,
            'updated_at' => $device->updated_at instanceof \DateTimeInterface
                ? DateTimeImmutable::createFromInterface($device->updated_at)
                : null,
        ];
    }
}
