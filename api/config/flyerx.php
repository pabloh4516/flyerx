<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Settings
    |--------------------------------------------------------------------------
    */

    'currency' => 'BRL',
    'currency_decimal_places' => 2,

    /*
    |--------------------------------------------------------------------------
    | Operational Limits (in cents)
    |--------------------------------------------------------------------------
    */

    'limits' => [
        'deposit' => [
            'min' => (int) env('DEPOSIT_MIN_AMOUNT', 100),        // R$ 1,00
            'max' => (int) env('DEPOSIT_MAX_AMOUNT', 10000000),   // R$ 100.000,00
        ],
        'withdrawal' => [
            'min' => (int) env('WITHDRAWAL_MIN_AMOUNT', 500),     // R$ 5,00
            'max' => (int) env('WITHDRAWAL_MAX_AMOUNT', 5000000), // R$ 50.000,00
            'approval_threshold' => (int) env('WITHDRAWAL_APPROVAL_THRESHOLD', 100000), // R$ 1.000,00
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | KYC Levels and Limits (in cents)
    |--------------------------------------------------------------------------
    */

    'kyc' => [
        'levels' => [
            0 => [
                'name' => 'Não verificado',
                'daily_deposit_limit' => 50000,      // R$ 500
                'daily_withdrawal_limit' => 0,       // Não pode sacar
                'monthly_deposit_limit' => 200000,   // R$ 2.000
                'monthly_withdrawal_limit' => 0,
            ],
            1 => [
                'name' => 'Básico',
                'daily_deposit_limit' => 500000,     // R$ 5.000
                'daily_withdrawal_limit' => 200000,  // R$ 2.000
                'monthly_deposit_limit' => 5000000,  // R$ 50.000
                'monthly_withdrawal_limit' => 2000000, // R$ 20.000
            ],
            2 => [
                'name' => 'Intermediário',
                'daily_deposit_limit' => 5000000,    // R$ 50.000
                'daily_withdrawal_limit' => 2000000, // R$ 20.000
                'monthly_deposit_limit' => 50000000, // R$ 500.000
                'monthly_withdrawal_limit' => 20000000, // R$ 200.000
            ],
            3 => [
                'name' => 'Completo',
                'daily_deposit_limit' => 50000000,   // R$ 500.000
                'daily_withdrawal_limit' => 20000000, // R$ 200.000
                'monthly_deposit_limit' => 500000000, // R$ 5.000.000
                'monthly_withdrawal_limit' => 200000000, // R$ 2.000.000
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */

    'security' => [
        'max_login_attempts' => (int) env('MAX_LOGIN_ATTEMPTS', 5),
        'lockout_duration' => (int) env('LOCKOUT_DURATION', 300), // seconds
        'password_min_length' => 8,
        'require_strong_password' => true,
        'session_lifetime' => 120, // minutes
        'refresh_token_lifetime' => 10080, // minutes (7 days)
        'access_token_lifetime' => 15, // minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */

    'rate_limits' => [
        'api' => [
            'per_minute' => (int) env('RATE_LIMIT_API', 100),
        ],
        'auth' => [
            'per_minute' => (int) env('RATE_LIMIT_AUTH', 5),
        ],
        'deposit' => [
            'per_minute' => 5,
            'per_hour' => 20,
            'per_day' => 50,
        ],
        'withdrawal' => [
            'per_minute' => 3,
            'per_hour' => 10,
            'per_day' => 20,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    */

    'features' => [
        'kyc_required' => env('FEATURE_KYC_REQUIRED', true),
        '2fa_required' => env('FEATURE_2FA_REQUIRED', false),
        'device_tracking' => env('FEATURE_DEVICE_TRACKING', true),
        'email_verification' => env('FEATURE_EMAIL_VERIFICATION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Deposit Settings
    |--------------------------------------------------------------------------
    */

    'deposits' => [
        'min_amount' => env('FLYERX_DEPOSIT_MIN', 10.00),
        'max_amount' => env('FLYERX_DEPOSIT_MAX', 50000.00),
        'expiration_minutes' => env('FLYERX_DEPOSIT_EXPIRATION', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Withdrawal Settings
    |--------------------------------------------------------------------------
    */

    'withdrawals' => [
        'min_amount' => env('FLYERX_WITHDRAWAL_MIN', 10.00),
        'max_amount' => env('FLYERX_WITHDRAWAL_MAX', 10000.00),
        'auto_approve_limit' => env('FLYERX_WITHDRAWAL_AUTO_APPROVE', 1000.00),
    ],

    /*
    |--------------------------------------------------------------------------
    | Fee Configuration
    |--------------------------------------------------------------------------
    */

    'fees' => [
        'deposit' => [
            'type' => 'fixed', // fixed, percentage, combined, tiered
            'fixed' => 0,
            'percentage' => 0,
        ],

        'withdrawal' => [
            'type' => 'tiered',
            'tiers' => [
                ['from' => 0, 'to' => 100, 'fixed' => 1.50, 'percentage' => 0],
                ['from' => 100, 'to' => 1000, 'fixed' => 0, 'percentage' => 1.5],
                ['from' => 1000, 'to' => null, 'fixed' => 0, 'percentage' => 1.0],
            ],
        ],

        // KYC level discounts on fees (percentage reduction)
        'kyc_discounts' => [
            0 => 0,    // No KYC: no discount
            1 => 10,   // Basic KYC: 10% discount
            2 => 20,   // Intermediate KYC: 20% discount
            3 => 30,   // Full KYC: 30% discount
        ],
    ],

];
