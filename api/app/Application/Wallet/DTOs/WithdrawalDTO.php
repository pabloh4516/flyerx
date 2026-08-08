<?php

declare(strict_types=1);

namespace App\Application\Wallet\DTOs;

use App\Domain\Wallet\Entities\Withdrawal;

final readonly class WithdrawalDTO
{
    public function __construct(
        public string $id,
        public string $walletId,
        public string $status,
        public float $amount,
        public float $feeAmount,
        public float $netAmount,
        public string $currency,
        public string $pixKeyType,
        public string $pixKey,
        public ?string $recipientName,
        public ?string $endToEndId,
        public ?string $processedAt,
        public ?string $completedAt,
        public ?string $failureReason,
        public string $createdAt,
        // Dados do saque Eulen (DePix → PIX)
        public ?string $depositAddress,
        public ?int $depositAmountInCents,
        public ?int $payoutAmountInCents,
    ) {}

    public static function fromEntity(Withdrawal $withdrawal): self
    {
        // Extrair dados do provider response
        $providerResponse = $withdrawal->getProviderResponse();
        $depositAddress = $providerResponse['depositAddress'] ?? null;
        $depositAmountInCents = $providerResponse['depositAmountInCents'] ?? null;
        $payoutAmountInCents = $providerResponse['payoutAmountInCents'] ?? null;

        return new self(
            id: $withdrawal->getId(),
            walletId: $withdrawal->getWalletId(),
            status: $withdrawal->getStatus()->value,
            amount: $withdrawal->getAmount()->getDecimal(),
            feeAmount: $withdrawal->getFeeAmount()->getDecimal(),
            netAmount: $withdrawal->getNetAmount()->getDecimal(),
            currency: $withdrawal->getAmount()->getCurrency(),
            pixKeyType: $withdrawal->getPixKey()->getType()->value,
            pixKey: $withdrawal->getPixKey()->getMasked(),
            recipientName: $withdrawal->getRecipientName(),
            endToEndId: $withdrawal->getEndToEndId(),
            processedAt: $withdrawal->getProcessedAt()?->format('c'),
            completedAt: $withdrawal->getCompletedAt()?->format('c'),
            failureReason: $withdrawal->getFailureReason(),
            createdAt: $withdrawal->getCreatedAt()->format('c'),
            depositAddress: $depositAddress,
            depositAmountInCents: $depositAmountInCents,
            payoutAmountInCents: $payoutAmountInCents,
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
                'key_type' => $this->pixKeyType,
                'key' => $this->pixKey,
                'recipient_name' => $this->recipientName,
            ],
            // Dados para o usuário enviar DePix
            'deposit' => [
                'address' => $this->depositAddress,
                'amount_in_cents' => $this->depositAmountInCents,
            ],
            'payout_amount_in_cents' => $this->payoutAmountInCents,
            'end_to_end_id' => $this->endToEndId,
            'processed_at' => $this->processedAt,
            'completed_at' => $this->completedAt,
            'failure_reason' => $this->failureReason,
            'created_at' => $this->createdAt,
        ];
    }
}
