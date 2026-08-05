<?php

declare(strict_types=1);

namespace App\Application\Wallet\Services;

use App\Domain\Wallet\ValueObjects\Money;

class FeeService
{
    /**
     * Calculate deposit fee.
     */
    public function calculateDepositFee(Money $amount): Money
    {
        $config = config('flyerx.fees.deposit', [
            'type' => 'fixed',
            'fixed' => 0,
            'percentage' => 0,
        ]);

        return $this->calculateFee($amount, $config);
    }

    /**
     * Calculate withdrawal fee.
     */
    public function calculateWithdrawalFee(Money $amount, int $kycLevel = 0): Money
    {
        $config = config('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [
                ['from' => 0, 'to' => 100, 'fixed' => 1.50, 'percentage' => 0],
                ['from' => 100, 'to' => 1000, 'fixed' => 0, 'percentage' => 1.5],
                ['from' => 1000, 'to' => null, 'fixed' => 0, 'percentage' => 1.0],
            ],
        ]);

        // Apply KYC discounts
        $discount = $this->getKycDiscount($kycLevel);
        $fee = $this->calculateFee($amount, $config);

        if ($discount > 0) {
            $discountAmount = $fee->percentage($discount);
            $fee = $fee->subtract($discountAmount);
        }

        return $fee;
    }

    /**
     * Calculate fee based on configuration.
     */
    private function calculateFee(Money $amount, array $config): Money
    {
        $type = $config['type'] ?? 'fixed';

        return match ($type) {
            'fixed' => $this->calculateFixedFee($config),
            'percentage' => $this->calculatePercentageFee($amount, $config),
            'combined' => $this->calculateCombinedFee($amount, $config),
            'tiered' => $this->calculateTieredFee($amount, $config),
            default => Money::zero(),
        };
    }

    private function calculateFixedFee(array $config): Money
    {
        $fixed = (float) ($config['fixed'] ?? 0);

        return Money::fromDecimal($fixed);
    }

    private function calculatePercentageFee(Money $amount, array $config): Money
    {
        $percentage = (float) ($config['percentage'] ?? 0);

        $fee = $amount->percentage($percentage);

        // Apply min/max limits
        return $this->applyLimits($fee, $config);
    }

    private function calculateCombinedFee(Money $amount, array $config): Money
    {
        $fixed = Money::fromDecimal((float) ($config['fixed'] ?? 0));
        $percentageFee = $amount->percentage((float) ($config['percentage'] ?? 0));

        $fee = $fixed->add($percentageFee);

        return $this->applyLimits($fee, $config);
    }

    private function calculateTieredFee(Money $amount, array $config): Money
    {
        $tiers = $config['tiers'] ?? [];
        $amountDecimal = $amount->getDecimal();

        foreach ($tiers as $tier) {
            $from = $tier['from'] ?? 0;
            $to = $tier['to'] ?? PHP_FLOAT_MAX;

            if ($amountDecimal >= $from && ($to === null || $amountDecimal < $to)) {
                $tierConfig = [
                    'type' => 'combined',
                    'fixed' => $tier['fixed'] ?? 0,
                    'percentage' => $tier['percentage'] ?? 0,
                    'min' => $tier['min'] ?? null,
                    'max' => $tier['max'] ?? null,
                ];

                return $this->calculateCombinedFee($amount, $tierConfig);
            }
        }

        return Money::zero();
    }

    private function applyLimits(Money $fee, array $config): Money
    {
        $min = isset($config['min']) ? Money::fromDecimal((float) $config['min']) : null;
        $max = isset($config['max']) ? Money::fromDecimal((float) $config['max']) : null;

        if ($min !== null && $fee->lessThan($min)) {
            return $min;
        }

        if ($max !== null && $fee->greaterThan($max)) {
            return $max;
        }

        return $fee;
    }

    private function getKycDiscount(int $kycLevel): float
    {
        $discounts = config('flyerx.fees.kyc_discounts', [
            0 => 0,
            1 => 10,
            2 => 20,
            3 => 30,
        ]);

        return (float) ($discounts[$kycLevel] ?? 0);
    }
}
