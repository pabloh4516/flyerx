<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

/**
 * Response da criação de saque via Eulen API
 *
 * @see https://docs.eulen.app/withdraw-25979382e0.md
 */
final readonly class CreateWithdrawalResponse
{
    public function __construct(
        public bool $success,
        public ?string $providerId,
        public ?string $status,

        // Campos específicos da Eulen para saque
        public ?string $depositAddress = null,      // Endereço Liquid para enviar DePix
        public ?int $depositAmountInCents = null,   // Valor em centavos a enviar em DePix
        public ?int $payoutAmountInCents = null,    // Valor em centavos que será enviado via PIX

        // Campos opcionais
        public ?string $endToEndId = null,
        public ?string $recipientName = null,
        public ?string $recipientDocument = null,

        // Erro
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    public static function success(
        string $providerId,
        string $status,
        ?string $depositAddress = null,
        ?int $depositAmountInCents = null,
        ?int $payoutAmountInCents = null,
        ?string $endToEndId = null,
        ?string $recipientName = null,
        ?string $recipientDocument = null,
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            providerId: $providerId,
            status: $status,
            depositAddress: $depositAddress,
            depositAmountInCents: $depositAmountInCents,
            payoutAmountInCents: $payoutAmountInCents,
            endToEndId: $endToEndId,
            recipientName: $recipientName,
            recipientDocument: $recipientDocument,
            rawResponse: $rawResponse,
        );
    }

    public static function failure(
        string $errorCode,
        string $errorMessage,
        array $rawResponse = []
    ): self {
        return new self(
            success: false,
            providerId: null,
            status: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }
}
