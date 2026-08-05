<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Enums\WithdrawalStatus;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Infrastructure\Persistence\Eloquent\Models\WithdrawalModel;
use DateTimeImmutable;
use ReflectionClass;

final class WithdrawalMapper
{
    public static function toEntity(WithdrawalModel $model): Withdrawal
    {
        $reflection = new ReflectionClass(Withdrawal::class);
        $withdrawal = $reflection->newInstanceWithoutConstructor();

        self::setProperty($reflection, $withdrawal, 'id', $model->id);
        self::setProperty($reflection, $withdrawal, 'walletId', $model->wallet_id);
        self::setProperty($reflection, $withdrawal, 'transactionId', $model->transaction_id);
        self::setProperty($reflection, $withdrawal, 'status', WithdrawalStatus::from($model->status));
        self::setProperty($reflection, $withdrawal, 'amount', Money::fromCents($model->amount, $model->currency));
        self::setProperty($reflection, $withdrawal, 'feeAmount', Money::fromCents($model->fee_amount, $model->currency));
        self::setProperty($reflection, $withdrawal, 'netAmount', Money::fromCents($model->net_amount, $model->currency));
        self::setProperty($reflection, $withdrawal, 'pixKey', new PixKey(
            PixKeyType::from($model->pix_key_type),
            $model->pix_key
        ));
        self::setProperty($reflection, $withdrawal, 'recipientName', $model->recipient_name);
        self::setProperty($reflection, $withdrawal, 'recipientDocument', $model->recipient_document);
        self::setProperty($reflection, $withdrawal, 'provider', $model->provider ?? 'eulen');
        self::setProperty($reflection, $withdrawal, 'providerId', $model->provider_id);
        self::setProperty($reflection, $withdrawal, 'providerStatus', $model->provider_status);
        self::setProperty($reflection, $withdrawal, 'endToEndId', $model->end_to_end_id);
        self::setProperty($reflection, $withdrawal, 'providerResponse', $model->provider_response);
        self::setProperty($reflection, $withdrawal, 'idempotencyKey', $model->idempotency_key);
        self::setProperty($reflection, $withdrawal, 'ledgerTransactionId', $model->metadata['ledger_transaction_id'] ?? null);
        self::setProperty($reflection, $withdrawal, 'approvedBy', $model->approved_by);
        self::setProperty($reflection, $withdrawal, 'approvedAt', $model->approved_at
            ? DateTimeImmutable::createFromMutable($model->approved_at)
            : null);
        self::setProperty($reflection, $withdrawal, 'processedAt', $model->processed_at
            ? DateTimeImmutable::createFromMutable($model->processed_at)
            : null);
        self::setProperty($reflection, $withdrawal, 'completedAt', null);
        self::setProperty($reflection, $withdrawal, 'failedAt', $model->failed_at
            ? DateTimeImmutable::createFromMutable($model->failed_at)
            : null);
        self::setProperty($reflection, $withdrawal, 'failureReason', $model->failure_reason);
        self::setProperty($reflection, $withdrawal, 'createdAt', DateTimeImmutable::createFromMutable($model->created_at));
        self::setProperty($reflection, $withdrawal, 'updatedAt', DateTimeImmutable::createFromMutable($model->updated_at));

        return $withdrawal;
    }

    public static function toModel(Withdrawal $entity): array
    {
        return [
            'id' => $entity->getId(),
            'wallet_id' => $entity->getWalletId(),
            'amount' => $entity->getAmount()->getCents(),
            'fee_amount' => $entity->getFeeAmount()->getCents(),
            'net_amount' => $entity->getNetAmount()->getCents(),
            'currency' => $entity->getAmount()->getCurrency(),
            'status' => $entity->getStatus()->value,
            'pix_key_type' => $entity->getPixKey()->getType()->value,
            'pix_key' => $entity->getPixKey()->getValue(),
            'recipient_name' => $entity->getRecipientName(),
            'recipient_document' => $entity->getRecipientDocument(),
            'provider' => $entity->getProvider(),
            'provider_id' => $entity->getProviderId(),
            'provider_status' => $entity->getProviderStatus(),
            'provider_response' => $entity->getProviderResponse(),
            'end_to_end_id' => $entity->getEndToEndId(),
            'processed_at' => $entity->getProcessedAt(),
            'failed_at' => $entity->getFailedAt(),
            'failure_reason' => $entity->getFailureReason(),
            'approved_at' => $entity->getApprovedAt(),
            'approved_by' => $entity->getApprovedBy(),
            'idempotency_key' => $entity->getIdempotencyKey(),
            'transaction_id' => $entity->getTransactionId(),
            'metadata' => array_filter([
                'ledger_transaction_id' => $entity->getLedgerTransactionId(),
            ]),
        ];
    }

    private static function setProperty(
        ReflectionClass $reflection,
        object $object,
        string $property,
        mixed $value
    ): void {
        $prop = $reflection->getProperty($property);
        $prop->setValue($object, $value);
    }
}
