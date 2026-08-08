<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

/**
 * Request para criar saque via Eulen API (Pix2Depix)
 *
 * @see https://docs.eulen.app/withdraw-25979382e0.md
 */
final readonly class CreateWithdrawalRequest
{
    public function __construct(
        // Campo obrigatório
        public string $pixKey,

        // Um desses é obrigatório (taxNumber OU euid)
        public ?string $taxNumber = null,
        public ?string $euid = null,

        // Exatamente UM desses deve ser informado
        public ?int $depositAmountInCents = null,  // Valor a enviar em DePix
        public ?int $payoutAmountInCents = null,   // Valor final a receber em PIX

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
            'pixKey' => $this->pixKey,
        ];

        // Adicionar taxNumber OU euid (API não aceita ambos)
        if ($this->taxNumber !== null) {
            $payload['taxNumber'] = $this->taxNumber;
        } elseif ($this->euid !== null) {
            $payload['euid'] = $this->euid;
        }

        // Adicionar exatamente UM dos valores de amount
        if ($this->payoutAmountInCents !== null) {
            $payload['payoutAmountInCents'] = $this->payoutAmountInCents;
        } elseif ($this->depositAmountInCents !== null) {
            $payload['depositAmountInCents'] = $this->depositAmountInCents;
        }

        return $payload;
    }

    /**
     * Valida se o request está correto para a Eulen
     */
    public function validate(): array
    {
        $errors = [];

        if (empty($this->pixKey)) {
            $errors[] = 'pixKey é obrigatório';
        }

        if ($this->taxNumber === null && $this->euid === null) {
            $errors[] = 'taxNumber ou euid deve ser informado';
        }

        if ($this->depositAmountInCents === null && $this->payoutAmountInCents === null) {
            $errors[] = 'depositAmountInCents ou payoutAmountInCents deve ser informado';
        }

        if ($this->depositAmountInCents !== null && $this->payoutAmountInCents !== null) {
            $errors[] = 'Informe apenas depositAmountInCents OU payoutAmountInCents, não ambos';
        }

        return $errors;
    }
}
