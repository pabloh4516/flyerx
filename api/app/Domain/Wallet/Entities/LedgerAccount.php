<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Entities;

use App\Domain\Shared\Entity;
use App\Domain\Wallet\Enums\AccountType;
use App\Domain\Wallet\Enums\EntryType;
use DateTimeImmutable;

class LedgerAccount extends Entity
{
    private string $code;
    private string $name;
    private ?string $description;
    private AccountType $type;
    private string $category;
    private ?string $parentId;
    private string $normalBalance;
    private bool $isSystem;
    private ?string $walletId;
    private string $currency;
    private bool $isActive;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    private function __construct(
        string $id,
        string $code,
        string $name,
        AccountType $type,
        string $category
    ) {
        $this->id = $id;
        $this->code = $code;
        $this->name = $name;
        $this->description = null;
        $this->type = $type;
        $this->category = $category;
        $this->parentId = null;
        $this->normalBalance = $type->normalBalance();
        $this->isSystem = false;
        $this->walletId = null;
        $this->currency = 'BRL';
        $this->isActive = true;
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public static function createSystemAccount(
        string $id,
        string $code,
        string $name,
        AccountType $type,
        string $category,
        ?string $description = null
    ): self {
        $account = new self($id, $code, $name, $type, $category);
        $account->isSystem = true;
        $account->description = $description;

        return $account;
    }

    public static function createUserAccount(
        string $id,
        string $code,
        string $name,
        string $walletId,
        AccountType $type = AccountType::ASSET,
        string $category = 'user_balance'
    ): self {
        $account = new self($id, $code, $name, $type, $category);
        $account->walletId = $walletId;

        return $account;
    }

    public static function reconstitute(
        string $id,
        string $code,
        string $name,
        ?string $description,
        AccountType $type,
        string $category,
        ?string $parentId,
        string $normalBalance,
        bool $isSystem,
        ?string $walletId,
        string $currency,
        bool $isActive,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $account = new self($id, $code, $name, $type, $category);
        $account->description = $description;
        $account->parentId = $parentId;
        $account->normalBalance = $normalBalance;
        $account->isSystem = $isSystem;
        $account->walletId = $walletId;
        $account->currency = $currency;
        $account->isActive = $isActive;
        $account->createdAt = $createdAt;
        $account->updatedAt = $updatedAt;

        return $account;
    }

    // Getters
    public function getCode(): string
    {
        return $this->code;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getType(): AccountType
    {
        return $this->type;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getParentId(): ?string
    {
        return $this->parentId;
    }

    public function getNormalBalance(): string
    {
        return $this->normalBalance;
    }

    public function isSystem(): bool
    {
        return $this->isSystem;
    }

    public function getWalletId(): ?string
    {
        return $this->walletId;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function isActive(): bool
    {
        return $this->isActive;
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

    /**
     * Determine if an entry type increases this account's balance.
     */
    public function entryIncreases(EntryType $entryType): bool
    {
        return $entryType->value === $this->normalBalance;
    }

    /**
     * Determine if an entry type decreases this account's balance.
     */
    public function entryDecreases(EntryType $entryType): bool
    {
        return !$this->entryIncreases($entryType);
    }
}
