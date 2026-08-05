<?php

declare(strict_types=1);

namespace App\Application\Identity\DTOs;

final readonly class DeviceInfoDTO
{
    public function __construct(
        public string $userAgent,
        public string $ipAddress,
        public ?string $fingerprint = null,
        public ?string $platform = null,
        public ?string $acceptLanguage = null,
        public ?string $deviceName = null,
    ) {}

    /**
     * Create from request data array.
     *
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            userAgent: $data['user_agent'] ?? '',
            ipAddress: $data['ip_address'] ?? '',
            fingerprint: $data['fingerprint'] ?? null,
            platform: $data['platform'] ?? null,
            acceptLanguage: $data['accept_language'] ?? null,
            deviceName: $data['device_name'] ?? null,
        );
    }

    /**
     * Create from HTTP request.
     */
    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            userAgent: $request->userAgent() ?? '',
            ipAddress: $request->ip() ?? '',
            fingerprint: $request->input('device_fingerprint'),
            platform: $request->input('device_platform'),
            acceptLanguage: $request->header('Accept-Language'),
            deviceName: $request->input('device_name'),
        );
    }

    /**
     * Convert to array.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'user_agent' => $this->userAgent,
            'ip_address' => $this->ipAddress,
            'fingerprint' => $this->fingerprint,
            'platform' => $this->platform,
            'accept_language' => $this->acceptLanguage,
            'device_name' => $this->deviceName,
        ];
    }
}
