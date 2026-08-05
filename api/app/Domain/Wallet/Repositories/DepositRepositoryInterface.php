<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Deposit;

interface DepositRepositoryInterface
{
    public function findById(Uuid $id): ?Deposit;

    public function findByIdempotencyKey(string $key): ?Deposit;

    public function findByProviderId(string $providerId): ?Deposit;

    public function findByPixTxId(string $txId): ?Deposit;

    public function findPendingByWalletId(Uuid $walletId): array;

    public function save(Deposit $deposit): void;

    public function update(Deposit $deposit): void;

    public function nextIdentity(): Uuid;
}
