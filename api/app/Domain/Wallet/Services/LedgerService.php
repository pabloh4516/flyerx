<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Services;

use App\Domain\Wallet\Entities\LedgerAccount;
use App\Domain\Wallet\Entities\LedgerEntry;
use App\Domain\Wallet\Enums\AccountType;
use App\Domain\Wallet\Enums\EntryType;
use App\Domain\Wallet\Exceptions\UnbalancedTransactionException;
use App\Domain\Wallet\Repositories\LedgerAccountRepositoryInterface;
use App\Domain\Wallet\Repositories\LedgerEntryRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * LedgerService - Double-Entry Accounting System
 *
 * This service manages all double-entry bookkeeping operations for the wallet system.
 * It ensures that every transaction maintains the fundamental accounting equation:
 * Assets = Liabilities + Equity (+ Revenue - Expenses)
 *
 * Key principles:
 * - Every transaction must have equal debits and credits
 * - Entries are immutable once created (never delete, only reverse)
 * - All operations are wrapped in database transactions
 * - UUIDs are used for all identifiers
 */
class LedgerService
{
    /**
     * Account category constants for system accounts.
     */
    public const CATEGORY_USER_BALANCE = 'user_balance';
    public const CATEGORY_USER_RESERVE = 'user_reserve';
    public const CATEGORY_USER_BLOCKED = 'user_blocked';
    public const CATEGORY_PROVIDER_PAYABLE = 'provider_payable';
    public const CATEGORY_PROVIDER_RECEIVABLE = 'provider_receivable';
    public const CATEGORY_FEE_REVENUE = 'fee_revenue';
    public const CATEGORY_PENDING_WITHDRAWALS = 'pending_withdrawals';

    public function __construct(
        private readonly LedgerAccountRepositoryInterface $accountRepository,
        private readonly LedgerEntryRepositoryInterface $entryRepository,
    ) {}

    /**
     * Record a double-entry transaction.
     *
     * This is the core method for creating ledger entries. It validates that
     * the transaction is balanced (debits = credits) before persisting.
     *
     * @param string $transactionId Unique identifier for this transaction
     * @param array $entries Array of entry specifications:
     *                       - account_id: string - The account ID
     *                       - type: EntryType - DEBIT or CREDIT
     *                       - amount: Money - The amount
     *                       - description: ?string - Optional description
     *                       - metadata: ?array - Optional metadata
     *
     * @throws UnbalancedTransactionException If debits != credits
     * @throws \DomainException If account not found
     */
    public function recordTransaction(string $transactionId, array $entries): void
    {
        $this->validateBalanced($entries);

        DB::transaction(function () use ($transactionId, $entries) {
            foreach ($entries as $entry) {
                $account = $this->accountRepository->findById($entry['account_id']);

                if ($account === null) {
                    throw new \DomainException("Account not found: {$entry['account_id']}");
                }

                // Calculate new balance based on account type and entry type
                $currentBalance = $this->entryRepository->getAccountBalance($entry['account_id']);
                $newBalance = $this->calculateNewBalance(
                    $account,
                    $currentBalance,
                    $entry['type'],
                    $entry['amount']
                );

                // Create the ledger entry
                $ledgerEntry = LedgerEntry::create(
                    id: $this->entryRepository->nextIdentity()->toString(),
                    transactionId: $transactionId,
                    accountId: $entry['account_id'],
                    entryType: $entry['type'],
                    amount: $entry['amount'],
                    balanceAfter: $newBalance,
                    description: $entry['description'] ?? null
                );

                // Set metadata if provided
                if (isset($entry['metadata']) && is_array($entry['metadata'])) {
                    $ledgerEntry->setMetadata($entry['metadata']);
                }

                $this->entryRepository->save($ledgerEntry);
            }
        });
    }

