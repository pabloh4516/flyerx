<?php

declare(strict_types=1);

namespace App\Application\Lwk;

use App\Application\Lwk\Contracts\LwkServiceInterface;
use App\Application\Lwk\Services\LwkService;
use Illuminate\Support\ServiceProvider;

class LwkServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(LwkServiceInterface::class, LwkService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
