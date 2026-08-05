<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Entities;

use App\Domain\Shared\AggregateRoot;
use App\Domain\Wallet\Enums\WalletStatus;
use App\Domain\Wallet\Events\WalletCreated;
use App\Domain\Wallet\Events\WalletSuspended;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\ValueObjects\Money;
use DateTimeImmutable;

class Wallet extends AggregateRoot
{
    private string $userId;
    private string $currency;
    private WalletStatus $status;
    private Money $dailyWithdrawalLimit;
    private Money $monthlyWithdrawalLimit;
    private array $metadata;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    private function __construct(
        string $id,
        string $userId,
        string $currency = 'BRL'
    ) {
        $this->id = $id;
        $this->userId = $userId;
        $this->currency = $currency;
        $this->status = WalletStatus::ACTIVE;
        $this->dailyWithdrawalLimit = Money::fromDecimal(5000.00, $currency);
        $this->monthlyWithdrawalLimit = Money::fromDecimal(50000.00, $currency);
        $this->metadata = [];
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public static function create(
        string $id,
        string $userId,
        string $currency = 'BRL'
    ): self {
        $wallet = new self($id, $userId, $currency);

        $wallet->recordDomainEvent(new WalletCreated($id, [
            'user_id' => $userId,
            'currency' => $currency,
        ]));

        return $wallet;
    }

    public static function reconstitute(
        string $id,
        string $userId,
        string $currency,
        WalletStatus $status,
        Money $dailyWithdrawalLimit,
        Money $monthlyWithdrawalLimit,
        array $metadata,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $wallet = new self($id, $userId, $currency);
        $wallet->status = $status;
        $wallet->dailyWithdrawalLimit = $dailyWithdrawalLimit;
        $wallet->monthlyWithdrawalLimit = $monthlyWithdrawalLimit;
        $wallet->metadata = $metadata;
        $wallet->createdAt = $createdAt;
        $wallet->updatedAt = $updatedAt;

        return $wallet;
    }

    // Getters
    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function getStatus(): WalletStatus
    {
        return $this->status;
    }

    public function getDailyWithdrawalLimit(): Money
    {
        return $this->dailyWithdrawalLimit;
    }

    public function getMonthlyWithdrawalLimit(): Money
    {
        return $this->monthlyWithdrawalLimit;
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

    public function isActive(): bool
    {
        return $this->status === WalletStatus::ACTIVE;
    }

    public function canDeposit(): bool
    {
        return $this->status->canDeposit();
    }

    public function canWithdraw(): bool
    {
        return $this->status->canWithdraw();
    }

    public function assertCanOperate(): void
    {
        if (!$this->status->canOperate()) {
            throw new WalletNotActiveException("Wallet is {$this->status->value}");
        }
    }

    public function suspend(string $reason): void
    {
        if ($this->status === WalletStatus::SUSPENDED) {
            return;
        }

        $this->status = WalletStatus::SUSPENDED;
        $this->metadata['suspended_reason'] = $reason;
        $this->metadata['suspended_at'] = (new DateTimeImmutable())->format('c');
        $this->touch();

        $this->recordDomainEvent(new WalletSuspended($this->id, $reason));
    }

    public function activate(): void
    {
        if ($this->status === WalletStatus::ACTIVE) {
            return;
        }

        $this->status = WalletStatus::ACTIVE;
        unset($this->metadata['suspended_reason'], $this->metadata['suspended_at']);
        $this->touch();
    }

    public function updateLimits(Money $dailyLimit, Money $monthlyLimit): void
    {
        $this->dailyWithdrawalLimit = $dailyLimit;
        $this->monthlyWithdrawalLimit = $monthlyLimit;
        $this->touch();
    }

    private function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
