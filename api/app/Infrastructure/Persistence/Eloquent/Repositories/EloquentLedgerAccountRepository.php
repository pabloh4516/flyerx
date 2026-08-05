<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Wallet\Entities\LedgerAccount;
use App\Domain\Wallet\Repositories\LedgerAccountRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\LedgerAccountModel;
use App\Infrastructure\Persistence\Mappers\LedgerAccountMapper;
use Illuminate\Support\Str;

final class EloquentLedgerAccountRepository implements LedgerAccountRepositoryInterface
{
    public function findById(string $id): ?LedgerAccount
    {
        $model = LedgerAccountModel::find($id);

        if ($model === null) {
            return null;
        }

        return LedgerAccountMapper::toEntity($model);
    }

    public function findByCode(string $code): ?LedgerAccount
    {
        $model = LedgerAccountModel::where('name', $code)->first();

        if ($model === null) {
            return null;
        }

        return LedgerAccountMapper::toEntity($model);
    }

    public function findByWalletId(string $walletId): ?LedgerAccount
    {
        // Find the main balance account for this wallet
        $model = LedgerAccountModel::where('wallet_id', $walletId)
            ->where('type', 'asset')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($model === null) {
            return null;
        }

        return LedgerAccountMapper::toEntity($model);
    }

    public function findByWalletIdAndCategory(string $walletId, string $category): ?LedgerAccount
    {
        // First try to find by category column
        $model = LedgerAccountModel::where('wallet_id', $walletId)
            ->where('category', $category)
            ->first();

        // Fallback: try to find by name pattern (for backwards compatibility)
        if ($model === null) {
            $namePattern = match ($category) {
                'user_balance' => '%BALANCE%',
                'user_reserve' => '%RESERVE%',
                'user_blocked' => '%BLOCKED%',
                default => '%' . strtoupper($category) . '%',
            };

            $model = LedgerAccountModel::where('wallet_id', $walletId)
                ->where('name', 'like', $namePattern)
                ->first();
        }

        if ($model === null) {
            return null;
        }

        return LedgerAccountMapper::toEntity($model);
    }

    public function findAllByWalletId(string $walletId): array
    {
        $models = LedgerAccountModel::where('wallet_id', $walletId)
            ->orderBy('created_at', 'asc')
            ->get();

        return $models->map(fn (LedgerAccountModel $model) => LedgerAccountMapper::toEntity($model))->all();
    }

    public function findSystemAccountByCategory(string $category): ?LedgerAccount
    {
        // First try to find by category column
        $model = LedgerAccountModel::where('is_system', true)
            ->where('category', $category)
            ->first();

        // Fallback: try to find by type column (for backwards compatibility)
        if ($model === null) {
            $model = LedgerAccountModel::where('is_system', true)
                ->where('type', $category)
                ->first();
        }

        if ($model === null) {
            return null;
        }

        return LedgerAccountMapper::toEntity($model);
    }

    public function save(LedgerAccount $account): void
    {
        $data = LedgerAccountMapper::toModel($account);
        LedgerAccountModel::create($data);
    }

    public function nextIdentity(): string
    {
        return Str::uuid()->toString();
    }
}