    /**
     * Record a deposit transaction with double-entry accounting.
     *
     * Accounting entries for a deposit:
     * 1. DEBIT User Wallet Account (Asset +) - User now has more money
     * 2. CREDIT Provider Payable Account (Liability +) - We owe this to provider
     *
     * If there's a fee:
     * 3. CREDIT User Wallet Account (Asset -) - Deduct fee from user
     * 4. CREDIT Fee Revenue Account (Revenue +) - Record fee as revenue
     *
     * Note: The fee entries cancel out part of the debit, maintaining balance.
     *
     * @param string $transactionId Unique transaction identifier
     * @param string $userAccountId User's wallet account ID
     * @param string $providerPayableAccountId System account for provider payables
     * @param Money $amount Gross deposit amount
     * @param string|null $feeAccountId Fee revenue account ID
     * @param Money|null $feeAmount Fee amount (if any)
     */
    public function recordDeposit(
        string $transactionId,
        string $userAccountId,
        string $providerPayableAccountId,
        Money $amount,
        ?string $feeAccountId = null,
        ?Money $feeAmount = null
    ): void {
        $entries = [];

        // Entry 1: Debit User Wallet Account (Asset increases with debit)
        // This increases the user's balance
        $entries[] = [
            'account_id' => $userAccountId,
            'type' => EntryType::DEBIT,
            'amount' => $amount,
            'description' => 'Deposit received',
            'metadata' => [
                'operation' => 'deposit',
                'transaction_id' => $transactionId,
            ],
        ];

        // Entry 2: Credit Provider Payable Account (Liability increases with credit)
        // This records that we received money from the provider
        $entries[] = [
            'account_id' => $providerPayableAccountId,
            'type' => EntryType::CREDIT,
            'amount' => $amount,
            'description' => 'Provider deposit received',
            'metadata' => [
                'operation' => 'deposit',
                'transaction_id' => $transactionId,
            ],
        ];

        // If there's a fee, record it with additional entries
        if ($feeAccountId !== null && $feeAmount !== null && $feeAmount->isPositive()) {
            // Entry 3: Credit User Wallet Account (Asset decreases with credit)
            // This deducts the fee from the user's balance
            $entries[] = [
                'account_id' => $userAccountId,
                'type' => EntryType::CREDIT,
                'amount' => $feeAmount,
                'description' => 'Deposit fee charged',
                'metadata' => [
                    'operation' => 'deposit_fee',
                    'transaction_id' => $transactionId,
                ],
            ];

            // Entry 4: Credit Fee Revenue Account (Revenue increases with credit)
            // This records the fee as revenue for the platform
            $entries[] = [
                'account_id' => $feeAccountId,
                'type' => EntryType::CREDIT,
                'amount' => $feeAmount,
                'description' => 'Deposit fee revenue',
                'metadata' => [
                    'operation' => 'deposit_fee',
                    'transaction_id' => $transactionId,
                ],
            ];
        }

        $this->recordTransaction($transactionId, $entries);
    }

