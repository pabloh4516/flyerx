<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Wallet\Entities\Wallet;
use App\Domain\Wallet\Enums\WalletStatus;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use DateTimeImmutable;

final class WalletMapper
{
    public static function toEntity(WalletModel $model): Wallet
    {
        return Wallet::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            currency: $model->currency,
            status: WalletStatus::from($model->status),
            dailyWithdrawalLimit: Money::fromCents($model->daily_withdrawal_limit, $model->currency),
            monthlyWithdrawalLimit: Money::fromCents($model->monthly_withdrawal_limit, $model->currency),
            metadata: [
                'suspended_reason' => $model->suspended_reason,
                'suspended_at' => $model->suspended_at?->format('c'),
            ],
            createdAt: DateTimeImmutable::createFromMutable($model->created_at),
            updatedAt: DateTimeImmutable::createFromMutable($model->updated_at),
        );
    }

    public static function toModel(Wallet $entity): array
    {
        $metadata = $entity->getMetadata();

        return [
            'id' => $entity->getId(),
            'user_id' => $entity->getUserId(),
            'currency' => $entity->getCurrency(),
            'status' => $entity->getStatus()->value,
            'daily_withdrawal_limit' => $entity->getDailyWithdrawalLimit()->getCents(),
            'monthly_withdrawal_limit' => $entity->getMonthlyWithdrawalLimit()->getCents(),
            'suspended_at' => isset($metadata['suspended_at'])
                ? new DateTimeImmutable($metadata['suspended_at'])
                : null,
            'suspended_reason' => $metadata['suspended_reason'] ?? null,
        ];
    }
}
