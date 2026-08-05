<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Audit\Listeners\AuditDepositCompleted;
use App\Application\Audit\Listeners\AuditDepositCreated;
use App\Application\Audit\Listeners\AuditDepositFailed;
use App\Application\Audit\Listeners\AuditPasswordChanged;
use App\Application\Audit\Listeners\AuditTwoFactorDisabled;
use App\Application\Audit\Listeners\AuditTwoFactorEnabled;
use App\Application\Audit\Listeners\AuditUserEmailVerified;
use App\Application\Audit\Listeners\AuditUserLoggedIn;
use App\Application\Audit\Listeners\AuditUserLoggedOut;
use App\Application\Audit\Listeners\AuditUserLoginFailed;
use App\Application\Audit\Listeners\AuditUserRegistered;
use App\Application\Audit\Listeners\AuditWalletCreated;
use App\Application\Audit\Listeners\AuditWalletSuspended;
use App\Application\Audit\Listeners\AuditWithdrawalCompleted;
use App\Application\Audit\Listeners\AuditWithdrawalCreated;
use App\Application\Audit\Listeners\AuditWithdrawalFailed;
use App\Domain\Identity\Events\PasswordChanged;
use App\Domain\Identity\Events\TwoFactorDisabled;
use App\Domain\Identity\Events\TwoFactorEnabled;
use App\Domain\Identity\Events\UserEmailVerified;
use App\Domain\Identity\Events\UserLoggedIn;
use App\Domain\Identity\Events\UserLoggedOut;
use App\Domain\Identity\Events\UserLoginFailed;
use App\Domain\Identity\Events\UserRegistered;
use App\Domain\Wallet\Events\DepositCompleted;
use App\Domain\Wallet\Events\DepositCreated;
use App\Domain\Wallet\Events\DepositFailed;
use App\Domain\Wallet\Events\WalletCreated;
use App\Domain\Wallet\Events\WalletSuspended;
use App\Domain\Wallet\Events\WithdrawalCompleted;
use App\Domain\Wallet\Events\WithdrawalCreated;
use App\Domain\Wallet\Events\WithdrawalFailed;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * Event Service Provider for Flyerx.
 *
 * Registers all domain event listeners, particularly for audit logging.
 * For fintech compliance, ALL critical operations MUST be audited.
 *
 * @see PCI-DSS Requirement 10
 * @see LGPD/GDPR Audit Requirements
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // -------------------------------------------------------------------------
        // Identity / Authentication Events
        // -------------------------------------------------------------------------
        UserRegistered::class => [
            AuditUserRegistered::class,
        ],

        UserEmailVerified::class => [
            AuditUserEmailVerified::class,
        ],

        PasswordChanged::class => [
            AuditPasswordChanged::class,
        ],

        TwoFactorEnabled::class => [
            AuditTwoFactorEnabled::class,
        ],

        TwoFactorDisabled::class => [
            AuditTwoFactorDisabled::class,
        ],

        UserLoggedIn::class => [
            AuditUserLoggedIn::class,
        ],

        UserLoggedOut::class => [
            AuditUserLoggedOut::class,
        ],

        UserLoginFailed::class => [
            AuditUserLoginFailed::class,
        ],

        // -------------------------------------------------------------------------
        // Wallet Events
        // -------------------------------------------------------------------------
        WalletCreated::class => [
            AuditWalletCreated::class,
        ],

        WalletSuspended::class => [
            AuditWalletSuspended::class,
        ],

        // -------------------------------------------------------------------------
        // Deposit Events
        // -------------------------------------------------------------------------
        DepositCreated::class => [
            AuditDepositCreated::class,
        ],

        DepositCompleted::class => [
            AuditDepositCompleted::class,
        ],

        DepositFailed::class => [
            AuditDepositFailed::class,
        ],

        // -------------------------------------------------------------------------
        // Withdrawal Events
        // -------------------------------------------------------------------------
        WithdrawalCreated::class => [
            AuditWithdrawalCreated::class,
        ],

        WithdrawalCompleted::class => [
            AuditWithdrawalCompleted::class,
        ],

        WithdrawalFailed::class => [
            AuditWithdrawalFailed::class,
        ],
    ];

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }
}