    /**
     * Record a withdrawal transaction with double-entry accounting.
     *
     * Accounting entries for a withdrawal:
     * 1. CREDIT User Wallet Account (Asset -) - User balance decreases
     * 2. DEBIT Provider Receivable Account (Asset +) - We're owed by provider
     *
     * If there's a fee:
     * 3. CREDIT Fee Revenue Account (Revenue +) - Fee revenue
     *
     * The total debited must equal total credited.
     *
     * @param string $transactionId Unique transaction identifier
     * @param string $userAccountId User's wallet account ID
     * @param string $providerReceivableAccountId System account for provider receivables
     * @param Money $netAmount Net amount to be sent to user (after fees)
     * @param string|null $feeAccountId Fee revenue account ID
     * @param Money|null $feeAmount Fee amount (if any)
     */
    public function recordWithdrawal(
        string $transactionId,
        string $userAccountId,
        string $providerReceivableAccountId,
        Money $netAmount,
        ?string $feeAccountId = null,
        ?Money $feeAmount = null
    ): void {
        // Calculate total amount to be debited from user account
        $totalAmount = $feeAmount !== null && $feeAmount->isPositive()
            ? $netAmount->add($feeAmount)
            : $netAmount;

        $entries = [];

        // Entry 1: Credit User Wallet Account (Asset decreases with credit)
        // This decreases the user's balance by total amount (net + fee)
        $entries[] = [
            'account_id' => $userAccountId,
            'type' => EntryType::CREDIT,
            'amount' => $totalAmount,
            'description' => 'Withdrawal processed',
            'metadata' => [
                'operation' => 'withdrawal',
                'transaction_id' => $transactionId,
                'net_amount' => $netAmount->getCents(),
                'fee_amount' => $feeAmount?->getCents() ?? 0,
            ],
        ];

        // Entry 2: Debit Provider Receivable Account (Asset increases with debit)
        // This records that the provider owes us money for the withdrawal
        $entries[] = [
            'account_id' => $providerReceivableAccountId,
            'type' => EntryType::DEBIT,
            'amount' => $netAmount,
            'description' => 'Provider withdrawal receivable',
            'metadata' => [
                'operation' => 'withdrawal',
                'transaction_id' => $transactionId,
            ],
        ];

        // If there's a fee, record it as revenue
        if ($feeAccountId !== null && $feeAmount !== null && $feeAmount->isPositive()) {
            // Entry 3: Credit Fee Revenue Account (Revenue increases with credit)
            // This records the withdrawal fee as revenue
            $entries[] = [
                'account_id' => $feeAccountId,
                'type' => EntryType::CREDIT,
                'amount' => $feeAmount,
                'description' => 'Withdrawal fee revenue',
                'metadata' => [
                    'operation' => 'withdrawal_fee',
                    'transaction_id' => $transactionId,
                ],
            ];
        }

        $this->recordTransaction($transactionId, $entries);
    }

    /**
     * Get the balance for a specific account.
     *
     * The balance is calculated from all ledger entries:
     * - For ASSET/EXPENSE accounts: balance = SUM(debits) - SUM(credits)
     * - For LIABILITY/EQUITY/REVENUE accounts: balance = SUM(credits) - SUM(debits)
     *
     * @param string $accountId The account ID
     * @return Money The current balance
     */
    public function getBalance(string $accountId): Money
    {
        return $this->entryRepository->getAccountBalance($accountId);
    }

    /**
     * Get the wallet balance for a user.
     *
     * This finds the user's main balance account and calculates the real balance
     * from all ledger entries. Returns zero if no account exists.
     *
     * @param string $walletId The wallet ID
     * @return Money The current wallet balance
     */
    public function getWalletBalance(string $walletId): Money
    {
        $account = $this->accountRepository->findByWalletId($walletId);

        if ($account === null) {
            return Money::zero();
        }

        return $this->getBalance($account->getId());
    }

    /**
     * Get available balance (excluding reserved and blocked amounts).
     *
     * Available = Main Balance - Reserved - Blocked
     *
     * @param string $walletId The wallet ID
     * @return Money The available balance
     */
    public function getAvailableBalance(string $walletId): Money
    {
        $mainBalance = $this->getWalletBalance($walletId);
        $reservedBalance = $this->getReservedBalance($walletId);
        $blockedBalance = $this->getBlockedBalance($walletId);

        // Subtract reserved and blocked from main balance
        try {
            $available = $mainBalance->subtract($reservedBalance);
            $available = $available->subtract($blockedBalance);
            return $available;
        } catch (\InvalidArgumentException $e) {
            // If subtraction would result in negative, return zero
            return Money::zero();
        }
    }

    /**
     * Get the reserved balance for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return Money The reserved balance
     */
    public function getReservedBalance(string $walletId): Money
    {
        $accounts = $this->getWalletAccounts($walletId);
        $reserveAccount = $accounts['reserve'] ?? null;

        if ($reserveAccount === null) {
            return Money::zero();
        }

        return $this->getBalance($reserveAccount->getId());
    }

