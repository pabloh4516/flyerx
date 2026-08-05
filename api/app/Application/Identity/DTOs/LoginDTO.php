<?php

declare(strict_types=1);

namespace App\Application\Identity\DTOs;

final readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public ?string $deviceFingerprint = null,
        public ?string $deviceName = null,
        public ?string $devicePlatform = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
            deviceFingerprint: $data['device_fingerprint'] ?? null,
            deviceName: $data['device_name'] ?? null,
            devicePlatform: $data['device_platform'] ?? null,
        );
    }
}
