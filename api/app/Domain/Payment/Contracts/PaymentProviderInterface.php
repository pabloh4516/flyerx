<?php

declare(strict_types=1);

namespace App\Domain\Payment\Contracts;

use App\Domain\Payment\DTOs\CreateDepositRequest;
use App\Domain\Payment\DTOs\CreateDepositResponse;
use App\Domain\Payment\DTOs\CreateWithdrawalRequest;
use App\Domain\Payment\DTOs\CreateWithdrawalResponse;
use App\Domain\Payment\DTOs\DepositStatusResponse;
use App\Domain\Payment\DTOs\WithdrawalStatusResponse;

interface PaymentProviderInterface
{
    /**
     * Get the provider name.
     */
    public function getName(): string;

    /**
     * Create a deposit (PIX QR Code).
     */
    public function createDeposit(CreateDepositRequest $request): CreateDepositResponse;

    /**
     * Get deposit status.
     */
    public function getDepositStatus(string $providerId): DepositStatusResponse;

    /**
     * Create a withdrawal (PIX transfer).
     */
    public function createWithdrawal(CreateWithdrawalRequest $request): CreateWithdrawalResponse;

    /**
     * Get withdrawal status.
     */
    public function getWithdrawalStatus(string $providerId): WithdrawalStatusResponse;

    /**
     * Check if the provider is healthy/available.
     */
    public function healthCheck(): bool;
}