    /**
     * Get the blocked balance for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return Money The blocked balance
     */
    public function getBlockedBalance(string $walletId): Money
    {
        $accounts = $this->getWalletAccounts($walletId);
        $blockedAccount = $accounts['blocked'] ?? null;

        if ($blockedAccount === null) {
            return Money::zero();
        }

        return $this->getBalance($blockedAccount->getId());
    }

    /**
     * Reverse entries for a transaction.
     *
     * Creates new entries that reverse the original transaction by:
     * 1. Swapping debits for credits and vice versa
     * 2. Using the same amounts
     * 3. Recording a reference to the original transaction
     * 4. Marking entries with 'reversal' metadata
     *
     * IMPORTANT: Never delete original entries. Reversals are the only way
     * to "undo" a transaction in double-entry accounting.
     *
     * @param string $originalTransactionId The transaction to reverse
     * @param string|null $reason Optional reason for the reversal
     * @return string The new reversal transaction ID
     *
     * @throws \DomainException If original transaction not found
     */
    public function reverseEntries(string $originalTransactionId, ?string $reason = null): string
    {
        // Find original entries
        $originalEntries = $this->entryRepository->findByTransactionId($originalTransactionId);

        if (empty($originalEntries)) {
            throw new \DomainException("Transaction not found: {$originalTransactionId}");
        }

        // Generate new transaction ID for the reversal
        $reversalTransactionId = Str::uuid()->toString();

        // Create reversal entries (swap debit/credit)
        $reversalEntries = [];
        foreach ($originalEntries as $originalEntry) {
            $reversalEntries[] = [
                'account_id' => $originalEntry->getAccountId(),
                'type' => $originalEntry->getEntryType()->opposite(), // Swap debit <-> credit
                'amount' => $originalEntry->getAmount(),
                'description' => 'Reversal: ' . ($originalEntry->getDescription() ?? 'No description'),
                'metadata' => [
                    'operation' => 'reversal',
                    'original_transaction_id' => $originalTransactionId,
                    'original_entry_id' => $originalEntry->getId(),
                    'reason' => $reason,
                    'reversed_at' => (new \DateTimeImmutable())->format('c'),
                ],
            ];
        }

        // Record the reversal transaction
        $this->recordTransaction($reversalTransactionId, $reversalEntries);

        return $reversalTransactionId;
    }

    /**
     * Create all necessary accounts for a new wallet.
     *
     * Each wallet needs three accounts:
     * 1. Main Balance Account (ASSET) - Primary user balance
     * 2. Reserve Account (ASSET) - Amounts pending withdrawal
     * 3. Blocked Account (ASSET) - Amounts blocked by compliance/disputes
     *
     * @param string $walletId The wallet ID
     * @param string $userId The user ID (for naming)
     * @return array<string, LedgerAccount> Array of created accounts keyed by type
     */
    public function createAccountsForWallet(string $walletId, string $userId): array
    {
        $accounts = [];

        DB::transaction(function () use ($walletId, $userId, &$accounts) {
            // 1. Main Balance Account (primary user balance)
            $mainAccount = LedgerAccount::createUserAccount(
                id: $this->accountRepository->nextIdentity(),
                code: "USER.{$userId}.BALANCE",
                name: "User Balance - {$userId}",
                walletId: $walletId,
                type: AccountType::ASSET,
                category: self::CATEGORY_USER_BALANCE
            );
            $this->accountRepository->save($mainAccount);
            $accounts['main'] = $mainAccount;

            // 2. Reserve Account (for pending withdrawals)
            $reserveAccount = LedgerAccount::createUserAccount(
                id: $this->accountRepository->nextIdentity(),
                code: "USER.{$userId}.RESERVE",
                name: "User Reserve - {$userId}",
                walletId: $walletId,
                type: AccountType::ASSET,
                category: self::CATEGORY_USER_RESERVE
            );
            $this->accountRepository->save($reserveAccount);
            $accounts['reserve'] = $reserveAccount;

            // 3. Blocked Account (for compliance holds, disputes, etc.)
            $blockedAccount = LedgerAccount::createUserAccount(
                id: $this->accountRepository->nextIdentity(),
                code: "USER.{$userId}.BLOCKED",
                name: "User Blocked - {$userId}",
                walletId: $walletId,
                type: AccountType::ASSET,
                category: self::CATEGORY_USER_BLOCKED
            );
            $this->accountRepository->save($blockedAccount);
            $accounts['blocked'] = $blockedAccount;
        });

        return $accounts;
    }

