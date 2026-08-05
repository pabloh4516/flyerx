<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Wallet\Services;

use App\Application\Wallet\Services\FeeService;
use App\Domain\Wallet\ValueObjects\Money;
use Illuminate\Support\Facades\Config;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FeeServiceTest extends TestCase
{
    private FeeService $feeService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->feeService = new FeeService();
    }

    #[Test]
    public function it_calculates_zero_deposit_fee_by_default(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'fixed',
            'fixed' => 0,
            'percentage' => 0,
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateDepositFee($amount);

        $this->assertEquals(0, $fee->getCents());
    }

    #[Test]
    public function it_calculates_fixed_deposit_fee(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'fixed',
            'fixed' => 2.50,
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateDepositFee($amount);

        $this->assertEquals(2.50, $fee->getDecimal());
    }

    #[Test]
    public function it_calculates_percentage_deposit_fee(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'percentage',
            'percentage' => 2.5, // 2.5%
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateDepositFee($amount);

        $this->assertEquals(2.50, $fee->getDecimal());
    }

    #[Test]
    public function it_calculates_combined_deposit_fee(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'combined',
            'fixed' => 1.00,
            'percentage' => 1.0, // 1%
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateDepositFee($amount);

        // 1.00 fixed + 1.00 (1% of 100) = 2.00
        $this->assertEquals(2.00, $fee->getDecimal());
    }

    #[Test]
    public function it_applies_min_fee_limit(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'percentage',
            'percentage' => 0.5, // 0.5%
            'min' => 2.00,
        ]);

        $amount = Money::fromDecimal(100.00); // 0.5% = 0.50
        $fee = $this->feeService->calculateDepositFee($amount);

        // Should use min of 2.00
        $this->assertEquals(2.00, $fee->getDecimal());
    }

    #[Test]
    public function it_applies_max_fee_limit(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'percentage',
            'percentage' => 10, // 10%
            'max' => 50.00,
        ]);

        $amount = Money::fromDecimal(1000.00); // 10% = 100
        $fee = $this->feeService->calculateDepositFee($amount);

        // Should be capped at 50.00
        $this->assertEquals(50.00, $fee->getDecimal());
    }

    #[Test]
    public function it_calculates_tiered_withdrawal_fee_for_small_amount(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [
                ['from' => 0, 'to' => 100, 'fixed' => 1.50, 'percentage' => 0],
                ['from' => 100, 'to' => 1000, 'fixed' => 0, 'percentage' => 1.5],
                ['from' => 1000, 'to' => null, 'fixed' => 0, 'percentage' => 1.0],
            ],
        ]);

        $amount = Money::fromDecimal(50.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount);

        // Should use first tier: fixed 1.50
        $this->assertEquals(1.50, $fee->getDecimal());
    }

    #[Test]
    public function it_calculates_tiered_withdrawal_fee_for_medium_amount(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [
                ['from' => 0, 'to' => 100, 'fixed' => 1.50, 'percentage' => 0],
                ['from' => 100, 'to' => 1000, 'fixed' => 0, 'percentage' => 1.5],
                ['from' => 1000, 'to' => null, 'fixed' => 0, 'percentage' => 1.0],
            ],
        ]);

        $amount = Money::fromDecimal(500.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount);

        // Should use second tier: 1.5% of 500 = 7.50
        $this->assertEquals(7.50, $fee->getDecimal());
    }

    #[Test]
    public function it_calculates_tiered_withdrawal_fee_for_large_amount(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [
                ['from' => 0, 'to' => 100, 'fixed' => 1.50, 'percentage' => 0],
                ['from' => 100, 'to' => 1000, 'fixed' => 0, 'percentage' => 1.5],
                ['from' => 1000, 'to' => null, 'fixed' => 0, 'percentage' => 1.0],
            ],
        ]);

        $amount = Money::fromDecimal(5000.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount);

        // Should use third tier: 1% of 5000 = 50.00
        $this->assertEquals(50.00, $fee->getDecimal());
    }

    #[Test]
    #[DataProvider('kycDiscountProvider')]
    public function it_applies_kyc_discount(int $kycLevel, float $expectedDiscount): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'fixed',
            'fixed' => 10.00,
        ]);

        Config::set('flyerx.fees.kyc_discounts', [
            0 => 0,
            1 => 10,
            2 => 20,
            3 => 30,
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount, $kycLevel);

        // 10.00 - discount
        $expectedFee = 10.00 * (1 - $expectedDiscount / 100);
        $this->assertEquals($expectedFee, $fee->getDecimal());
    }

    public static function kycDiscountProvider(): array
    {
        return [
            'kyc_level_0' => [0, 0],    // No discount
            'kyc_level_1' => [1, 10],   // 10% discount
            'kyc_level_2' => [2, 20],   // 20% discount
            'kyc_level_3' => [3, 30],   // 30% discount
        ];
    }

    #[Test]
    public function it_returns_zero_for_unknown_fee_type(): void
    {
        Config::set('flyerx.fees.deposit', [
            'type' => 'unknown_type',
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateDepositFee($amount);

        $this->assertEquals(0, $fee->getCents());
    }

    #[Test]
    public function it_returns_zero_when_no_matching_tier(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [], // Empty tiers
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount);

        $this->assertEquals(0, $fee->getCents());
    }

    #[Test]
    public function it_handles_tiered_fee_with_min_max(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'tiered',
            'tiers' => [
                [
                    'from' => 0,
                    'to' => null,
                    'fixed' => 0,
                    'percentage' => 1.0,
                    'min' => 5.00,
                    'max' => 100.00,
                ],
            ],
        ]);

        // Test min
        $smallAmount = Money::fromDecimal(100.00); // 1% = 1.00
        $smallFee = $this->feeService->calculateWithdrawalFee($smallAmount);
        $this->assertEquals(5.00, $smallFee->getDecimal()); // Should use min

        // Test max
        $largeAmount = Money::fromDecimal(50000.00); // 1% = 500.00
        $largeFee = $this->feeService->calculateWithdrawalFee($largeAmount);
        $this->assertEquals(100.00, $largeFee->getDecimal()); // Should use max
    }

    #[Test]
    public function it_handles_invalid_kyc_level(): void
    {
        Config::set('flyerx.fees.withdrawal', [
            'type' => 'fixed',
            'fixed' => 10.00,
        ]);

        Config::set('flyerx.fees.kyc_discounts', [
            0 => 0,
            1 => 10,
        ]);

        $amount = Money::fromDecimal(100.00);
        $fee = $this->feeService->calculateWithdrawalFee($amount, 999); // Invalid level

        // Should not apply discount for unknown level
        $this->assertEquals(10.00, $fee->getDecimal());
    }
}
