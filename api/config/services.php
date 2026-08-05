<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as payment gateways, notification services, and more.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Eulen Payment Provider
    |--------------------------------------------------------------------------
    */

    'eulen' => [
        'base_url' => env('EULEN_BASE_URL', 'https://depix.eulen.app/api'),
        'api_token' => env('EULEN_API_TOKEN'),
        'timeout' => (int) env('EULEN_TIMEOUT', 30),

        // Webhook signature validation
        'webhook_secret' => env('EULEN_WEBHOOK_SECRET'),
        'webhook_signature_validation' => env('EULEN_WEBHOOK_SIGNATURE_VALIDATION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | LWK Microservice (Liquid Wallet Kit)
    |--------------------------------------------------------------------------
    |
    | Configurações para comunicação com o microserviço Python que
    | gerencia a carteira Liquid via LWK.
    |
    */

    'lwk' => [
        'url' => env('LWK_MICROSERVICE_URL', 'http://localhost:8000'),
        'api_key' => env('LWK_MICROSERVICE_API_KEY'),
        'timeout' => (int) env('LWK_MICROSERVICE_TIMEOUT', 30),
    ],

];
