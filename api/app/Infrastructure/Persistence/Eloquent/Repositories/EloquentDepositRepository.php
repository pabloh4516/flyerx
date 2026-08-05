<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\DepositModel;
use App\Infrastructure\Persistence\Mappers\DepositMapper;
use Illuminate\Support\Str;

final class EloquentDepositRepository implements DepositRepositoryInterface
{
    public function findById(Uuid $id): ?Deposit
    {
        $model = DepositModel::find($id->toString());

        if ($model === null) {
            return null;
        }

        return DepositMapper::toEntity($model);
    }

    public function findByIdempotencyKey(string $key): ?Deposit
    {
        $model = DepositModel::where('idempotency_key', $key)->first();

        if ($model === null) {
            return null;
        }

        return DepositMapper::toEntity($model);
    }

    public function findByProviderId(string $providerId): ?Deposit
    {
        $model = DepositModel::where('provider_id', $providerId)->first();

        if ($model === null) {
            return null;
        }

        return DepositMapper::toEntity($model);
    }

    public function findByPixTxId(string $txId): ?Deposit
    {
        $model = DepositModel::where('pix_tx_id', $txId)->first();

        if ($model === null) {
            return null;
        }

        return DepositMapper::toEntity($model);
    }

    public function findPendingByWalletId(Uuid $walletId): array
    {
        $models = DepositModel::where('wallet_id', $walletId->toString())
            ->whereIn('status', [
                DepositStatus::PENDING->value,
                DepositStatus::AWAITING_PAYMENT->value,
                DepositStatus::PROCESSING->value,
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return $models->map(fn (DepositModel $model) => DepositMapper::toEntity($model))->all();
    }

    public function save(Deposit $deposit): void
    {
        $data = DepositMapper::toModel($deposit);
        DepositModel::create($data);
    }

    public function update(Deposit $deposit): void
    {
        $data = DepositMapper::toModel($deposit);
        unset($data['id']);
        DepositModel::where('id', $deposit->getId())->update($data);
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString(Str::uuid()->toString());
    }
}
