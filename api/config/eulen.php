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
    | Split Settings (Taxa do Parceiro)
    |--------------------------------------------------------------------------
    | Configuração da taxa Flyerx cobrada nos depósitos via split da Eulen.
    | A carteira de split pode ser configurada via env ou admin panel.
    */

    'split' => [
        // Endereço Liquid da carteira Flyerx para receber taxa de depósito
        // Pode ser sobrescrito pelo admin panel
        'deposit_address' => env('FLYERX_SPLIT_ADDRESS'),

        // Taxa de depósito (porcentagem) - ex: "2" para 2%
        // Pode ser sobrescrito pelo admin panel
        'deposit_fee_percent' => env('FLYERX_DEPOSIT_FEE_PERCENT', '2'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Withdrawal Settings (Saque)
    |--------------------------------------------------------------------------
    | Taxa de saque é descontada do valor antes de enviar para Eulen.
    | A Eulen não suporta split em saques, então cobramos antes.
    */

    'withdrawal' => [
        // Taxa de saque (porcentagem) - ex: "1.5" para 1.5%
        'fee_percent' => env('FLYERX_WITHDRAWAL_FEE_PERCENT', '1.5'),

        // Taxa mínima de saque em centavos (R$ 0,50 = 50)
        'fee_min_cents' => (int) env('FLYERX_WITHDRAWAL_FEE_MIN_CENTS', 50),
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
