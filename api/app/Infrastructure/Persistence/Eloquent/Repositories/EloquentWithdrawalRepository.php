<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Enums\WithdrawalStatus;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\WithdrawalModel;
use App\Infrastructure\Persistence\Mappers\WithdrawalMapper;
use DateTimeImmutable;
use Illuminate\Support\Str;

final class EloquentWithdrawalRepository implements WithdrawalRepositoryInterface
{
    public function findById(Uuid $id): ?Withdrawal
    {
        $model = WithdrawalModel::find($id->toString());

        if ($model === null) {
            return null;
        }

        return WithdrawalMapper::toEntity($model);
    }

    public function findByIdempotencyKey(string $key): ?Withdrawal
    {
        $model = WithdrawalModel::where('idempotency_key', $key)->first();

        if ($model === null) {
            return null;
        }

        return WithdrawalMapper::toEntity($model);
    }

    public function findByProviderId(string $providerId): ?Withdrawal
    {
        $model = WithdrawalModel::where('provider_id', $providerId)->first();

        if ($model === null) {
            return null;
        }

        return WithdrawalMapper::toEntity($model);
    }

    public function findPendingByWalletId(Uuid $walletId): array
    {
        $models = WithdrawalModel::where('wallet_id', $walletId->toString())
            ->whereIn('status', [
                WithdrawalStatus::PENDING->value,
                WithdrawalStatus::APPROVED->value,
                WithdrawalStatus::PROCESSING->value,
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return $models->map(fn (WithdrawalModel $model) => WithdrawalMapper::toEntity($model))->all();
    }

    public function save(Withdrawal $withdrawal): void
    {
        $data = WithdrawalMapper::toModel($withdrawal);
        WithdrawalModel::create($data);
    }

    public function update(Withdrawal $withdrawal): void
    {
        $data = WithdrawalMapper::toModel($withdrawal);
        unset($data['id']);
        WithdrawalModel::where('id', $withdrawal->getId())->update($data);
    }

    public function sumCompletedByWalletIdAndDateRange(
        Uuid $walletId,
        DateTimeImmutable $from,
        DateTimeImmutable $to
    ): Money {
        $sum = WithdrawalModel::where('wallet_id', $walletId->toString())
            ->where('status', WithdrawalStatus::COMPLETED->value)
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount');

        return Money::fromCents((int) $sum);
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString(Str::uuid()->toString());
    }
}
