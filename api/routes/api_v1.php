<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\TwoFactorController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\DepositController;
use App\Http\Controllers\Api\V1\WithdrawalController;
use App\Http\Controllers\Api\V1\WalletController;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
*/

// ===========================================
// Public Routes (No Authentication)
// ===========================================

Route::prefix('auth')->group(function () {
    // Registration
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1')
        ->name('auth.register');

    // Login
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:auth')
        ->name('auth.login');

    // 2FA Verification (during login)
    Route::post('/2fa/verify', [TwoFactorController::class, 'verify'])
        ->middleware('throttle:auth')
        ->name('auth.2fa.verify');

    // Refresh Token
    Route::post('/refresh', [AuthController::class, 'refresh'])
        ->middleware('throttle:10,1')
        ->name('auth.refresh');

    // Password Reset
    Route::post('/password/forgot', [PasswordResetController::class, 'requestReset'])
        ->middleware('throttle:3,60')
        ->name('password.forgot');

    Route::post('/password/validate-token', [PasswordResetController::class, 'validateToken'])
        ->middleware('throttle:10,1')
        ->name('password.validate-token');

    Route::post('/password/reset', [PasswordResetController::class, 'resetPassword'])
        ->middleware('throttle:3,60')
        ->name('password.reset');
});

// Email Verification
Route::get('/email/verify/{id}/{token}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

// ===========================================
// Authenticated Routes
// ===========================================

Route::middleware(['auth'])->group(function () {

    // ------------------------------------------
    // Authentication Management
    // ------------------------------------------

    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])
            ->name('auth.me');

        Route::post('/logout', [AuthController::class, 'logout'])
            ->name('auth.logout');

        Route::post('/logout-all', [AuthController::class, 'logoutAll'])
            ->name('auth.logout-all');

        Route::post('/email/resend', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:3,60')
            ->name('auth.email.resend');
    });

    // ------------------------------------------
    // Two-Factor Authentication
    // ------------------------------------------

    Route::prefix('2fa')->group(function () {
        Route::get('/status', [TwoFactorController::class, 'status'])
            ->name('2fa.status');

        Route::post('/setup', [TwoFactorController::class, 'setup'])
            ->name('2fa.setup');

        Route::post('/confirm', [TwoFactorController::class, 'confirm'])
            ->name('2fa.confirm');

        Route::post('/disable', [TwoFactorController::class, 'disable'])
            ->name('2fa.disable');

        Route::post('/backup-codes/regenerate', [TwoFactorController::class, 'regenerateBackupCodes'])
            ->name('2fa.backup-codes.regenerate');
    });

    // ------------------------------------------
    // Wallet Management
    // ------------------------------------------

    Route::prefix('wallet')->group(function () {
        Route::get('/', [WalletController::class, 'show'])
            ->name('wallet.show');

        Route::get('/balance', [WalletController::class, 'balance'])
            ->name('wallet.balance');

        Route::get('/history', [WalletController::class, 'history'])
            ->name('wallet.history');
    });

    // ------------------------------------------
    // Deposits (PIX)
    // ------------------------------------------

    Route::prefix('deposits')->group(function () {
        Route::post('/', [DepositController::class, 'store'])
            ->middleware('throttle:10,1')
            ->name('deposits.store');

        Route::get('/pending', [DepositController::class, 'pending'])
            ->name('deposits.pending');

        Route::get('/{depositId}', [DepositController::class, 'show'])
            ->name('deposits.show');

        Route::post('/{depositId}/cancel', [DepositController::class, 'cancel'])
            ->name('deposits.cancel');
    });

    // ------------------------------------------
    // Withdrawals (PIX)
    // ------------------------------------------

    Route::prefix('withdrawals')->group(function () {
        Route::post('/', [WithdrawalController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('withdrawals.store');

        Route::get('/pending', [WithdrawalController::class, 'pending'])
            ->name('withdrawals.pending');

        Route::post('/estimate-fee', [WithdrawalController::class, 'estimateFee'])
            ->name('withdrawals.estimate-fee');

        Route::get('/{withdrawalId}', [WithdrawalController::class, 'show'])
            ->name('withdrawals.show');

        Route::post('/{withdrawalId}/cancel', [WithdrawalController::class, 'cancel'])
            ->name('withdrawals.cancel');
    });

});