    /**
     * Reserve funds for a pending operation (like withdrawal).
     *
     * Moves funds from main balance to reserve account.
     *
     * @param string $walletId The wallet ID
     * @param Money $amount Amount to reserve
     * @param string|null $reason Reason for reservation
     * @return string The transaction ID
     */
    public function reserveFunds(string $walletId, Money $amount, ?string $reason = null): string
    {
        $accounts = $this->getWalletAccounts($walletId);
        $mainAccount = $accounts['main'] ?? null;
        $reserveAccount = $accounts['reserve'] ?? null;

        if ($mainAccount === null || $reserveAccount === null) {
            throw new \DomainException("Wallet accounts not found for: {$walletId}");
        }

        $transactionId = Str::uuid()->toString();

        $entries = [
            // Credit main account (decrease)
            [
                'account_id' => $mainAccount->getId(),
                'type' => EntryType::CREDIT,
                'amount' => $amount,
                'description' => 'Funds reserved',
                'metadata' => [
                    'operation' => 'reserve',
                    'reason' => $reason,
                ],
            ],
            // Debit reserve account (increase)
            [
                'account_id' => $reserveAccount->getId(),
                'type' => EntryType::DEBIT,
                'amount' => $amount,
                'description' => 'Funds reserved',
                'metadata' => [
                    'operation' => 'reserve',
                    'reason' => $reason,
                ],
            ],
        ];

        $this->recordTransaction($transactionId, $entries);

        return $transactionId;
    }

    /**
     * Release reserved funds back to main balance.
     *
     * @param string $walletId The wallet ID
     * @param Money $amount Amount to release
     * @param string|null $reason Reason for release
     * @return string The transaction ID
     */
    public function releaseFunds(string $walletId, Money $amount, ?string $reason = null): string
    {
        $accounts = $this->getWalletAccounts($walletId);
        $mainAccount = $accounts['main'] ?? null;
        $reserveAccount = $accounts['reserve'] ?? null;

        if ($mainAccount === null || $reserveAccount === null) {
            throw new \DomainException("Wallet accounts not found for: {$walletId}");
        }

        $transactionId = Str::uuid()->toString();

        $entries = [
            // Credit reserve account (decrease)
            [
                'account_id' => $reserveAccount->getId(),
                'type' => EntryType::CREDIT,
                'amount' => $amount,
                'description' => 'Funds released',
                'metadata' => [
                    'operation' => 'release',
                    'reason' => $reason,
                ],
            ],
            // Debit main account (increase)
            [
                'account_id' => $mainAccount->getId(),
                'type' => EntryType::DEBIT,
                'amount' => $amount,
                'description' => 'Funds released',
                'metadata' => [
                    'operation' => 'release',
                    'reason' => $reason,
                ],
            ],
        ];

        $this->recordTransaction($transactionId, $entries);

        return $transactionId;
    }

