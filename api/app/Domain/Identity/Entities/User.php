<?php

declare(strict_types=1);

namespace App\Domain\Identity\Entities;

use App\Domain\Identity\Enums\KycStatus;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\Events\PasswordChanged;
use App\Domain\Identity\Events\TwoFactorDisabled;
use App\Domain\Identity\Events\TwoFactorEnabled;
use App\Domain\Identity\Events\UserBlocked;
use App\Domain\Identity\Events\UserEmailVerified;
use App\Domain\Identity\Events\UserKycUpdated;
use App\Domain\Identity\Events\UserRegistered;
use App\Domain\Identity\Exceptions\UserBlockedException;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Identity\ValueObjects\PhoneNumber;
use App\Domain\Identity\ValueObjects\TaxNumber;
use App\Domain\Shared\AggregateRoot;
use DateTimeImmutable;
use DateTimeInterface;

class User extends AggregateRoot
{
    private Email $email;
    private ?DateTimeImmutable $emailVerifiedAt;
    private Password $password;
    private string $fullName;
    private TaxNumber $taxNumber;
    private ?PhoneNumber $phoneNumber;
    private ?DateTimeImmutable $phoneVerifiedAt;
    private ?DateTimeImmutable $birthDate;
    private UserStatus $status;
    private int $kycLevel;
    private KycStatus $kycStatus;
    private ?DateTimeImmutable $kycVerifiedAt;
    private bool $twoFactorEnabled;
    private int $failedLoginAttempts;
    private ?DateTimeImmutable $lockedUntil;
    private ?DateTimeImmutable $lastLoginAt;
    private ?string $lastLoginIp;
    private array $metadata;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    private function __construct(
        string $id,
        Email $email,
        Password $password,
        string $fullName,
        TaxNumber $taxNumber,
        ?PhoneNumber $phoneNumber = null,
        ?DateTimeImmutable $birthDate = null
    ) {
        $this->id = $id;
        $this->email = $email;
        $this->emailVerifiedAt = null;
        $this->password = $password;
        $this->fullName = $fullName;
        $this->taxNumber = $taxNumber;
        $this->phoneNumber = $phoneNumber;
        $this->phoneVerifiedAt = null;
        $this->birthDate = $birthDate;
        $this->status = UserStatus::PENDING;
        $this->kycLevel = 0;
        $this->kycStatus = KycStatus::PENDING;
        $this->kycVerifiedAt = null;
        $this->twoFactorEnabled = false;
        $this->failedLoginAttempts = 0;
        $this->lockedUntil = null;
        $this->lastLoginAt = null;
        $this->lastLoginIp = null;
        $this->metadata = [];
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public static function register(
        string $id,
        Email $email,
        Password $password,
        string $fullName,
        TaxNumber $taxNumber,
        ?PhoneNumber $phoneNumber = null,
        ?DateTimeImmutable $birthDate = null
    ): self {
        $user = new self($id, $email, $password, $fullName, $taxNumber, $phoneNumber, $birthDate);

        $user->recordDomainEvent(new UserRegistered($id, [
            'email' => $email->toString(),
            'full_name' => $fullName,
            'tax_number_type' => $taxNumber->getType(),
        ]));

        return $user;
    }

    public static function reconstitute(
        string $id,
        Email $email,
        ?DateTimeImmutable $emailVerifiedAt,
        Password $password,
        string $fullName,
        TaxNumber $taxNumber,
        ?PhoneNumber $phoneNumber,
        ?DateTimeImmutable $phoneVerifiedAt,
        ?DateTimeImmutable $birthDate,
        UserStatus $status,
        int $kycLevel,
        KycStatus $kycStatus,
        ?DateTimeImmutable $kycVerifiedAt,
        bool $twoFactorEnabled,
        int $failedLoginAttempts,
        ?DateTimeImmutable $lockedUntil,
        ?DateTimeImmutable $lastLoginAt,
        ?string $lastLoginIp,
        array $metadata,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $user = new self($id, $email, $password, $fullName, $taxNumber, $phoneNumber, $birthDate);
        $user->emailVerifiedAt = $emailVerifiedAt;
        $user->phoneVerifiedAt = $phoneVerifiedAt;
        $user->status = $status;
        $user->kycLevel = $kycLevel;
        $user->kycStatus = $kycStatus;
        $user->kycVerifiedAt = $kycVerifiedAt;
        $user->twoFactorEnabled = $twoFactorEnabled;
        $user->failedLoginAttempts = $failedLoginAttempts;
        $user->lockedUntil = $lockedUntil;
        $user->lastLoginAt = $lastLoginAt;
        $user->lastLoginIp = $lastLoginIp;
        $user->metadata = $metadata;
        $user->createdAt = $createdAt;
        $user->updatedAt = $updatedAt;

        return $user;
    }

    // Getters
    public function getEmail(): Email
    {
        return $this->email;
    }

    public function getEmailVerifiedAt(): ?DateTimeImmutable
    {
        return $this->emailVerifiedAt;
    }

    public function isEmailVerified(): bool
    {
        return $this->emailVerifiedAt !== null;
    }

    public function getPassword(): Password
    {
        return $this->password;
    }

    public function getPasswordHash(): string
    {
        return $this->password->getHash();
    }

    public function getFullName(): string
    {
        return $this->fullName;
    }

    public function getTaxNumber(): TaxNumber
    {
        return $this->taxNumber;
    }

    public function getPhoneNumber(): ?PhoneNumber
    {
        return $this->phoneNumber;
    }

    public function getPhoneVerifiedAt(): ?DateTimeImmutable
    {
        return $this->phoneVerifiedAt;
    }

    public function getBirthDate(): ?DateTimeImmutable
    {
        return $this->birthDate;
    }

    public function getStatus(): UserStatus
    {
        return $this->status;
    }

    public function getKycLevel(): int
    {
        return $this->kycLevel;
    }

    public function getKycStatus(): KycStatus
    {
        return $this->kycStatus;
    }

    public function getKycVerifiedAt(): ?DateTimeImmutable
    {
        return $this->kycVerifiedAt;
    }

    public function isTwoFactorEnabled(): bool
    {
        return $this->twoFactorEnabled;
    }

    public function getFailedLoginAttempts(): int
    {
        return $this->failedLoginAttempts;
    }

    public function getLockedUntil(): ?DateTimeImmutable
    {
        return $this->lockedUntil;
    }

    public function getLastLoginAt(): ?DateTimeImmutable
    {
        return $this->lastLoginAt;
    }

    public function getLastLoginIp(): ?string
    {
        return $this->lastLoginIp;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Business Logic

    public function canLogin(): bool
    {
        if (!$this->status->canLogin()) {
            return false;
        }

        if ($this->isLocked()) {
            return false;
        }

        return true;
    }

    public function isLocked(): bool
    {
        if ($this->lockedUntil === null) {
            return false;
        }

        return $this->lockedUntil > new DateTimeImmutable();
    }

    public function verifyEmail(): void
    {
        if ($this->emailVerifiedAt !== null) {
            return;
        }

        $this->emailVerifiedAt = new DateTimeImmutable();
        $this->status = UserStatus::ACTIVE;
        $this->touch();

        $this->recordDomainEvent(new UserEmailVerified($this->id));
    }

    public function changePassword(Password $newPassword): void
    {
        $this->password = $newPassword;
        $this->touch();

        $this->recordDomainEvent(new PasswordChanged($this->id));
    }

    public function recordLoginAttempt(bool $success, string $ip): void
    {
        if ($success) {
            $this->failedLoginAttempts = 0;
            $this->lockedUntil = null;
            $this->lastLoginAt = new DateTimeImmutable();
            $this->lastLoginIp = $ip;
        } else {
            $this->failedLoginAttempts++;

            $maxAttempts = $this->getConfigValue('flyerx.security.max_login_attempts', 5);
            if ($this->failedLoginAttempts >= $maxAttempts) {
                $lockoutDuration = $this->getConfigValue('flyerx.security.lockout_duration', 300);
                $this->lockedUntil = (new DateTimeImmutable())->modify("+{$lockoutDuration} seconds");
            }
        }

        $this->touch();
    }

    public function enableTwoFactor(): void
    {
        if ($this->twoFactorEnabled) {
            return;
        }

        $this->twoFactorEnabled = true;
        $this->touch();

        $this->recordDomainEvent(new TwoFactorEnabled($this->id));
    }

    public function disableTwoFactor(): void
    {
        if (!$this->twoFactorEnabled) {
            return;
        }

        $this->twoFactorEnabled = false;
        $this->touch();

        $this->recordDomainEvent(new TwoFactorDisabled($this->id));
    }

    public function updateKyc(int $level, KycStatus $status): void
    {
        $previousLevel = $this->kycLevel;
        $previousStatus = $this->kycStatus;

        $this->kycLevel = $level;
        $this->kycStatus = $status;
        $this->touch();

        $this->recordDomainEvent(new UserKycUpdated($this->id, [
            'previous_level' => $previousLevel,
            'new_level' => $level,
            'previous_status' => $previousStatus->value,
            'new_status' => $status->value,
        ]));
    }

    public function block(string $reason): void
    {
        $this->status = UserStatus::BLOCKED;
        $this->metadata['blocked_reason'] = $reason;
        $this->metadata['blocked_at'] = (new DateTimeImmutable())->format(DateTimeInterface::ATOM);
        $this->touch();

        $this->recordDomainEvent(new UserBlocked($this->id, $reason));
    }

    public function unblock(): void
    {
        $this->status = UserStatus::ACTIVE;
        unset($this->metadata['blocked_reason'], $this->metadata['blocked_at']);
        $this->touch();
    }

    public function updateProfile(string $fullName, ?PhoneNumber $phoneNumber, ?DateTimeImmutable $birthDate): void
    {
        $this->fullName = $fullName;
        $this->phoneNumber = $phoneNumber;
        $this->birthDate = $birthDate;
        $this->touch();
    }

    private function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    private function getConfigValue(string $key, mixed $default): mixed
    {
        if (function_exists('config') && function_exists('app') && app()->bound('config')) {
            return config($key, $default);
        }

        return $default;
    }
}
