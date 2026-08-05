<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Wallet\Entities\LedgerAccount;
use App\Domain\Wallet\Enums\AccountType;
use App\Infrastructure\Persistence\Eloquent\Models\LedgerAccountModel;
use DateTimeImmutable;

final class LedgerAccountMapper
{
    public static function toEntity(LedgerAccountModel $model): LedgerAccount
    {
        return LedgerAccount::reconstitute(
            id: $model->id,
            code: $model->code ?? $model->name,
            name: $model->name,
            description: $model->description,
            type: AccountType::from($model->type),
            category: $model->category ?? $model->type,
            parentId: null,
            normalBalance: AccountType::from($model->type)->normalBalance(),
            isSystem: $model->is_system ?? false,
            walletId: $model->wallet_id,
            currency: $model->currency ?? 'BRL',
            isActive: true,
            createdAt: $model->created_at
                ? DateTimeImmutable::createFromMutable($model->created_at)
                : new DateTimeImmutable(),
            updatedAt: $model->updated_at
                ? DateTimeImmutable::createFromMutable($model->updated_at)
                : new DateTimeImmutable(),
        );
    }

    public static function toModel(LedgerAccount $entity): array
    {
        return [
            'id' => $entity->getId(),
            'wallet_id' => $entity->getWalletId(),
            'type' => $entity->getType()->value,
            'category' => $entity->getCategory(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'currency' => $entity->getCurrency(),
            'balance' => 0, // Balance is calculated from entries
            'is_system' => $entity->isSystem(),
        ];
    }
}
