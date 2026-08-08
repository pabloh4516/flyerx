<?php

declare(strict_types=1);

namespace App\Application\Wallet\Services;

use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Payment\DTOs\CreateDepositRequest;
use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Exceptions\DuplicateOperationException;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\Services\LedgerService;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Payment\PaymentProviderFactory;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

class DepositService
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly DepositRepositoryInterface $depositRepository,
        private readonly LedgerService $ledgerService,
        private readonly FeeService $feeService,
        private readonly Dispatcher $eventDispatcher,
        private readonly PaymentProviderInterface $paymentProvider,
    ) {}

    /**
     * Create a new deposit request via Eulen Pix2Depix.
     *
     * @param string $walletId ID da carteira
     * @param int $amountInCents Valor em centavos
     * @param string $payerTaxNumber CPF/CNPJ do pagador (obrigatório pela Eulen)
     * @param string $idempotencyKey Chave de idempotência
     * @param string|null $depixAddress Endereço Liquid para receber DePix
     * @param string|null $euid EUID do usuário na Eulen
     * @param string|null $splitAddress Endereço Liquid para split (comissão)
     * @param string|null $splitFee Porcentagem do split (ex: "0.02")
     */
    public function createDeposit(
        string $walletId,
        int $amountInCents,
        string $payerTaxNumber,
        string $idempotencyKey,
        ?string $depixAddress = null,
        ?string $euid = null,
        ?string $splitAddress = null,
        ?string $splitFee = null,
    ): Deposit {
        // Check for duplicate
        $existing = $this->depositRepository->findByIdempotencyKey($idempotencyKey);
        if ($existing !== null) {
            throw new DuplicateOperationException($idempotencyKey);
        }

        // Validate wallet
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($walletId)
        );

        if ($wallet === null) {
            throw new \DomainException('Wallet not found');
        }

        if (!$wallet->canDeposit()) {
            throw new WalletNotActiveException('Wallet cannot accept deposits');
        }

        // Calculate fee
        $amount = Money::fromCents($amountInCents);
        $fee = $this->feeService->calculateDepositFee($amount);

        // Create deposit entity
        $deposit = Deposit::create(
            id: $this->depositRepository->nextIdentity()->toString(),
            walletId: $walletId,
            amount: $amount,
            feeAmount: $fee,
            idempotencyKey: $idempotencyKey,
        );

        // Call Eulen provider
        $provider = $this->paymentProvider;
        $response = $provider->createDeposit(new CreateDepositRequest(
            amountInCents: $amountInCents,
            endUserTaxNumber: $payerTaxNumber,
            depixAddress: $depixAddress,
            euid: $euid,
            depixSplitAddress: $splitAddress,
            splitFee: $splitFee,
            idempotencyKey: $idempotencyKey,
        ));

        if (!$response->success) {
            $deposit->fail($response->errorMessage ?? 'Provider error');
            $this->depositRepository->save($deposit);

            throw new \DomainException($response->errorMessage ?? 'Failed to create deposit');
        }

        // Update deposit with provider data
        $deposit->setProviderData(
            $response->providerId,
            $response->status,
            $response->rawResponse
        );

        $deposit->setPixData(
            $response->pixQrCode,
            $response->pixCopyPaste,
            $response->pixTxId,
            $response->expiresAt
        );

        $this->depositRepository->save($deposit);

        // Dispatch events
        foreach ($deposit->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $deposit;
    }

    /**
     * Confirm a deposit (called by webhook or polling).
     */
    public function confirmDeposit(string $depositId): void
    {
        DB::transaction(function () use ($depositId) {
            $deposit = $this->depositRepository->findById(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($depositId)
            );

            if ($deposit === null) {
                throw new \DomainException('Deposit not found');
            }

            if ($deposit->getStatus()->isFinal()) {
                return;
            }

            // Check status with provider
            $provider = $this->paymentProvider;
            $status = $provider->getDepositStatus($deposit->getProviderId());

            if (!$status->success) {
                throw new \DomainException('Failed to get deposit status');
            }

            // Update provider data
            $deposit->setProviderData(
                $deposit->getProviderId(),
                $status->status,
                $status->rawResponse
            );

            if ($status->isPaid()) {
                $this->processDepositPayment($deposit);
            } elseif ($status->isExpired()) {
                $deposit->expire();
            } elseif ($status->isFailed()) {
                $deposit->fail($status->errorMessage ?? 'Payment failed');
            }

            $this->depositRepository->update($deposit);

            foreach ($deposit->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }
        });
    }

    /**
     * Process deposit payment and update ledger.
     */
    private function processDepositPayment(Deposit $deposit): void
    {
        // Create transaction in ledger
        $transactionId = \Illuminate\Support\Str::uuid()->toString();

        // Get accounts from the ledger service
        $userAccountId = $this->getUserAccountId($deposit->getWalletId());
        $providerPayableAccountId = $this->getSystemAccountId('provider_payable');
        $feeAccountId = $this->getSystemAccountId('fee_revenue');

        $this->ledgerService->recordDeposit(
            transactionId: $transactionId,
            userAccountId: $userAccountId,
            providerPayableAccountId: $providerPayableAccountId,
            amount: $deposit->getAmount(),
            feeAccountId: $deposit->getFeeAmount()->isPositive() ? $feeAccountId : null,
            feeAmount: $deposit->getFeeAmount()->isPositive() ? $deposit->getFeeAmount() : null,
        );

        $deposit->complete($transactionId);
    }

    /**
     * Get deposit by ID.
     */
    public function getDeposit(string $depositId): ?Deposit
    {
        return $this->depositRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($depositId)
        );
    }

    /**
     * Get deposit by idempotency key.
     */
    public function getDepositByIdempotencyKey(string $idempotencyKey): ?Deposit
    {
        return $this->depositRepository->findByIdempotencyKey($idempotencyKey);
    }

    /**
     * Get pending deposits for wallet.
     */
    public function getPendingDeposits(string $walletId): array
    {
        return $this->depositRepository->findPendingByWalletId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($walletId)
        );
    }

    /**
     * Get the user's main account ID for a wallet.
     */
    private function getUserAccountId(string $walletId): string
    {
        $account = $this->ledgerService->getOrCreateMainAccount($walletId);
        return $account->getId();
    }

    /**
     * Get the system account ID for a given category.
     */
    private function getSystemAccountId(string $category): string
    {
        $account = $this->ledgerService->getOrCreateSystemAccount($category);
        return $account->getId();
    }
}
