<?php

declare(strict_types=1);

namespace App\Providers;

use App\Application\Audit\Contracts\AuditServiceInterface;
use App\Application\Audit\Services\AuditService;
use Illuminate\Support\ServiceProvider;

/**
 * Service provider for audit logging.
 *
 * Registers the AuditService as a singleton to ensure consistent
 * audit logging throughout the application lifecycle.
 */
class AuditServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register AuditService as singleton
        $this->app->singleton(AuditServiceInterface::class, AuditService::class);
        $this->app->singleton(AuditService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Nothing to boot
    }
}
