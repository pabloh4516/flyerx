<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Entities;

use App\Domain\Shared\AggregateRoot;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\Events\DepositCompleted;
use App\Domain\Wallet\Events\DepositCreated;
use App\Domain\Wallet\Events\DepositFailed;
use App\Domain\Wallet\ValueObjects\Money;
use DateTimeImmutable;

class Deposit extends AggregateRoot
{
    private string $walletId;
    private ?string $transactionId;
    private DepositStatus $status;
    private Money $amount;
    private Money $feeAmount;
    private Money $netAmount;
    private string $paymentMethod;

    // PIX specific
    private ?string $pixQrCode;
    private ?string $pixCopyPaste;
    private ?string $pixTxId;
    private ?DateTimeImmutable $pixExpiresAt;

    // Provider
    private string $provider;
    private ?string $providerId;
    private ?string $providerStatus;
    private ?array $providerResponse;

    // Idempotency
    private string $idempotencyKey;

    // Timestamps
    private ?DateTimeImmutable $paidAt;
    private ?DateTimeImmutable $confirmedAt;
    private ?DateTimeImmutable $failedAt;
    private ?string $failureReason;
    private ?DateTimeImmutable $expiresAt;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    private function __construct(
        string $id,
        string $walletId,
        Money $amount,
        Money $feeAmount,
        string $idempotencyKey,
        string $provider = 'eulen'
    ) {
        $this->id = $id;
        $this->walletId = $walletId;
        $this->transactionId = null;
        $this->status = DepositStatus::PENDING;
        $this->amount = $amount;
        $this->feeAmount = $feeAmount;
        $this->netAmount = $amount->subtract($feeAmount);
        $this->paymentMethod = 'pix';
        $this->pixQrCode = null;
        $this->pixCopyPaste = null;
        $this->pixTxId = null;
        $this->pixExpiresAt = null;
        $this->provider = $provider;
        $this->providerId = null;
        $this->providerStatus = null;
        $this->providerResponse = null;
        $this->idempotencyKey = $idempotencyKey;
        $this->paidAt = null;
        $this->confirmedAt = null;
        $this->failedAt = null;
        $this->failureReason = null;
        $this->expiresAt = null;
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public static function create(
        string $id,
        string $walletId,
        Money $amount,
        Money $feeAmount,
        string $idempotencyKey,
        string $provider = 'eulen'
    ): self {
        $deposit = new self($id, $walletId, $amount, $feeAmount, $idempotencyKey, $provider);

        $deposit->recordDomainEvent(new DepositCreated($id, [
            'wallet_id' => $walletId,
            'amount' => $amount->getDecimalString(),
            'fee' => $feeAmount->getDecimalString(),
        ]));

        return $deposit;
    }

    // Getters
    public function getWalletId(): string
    {
        return $this->walletId;
    }

    public function getTransactionId(): ?string
    {
        return $this->transactionId;
    }

    public function getStatus(): DepositStatus
    {
        return $this->status;
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getFeeAmount(): Money
    {
        return $this->feeAmount;
    }

    public function getNetAmount(): Money
    {
        return $this->netAmount;
    }

    public function getPaymentMethod(): string
    {
        return $this->paymentMethod;
    }

    public function getPixQrCode(): ?string
    {
        return $this->pixQrCode;
    }

    public function getPixCopyPaste(): ?string
    {
        return $this->pixCopyPaste;
    }

    public function getPixTxId(): ?string
    {
        return $this->pixTxId;
    }

    public function getPixExpiresAt(): ?DateTimeImmutable
    {
        return $this->pixExpiresAt;
    }

    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getProviderId(): ?string
    {
        return $this->providerId;
    }

    public function getProviderStatus(): ?string
    {
        return $this->providerStatus;
    }

    public function getProviderResponse(): ?array
    {
        return $this->providerResponse;
    }

    public function getIdempotencyKey(): string
    {
        return $this->idempotencyKey;
    }

    public function getPaidAt(): ?DateTimeImmutable
    {
        return $this->paidAt;
    }

    public function getConfirmedAt(): ?DateTimeImmutable
    {
        return $this->confirmedAt;
    }

    public function getFailedAt(): ?DateTimeImmutable
    {
        return $this->failedAt;
    }

    public function getFailureReason(): ?string
    {
        return $this->failureReason;
    }

    public function getExpiresAt(): ?DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // Business Logic

    public function setPixData(
        string $qrCode,
        string $copyPaste,
        string $txId,
        DateTimeImmutable $expiresAt
    ): void {
        $this->pixQrCode = $qrCode;
        $this->pixCopyPaste = $copyPaste;
        $this->pixTxId = $txId;
        $this->pixExpiresAt = $expiresAt;
        $this->expiresAt = $expiresAt;
        $this->status = DepositStatus::AWAITING_PAYMENT;
        $this->touch();
    }

    public function setProviderData(
        string $providerId,
        string $providerStatus,
        array $providerResponse
    ): void {
        $this->providerId = $providerId;
        $this->providerStatus = $providerStatus;
        $this->providerResponse = $providerResponse;
        $this->touch();
    }

    public function markAsProcessing(): void
    {
        $this->status = DepositStatus::PROCESSING;
        $this->paidAt = new DateTimeImmutable();
        $this->touch();
    }

    public function complete(string $transactionId): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = DepositStatus::COMPLETED;
        $this->transactionId = $transactionId;
        $this->confirmedAt = new DateTimeImmutable();
        $this->touch();

        $this->recordDomainEvent(new DepositCompleted($this->id, [
            'wallet_id' => $this->walletId,
            'transaction_id' => $transactionId,
            'amount' => $this->amount->getDecimalString(),
            'net_amount' => $this->netAmount->getDecimalString(),
        ]));
    }

    public function fail(string $reason): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = DepositStatus::FAILED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = $reason;
        $this->touch();

        $this->recordDomainEvent(new DepositFailed($this->id, $reason));
    }

    public function expire(): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = DepositStatus::EXPIRED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = 'Payment expired';
        $this->touch();
    }

    public function cancel(): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = DepositStatus::CANCELLED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = 'Cancelled by user';
        $this->touch();
    }

    public function isExpired(): bool
    {
        if ($this->expiresAt === null) {
            return false;
        }

        return $this->expiresAt < new DateTimeImmutable();
    }

    public function isPending(): bool
    {
        return $this->status->isPending();
    }

    private function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
