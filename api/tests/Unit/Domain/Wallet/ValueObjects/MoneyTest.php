<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Wallet\ValueObjects;

use App\Domain\Wallet\ValueObjects\Money;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    #[Test]
    public function it_creates_from_decimal(): void
    {
        $money = Money::fromDecimal(100.50);

        $this->assertEquals(10050, $money->getCents());
        $this->assertEquals(100.50, $money->getDecimal());
        $this->assertEquals('BRL', $money->getCurrency());
    }

    #[Test]
    public function it_creates_from_cents(): void
    {
        $money = Money::fromCents(10050);

        $this->assertEquals(10050, $money->getCents());
        $this->assertEquals(100.50, $money->getDecimal());
    }

    #[Test]
    public function it_creates_zero(): void
    {
        $money = Money::zero();

        $this->assertEquals(0, $money->getCents());
        $this->assertTrue($money->isZero());
        $this->assertFalse($money->isPositive());
    }

    #[Test]
    public function it_throws_on_negative_decimal(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Amount cannot be negative');

        Money::fromDecimal(-100);
    }

    #[Test]
    public function it_throws_on_negative_cents(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Amount cannot be negative');

        Money::fromCents(-100);
    }

    #[Test]
    public function it_adds_money(): void
    {
        $money1 = Money::fromDecimal(100.00);
        $money2 = Money::fromDecimal(50.50);

        $result = $money1->add($money2);

        $this->assertEquals(150.50, $result->getDecimal());
        // Original should be unchanged (immutability)
        $this->assertEquals(100.00, $money1->getDecimal());
    }

    #[Test]
    public function it_subtracts_money(): void
    {
        $money1 = Money::fromDecimal(100.00);
        $money2 = Money::fromDecimal(30.50);

        $result = $money1->subtract($money2);

        $this->assertEquals(69.50, $result->getDecimal());
    }

    #[Test]
    public function it_throws_on_negative_subtraction_result(): void
    {
        $money1 = Money::fromDecimal(50.00);
        $money2 = Money::fromDecimal(100.00);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Result cannot be negative');

        $money1->subtract($money2);
    }

    #[Test]
    public function it_multiplies_by_factor(): void
    {
        $money = Money::fromDecimal(100.00);

        $result = $money->multiply(1.5);

        $this->assertEquals(150.00, $result->getDecimal());
    }

    #[Test]
    public function it_calculates_percentage(): void
    {
        $money = Money::fromDecimal(200.00);

        $result = $money->percentage(10); // 10%

        $this->assertEquals(20.00, $result->getDecimal());
    }

    #[Test]
    public function it_compares_greater_than(): void
    {
        $money1 = Money::fromDecimal(100.00);
        $money2 = Money::fromDecimal(50.00);

        $this->assertTrue($money1->greaterThan($money2));
        $this->assertFalse($money2->greaterThan($money1));
    }

    #[Test]
    public function it_compares_less_than(): void
    {
        $money1 = Money::fromDecimal(50.00);
        $money2 = Money::fromDecimal(100.00);

        $this->assertTrue($money1->lessThan($money2));
        $this->assertFalse($money2->lessThan($money1));
    }

    #[Test]
    public function it_compares_equality(): void
    {
        $money1 = Money::fromDecimal(100.00);
        $money2 = Money::fromDecimal(100.00);
        $money3 = Money::fromDecimal(100.00, 'USD');

        $this->assertTrue($money1->equals($money2));
        $this->assertFalse($money1->equals($money3));
    }

    #[Test]
    public function it_throws_on_different_currencies_operation(): void
    {
        $brl = Money::fromDecimal(100.00, 'BRL');
        $usd = Money::fromDecimal(100.00, 'USD');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot operate on different currencies');

        $brl->add($usd);
    }

    #[Test]
    public function it_formats_brl_currency(): void
    {
        $money = Money::fromDecimal(1234.56);

        $formatted = $money->format();

        $this->assertEquals('R$ 1.234,56', $formatted);
    }

    #[Test]
    public function it_formats_usd_currency(): void
    {
        $money = Money::fromDecimal(1234.56, 'USD');

        $formatted = $money->format();

        $this->assertEquals('$ 1.234,56', $formatted);
    }

    #[Test]
    public function it_returns_decimal_string_with_precision(): void
    {
        $money = Money::fromDecimal(100.50);

        $this->assertEquals('100.50', $money->getDecimalString());
    }

    #[Test]
    public function it_handles_rounding_correctly(): void
    {
        // Test that 33.33% of 100 rounds properly
        $money = Money::fromDecimal(100.00);
        $result = $money->percentage(33.33);

        $this->assertEquals(33.33, $result->getDecimal());
    }

    #[Test]
    public function it_converts_to_string(): void
    {
        $money = Money::fromDecimal(100.50);

        $this->assertEquals('R$ 100,50', (string) $money);
    }

    #[Test]
    #[DataProvider('comparisonDataProvider')]
    public function it_compares_correctly(float $amount1, float $amount2, bool $gt, bool $gte, bool $lt, bool $lte): void
    {
        $money1 = Money::fromDecimal($amount1);
        $money2 = Money::fromDecimal($amount2);

        $this->assertEquals($gt, $money1->greaterThan($money2));
        $this->assertEquals($gte, $money1->greaterThanOrEqual($money2));
        $this->assertEquals($lt, $money1->lessThan($money2));
        $this->assertEquals($lte, $money1->lessThanOrEqual($money2));
    }

    public static function comparisonDataProvider(): array
    {
        return [
            'greater' => [100.00, 50.00, true, true, false, false],
            'lesser' => [50.00, 100.00, false, false, true, true],
            'equal' => [100.00, 100.00, false, true, false, true],
        ];
    }
}
