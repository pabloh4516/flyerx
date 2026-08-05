<?php

declare(strict_types=1);

namespace App\Domain\Payment\DTOs;

use DateTimeImmutable;

final readonly class CreateDepositResponse
{
    public function __construct(
        public bool $success,
        public ?string $providerId,
        public ?string $status,
        public ?string $pixQrCode,
        public ?string $pixCopyPaste,
        public ?string $pixTxId,
        public ?DateTimeImmutable $expiresAt,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
        public array $rawResponse = [],
    ) {}

    public static function success(
        string $providerId,
        string $status,
        string $pixQrCode,
        string $pixCopyPaste,
        string $pixTxId,
        DateTimeImmutable $expiresAt,
        array $rawResponse = []
    ): self {
        return new self(
            success: true,
            providerId: $providerId,
            status: $status,
            pixQrCode: $pixQrCode,
            pixCopyPaste: $pixCopyPaste,
            pixTxId: $pixTxId,
            expiresAt: $expiresAt,
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
            pixQrCode: null,
            pixCopyPaste: null,
            pixTxId: null,
            expiresAt: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            rawResponse: $rawResponse,
        );
    }
}
