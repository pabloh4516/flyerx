<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Application\Identity\DTOs\DeviceInfoDTO;
use App\Domain\Identity\Repositories\DeviceRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Mail\NewDeviceDetectedMail;
use Illuminate\Contracts\Mail\Mailer;

class DeviceTrackingService
{
    public function __construct(
        private readonly DeviceRepositoryInterface $deviceRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly Mailer $mailer,
    ) {}

    /**
     * Track a device for a user during login.
     * Returns the device ID.
     */
    public function trackDevice(string $userId, DeviceInfoDTO $deviceInfo): string
    {
        $fingerprint = $this->generateFingerprint($deviceInfo);
        $parsedInfo = $this->parseUserAgent($deviceInfo->userAgent);

        $existingDevice = $this->deviceRepository->findByUserIdAndFingerprint(
            Uuid::fromString($userId),
            $fingerprint
        );

        if ($existingDevice !== null) {
            // Update existing device
            $deviceId = Uuid::fromString($existingDevice['id']);

            // Check if device is blocked
            if ($existingDevice['is_blocked']) {
                throw new \DomainException('Este dispositivo foi bloqueado.');
            }

            $this->deviceRepository->updateLastSeen($deviceId, $deviceInfo->ipAddress);

            return $existingDevice['id'];
        }

        // Create new device
        $deviceId = $this->deviceRepository->create([
            'user_id' => $userId,
            'device_fingerprint' => $fingerprint,
            'device_name' => $deviceInfo->deviceName,
            'device_type' => $parsedInfo['device_type'],
            'os_name' => $parsedInfo['os_name'],
            'os_version' => $parsedInfo['os_version'],
            'browser_name' => $parsedInfo['browser_name'],
            'browser_version' => $parsedInfo['browser_version'],
            'last_ip' => $deviceInfo->ipAddress,
        ]);

        // Notify user about new device
        $this->notifyNewDevice($userId, [
            'device_type' => $parsedInfo['device_type'],
            'browser_name' => $parsedInfo['browser_name'],
            'os_name' => $parsedInfo['os_name'],
            'ip_address' => $deviceInfo->ipAddress,
        ]);

        return $deviceId->toString();
    }

    /**
     * Parse user agent string to extract browser, OS, and device info.
     *
     * @return array<string, string|null>
     */
    public function parseUserAgent(string $userAgent): array
    {
        $result = [
            'browser_name' => null,
            'browser_version' => null,
            'os_name' => null,
            'os_version' => null,
            'device_type' => 'desktop',
        ];

        if (empty($userAgent)) {
            return $result;
        }

        // Detect device type
        $result['device_type'] = $this->detectDeviceType($userAgent);

        // Detect browser
        $browserInfo = $this->detectBrowser($userAgent);
        $result['browser_name'] = $browserInfo['name'];
        $result['browser_version'] = $browserInfo['version'];

        // Detect OS
        $osInfo = $this->detectOS($userAgent);
        $result['os_name'] = $osInfo['name'];
        $result['os_version'] = $osInfo['version'];

        return $result;
    }

    /**
     * Generate a unique fingerprint for device identification.
     */
    public function generateFingerprint(DeviceInfoDTO $deviceInfo): string
    {
        // If client provided a fingerprint, use it
        if ($deviceInfo->fingerprint !== null && $deviceInfo->fingerprint !== '') {
            return $deviceInfo->fingerprint;
        }

        // Generate server-side fingerprint based on available data
        $components = [
            $deviceInfo->userAgent,
            $deviceInfo->acceptLanguage ?? '',
            $deviceInfo->platform ?? '',
        ];

        return hash('sha256', implode('|', $components));
    }

    /**
     * Check if this is a new device for the user.
     */
    public function isNewDevice(string $userId, string $fingerprint): bool
    {
        $device = $this->deviceRepository->findByUserIdAndFingerprint(
            Uuid::fromString($userId),
            $fingerprint
        );

        return $device === null;
    }

    /**
     * Get all trusted devices for a user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getTrustedDevices(string $userId): array
    {
        $devices = $this->deviceRepository->findAllByUserId(Uuid::fromString($userId));

        return array_filter($devices, fn (array $device) => $device['is_trusted'] === true);
    }

    /**
     * Get all devices for a user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getAllDevices(string $userId): array
    {
        return $this->deviceRepository->findAllByUserId(Uuid::fromString($userId));
    }

    /**
     * Trust a device.
     */
    public function trustDevice(string $deviceId): void
    {
        $this->deviceRepository->trustDevice(Uuid::fromString($deviceId));
    }

    /**
     * Block a device.
     */
    public function blockDevice(string $deviceId): void
    {
        $this->deviceRepository->blockDevice(Uuid::fromString($deviceId));
    }

    /**
     * Remove a device.
     */
    public function removeDevice(string $deviceId): void
    {
        $this->deviceRepository->delete(Uuid::fromString($deviceId));
    }

