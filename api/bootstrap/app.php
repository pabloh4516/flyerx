<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        \App\Providers\AppServiceProvider::class,
        \App\Providers\AuditServiceProvider::class,
        \App\Providers\EventServiceProvider::class,
        \App\Infrastructure\Providers\RepositoryServiceProvider::class,
        \App\Providers\WalletServiceProvider::class,
        \App\Application\Lwk\LwkServiceProvider::class,
    ])
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API middleware
        $middleware->statefulApi();

        // Aliases
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'kyc.approved' => \App\Http\Middleware\EnsureKycApproved::class,
            'wallet.active' => \App\Http\Middleware\EnsureWalletActive::class,
            '2fa.verified' => \App\Http\Middleware\EnsureTwoFactorVerified::class,
            'webhook.signature' => \App\Http\Middleware\ValidateWebhookSignature::class,
            'gateway.key' => \App\Http\Middleware\ValidateGatewayKey::class,
        ]);

        // Global middleware (ordem importa!)
        $middleware->append([
            \Illuminate\Http\Middleware\HandleCors::class,      // CORS primeiro
            \App\Http\Middleware\ValidateGatewayKey::class,     // Gateway key
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\LogRequestResponse::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson()) {
                return app(\App\Http\Responses\ApiErrorResponse::class)->fromException($e);
            }
        });
    })->create();
