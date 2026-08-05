<?php

declare(strict_types=1);

namespace App\Domain\Wallet\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use InvalidArgumentException;

final class Money implements ValueObjectInterface
{
    private const DEFAULT_CURRENCY = 'BRL';
    private const SCALE = 2;

    private function __construct(
        private readonly int $amount, // Amount in cents
        private readonly string $currency = self::DEFAULT_CURRENCY
    ) {}

    /**
     * Create from decimal amount (e.g., 100.50)
     */
    public static function fromDecimal(float|string $amount, string $currency = self::DEFAULT_CURRENCY): self
    {
        $amount = (float) $amount;

        if ($amount < 0) {
            throw new InvalidArgumentException('Amount cannot be negative');
        }

        $cents = (int) round($amount * (10 ** self::SCALE));

        return new self($cents, strtoupper($currency));
    }

    /**
     * Create from cents (e.g., 10050 for R$ 100.50)
     */
    public static function fromCents(int $cents, string $currency = self::DEFAULT_CURRENCY): self
    {
        if ($cents < 0) {
            throw new InvalidArgumentException('Amount cannot be negative');
        }

        return new self($cents, strtoupper($currency));
    }

    /**
     * Create zero amount.
     */
    public static function zero(string $currency = self::DEFAULT_CURRENCY): self
    {
        return new self(0, strtoupper($currency));
    }

    /**
     * Get amount in cents.
     */
    public function getCents(): int
    {
        return $this->amount;
    }

    /**
     * Get amount as decimal.
     */
    public function getDecimal(): float
    {
        return $this->amount / (10 ** self::SCALE);
    }

    /**
     * Get amount as string with proper precision.
     */
    public function getDecimalString(): string
    {
        return number_format($this->getDecimal(), self::SCALE, '.', '');
    }

    /**
     * Get currency code.
     */
    public function getCurrency(): string
    {
        return $this->currency;
    }

    /**
     * Add another money amount.
     */
    public function add(self $other): self
    {
        $this->assertSameCurrency($other);

        return new self($this->amount + $other->amount, $this->currency);
    }

    /**
     * Subtract another money amount.
     */
    public function subtract(self $other): self
    {
        $this->assertSameCurrency($other);

        $result = $this->amount - $other->amount;

        if ($result < 0) {
            throw new InvalidArgumentException('Result cannot be negative');
        }

        return new self($result, $this->currency);
    }

    /**
     * Multiply by a factor.
     */
    public function multiply(float $factor): self
    {
        if ($factor < 0) {
            throw new InvalidArgumentException('Factor cannot be negative');
        }

        $result = (int) round($this->amount * $factor);

        return new self($result, $this->currency);
    }

    /**
     * Calculate percentage.
     */
    public function percentage(float $percent): self
    {
        return $this->multiply($percent / 100);
    }

    /**
     * Check if amount is zero.
     */
    public function isZero(): bool
    {
        return $this->amount === 0;
    }

    /**
     * Check if amount is positive.
     */
    public function isPositive(): bool
    {
        return $this->amount > 0;
    }

    /**
     * Check if greater than another amount.
     */
    public function greaterThan(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->amount > $other->amount;
    }

    /**
     * Check if greater than or equal to another amount.
     */
    public function greaterThanOrEqual(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->amount >= $other->amount;
    }

    /**
     * Check if less than another amount.
     */
    public function lessThan(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->amount < $other->amount;
    }

    /**
     * Check if less than or equal to another amount.
     */
    public function lessThanOrEqual(self $other): bool
    {
        $this->assertSameCurrency($other);

        return $this->amount <= $other->amount;
    }

    /**
     * Format for display.
     */
    public function format(): string
    {
        $symbol = match ($this->currency) {
            'BRL' => 'R$',
            'USD' => '$',
            'EUR' => '€',
            default => $this->currency . ' ',
        };

        return $symbol . ' ' . number_format($this->getDecimal(), 2, ',', '.');
    }

    /**
     * Alias for format().
     */
    public function getFormatted(): string
    {
        return $this->format();
    }

    public function toString(): string
    {
        return $this->getDecimalString();
    }

    public function equals(ValueObjectInterface $other): bool
    {
        if (!$other instanceof self) {
            return false;
        }

        return $this->amount === $other->amount && $this->currency === $other->currency;
    }

    private function assertSameCurrency(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Cannot operate on different currencies: {$this->currency} vs {$other->currency}"
            );
        }
    }

    public function __toString(): string
    {
        return $this->format();
    }
}