    /**
     * Notify user about a new device login.
     *
     * @param array<string, mixed> $deviceInfo
     */
    public function notifyNewDevice(string $userId, array $deviceInfo): void
    {
        $user = $this->userRepository->findById(Uuid::fromString($userId));

        if ($user === null) {
            return;
        }

        $email = $user->getEmail()->toString();
        $userName = $user->getFullName();

        $this->mailer->to($email)->queue(
            new NewDeviceDetectedMail(
                userName: $userName,
                deviceType: $deviceInfo['device_type'] ?? 'Desconhecido',
                browserName: $deviceInfo['browser_name'] ?? 'Desconhecido',
                osName: $deviceInfo['os_name'] ?? 'Desconhecido',
                ipAddress: $deviceInfo['ip_address'] ?? 'Desconhecido',
                loginTime: now()->format('d/m/Y H:i:s'),
            )
        );
    }

    /**
     * Detect device type from user agent.
     */
    private function detectDeviceType(string $userAgent): string
    {
        $userAgent = strtolower($userAgent);

        // Tablet detection FIRST (since tablets may contain "mobile" in user agent)
        $tabletKeywords = ['ipad', 'tablet', 'kindle', 'playbook', 'silk'];

        foreach ($tabletKeywords as $keyword) {
            if (str_contains($userAgent, $keyword)) {
                return 'tablet';
            }
        }

        // Mobile-specific keywords that should always return mobile
        $strictMobileKeywords = [
            'iphone',
            'ipod',
            'blackberry',
            'windows phone',
            'opera mini',
            'iemobile',
        ];

        foreach ($strictMobileKeywords as $keyword) {
            if (str_contains($userAgent, $keyword)) {
                return 'mobile';
            }
        }

        // Android detection with tablet heuristics
        if (str_contains($userAgent, 'android')) {
            // Android tablets typically DON'T have "Mobile" in user agent
            // Android phones typically DO have "Mobile" in user agent
            if (str_contains($userAgent, 'mobile')) {
                return 'mobile';
            }
            return 'tablet';
        }

        // Generic mobile detection
        if (str_contains($userAgent, 'mobile')) {
            return 'mobile';
        }

        return 'desktop';
    }

    /**
     * Detect browser from user agent.
     *
     * @return array{name: string|null, version: string|null}
     */
    private function detectBrowser(string $userAgent): array
    {
        $browsers = [
            'Edge' => '/Edg(?:e|A|iOS)?\/([0-9.]+)/i',
            'Opera' => '/(?:Opera|OPR)\/([0-9.]+)/i',
            'Chrome' => '/Chrome\/([0-9.]+)/i',
            'Safari' => '/Version\/([0-9.]+).*Safari/i',
            'Firefox' => '/Firefox\/([0-9.]+)/i',
            'Internet Explorer' => '/(?:MSIE |rv:)([0-9.]+)/i',
        ];

        foreach ($browsers as $name => $pattern) {
            if (preg_match($pattern, $userAgent, $matches)) {
                return [
                    'name' => $name,
                    'version' => $this->truncateVersion($matches[1] ?? null),
                ];
            }
        }

        return ['name' => null, 'version' => null];
    }

    /**
     * Detect operating system from user agent.
     *
     * @return array{name: string|null, version: string|null}
     */
    private function detectOS(string $userAgent): array
    {
        $osList = [
            'Windows 11' => '/Windows NT 10\.0.*Win64/i',
            'Windows 10' => '/Windows NT 10\.0/i',
            'Windows 8.1' => '/Windows NT 6\.3/i',
            'Windows 8' => '/Windows NT 6\.2/i',
            'Windows 7' => '/Windows NT 6\.1/i',
            'macOS' => '/Mac OS X ([0-9_]+)/i',
            'iOS' => '/(?:iPhone|iPad|iPod).*OS ([0-9_]+)/i',
            'Android' => '/Android ([0-9.]+)/i',
            'Linux' => '/Linux/i',
            'Ubuntu' => '/Ubuntu/i',
            'Chrome OS' => '/CrOS/i',
        ];

        foreach ($osList as $name => $pattern) {
            if (preg_match($pattern, $userAgent, $matches)) {
                $version = null;

                if (isset($matches[1])) {
                    $version = str_replace('_', '.', $matches[1]);
                    $version = $this->truncateVersion($version);
                }

                // Clean up OS name for specific cases
                if (str_starts_with($name, 'Windows')) {
                    return ['name' => $name, 'version' => null];
                }

                return ['name' => $name, 'version' => $version];
            }
        }

        return ['name' => null, 'version' => null];
    }

    /**
     * Truncate version string to fit database column (max 20 chars).
     */
    private function truncateVersion(?string $version): ?string
    {
        if ($version === null) {
            return null;
        }

        // Get only major.minor version for brevity
        $parts = explode('.', $version);
        $shortVersion = implode('.', array_slice($parts, 0, 2));

        return substr($shortVersion, 0, 20);
    }
}
