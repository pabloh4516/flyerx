<?php

declare(strict_types=1);

namespace App\Application\Wallet\Listeners;

use App\Domain\Identity\Events\UserRegistered;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Wallet;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * Creates a wallet automatically when a user registers.
 */
class CreateWalletOnUserRegistered
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly Dispatcher $eventDispatcher,
    ) {}

    public function handle(UserRegistered $event): void
    {
        $userId = $event->getAggregateId();

        // Check if wallet already exists
        $existingWallet = $this->walletRepository->findByUserId(
            Uuid::fromString($userId)
        );

        if ($existingWallet !== null) {
            return;
        }

        // Create new wallet
        $walletId = Uuid::generate()->toString();
        $wallet = Wallet::create(
            id: $walletId,
            userId: $userId,
            currency: 'BRL'
        );

        // Save wallet
        $this->walletRepository->save($wallet);

        // Dispatch domain events
        foreach ($wallet->pullDomainEvents() as $domainEvent) {
            $this->eventDispatcher->dispatch($domainEvent);
        }
    }
}
