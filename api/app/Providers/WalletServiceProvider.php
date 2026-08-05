<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Wallet\Services\DepositService;
use App\Application\Wallet\Services\FeeService;
use App\Application\Wallet\Services\WithdrawalService;
use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\LedgerAccountRepositoryInterface;
use App\Domain\Wallet\Repositories\LedgerEntryRepositoryInterface;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\Services\LedgerService;
use App\Infrastructure\Payment\PaymentProviderFactory;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDepositRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLedgerAccountRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentLedgerEntryRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentWalletRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentWithdrawalRepository;
use Illuminate\Support\ServiceProvider;

class WalletServiceProvider extends ServiceProvider
{
    public array $singletons = [
        // Repositories
        WalletRepositoryInterface::class => EloquentWalletRepository::class,
        DepositRepositoryInterface::class => EloquentDepositRepository::class,
        WithdrawalRepositoryInterface::class => EloquentWithdrawalRepository::class,
        LedgerAccountRepositoryInterface::class => EloquentLedgerAccountRepository::class,
        LedgerEntryRepositoryInterface::class => EloquentLedgerEntryRepository::class,
    ];

    public function register(): void
    {
        $this->app->singleton(FeeService::class);

        // Payment Provider (can be overridden in tests)
        $this->app->singleton(PaymentProviderInterface::class, function ($app) {
            return PaymentProviderFactory::default();
        });

        $this->app->singleton(LedgerService::class, function ($app) {
            return new LedgerService(
                $app->make(LedgerAccountRepositoryInterface::class),
                $app->make(LedgerEntryRepositoryInterface::class),
            );
        });

        $this->app->singleton(DepositService::class, function ($app) {
            return new DepositService(
                $app->make(WalletRepositoryInterface::class),
                $app->make(DepositRepositoryInterface::class),
                $app->make(LedgerService::class),
                $app->make(FeeService::class),
                $app->make(\Illuminate\Contracts\Events\Dispatcher::class),
                $app->make(PaymentProviderInterface::class),
            );
        });

        $this->app->singleton(WithdrawalService::class, function ($app) {
            return new WithdrawalService(
                $app->make(WalletRepositoryInterface::class),
                $app->make(WithdrawalRepositoryInterface::class),
                $app->make(LedgerService::class),
                $app->make(FeeService::class),
                $app->make(\Illuminate\Contracts\Events\Dispatcher::class),
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
