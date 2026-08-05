<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]));

// API v1
Route::prefix('v1')->group(base_path('routes/api_v1.php'));

// Webhooks (separate prefix, no auth)
Route::prefix('webhooks')->group(base_path('routes/webhooks.php'));
