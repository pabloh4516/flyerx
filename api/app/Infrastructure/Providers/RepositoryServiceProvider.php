<?php

declare(strict_types=1);

namespace App\Infrastructure\Providers;

use App\Domain\Identity\Repositories\DeviceRepositoryInterface;
use App\Domain\Identity\Repositories\PasswordResetRepositoryInterface;
use App\Domain\Identity\Repositories\SessionRepositoryInterface;
use App\Domain\Identity\Repositories\TwoFactorRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentDeviceRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentPasswordResetRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentSessionRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentTwoFactorRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * All repository interface to implementation bindings.
     */
    public array $bindings = [
        // Identity Context
        UserRepositoryInterface::class => EloquentUserRepository::class,
        SessionRepositoryInterface::class => EloquentSessionRepository::class,
        TwoFactorRepositoryInterface::class => EloquentTwoFactorRepository::class,
        PasswordResetRepositoryInterface::class => EloquentPasswordResetRepository::class,
        DeviceRepositoryInterface::class => EloquentDeviceRepository::class,
    ];

    /**
     * Register services.
     */
    public function register(): void
    {
        foreach ($this->bindings as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
