<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\DepositModel;
use DateTimeImmutable;
use ReflectionClass;

final class DepositMapper
{
    public static function toEntity(DepositModel $model): Deposit
    {
        $reflection = new ReflectionClass(Deposit::class);
        $deposit = $reflection->newInstanceWithoutConstructor();

        self::setProperty($reflection, $deposit, 'id', $model->id);
        self::setProperty($reflection, $deposit, 'walletId', $model->wallet_id);
        self::setProperty($reflection, $deposit, 'transactionId', $model->transaction_id);
        self::setProperty($reflection, $deposit, 'status', DepositStatus::from($model->status));
        self::setProperty($reflection, $deposit, 'amount', Money::fromCents($model->amount, $model->currency));
        self::setProperty($reflection, $deposit, 'feeAmount', Money::fromCents($model->fee_amount, $model->currency));
        self::setProperty($reflection, $deposit, 'netAmount', Money::fromCents($model->net_amount, $model->currency));
        self::setProperty($reflection, $deposit, 'paymentMethod', 'pix');
        self::setProperty($reflection, $deposit, 'pixQrCode', $model->pix_qr_code);
        self::setProperty($reflection, $deposit, 'pixCopyPaste', $model->pix_copy_paste);
        self::setProperty($reflection, $deposit, 'pixTxId', $model->pix_tx_id);
        self::setProperty($reflection, $deposit, 'pixExpiresAt', $model->expires_at
            ? DateTimeImmutable::createFromMutable($model->expires_at)
            : null);
        self::setProperty($reflection, $deposit, 'provider', $model->provider ?? 'eulen');
        self::setProperty($reflection, $deposit, 'providerId', $model->provider_id);
        self::setProperty($reflection, $deposit, 'providerStatus', $model->provider_status);
        self::setProperty($reflection, $deposit, 'providerResponse', $model->provider_response);
        self::setProperty($reflection, $deposit, 'idempotencyKey', $model->idempotency_key);
        self::setProperty($reflection, $deposit, 'paidAt', $model->paid_at
            ? DateTimeImmutable::createFromMutable($model->paid_at)
            : null);
        self::setProperty($reflection, $deposit, 'confirmedAt', null);
        self::setProperty($reflection, $deposit, 'failedAt', $model->failed_at
            ? DateTimeImmutable::createFromMutable($model->failed_at)
            : null);
        self::setProperty($reflection, $deposit, 'failureReason', $model->failure_reason);
        self::setProperty($reflection, $deposit, 'expiresAt', $model->expires_at
            ? DateTimeImmutable::createFromMutable($model->expires_at)
            : null);
        self::setProperty($reflection, $deposit, 'createdAt', DateTimeImmutable::createFromMutable($model->created_at));
        self::setProperty($reflection, $deposit, 'updatedAt', DateTimeImmutable::createFromMutable($model->updated_at));

        return $deposit;
    }

    public static function toModel(Deposit $entity): array
    {
        return [
            'id' => $entity->getId(),
            'wallet_id' => $entity->getWalletId(),
            'amount' => $entity->getAmount()->getCents(),
            'fee_amount' => $entity->getFeeAmount()->getCents(),
            'net_amount' => $entity->getNetAmount()->getCents(),
            'currency' => $entity->getAmount()->getCurrency(),
            'status' => $entity->getStatus()->value,
            'provider' => $entity->getProvider(),
            'provider_id' => $entity->getProviderId(),
            'provider_status' => $entity->getProviderStatus(),
            'provider_response' => $entity->getProviderResponse(),
            'pix_qr_code' => $entity->getPixQrCode(),
            'pix_copy_paste' => $entity->getPixCopyPaste(),
            'pix_tx_id' => $entity->getPixTxId(),
            'expires_at' => $entity->getExpiresAt(),
            'paid_at' => $entity->getPaidAt(),
            'failed_at' => $entity->getFailedAt(),
            'failure_reason' => $entity->getFailureReason(),
            'idempotency_key' => $entity->getIdempotencyKey(),
            'transaction_id' => $entity->getTransactionId(),
            'metadata' => [],
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