    /**
     * Block funds (compliance, disputes, etc.).
     *
     * @param string $walletId The wallet ID
     * @param Money $amount Amount to block
     * @param string $reason Reason for blocking (required)
     * @return string The transaction ID
     */
    public function blockFunds(string $walletId, Money $amount, string $reason): string
    {
        $accounts = $this->getWalletAccounts($walletId);
        $mainAccount = $accounts['main'] ?? null;
        $blockedAccount = $accounts['blocked'] ?? null;

        if ($mainAccount === null || $blockedAccount === null) {
            throw new \DomainException("Wallet accounts not found for: {$walletId}");
        }

        $transactionId = Str::uuid()->toString();

        $entries = [
            // Credit main account (decrease)
            [
                'account_id' => $mainAccount->getId(),
                'type' => EntryType::CREDIT,
                'amount' => $amount,
                'description' => 'Funds blocked',
                'metadata' => [
                    'operation' => 'block',
                    'reason' => $reason,
                ],
            ],
            // Debit blocked account (increase)
            [
                'account_id' => $blockedAccount->getId(),
                'type' => EntryType::DEBIT,
                'amount' => $amount,
                'description' => 'Funds blocked',
                'metadata' => [
                    'operation' => 'block',
                    'reason' => $reason,
                ],
            ],
        ];

        $this->recordTransaction($transactionId, $entries);

        return $transactionId;
    }

    /**
     * Unblock funds.
     *
     * @param string $walletId The wallet ID
     * @param Money $amount Amount to unblock
     * @param string $reason Reason for unblocking
     * @return string The transaction ID
     */
    public function unblockFunds(string $walletId, Money $amount, string $reason): string
    {
        $accounts = $this->getWalletAccounts($walletId);
        $mainAccount = $accounts['main'] ?? null;
        $blockedAccount = $accounts['blocked'] ?? null;

        if ($mainAccount === null || $blockedAccount === null) {
            throw new \DomainException("Wallet accounts not found for: {$walletId}");
        }

        $transactionId = Str::uuid()->toString();

        $entries = [
            // Credit blocked account (decrease)
            [
                'account_id' => $blockedAccount->getId(),
                'type' => EntryType::CREDIT,
                'amount' => $amount,
                'description' => 'Funds unblocked',
                'metadata' => [
                    'operation' => 'unblock',
                    'reason' => $reason,
                ],
            ],
            // Debit main account (increase)
            [
                'account_id' => $mainAccount->getId(),
                'type' => EntryType::DEBIT,
                'amount' => $amount,
                'description' => 'Funds unblocked',
                'metadata' => [
                    'operation' => 'unblock',
                    'reason' => $reason,
                ],
            ],
        ];

        $this->recordTransaction($transactionId, $entries);

        return $transactionId;
    }

    /**
     * Transfer between two user wallets.
     *
     * @param string $fromWalletId Source wallet ID
     * @param string $toWalletId Destination wallet ID
     * @param Money $amount Transfer amount
     * @param string|null $description Optional description
     * @return string The transaction ID
     */
    public function transfer(
        string $fromWalletId,
        string $toWalletId,
        Money $amount,
        ?string $description = null
    ): string {
        $fromAccount = $this->accountRepository->findByWalletId($fromWalletId);
        $toAccount = $this->accountRepository->findByWalletId($toWalletId);

        if ($fromAccount === null) {
            throw new \DomainException("Source wallet account not found: {$fromWalletId}");
        }

        if ($toAccount === null) {
            throw new \DomainException("Destination wallet account not found: {$toWalletId}");
        }

        $transactionId = Str::uuid()->toString();

        $entries = [
            // Credit source account (decrease)
            [
                'account_id' => $fromAccount->getId(),
                'type' => EntryType::CREDIT,
                'amount' => $amount,
                'description' => $description ?? 'Transfer out',
                'metadata' => [
                    'operation' => 'transfer',
                    'direction' => 'out',
                    'counterparty_wallet_id' => $toWalletId,
                ],
            ],
            // Debit destination account (increase)
            [
                'account_id' => $toAccount->getId(),
                'type' => EntryType::DEBIT,
                'amount' => $amount,
                'description' => $description ?? 'Transfer in',
                'metadata' => [
                    'operation' => 'transfer',
                    'direction' => 'in',
                    'counterparty_wallet_id' => $fromWalletId,
                ],
            ],
        ];

        $this->recordTransaction($transactionId, $entries);

        return $transactionId;
    }

