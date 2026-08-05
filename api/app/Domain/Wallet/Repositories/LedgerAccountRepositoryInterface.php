<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Repositories;

use App\Domain\Wallet\Entities\LedgerAccount;

interface LedgerAccountRepositoryInterface
{
    public function findById(string $id): ?LedgerAccount;

    public function findByCode(string $code): ?LedgerAccount;

    public function findByWalletId(string $walletId): ?LedgerAccount;

    /**
     * Find a user account by wallet ID and category.
     *
     * @param string $walletId The wallet ID
     * @param string $category The account category (e.g., 'user_balance', 'user_reserve', 'user_blocked')
     * @return LedgerAccount|null
     */
    public function findByWalletIdAndCategory(string $walletId, string $category): ?LedgerAccount;

    /**
     * Find all accounts for a wallet.
     *
     * @param string $walletId The wallet ID
     * @return array<LedgerAccount>
     */
    public function findAllByWalletId(string $walletId): array;

    public function findSystemAccountByCategory(string $category): ?LedgerAccount;

    public function save(LedgerAccount $account): void;

    public function nextIdentity(): string;
}
