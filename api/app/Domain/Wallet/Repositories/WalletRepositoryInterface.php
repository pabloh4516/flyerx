<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Repositories;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Wallet;

interface WalletRepositoryInterface
{
    public function findById(Uuid $id): ?Wallet;

    public function findByUserId(Uuid $userId): ?Wallet;

    public function save(Wallet $wallet): void;

    public function update(Wallet $wallet): void;

    public function nextIdentity(): Uuid;
}
