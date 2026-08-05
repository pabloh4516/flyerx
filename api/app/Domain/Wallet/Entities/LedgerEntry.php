<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Entities;

use App\Domain\Shared\Entity;
use App\Domain\Wallet\Enums\EntryType;
use App\Domain\Wallet\ValueObjects\Money;
use DateTimeImmutable;

class LedgerEntry extends Entity
{
    private string $transactionId;
    private string $accountId;
    private EntryType $entryType;
    private Money $amount;
    private Money $balanceAfter;
    private ?string $description;
    private array $metadata;
    private DateTimeImmutable $createdAt;

    private function __construct(
        string $id,
        string $transactionId,
        string $accountId,
        EntryType $entryType,
        Money $amount,
        Money $balanceAfter,
        ?string $description = null
    ) {
        $this->id = $id;
        $this->transactionId = $transactionId;
        $this->accountId = $accountId;
        $this->entryType = $entryType;
        $this->amount = $amount;
        $this->balanceAfter = $balanceAfter;
        $this->description = $description;
        $this->metadata = [];
        $this->createdAt = new DateTimeImmutable();
    }

    public static function create(
        string $id,
        string $transactionId,
        string $accountId,
        EntryType $entryType,
        Money $amount,
        Money $balanceAfter,
        ?string $description = null
    ): self {
        return new self($id, $transactionId, $accountId, $entryType, $amount, $balanceAfter, $description);
    }

    public static function reconstitute(
        string $id,
        string $transactionId,
        string $accountId,
        EntryType $entryType,
        Money $amount,
        Money $balanceAfter,
        ?string $description,
        array $metadata,
        DateTimeImmutable $createdAt
    ): self {
        $entry = new self($id, $transactionId, $accountId, $entryType, $amount, $balanceAfter, $description);
        $entry->metadata = $metadata;
        $entry->createdAt = $createdAt;

        return $entry;
    }

    // Getters
    public function getTransactionId(): string
    {
        return $this->transactionId;
    }

    public function getAccountId(): string
    {
        return $this->accountId;
    }

    public function getEntryType(): EntryType
    {
        return $this->entryType;
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getBalanceAfter(): Money
    {
        return $this->balanceAfter;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function isDebit(): bool
    {
        return $this->entryType === EntryType::DEBIT;
    }

    public function isCredit(): bool
    {
        return $this->entryType === EntryType::CREDIT;
    }

    public function setMetadata(array $metadata): void
    {
        $this->metadata = $metadata;
    }
}
