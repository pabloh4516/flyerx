<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\WebhookController;

/*
|--------------------------------------------------------------------------
| Webhook Routes
|--------------------------------------------------------------------------
| These routes handle incoming webhooks from payment providers.
| They do not require authentication but validate signatures.
*/

Route::prefix('eulen')->group(function () {

    // Main webhook endpoint
    // The webhook.signature:eulen middleware validates Basic Auth (secret as username)
    Route::post('/', [WebhookController::class, 'eulen'])
        ->middleware([
            'throttle:100,1',
            'webhook.signature:eulen',
        ])
        ->name('webhooks.eulen');

});
