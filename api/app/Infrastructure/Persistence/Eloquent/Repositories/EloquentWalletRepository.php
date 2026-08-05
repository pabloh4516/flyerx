<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Wallet;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use App\Infrastructure\Persistence\Mappers\WalletMapper;
use Illuminate\Support\Str;

final class EloquentWalletRepository implements WalletRepositoryInterface
{
    public function findById(Uuid $id): ?Wallet
    {
        $model = WalletModel::find($id->toString());

        if ($model === null) {
            return null;
        }

        return WalletMapper::toEntity($model);
    }

    public function findByUserId(Uuid $userId): ?Wallet
    {
        $model = WalletModel::where('user_id', $userId->toString())->first();

        if ($model === null) {
            return null;
        }

        return WalletMapper::toEntity($model);
    }

    public function save(Wallet $wallet): void
    {
        $data = WalletMapper::toModel($wallet);
        WalletModel::create($data);
    }

    public function update(Wallet $wallet): void
    {
        $data = WalletMapper::toModel($wallet);
        WalletModel::where('id', $wallet->getId())->update($data);
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString(Str::uuid()->toString());
    }
}