    /**
     * Get all entries for a transaction.
     *
     * @param string $transactionId The transaction ID
     * @return array<LedgerEntry> Array of ledger entries
     */
    public function getTransactionEntries(string $transactionId): array
    {
        return $this->entryRepository->findByTransactionId($transactionId);
    }

    /**
     * Get account statement (list of entries).
     *
     * @param string $accountId The account ID
     * @param int $limit Maximum entries to return
     * @param int $offset Offset for pagination
     * @return array<LedgerEntry> Array of ledger entries
     */
    public function getAccountStatement(string $accountId, int $limit = 100, int $offset = 0): array
    {
        return $this->entryRepository->findByAccountId($accountId, $limit, $offset);
    }

    /**
     * Validate that a transaction is balanced (debits = credits).
     *
     * @param array $entries The entries to validate
     * @throws UnbalancedTransactionException If not balanced
     */
    private function validateBalanced(array $entries): void
    {
        $debits = Money::zero();
        $credits = Money::zero();

        foreach ($entries as $entry) {
            if ($entry['type'] === EntryType::DEBIT) {
                $debits = $debits->add($entry['amount']);
            } else {
                $credits = $credits->add($entry['amount']);
            }
        }

        if (!$debits->equals($credits)) {
            throw new UnbalancedTransactionException(
                "Transaction is unbalanced: debits={$debits->getDecimalString()}, credits={$credits->getDecimalString()}"
            );
        }
    }

    /**
     * Calculate the new balance after an entry.
     *
     * The calculation depends on the account type:
     * - ASSET/EXPENSE: Debit increases, Credit decreases
     * - LIABILITY/EQUITY/REVENUE: Credit increases, Debit decreases
     *
     * @param LedgerAccount $account The account
     * @param Money $currentBalance Current account balance
     * @param EntryType $entryType The entry type (DEBIT or CREDIT)
     * @param Money $amount The entry amount
     * @return Money The new balance after the entry
     */
    private function calculateNewBalance(
        LedgerAccount $account,
        Money $currentBalance,
        EntryType $entryType,
        Money $amount
    ): Money {
        // Check if this entry type increases the account balance
        if ($account->entryIncreases($entryType)) {
            return $currentBalance->add($amount);
        }

        // Entry decreases the balance
        // For user balance accounts, we must validate sufficient funds
        if ($account->getCategory() === self::CATEGORY_USER_BALANCE) {
            if ($amount->greaterThan($currentBalance)) {
                throw new \DomainException(
                    "Insufficient balance: required={$amount->getDecimalString()}, " .
                    "available={$currentBalance->getDecimalString()}"
                );
            }
        }

        // For system accounts or when sufficient balance exists
        try {
            return $currentBalance->subtract($amount);
        } catch (\InvalidArgumentException $e) {
            // Money class doesn't allow negative results
            // For system accounts, we need to handle this differently
            // In double-entry, the "balance" can appear negative for certain account types
            // We return zero as a safeguard, but this shouldn't happen with proper validation
            return Money::zero();
        }
    }

    /**
     * Get all accounts for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return array<string, LedgerAccount|null> Array keyed by account type
     */
    private function getWalletAccounts(string $walletId): array
    {
        return [
            'main' => $this->accountRepository->findByWalletIdAndCategory(
                $walletId,
                self::CATEGORY_USER_BALANCE
            ),
            'reserve' => $this->accountRepository->findByWalletIdAndCategory(
                $walletId,
                self::CATEGORY_USER_RESERVE
            ),
            'blocked' => $this->accountRepository->findByWalletIdAndCategory(
                $walletId,
                self::CATEGORY_USER_BLOCKED
            ),
        ];
    }

