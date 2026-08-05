<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\LedgerEntry;
use App\Domain\Wallet\Repositories\LedgerEntryRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\LedgerEntryModel;
use App\Infrastructure\Persistence\Mappers\LedgerEntryMapper;
use Illuminate\Support\Str;

final class EloquentLedgerEntryRepository implements LedgerEntryRepositoryInterface
{
    public function findById(Uuid $id): ?LedgerEntry
    {
        $model = LedgerEntryModel::find($id->toString());

        if ($model === null) {
            return null;
        }

        return LedgerEntryMapper::toEntity($model);
    }

    public function findByTransactionId(string $transactionId): array
    {
        $models = LedgerEntryModel::where('transaction_id', $transactionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return $models->map(fn (LedgerEntryModel $model) => LedgerEntryMapper::toEntity($model))->all();
    }

    public function findByAccountId(string $accountId, int $limit = 100, int $offset = 0): array
    {
        $models = LedgerEntryModel::where('account_id', $accountId)
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        return $models->map(fn (LedgerEntryModel $model) => LedgerEntryMapper::toEntity($model))->all();
    }

    /**
     * Calculate the account balance from all ledger entries.
     *
     * For ASSET/EXPENSE accounts: balance = SUM(debits) - SUM(credits)
     * For LIABILITY/EQUITY/REVENUE accounts: balance = SUM(credits) - SUM(debits)
     *
     * Since we're dealing with user balance accounts (ASSET type), we use:
     * balance = SUM(debits) - SUM(credits)
     *
     * @param string $accountId The account ID
     * @return Money The calculated balance
     */
    public function getAccountBalance(string $accountId): Money
    {
        // Get sum of all debit entries for this account
        $debits = LedgerEntryModel::where('account_id', $accountId)
            ->where('entry_type', 'debit')
            ->sum('amount');

        // Get sum of all credit entries for this account
        $credits = LedgerEntryModel::where('account_id', $accountId)
            ->where('entry_type', 'credit')
            ->sum('amount');

        // For asset accounts: balance = debits - credits
        // The amounts are stored as decimals, so we convert to cents
        $debitCents = (int) round((float) $debits * 100);
        $creditCents = (int) round((float) $credits * 100);

        $balanceCents = $debitCents - $creditCents;

        // Handle negative balance (shouldn't happen for user accounts, but handle gracefully)
        if ($balanceCents < 0) {
            return Money::zero();
        }

        return Money::fromCents($balanceCents);
    }

    public function save(LedgerEntry $entry): void
    {
        $data = LedgerEntryMapper::toModel($entry);
        LedgerEntryModel::create($data);
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString(Str::uuid()->toString());
    }
}
