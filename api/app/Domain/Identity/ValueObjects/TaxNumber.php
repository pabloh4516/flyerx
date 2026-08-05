<?php

declare(strict_types=1);

namespace App\Domain\Identity\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use App\Domain\Identity\Exceptions\InvalidTaxNumberException;

final class TaxNumber implements ValueObjectInterface
{
    private const TYPE_CPF = 'CPF';
    private const TYPE_CNPJ = 'CNPJ';

    private function __construct(
        private readonly string $value,
        private readonly string $type
    ) {}

    public static function fromString(string $taxNumber): self
    {
        // Remove non-numeric characters
        $cleaned = preg_replace('/\D/', '', $taxNumber);

        if (strlen($cleaned) === 11) {
            if (!self::isValidCpf($cleaned)) {
                throw new InvalidTaxNumberException("Invalid CPF: {$taxNumber}");
            }
            return new self($cleaned, self::TYPE_CPF);
        }

        if (strlen($cleaned) === 14) {
            if (!self::isValidCnpj($cleaned)) {
                throw new InvalidTaxNumberException("Invalid CNPJ: {$taxNumber}");
            }
            return new self($cleaned, self::TYPE_CNPJ);
        }

        throw new InvalidTaxNumberException("Tax number must be CPF (11 digits) or CNPJ (14 digits): {$taxNumber}");
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function isCpf(): bool
    {
        return $this->type === self::TYPE_CPF;
    }

    public function isCnpj(): bool
    {
        return $this->type === self::TYPE_CNPJ;
    }

    public function getFormatted(): string
    {
        if ($this->isCpf()) {
            return preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $this->value);
        }

        return preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $this->value);
    }

    public function getMasked(): string
    {
        if ($this->isCpf()) {
            return substr($this->value, 0, 3) . '.***.***-' . substr($this->value, -2);
        }

        return substr($this->value, 0, 2) . '.***.***/****-' . substr($this->value, -2);
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function equals(ValueObjectInterface $other): bool
    {
        if (!$other instanceof self) {
            return false;
        }

        return $this->value === $other->value;
    }

    private static function isValidCpf(string $cpf): bool
    {
        // Check for known invalid CPFs
        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }

        // Validate first check digit
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += (int) $cpf[$i] * (10 - $i);
        }
        $remainder = ($sum * 10) % 11;
        if ($remainder === 10) {
            $remainder = 0;
        }
        if ($remainder !== (int) $cpf[9]) {
            return false;
        }

        // Validate second check digit
        $sum = 0;
        for ($i = 0; $i < 10; $i++) {
            $sum += (int) $cpf[$i] * (11 - $i);
        }
        $remainder = ($sum * 10) % 11;
        if ($remainder === 10) {
            $remainder = 0;
        }

        return $remainder === (int) $cpf[10];
    }

    private static function isValidCnpj(string $cnpj): bool
    {
        // Check for known invalid CNPJs
        if (preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }

        // Validate first check digit
        $weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += (int) $cnpj[$i] * $weights[$i];
        }
        $remainder = $sum % 11;
        $digit1 = $remainder < 2 ? 0 : 11 - $remainder;
        if ($digit1 !== (int) $cnpj[12]) {
            return false;
        }

        // Validate second check digit
        $weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += (int) $cnpj[$i] * $weights[$i];
        }
        $remainder = $sum % 11;
        $digit2 = $remainder < 2 ? 0 : 11 - $remainder;

        return $digit2 === (int) $cnpj[13];
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
