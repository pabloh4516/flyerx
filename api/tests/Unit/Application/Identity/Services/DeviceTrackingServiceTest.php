<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Identity\Services;

use App\Application\Identity\DTOs\DeviceInfoDTO;
use App\Application\Identity\Services\DeviceTrackingService;
use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Repositories\DeviceRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Mail\NewDeviceDetectedMail;
use Illuminate\Contracts\Mail\Mailer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class DeviceTrackingServiceTest extends TestCase
{
    private DeviceTrackingService $service;
    private DeviceRepositoryInterface&MockObject $deviceRepository;
    private UserRepositoryInterface&MockObject $userRepository;
    private Mailer&MockObject $mailer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->deviceRepository = $this->createMock(DeviceRepositoryInterface::class);
        $this->userRepository = $this->createMock(UserRepositoryInterface::class);
        $this->mailer = $this->createMock(Mailer::class);

        $this->service = new DeviceTrackingService(
            $this->deviceRepository,
            $this->userRepository,
            $this->mailer,
        );
    }

    // -------------------------------------------------------------------------
    // parseUserAgent Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_parses_chrome_on_windows_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Chrome', $result['browser_name']);
        $this->assertStringStartsWith('120', $result['browser_version']);
        $this->assertEquals('Windows 11', $result['os_name']);
        $this->assertEquals('desktop', $result['device_type']);
    }

    #[Test]
    public function it_parses_safari_on_macos_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Safari', $result['browser_name']);
        $this->assertEquals('17.1', $result['browser_version']);
        $this->assertEquals('macOS', $result['os_name']);
        $this->assertEquals('desktop', $result['device_type']);
    }

    #[Test]
    public function it_parses_firefox_on_linux_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Firefox', $result['browser_name']);
        $this->assertEquals('120.0', $result['browser_version']);
        $this->assertEquals('Linux', $result['os_name']);
        $this->assertEquals('desktop', $result['device_type']);
    }

    #[Test]
    public function it_parses_chrome_on_android_mobile_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Chrome', $result['browser_name']);
        $this->assertEquals('Android', $result['os_name']);
        $this->assertEquals('mobile', $result['device_type']);
    }

    #[Test]
    public function it_parses_safari_on_iphone_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Safari', $result['browser_name']);
        $this->assertEquals('iOS', $result['os_name']);
        $this->assertEquals('mobile', $result['device_type']);
    }

    #[Test]
    public function it_parses_safari_on_ipad_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Safari', $result['browser_name']);
        $this->assertEquals('iOS', $result['os_name']);
        $this->assertEquals('tablet', $result['device_type']);
    }

    #[Test]
    public function it_parses_edge_browser_user_agent(): void
    {
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';

        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('Edge', $result['browser_name']);
        $this->assertStringStartsWith('120', $result['browser_version']);
    }

    #[Test]
    public function it_returns_defaults_for_empty_user_agent(): void
    {
        $result = $this->service->parseUserAgent('');

        $this->assertNull($result['browser_name']);
        $this->assertNull($result['browser_version']);
        $this->assertNull($result['os_name']);
        $this->assertNull($result['os_version']);
        $this->assertEquals('desktop', $result['device_type']);
    }

    // -------------------------------------------------------------------------
    // generateFingerprint Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_uses_provided_fingerprint_when_available(): void
    {
        $deviceInfo = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Test',
            ipAddress: '192.168.1.1',
            fingerprint: 'custom-fingerprint-123',
        );

        $result = $this->service->generateFingerprint($deviceInfo);

        $this->assertEquals('custom-fingerprint-123', $result);
    }

    #[Test]
    public function it_generates_fingerprint_from_device_info_when_not_provided(): void
    {
        $deviceInfo = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Test',
            ipAddress: '192.168.1.1',
            acceptLanguage: 'pt-BR',
            platform: 'desktop',
        );

        $result = $this->service->generateFingerprint($deviceInfo);

        $this->assertNotEmpty($result);
        $this->assertEquals(64, strlen($result)); // SHA-256 hash length
    }

    #[Test]
    public function it_generates_consistent_fingerprint_for_same_input(): void
    {
        $deviceInfo1 = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Test',
            ipAddress: '192.168.1.1',
            acceptLanguage: 'pt-BR',
            platform: 'desktop',
        );

        $deviceInfo2 = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Test',
            ipAddress: '192.168.1.2', // IP is not used in fingerprint
            acceptLanguage: 'pt-BR',
            platform: 'desktop',
        );

        $result1 = $this->service->generateFingerprint($deviceInfo1);
        $result2 = $this->service->generateFingerprint($deviceInfo2);

        $this->assertEquals($result1, $result2);
    }

    #[Test]
    public function it_generates_different_fingerprint_for_different_input(): void
    {
        $deviceInfo1 = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Chrome',
            ipAddress: '192.168.1.1',
        );

        $deviceInfo2 = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Firefox',
            ipAddress: '192.168.1.1',
        );

        $result1 = $this->service->generateFingerprint($deviceInfo1);
        $result2 = $this->service->generateFingerprint($deviceInfo2);

        $this->assertNotEquals($result1, $result2);
    }

    // -------------------------------------------------------------------------
    // isNewDevice Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_returns_true_when_device_is_new(): void
    {
        $userId = Uuid::generate()->toString();
        $fingerprint = 'new-fingerprint';

        $this->deviceRepository
            ->expects($this->once())
            ->method('findByUserIdAndFingerprint')
            ->with(
                $this->callback(fn (Uuid $id) => $id->toString() === $userId),
                $fingerprint
            )
            ->willReturn(null);

        $result = $this->service->isNewDevice($userId, $fingerprint);

        $this->assertTrue($result);
    }

    #[Test]
    public function it_returns_false_when_device_exists(): void
    {
        $userId = Uuid::generate()->toString();
        $fingerprint = 'existing-fingerprint';

        $this->deviceRepository
            ->expects($this->once())
            ->method('findByUserIdAndFingerprint')
            ->willReturn([
                'id' => Uuid::generate()->toString(),
                'user_id' => $userId,
                'device_fingerprint' => $fingerprint,
            ]);

        $result = $this->service->isNewDevice($userId, $fingerprint);

        $this->assertFalse($result);
    }

    // -------------------------------------------------------------------------
    // trackDevice Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_updates_existing_device_on_track(): void
    {
        $userId = Uuid::generate()->toString();
        $deviceId = Uuid::generate()->toString();
        $fingerprint = 'existing-fingerprint';

        $deviceInfo = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Chrome',
            ipAddress: '192.168.1.100',
            fingerprint: $fingerprint,
        );

        $this->deviceRepository
            ->expects($this->once())
            ->method('findByUserIdAndFingerprint')
            ->willReturn([
                'id' => $deviceId,
                'user_id' => $userId,
                'device_fingerprint' => $fingerprint,
                'is_blocked' => false,
            ]);

        $this->deviceRepository
            ->expects($this->once())
            ->method('updateLastSeen')
            ->with(
                $this->callback(fn (Uuid $id) => $id->toString() === $deviceId),
                '192.168.1.100'
            );

        // Should NOT create a new device or send notification
        $this->deviceRepository->expects($this->never())->method('create');

        $result = $this->service->trackDevice($userId, $deviceInfo);

        $this->assertEquals($deviceId, $result);
    }

    #[Test]
    public function it_creates_new_device_and_sends_notification(): void
    {
        $userId = Uuid::generate()->toString();
        $newDeviceId = Uuid::generate();
        $fingerprint = 'new-fingerprint-hash';

        $deviceInfo = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
            ipAddress: '192.168.1.100',
            fingerprint: $fingerprint,
        );

        // Mock user for notification
        $user = $this->createMock(User::class);
        $user->method('getEmail')->willReturn(Email::fromString('test@example.com'));
        $user->method('getFullName')->willReturn('Test User');

        $this->deviceRepository
            ->expects($this->once())
            ->method('findByUserIdAndFingerprint')
            ->willReturn(null);

        $this->deviceRepository
            ->expects($this->once())
            ->method('create')
            ->willReturn($newDeviceId);

        $this->userRepository
            ->expects($this->once())
            ->method('findById')
            ->willReturn($user);

        // Verify mail is queued
        $pendingMail = $this->createMock(\Illuminate\Mail\PendingMail::class);
        $pendingMail->expects($this->once())
            ->method('queue')
            ->with($this->isInstanceOf(NewDeviceDetectedMail::class));

        $this->mailer
            ->expects($this->once())
            ->method('to')
            ->with('test@example.com')
            ->willReturn($pendingMail);

        $result = $this->service->trackDevice($userId, $deviceInfo);

        $this->assertEquals($newDeviceId->toString(), $result);
    }

    #[Test]
    public function it_throws_exception_when_device_is_blocked(): void
    {
        $userId = Uuid::generate()->toString();
        $deviceId = Uuid::generate()->toString();
        $fingerprint = 'blocked-fingerprint';

        $deviceInfo = new DeviceInfoDTO(
            userAgent: 'Mozilla/5.0 Chrome',
            ipAddress: '192.168.1.100',
            fingerprint: $fingerprint,
        );

        $this->deviceRepository
            ->expects($this->once())
            ->method('findByUserIdAndFingerprint')
            ->willReturn([
                'id' => $deviceId,
                'user_id' => $userId,
                'device_fingerprint' => $fingerprint,
                'is_blocked' => true,
            ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Este dispositivo foi bloqueado.');

        $this->service->trackDevice($userId, $deviceInfo);
    }

    // -------------------------------------------------------------------------
    // getTrustedDevices Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_returns_only_trusted_devices(): void
    {
        $userId = Uuid::generate()->toString();

        $devices = [
            ['id' => '1', 'is_trusted' => true, 'device_name' => 'Chrome Desktop'],
            ['id' => '2', 'is_trusted' => false, 'device_name' => 'Firefox Mobile'],
            ['id' => '3', 'is_trusted' => true, 'device_name' => 'Safari iPad'],
        ];

        $this->deviceRepository
            ->expects($this->once())
            ->method('findAllByUserId')
            ->willReturn($devices);

        $result = $this->service->getTrustedDevices($userId);

        $this->assertCount(2, $result);
        $this->assertEquals('1', array_values($result)[0]['id']);
        $this->assertEquals('3', array_values($result)[1]['id']);
    }

    // -------------------------------------------------------------------------
    // trustDevice / blockDevice / removeDevice Tests
    // -------------------------------------------------------------------------

    #[Test]
    public function it_trusts_a_device(): void
    {
        $deviceId = Uuid::generate()->toString();

        $this->deviceRepository
            ->expects($this->once())
            ->method('trustDevice')
            ->with($this->callback(fn (Uuid $id) => $id->toString() === $deviceId));

        $this->service->trustDevice($deviceId);
    }

    #[Test]
    public function it_blocks_a_device(): void
    {
        $deviceId = Uuid::generate()->toString();

        $this->deviceRepository
            ->expects($this->once())
            ->method('blockDevice')
            ->with($this->callback(fn (Uuid $id) => $id->toString() === $deviceId));

        $this->service->blockDevice($deviceId);
    }

    #[Test]
    public function it_removes_a_device(): void
    {
        $deviceId = Uuid::generate()->toString();

        $this->deviceRepository
            ->expects($this->once())
            ->method('delete')
            ->with($this->callback(fn (Uuid $id) => $id->toString() === $deviceId));

        $this->service->removeDevice($deviceId);
    }

    // -------------------------------------------------------------------------
    // Data Providers
    // -------------------------------------------------------------------------

    #[Test]
    #[DataProvider('mobileUserAgentProvider')]
    public function it_detects_mobile_device_type(string $userAgent): void
    {
        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('mobile', $result['device_type']);
    }

    public static function mobileUserAgentProvider(): array
    {
        return [
            'iphone' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
            'android_phone' => ['Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Mobile'],
            'windows_phone' => ['Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1) AppleWebKit/537.36'],
            'blackberry' => ['Mozilla/5.0 (BB10; Kbd) AppleWebKit/537.35+ BlackBerry'],
        ];
    }

    #[Test]
    #[DataProvider('tabletUserAgentProvider')]
    public function it_detects_tablet_device_type(string $userAgent): void
    {
        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('tablet', $result['device_type']);
    }

    public static function tabletUserAgentProvider(): array
    {
        return [
            'ipad' => ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'],
            'android_tablet' => ['Mozilla/5.0 (Linux; Android 13; SM-T870) AppleWebKit/537.36 Tablet'],
            'kindle' => ['Mozilla/5.0 (Linux; Android 5.1.1; KFAUWI) AppleWebKit/537.36 Silk/3.0'],
        ];
    }

    #[Test]
    #[DataProvider('desktopUserAgentProvider')]
    public function it_detects_desktop_device_type(string $userAgent): void
    {
        $result = $this->service->parseUserAgent($userAgent);

        $this->assertEquals('desktop', $result['device_type']);
    }

    public static function desktopUserAgentProvider(): array
    {
        return [
            'windows_chrome' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'],
            'mac_safari' => ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'],
            'linux_firefox' => ['Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'],
        ];
    }
}
