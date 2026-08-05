<?php

declare(strict_types=1);

namespace App\Infrastructure\Payment;

use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Infrastructure\Payment\Providers\EulenProvider;
use InvalidArgumentException;

class PaymentProviderFactory
{
    /**
     * Create a payment provider instance.
     */
    public static function create(?string $provider = null): PaymentProviderInterface
    {
        $provider = $provider ?? config('flyerx.payment.default_provider', 'eulen');

        return match ($provider) {
            'eulen' => new EulenProvider(),
            default => throw new InvalidArgumentException("Unknown payment provider: {$provider}"),
        };
    }

    /**
     * Get the default provider.
     */
    public static function default(): PaymentProviderInterface
    {
        return self::create();
    }
}