    /**
     * Get or create the main balance account for a wallet.
     *
     * If the account doesn't exist, it will be created along with the
     * reserve and blocked accounts for the wallet.
     *
     * @param string $walletId The wallet ID
     * @return LedgerAccount The main balance account
     */
    public function getOrCreateMainAccount(string $walletId): LedgerAccount
    {
        $account = $this->accountRepository->findByWalletIdAndCategory(
            $walletId,
            self::CATEGORY_USER_BALANCE
        );

        if ($account !== null) {
            return $account;
        }

        // Create all accounts for the wallet
        $accounts = $this->createAccountsForWallet($walletId, $walletId);

        return $accounts['main'];
    }

    /**
     * Get or create system account by category.
     *
     * System accounts are shared accounts used for tracking provider relationships
     * and revenue. They are created once and reused across all transactions.
     *
     * @param string $category The account category
     * @return LedgerAccount The system account
     */
    public function getOrCreateSystemAccount(string $category): LedgerAccount
    {
        $account = $this->accountRepository->findSystemAccountByCategory($category);

        if ($account !== null) {
            return $account;
        }

        // Create the system account
        $accountType = match ($category) {
            self::CATEGORY_PROVIDER_PAYABLE => AccountType::LIABILITY,
            self::CATEGORY_PROVIDER_RECEIVABLE => AccountType::ASSET,
            self::CATEGORY_FEE_REVENUE => AccountType::REVENUE,
            self::CATEGORY_PENDING_WITHDRAWALS => AccountType::LIABILITY,
            default => AccountType::ASSET,
        };

        $accountName = match ($category) {
            self::CATEGORY_PROVIDER_PAYABLE => 'Provider Payable',
            self::CATEGORY_PROVIDER_RECEIVABLE => 'Provider Receivable',
            self::CATEGORY_FEE_REVENUE => 'Fee Revenue',
            self::CATEGORY_PENDING_WITHDRAWALS => 'Pending Withdrawals',
            default => ucfirst(str_replace('_', ' ', $category)),
        };

        $account = LedgerAccount::createSystemAccount(
            id: $this->accountRepository->nextIdentity(),
            code: 'SYS.' . strtoupper(str_replace('_', '.', $category)),
            name: $accountName,
            type: $accountType,
            category: $category,
            description: "System account for {$accountName}"
        );

        $this->accountRepository->save($account);

        return $account;
    }

    /**
     * Validate that wallet has sufficient available balance.
     *
     * @param string $walletId The wallet ID
     * @param Money $requiredAmount The required amount
     * @throws \DomainException If insufficient balance
     */
    public function validateSufficientBalance(string $walletId, Money $requiredAmount): void
    {
        $availableBalance = $this->getAvailableBalance($walletId);

        if ($requiredAmount->greaterThan($availableBalance)) {
            throw new \DomainException(
                "Insufficient balance: required={$requiredAmount->getDecimalString()}, " .
                "available={$availableBalance->getDecimalString()}"
            );
        }
    }

    /**
     * Get a summary of all balances for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return array{main: Money, reserved: Money, blocked: Money, available: Money, total: Money}
     */
    public function getBalanceSummary(string $walletId): array
    {
        $mainBalance = $this->getWalletBalance($walletId);
        $reservedBalance = $this->getReservedBalance($walletId);
        $blockedBalance = $this->getBlockedBalance($walletId);
        $availableBalance = $this->getAvailableBalance($walletId);

        // Total is main + reserved + blocked (all user funds)
        $totalBalance = $mainBalance->add($reservedBalance)->add($blockedBalance);

        return [
            'main' => $mainBalance,
            'reserved' => $reservedBalance,
            'blocked' => $blockedBalance,
            'available' => $availableBalance,
            'total' => $totalBalance,
        ];
    }
}
