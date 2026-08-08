<?php

declare(strict_types=1);

namespace App\Application\Wallet\Services;

use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Payment\DTOs\CreateWithdrawalRequest;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Exceptions\DuplicateOperationException;
use App\Domain\Wallet\Exceptions\InsufficientBalanceException;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\Exceptions\WithdrawalLimitExceededException;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\Services\LedgerService;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Infrastructure\Payment\PaymentProviderFactory;
use DateTimeImmutable;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

class WithdrawalService
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly WithdrawalRepositoryInterface $withdrawalRepository,
        private readonly LedgerService $ledgerService,
        private readonly FeeService $feeService,
        private readonly Dispatcher $eventDispatcher,
    ) {}

    /**
     * Create a new withdrawal request.
     */
    public function createWithdrawal(
        string $walletId,
        Money $amount,
        PixKey $pixKey,
        string $idempotencyKey,
        ?string $recipientName = null,
        ?string $recipientDocument = null
    ): Withdrawal {
        // Check for duplicate
        $existing = $this->withdrawalRepository->findByIdempotencyKey($idempotencyKey);
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

        if (!$wallet->canWithdraw()) {
            throw new WalletNotActiveException('Wallet cannot process withdrawals');
        }

        // Get user's KYC level (simplified - should come from User)
        $kycLevel = 1; // TODO: Get from user entity

        // Calculate fee
        $fee = $this->feeService->calculateWithdrawalFee($amount, $kycLevel);
        $totalAmount = $amount->add($fee);

        // Check balance
        $balance = $this->getWalletBalance($walletId);
        if ($balance->lessThan($totalAmount)) {
            throw new InsufficientBalanceException(
                $totalAmount->getDecimalString(),
                $balance->getDecimalString()
            );
        }

        // Check daily limit
        $this->validateDailyLimit($wallet, $amount);

        // Check monthly limit
        $this->validateMonthlyLimit($wallet, $amount);

        // Create withdrawal
        $withdrawal = Withdrawal::create(
            id: $this->withdrawalRepository->nextIdentity()->toString(),
            walletId: $walletId,
            amount: $amount,
            feeAmount: $fee,
            pixKey: $pixKey,
            idempotencyKey: $idempotencyKey,
        );

        if ($recipientName !== null) {
            $withdrawal->setRecipientInfo($recipientName, $recipientDocument);
        }

        // Auto-approve for small amounts (configurable)
        $autoApproveLimit = Money::fromDecimal(
            config('flyerx.withdrawals.auto_approve_limit', 1000.00)
        );

        if ($amount->lessThanOrEqual($autoApproveLimit)) {
            $withdrawal->autoApprove();
        }

        $this->withdrawalRepository->save($withdrawal);

        // Dispatch events
        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $withdrawal;
    }

    /**
     * Process an approved withdrawal.
     */
    public function processWithdrawal(string $withdrawalId): void
    {
        DB::transaction(function () use ($withdrawalId) {
            $withdrawal = $this->withdrawalRepository->findById(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
            );

            if ($withdrawal === null) {
                throw new \DomainException('Withdrawal not found');
            }

            if (!$withdrawal->getStatus()->canProcess()) {
                return;
            }

            $withdrawal->markAsProcessing();

            // Calculate total amount including fee
            $totalAmount = $withdrawal->getAmount();

            // Reserve funds in the user's wallet before processing
            $reserveTransactionId = $this->ledgerService->reserveFunds(
                $withdrawal->getWalletId(),
                $totalAmount,
                'Withdrawal processing: ' . $withdrawalId
            );

            // Record the withdrawal transaction in ledger
            $transactionId = \Illuminate\Support\Str::uuid()->toString();
            $userAccountId = $this->getUserAccountId($withdrawal->getWalletId());
            $pendingWithdrawalsAccountId = $this->getSystemAccountId('pending_withdrawals');
            $feeAccountId = $this->getSystemAccountId('fee_revenue');

            // Debit user account, credit pending withdrawals
            $this->ledgerService->recordWithdrawal(
                transactionId: $transactionId,
                userAccountId: $userAccountId,
                providerReceivableAccountId: $pendingWithdrawalsAccountId,
                netAmount: $withdrawal->getNetAmount(),
                feeAccountId: $withdrawal->getFeeAmount()->isPositive() ? $feeAccountId : null,
                feeAmount: $withdrawal->getFeeAmount()->isPositive() ? $withdrawal->getFeeAmount() : null,
            );

            // Call payment provider
            $provider = PaymentProviderFactory::default();
            $response = $provider->createWithdrawal(new CreateWithdrawalRequest(
                pixKey: $withdrawal->getPixKey()->getValue(),
                taxNumber: $withdrawal->getRecipientDocument(),
                payoutAmountInCents: (int) ($withdrawal->getNetAmount()->getDecimal() * 100),
                idempotencyKey: $withdrawal->getIdempotencyKey(),
            ));

            if (!$response->success) {
                $withdrawal->fail($response->errorMessage ?? 'Provider error');
                $this->withdrawalRepository->update($withdrawal);

                // Reverse ledger entries when provider fails
                $this->ledgerService->reverseEntries(
                    $transactionId,
                    'Provider error: ' . ($response->errorMessage ?? 'Failed to process withdrawal')
                );

                // Release the reserved funds back to available balance
                $this->ledgerService->releaseFunds(
                    $withdrawal->getWalletId(),
                    $totalAmount,
                    'Withdrawal failed: ' . $withdrawalId
                );

                throw new \DomainException($response->errorMessage ?? 'Failed to process withdrawal');
            }

            // Update withdrawal with provider data
            $withdrawal->setProviderData(
                $response->providerId,
                $response->status,
                $response->endToEndId,
                $response->rawResponse
            );

            // Store the transaction ID for later confirmation/reversal
            $withdrawal->setLedgerTransactionId($transactionId);

            $this->withdrawalRepository->update($withdrawal);

            foreach ($withdrawal->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }
        });
    }

    /**
     * Confirm a withdrawal (called by webhook or polling).
     */
    public function confirmWithdrawal(string $withdrawalId): void
    {
        DB::transaction(function () use ($withdrawalId) {
            $withdrawal = $this->withdrawalRepository->findById(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
            );

            if ($withdrawal === null) {
                throw new \DomainException('Withdrawal not found');
            }

            if ($withdrawal->getStatus()->isFinal()) {
                return;
            }

            // Check status with provider
            $provider = PaymentProviderFactory::default();
            $status = $provider->getWithdrawalStatus($withdrawal->getProviderId());

            if (!$status->success) {
                throw new \DomainException('Failed to get withdrawal status');
            }

            // Update provider data
            $withdrawal->setProviderData(
                $withdrawal->getProviderId(),
                $status->status,
                $status->endToEndId ?? $withdrawal->getEndToEndId(),
                $status->rawResponse
            );

            if ($status->isCompleted()) {
                $transactionId = \Illuminate\Support\Str::uuid()->toString();
                $withdrawal->complete($transactionId);

                // Release the reserved funds since the withdrawal completed successfully
                // The funds have already been debited from the user's account in processWithdrawal
                $this->ledgerService->releaseFunds(
                    $withdrawal->getWalletId(),
                    $withdrawal->getAmount(),
                    'Withdrawal completed: ' . $withdrawalId
                );
            } elseif ($status->isFailed()) {
                $withdrawal->fail($status->errorMessage ?? 'Withdrawal failed');

                // Reverse ledger entries when withdrawal fails
                $ledgerTransactionId = $withdrawal->getLedgerTransactionId();
                if ($ledgerTransactionId !== null) {
                    $this->ledgerService->reverseEntries(
                        $ledgerTransactionId,
                        'Withdrawal failed: ' . ($status->errorMessage ?? 'Unknown error')
                    );
                }

                // Release the reserved funds back to available balance
                $this->ledgerService->releaseFunds(
                    $withdrawal->getWalletId(),
                    $withdrawal->getAmount(),
                    'Withdrawal failed: ' . $withdrawalId
                );
            }

            $this->withdrawalRepository->update($withdrawal);

            foreach ($withdrawal->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }
        });
    }

    /**
     * Approve a pending withdrawal.
     */
    public function approveWithdrawal(string $withdrawalId, string $approvedBy): void
    {
        $withdrawal = $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );

        if ($withdrawal === null) {
            throw new \DomainException('Withdrawal not found');
        }

        $withdrawal->approve($approvedBy);
        $this->withdrawalRepository->update($withdrawal);
    }

    /**
     * Reject a pending withdrawal.
     */
    public function rejectWithdrawal(string $withdrawalId, string $reason): void
    {
        $withdrawal = $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );

        if ($withdrawal === null) {
            throw new \DomainException('Withdrawal not found');
        }

        $withdrawal->reject($reason);
        $this->withdrawalRepository->update($withdrawal);

        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }
    }

    /**
     * Cancel a withdrawal.
     */
    public function cancelWithdrawal(string $withdrawalId): void
    {
        $withdrawal = $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );

        if ($withdrawal === null) {
            throw new \DomainException('Withdrawal not found');
        }

        if (!$withdrawal->canBeCancelled()) {
            throw new \DomainException('Withdrawal cannot be cancelled');
        }

        $withdrawal->cancel();
        $this->withdrawalRepository->update($withdrawal);

        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }
    }

    /**
     * Get withdrawal by ID.
     */
    public function getWithdrawal(string $withdrawalId): ?Withdrawal
    {
        return $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );
    }

    /**
     * Get pending withdrawals for wallet.
     */
    public function getPendingWithdrawals(string $walletId): array
    {
        return $this->withdrawalRepository->findPendingByWalletId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($walletId)
        );
    }

    /**
     * Get the available balance for a wallet from the ledger.
     *
     * @param string $walletId The wallet ID
     * @return Money The available balance
     */
    private function getWalletBalance(string $walletId): Money
    {
        return $this->ledgerService->getAvailableBalance($walletId);
    }

    private function validateDailyLimit(\App\Domain\Wallet\Entities\Wallet $wallet, Money $amount): void
    {
        $today = new DateTimeImmutable('today');
        $tomorrow = new DateTimeImmutable('tomorrow');

        $todayWithdrawals = $this->withdrawalRepository->sumCompletedByWalletIdAndDateRange(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($wallet->getId()),
            $today,
            $tomorrow
        );

        $newTotal = $todayWithdrawals->add($amount);

        if ($newTotal->greaterThan($wallet->getDailyWithdrawalLimit())) {
            throw new WithdrawalLimitExceededException(
                'daily',
                $wallet->getDailyWithdrawalLimit()->getDecimalString()
            );
        }
    }

    private function validateMonthlyLimit(\App\Domain\Wallet\Entities\Wallet $wallet, Money $amount): void
    {
        $startOfMonth = new DateTimeImmutable('first day of this month midnight');
        $startOfNextMonth = new DateTimeImmutable('first day of next month midnight');

        $monthWithdrawals = $this->withdrawalRepository->sumCompletedByWalletIdAndDateRange(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($wallet->getId()),
            $startOfMonth,
            $startOfNextMonth
        );

        $newTotal = $monthWithdrawals->add($amount);

        if ($newTotal->greaterThan($wallet->getMonthlyWithdrawalLimit())) {
            throw new WithdrawalLimitExceededException(
                'monthly',
                $wallet->getMonthlyWithdrawalLimit()->getDecimalString()
            );
        }
    }

    /**
     * Get the user's main account ID for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return string The account ID
     */
    private function getUserAccountId(string $walletId): string
    {
        $account = $this->ledgerService->getOrCreateMainAccount($walletId);
        return $account->getId();
    }

    /**
     * Get the system account ID for a given category.
     *
     * @param string $category The account category (e.g., 'pending_withdrawals', 'fee_revenue')
     * @return string The account ID
     */
    private function getSystemAccountId(string $category): string
    {
        $account = $this->ledgerService->getOrCreateSystemAccount($category);
        return $account->getId();
    }
}
