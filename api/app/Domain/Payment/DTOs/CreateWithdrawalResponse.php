<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

final readonly class CreateWithdrawalResponse
{
    public function __construct(
        public bool $success,
        public ?string $providerId,
        public ?string $status,
        public ?string $endToEndId,
        public ?string $recipientName,
        public ?string $recipientDocument,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    public static function success(
        string $providerId,
        string $status,
        ?string $endToEndId = null,
        ?string $recipientName = null,
        ?string $recipientDocument = null,
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            providerId: $providerId,
            status: $status,
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
            endToEndId: null,
            recipientName: null,
            recipientDocument: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }
}
