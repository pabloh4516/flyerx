<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

/**
 * Request para criar depósito via Eulen API (Pix2Depix)
 *
 * @see https://docs.eulen.app/deposit-pix-depix-12532107e0.md
 */
final readonly class CreateDepositRequest
{
    public function __construct(
        // Campos obrigatórios da Eulen
        public int $amountInCents,
        public string $endUserTaxNumber,

        // Campos opcionais
        public ?string $depixAddress = null,
        public ?string $euid = null,
        public ?string $endUserFullName = null,

        // Campos de split (comissão do parceiro)
        public ?string $depixSplitAddress = null,
        public ?string $splitFee = null, // Porcentagem como string, ex: "0.02" para 2%

        // Delay opcional (1-720 horas)
        public ?int $delayDepixInHours = null,

        // Idempotency (usado no header X-Nonce)
        public ?string $idempotencyKey = null,

        // Metadata interno (não enviado para Eulen)
        public array $metadata = [],
    ) {}

    /**
     * Converte para o formato esperado pela API da Eulen
     */
    public function toEulenPayload(): array
    {
        $payload = [
            'amountInCents' => $this->amountInCents,
            'endUserTaxNumber' => $this->endUserTaxNumber,
        ];

        if ($this->depixAddress !== null) {
            $payload['depixAddress'] = $this->depixAddress;
        }

        if ($this->euid !== null) {
            $payload['euid'] = $this->euid;
        }

        if ($this->endUserFullName !== null) {
            $payload['endUserFullName'] = $this->endUserFullName;
        }

        if ($this->depixSplitAddress !== null) {
            $payload['depixSplitAddress'] = $this->depixSplitAddress;
        }

        if ($this->splitFee !== null) {
            $payload['splitFee'] = $this->splitFee;
        }

        if ($this->delayDepixInHours !== null) {
            $payload['delayDepixInHours'] = $this->delayDepixInHours;
        }

        return $payload;
    }
}
