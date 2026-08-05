<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Identity\Entities;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Enums\KycStatus;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Events\PasswordChanged;
use App\Domain\Identity\Events\TwoFactorDisabled;
use App\Domain\Identity\Events\TwoFactorEnabled;
use App\Domain\Identity\Events\UserEmailVerified;
use App\Domain\Identity\Events\UserKycUpdated;
use App\Domain\Identity\Events\UserRegistered;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Identity\ValueObjects\TaxNumber;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Ramsey\Uuid\Uuid;

class UserTest extends TestCase
{
    #[Test]
    public function it_registers_a_new_user(): void
    {
        $user = $this->createUser();

        $this->assertSame('user@example.com', $user->getEmail()->toString());
        $this->assertSame('John Doe', $user->getFullName());
        $this->assertSame('52998224725', $user->getTaxNumber()->getValue());
        $this->assertSame(UserStatus::PENDING, $user->getStatus());
        $this->assertSame(0, $user->getKycLevel());
        $this->assertSame(KycStatus::PENDING, $user->getKycStatus());
        $this->assertFalse($user->isTwoFactorEnabled());
        $this->assertFalse($user->isEmailVerified());
    }

    #[Test]
    public function it_records_user_registered_event(): void
    {
        $user = $this->createUser();
        $events = $user->pullDomainEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(UserRegistered::class, $events[0]);
    }

    #[Test]
    public function it_verifies_email(): void
    {
        $user = $this->createUser();
        $user->pullDomainEvents(); // Clear initial events

        $user->verifyEmail();

        $this->assertTrue($user->isEmailVerified());
        $this->assertSame(UserStatus::ACTIVE, $user->getStatus());

        $events = $user->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(UserEmailVerified::class, $events[0]);
    }

    #[Test]
    public function it_does_not_verify_email_twice(): void
    {
        $user = $this->createUser();
        $user->verifyEmail();
        $user->pullDomainEvents();

        $user->verifyEmail();

        $events = $user->pullDomainEvents();
        $this->assertCount(0, $events);
    }

    #[Test]
    public function it_changes_password(): void
    {
        $user = $this->createUser();
        $user->pullDomainEvents();

        $newPassword = Password::fromPlainText('NewSecureP@ss1');
        $user->changePassword($newPassword);

        $this->assertTrue($user->getPassword()->verify('NewSecureP@ss1'));

        $events = $user->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(PasswordChanged::class, $events[0]);
    }

    #[Test]
    public function it_enables_two_factor(): void
    {
        $user = $this->createUser();
        $user->pullDomainEvents();

        $user->enableTwoFactor();

        $this->assertTrue($user->isTwoFactorEnabled());

        $events = $user->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(TwoFactorEnabled::class, $events[0]);
    }

    #[Test]
    public function it_disables_two_factor(): void
    {
        $user = $this->createUser();
        $user->enableTwoFactor();
        $user->pullDomainEvents();

        $user->disableTwoFactor();

        $this->assertFalse($user->isTwoFactorEnabled());

        $events = $user->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(TwoFactorDisabled::class, $events[0]);
    }

    #[Test]
    public function it_updates_kyc(): void
    {
        $user = $this->createUser();
        $user->pullDomainEvents();

        $user->updateKyc(1, KycStatus::APPROVED);

        $this->assertSame(1, $user->getKycLevel());
        $this->assertSame(KycStatus::APPROVED, $user->getKycStatus());

        $events = $user->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(UserKycUpdated::class, $events[0]);
    }

    #[Test]
    public function it_records_failed_login_attempts(): void
    {
        $user = $this->createUser();
        $user->verifyEmail();

        $user->recordLoginAttempt(false, '127.0.0.1');
        $this->assertSame(1, $user->getFailedLoginAttempts());

        $user->recordLoginAttempt(false, '127.0.0.1');
        $this->assertSame(2, $user->getFailedLoginAttempts());
    }

    #[Test]
    public function it_resets_failed_attempts_on_successful_login(): void
    {
        $user = $this->createUser();
        $user->verifyEmail();

        $user->recordLoginAttempt(false, '127.0.0.1');
        $user->recordLoginAttempt(false, '127.0.0.1');
        $user->recordLoginAttempt(true, '127.0.0.1');

        $this->assertSame(0, $user->getFailedLoginAttempts());
        $this->assertSame('127.0.0.1', $user->getLastLoginIp());
    }

    #[Test]
    public function it_blocks_user(): void
    {
        $user = $this->createUser();
        $user->verifyEmail();
        $user->pullDomainEvents();

        $user->block('Suspicious activity');

        $this->assertSame(UserStatus::BLOCKED, $user->getStatus());
        $this->assertFalse($user->canLogin());
    }

    #[Test]
    public function pending_user_cannot_login(): void
    {
        $user = $this->createUser();

        $this->assertFalse($user->canLogin());
    }

    #[Test]
    public function active_user_can_login(): void
    {
        $user = $this->createUser();
        $user->verifyEmail();

        $this->assertTrue($user->canLogin());
    }

    private function createUser(): User
    {
        return User::register(
            id: Uuid::uuid4()->toString(),
            email: Email::fromString('user@example.com'),
            password: Password::fromPlainText('SecureP@ss1'),
            fullName: 'John Doe',
            taxNumber: TaxNumber::fromString('52998224725'),
        );
    }
}
