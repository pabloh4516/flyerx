<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Entities;

use App\Domain\Shared\AggregateRoot;
use App\Domain\Wallet\Enums\WithdrawalStatus;
use App\Domain\Wallet\Events\WithdrawalCompleted;
use App\Domain\Wallet\Events\WithdrawalCreated;
use App\Domain\Wallet\Events\WithdrawalFailed;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use DateTimeImmutable;

class Withdrawal extends AggregateRoot
{
    private string $walletId;
    private ?string $transactionId;
    private WithdrawalStatus $status;
    private Money $amount;
    private Money $feeAmount;
    private Money $netAmount;

    // PIX destination
    private PixKey $pixKey;
    private ?string $recipientName;
    private ?string $recipientDocument;

    // Provider
    private string $provider;
    private ?string $providerId;
    private ?string $providerStatus;
    private ?string $endToEndId;
    private ?array $providerResponse;

    // Idempotency
    private string $idempotencyKey;

    // Ledger tracking
    private ?string $ledgerTransactionId;

    // Approval
    private ?string $approvedBy;
    private ?DateTimeImmutable $approvedAt;

    // Timestamps
    private ?DateTimeImmutable $processedAt;
    private ?DateTimeImmutable $completedAt;
    private ?DateTimeImmutable $failedAt;
    private ?string $failureReason;
    private DateTimeImmutable $createdAt;
    private DateTimeImmutable $updatedAt;

    private function __construct(
        string $id,
        string $walletId,
        Money $amount,
        Money $feeAmount,
        PixKey $pixKey,
        string $idempotencyKey,
        string $provider = 'eulen'
    ) {
        $this->id = $id;
        $this->walletId = $walletId;
        $this->transactionId = null;
        $this->status = WithdrawalStatus::PENDING;
        $this->amount = $amount;
        $this->feeAmount = $feeAmount;
        $this->netAmount = $amount->subtract($feeAmount);
        $this->pixKey = $pixKey;
        $this->recipientName = null;
        $this->recipientDocument = null;
        $this->provider = $provider;
        $this->providerId = null;
        $this->providerStatus = null;
        $this->endToEndId = null;
        $this->providerResponse = null;
        $this->idempotencyKey = $idempotencyKey;
        $this->ledgerTransactionId = null;
        $this->approvedBy = null;
        $this->approvedAt = null;
        $this->processedAt = null;
        $this->completedAt = null;
        $this->failedAt = null;
        $this->failureReason = null;
        $this->createdAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    public static function create(
        string $id,
        string $walletId,
        Money $amount,
        Money $feeAmount,
        PixKey $pixKey,
        string $idempotencyKey,
        string $provider = 'eulen'
    ): self {
        $withdrawal = new self($id, $walletId, $amount, $feeAmount, $pixKey, $idempotencyKey, $provider);

        $withdrawal->recordDomainEvent(new WithdrawalCreated($id, [
            'wallet_id' => $walletId,
            'amount' => $amount->getDecimalString(),
            'fee' => $feeAmount->getDecimalString(),
            'pix_key_type' => $pixKey->getType()->value,
        ]));

        return $withdrawal;
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

    public function getStatus(): WithdrawalStatus
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

    public function getPixKey(): PixKey
    {
        return $this->pixKey;
    }

    public function getRecipientName(): ?string
    {
        return $this->recipientName;
    }

    public function getRecipientDocument(): ?string
    {
        return $this->recipientDocument;
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

    public function getEndToEndId(): ?string
    {
        return $this->endToEndId;
    }

    public function getProviderResponse(): ?array
    {
        return $this->providerResponse;
    }

    public function getIdempotencyKey(): string
    {
        return $this->idempotencyKey;
    }

    public function getLedgerTransactionId(): ?string
    {
        return $this->ledgerTransactionId;
    }

    public function getApprovedBy(): ?string
    {
        return $this->approvedBy;
    }

    public function getApprovedAt(): ?DateTimeImmutable
    {
        return $this->approvedAt;
    }

    public function getProcessedAt(): ?DateTimeImmutable
    {
        return $this->processedAt;
    }

    public function getCompletedAt(): ?DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function getFailedAt(): ?DateTimeImmutable
    {
        return $this->failedAt;
    }

    public function getFailureReason(): ?string
    {
        return $this->failureReason;
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

    public function setRecipientInfo(string $name, ?string $document = null): void
    {
        $this->recipientName = $name;
        $this->recipientDocument = $document;
        $this->touch();
    }

    public function setProviderData(
        string $providerId,
        string $providerStatus,
        ?string $endToEndId,
        array $providerResponse
    ): void {
        $this->providerId = $providerId;
        $this->providerStatus = $providerStatus;
        $this->endToEndId = $endToEndId;
        $this->providerResponse = $providerResponse;
        $this->touch();
    }

    /**
     * Set the ledger transaction ID for tracking and potential reversal.
     *
     * @param string $transactionId The ledger transaction ID
     */
    public function setLedgerTransactionId(string $transactionId): void
    {
        $this->ledgerTransactionId = $transactionId;
        $this->touch();
    }

    public function approve(string $approvedBy): void
    {
        if ($this->status !== WithdrawalStatus::PENDING) {
            return;
        }

        $this->status = WithdrawalStatus::APPROVED;
        $this->approvedBy = $approvedBy;
        $this->approvedAt = new DateTimeImmutable();
        $this->touch();
    }

    public function autoApprove(): void
    {
        $this->approve('system');
    }

    public function reject(string $reason): void
    {
        if ($this->status !== WithdrawalStatus::PENDING) {
            return;
        }

        $this->status = WithdrawalStatus::REJECTED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = $reason;
        $this->touch();
    }

    public function markAsProcessing(): void
    {
        if (!$this->status->canProcess() && $this->status !== WithdrawalStatus::PENDING) {
            return;
        }

        $this->status = WithdrawalStatus::PROCESSING;
        $this->processedAt = new DateTimeImmutable();
        $this->touch();
    }

    public function complete(string $transactionId): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = WithdrawalStatus::COMPLETED;
        $this->transactionId = $transactionId;
        $this->completedAt = new DateTimeImmutable();
        $this->touch();

        $this->recordDomainEvent(new WithdrawalCompleted($this->id, [
            'wallet_id' => $this->walletId,
            'transaction_id' => $transactionId,
            'amount' => $this->amount->getDecimalString(),
            'net_amount' => $this->netAmount->getDecimalString(),
            'end_to_end_id' => $this->endToEndId,
        ]));
    }

    public function fail(string $reason): void
    {
        if ($this->status->isFinal()) {
            return;
        }

        $this->status = WithdrawalStatus::FAILED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = $reason;
        $this->touch();

        $this->recordDomainEvent(new WithdrawalFailed($this->id, $reason));
    }

    public function cancel(): void
    {
        if ($this->status->isFinal() || $this->status === WithdrawalStatus::PROCESSING) {
            return;
        }

        $this->status = WithdrawalStatus::CANCELLED;
        $this->failedAt = new DateTimeImmutable();
        $this->failureReason = 'Cancelled by user';
        $this->touch();
    }

    public function isPending(): bool
    {
        return $this->status === WithdrawalStatus::PENDING;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            WithdrawalStatus::PENDING,
            WithdrawalStatus::APPROVED,
        ]);
    }

    private function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
