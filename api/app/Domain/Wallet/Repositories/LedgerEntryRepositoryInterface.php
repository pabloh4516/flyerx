<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\LedgerEntry;
use App\Domain\Wallet\ValueObjects\Money;

interface LedgerEntryRepositoryInterface
{
    public function findById(Uuid $id): ?LedgerEntry;

    public function findByTransactionId(string $transactionId): array;

    public function findByAccountId(string $accountId, int $limit = 100, int $offset = 0): array;

    public function getAccountBalance(string $accountId): Money;

    public function save(LedgerEntry $entry): void;

    public function nextIdentity(): Uuid;
}
