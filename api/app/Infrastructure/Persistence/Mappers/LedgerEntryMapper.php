<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Wallet\Entities\LedgerEntry;
use App\Domain\Wallet\Enums\EntryType;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\LedgerEntryModel;
use DateTimeImmutable;

final class LedgerEntryMapper
{
    public static function toEntity(LedgerEntryModel $model): LedgerEntry
    {
        $currency = $model->currency ?? 'BRL';

        // Handle amount - could be stored as cents (int) or decimal
        $amount = is_int($model->amount)
            ? Money::fromCents($model->amount, $currency)
            : Money::fromDecimal((float) $model->amount, $currency);

        // Handle balance_after - could be stored as cents (int) or decimal
        $balanceAfter = isset($model->balance_after)
            ? (is_int($model->balance_after)
                ? Money::fromCents($model->balance_after, $currency)
                : Money::fromDecimal((float) $model->balance_after, $currency))
            : Money::zero($currency);

        return LedgerEntry::reconstitute(
            id: $model->id,
            transactionId: $model->transaction_id,
            accountId: $model->account_id,
            entryType: EntryType::from($model->entry_type),
            amount: $amount,
            balanceAfter: $balanceAfter,
            description: $model->description,
            metadata: $model->metadata ?? [],
            createdAt: $model->created_at
                ? DateTimeImmutable::createFromMutable($model->created_at)
                : new DateTimeImmutable(),
        );
    }

    public static function toModel(LedgerEntry $entity): array
    {
        return [
            'id' => $entity->getId(),
            'transaction_id' => $entity->getTransactionId(),
            'account_id' => $entity->getAccountId(),
            'entry_type' => $entity->getEntryType()->value,
            'amount' => $entity->getAmount()->getDecimal(),
            'currency' => $entity->getAmount()->getCurrency(),
            'balance_after' => $entity->getBalanceAfter()->getDecimal(),
            'description' => $entity->getDescription(),
            'metadata' => $entity->getMetadata(),
            'created_at' => $entity->getCreatedAt(),
        ];
    }
}
