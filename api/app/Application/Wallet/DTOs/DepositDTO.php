<?php

declare(strict_types=1);

namespace App\Application\Wallet\DTOs;

use App\Domain\Wallet\Entities\Deposit;
use DateTimeImmutable;

final readonly class DepositDTO
{
    public function __construct(
        public string $id,
        public string $walletId,
        public string $status,
        public float $amount,
        public float $feeAmount,
        public float $netAmount,
        public string $currency,
        public ?string $pixQrCode,
        public ?string $pixCopyPaste,
        public ?string $pixTxId,
        public ?string $expiresAt,
        public ?string $paidAt,
        public ?string $failureReason,
        public string $createdAt,
    ) {}

    public static function fromEntity(Deposit $deposit): self
    {
        return new self(
            id: $deposit->getId(),
            walletId: $deposit->getWalletId(),
            status: $deposit->getStatus()->value,
            amount: $deposit->getAmount()->getDecimal(),
            feeAmount: $deposit->getFeeAmount()->getDecimal(),
            netAmount: $deposit->getNetAmount()->getDecimal(),
            currency: $deposit->getAmount()->getCurrency(),
            pixQrCode: $deposit->getPixQrCode(),
            pixCopyPaste: $deposit->getPixCopyPaste(),
            pixTxId: $deposit->getPixTxId(),
            expiresAt: $deposit->getExpiresAt()?->format('c'),
            paidAt: $deposit->getPaidAt()?->format('c'),
            failureReason: $deposit->getFailureReason(),
            createdAt: $deposit->getCreatedAt()->format('c'),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'wallet_id' => $this->walletId,
            'status' => $this->status,
            'amount' => $this->amount,
            'fee_amount' => $this->feeAmount,
            'net_amount' => $this->netAmount,
            'currency' => $this->currency,
            'pix' => [
                'qr_code' => $this->pixQrCode,
                'copy_paste' => $this->pixCopyPaste,
                'tx_id' => $this->pixTxId,
            ],
            'expires_at' => $this->expiresAt,
            'paid_at' => $this->paidAt,
            'failure_reason' => $this->failureReason,
            'created_at' => $this->createdAt,
        ];
    }
}
