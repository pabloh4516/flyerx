<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\ValueObjects\Money;
use DateTimeImmutable;

interface WithdrawalRepositoryInterface
{
    public function findById(Uuid $id): ?Withdrawal;

    public function findByIdempotencyKey(string $key): ?Withdrawal;

    public function findByProviderId(string $providerId): ?Withdrawal;

    public function findPendingByWalletId(Uuid $walletId): array;

    public function save(Withdrawal $withdrawal): void;

    public function update(Withdrawal $withdrawal): void;

    public function sumCompletedByWalletIdAndDateRange(
        Uuid $walletId,
        DateTimeImmutable $from,
        DateTimeImmutable $to
    ): Money;

    public function nextIdentity(): Uuid;
}
