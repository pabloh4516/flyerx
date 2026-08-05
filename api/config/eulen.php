<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Eulen Payment Provider Configuration
    |--------------------------------------------------------------------------
    */

    'enabled' => env('EULEN_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | API Settings
    |--------------------------------------------------------------------------
    */

    'base_url' => env('EULEN_BASE_URL', 'https://depix.eulen.app/api'),
    'api_token' => env('EULEN_API_TOKEN'),
    'timeout' => (int) env('EULEN_TIMEOUT', 30),

    /*
    |--------------------------------------------------------------------------
    | Webhook Settings
    |--------------------------------------------------------------------------
    */

    'webhook' => [
        'secret' => env('EULEN_WEBHOOK_SECRET'),
        'signature_header' => env('EULEN_WEBHOOK_SIG_HEADER', 'X-Signature'),
        'signature_algo' => env('EULEN_WEBHOOK_SIG_ALGO', 'sha256'),
        'validate_signature' => env('FEATURE_EULEN_WEBHOOK_VALIDATION', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retry Policy
    |--------------------------------------------------------------------------
    */

    'retry' => [
        'attempts' => (int) env('EULEN_RETRY_ATTEMPTS', 3),
        'delay_ms' => 100,
        'multiplier' => 2.0,
        'max_delay_ms' => 5000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Circuit Breaker
    |--------------------------------------------------------------------------
    */

    'circuit_breaker' => [
        'threshold' => (int) env('EULEN_CB_THRESHOLD', 5),
        'recovery_time' => (int) env('EULEN_CB_RECOVERY_TIME', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | QR Code Settings
    |--------------------------------------------------------------------------
    */

    'qr_code' => [
        'ttl_minutes' => (int) env('EULEN_QR_TTL', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Status Mapping
    |--------------------------------------------------------------------------
    | Maps Eulen statuses to internal statuses
    */

    'deposit_status_map' => [
        'pending' => 'pending',
        'under_review' => 'processing',
        'approved' => 'processing',
        'depix_sent' => 'confirmed',
        'delayed' => 'processing',
        'refunded' => 'refunded',
        'canceled' => 'cancelled',
        'expired' => 'expired',
        'error' => 'failed',
    ],

    'withdrawal_status_map' => [
        'unsent' => 'pending',
        'sending' => 'processing',
        'sent' => 'confirmed',
        'refunded' => 'refunded',
        'cancelled' => 'cancelled',
        'error' => 'failed',
        'expired' => 'expired',
    ],

];
