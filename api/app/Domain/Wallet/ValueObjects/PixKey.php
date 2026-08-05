<?php

declare(strict_types=1);

namespace App\Domain\Wallet\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use App\Domain\Wallet\Enums\PixKeyType;
use InvalidArgumentException;

final class PixKey implements ValueObjectInterface
{
    public function __construct(
        private readonly PixKeyType $type,
        private readonly string $value
    ) {
        // Validate the key
        $normalizedValue = self::normalize($type, $value);
        if (!$type->validate($normalizedValue)) {
            throw new InvalidArgumentException("Invalid PIX key for type {$type->value}: {$value}");
        }
    }

    public static function create(PixKeyType $type, string $value): self
    {
        $normalizedValue = self::normalize($type, $value);

        if (!$type->validate($normalizedValue)) {
            throw new InvalidArgumentException("Invalid PIX key for type {$type->value}: {$value}");
        }

        return new self($type, $normalizedValue);
    }

    public static function fromString(string $value): self
    {
        $type = self::detectType($value);

        return self::create($type, $value);
    }

    public function getType(): PixKeyType
    {
        return $this->type;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getMasked(): string
    {
        return match ($this->type) {
            PixKeyType::CPF => substr($this->value, 0, 3) . '.***.***-' . substr($this->value, -2),
            PixKeyType::CNPJ => substr($this->value, 0, 2) . '.***.***/****-' . substr($this->value, -2),
            PixKeyType::EMAIL => $this->maskEmail(),
            PixKeyType::PHONE => $this->maskPhone(),
            PixKeyType::RANDOM => substr($this->value, 0, 8) . '-****-****-****-' . substr($this->value, -12),
        };
    }

    public function getFormatted(): string
    {
        return match ($this->type) {
            PixKeyType::CPF => preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $this->value),
            PixKeyType::CNPJ => preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $this->value),
            PixKeyType::PHONE => '+' . preg_replace('/(\d{2})(\d{2})(\d{5})(\d{4})/', '$1 ($2) $3-$4', $this->value),
            default => $this->value,
        };
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

        return $this->type === $other->type && $this->value === $other->value;
    }

    private static function normalize(PixKeyType $type, string $value): string
    {
        return match ($type) {
            PixKeyType::CPF, PixKeyType::CNPJ, PixKeyType::PHONE => preg_replace('/\D/', '', $value),
            PixKeyType::EMAIL => strtolower(trim($value)),
            PixKeyType::RANDOM => strtolower(trim($value)),
        };
    }

    private static function detectType(string $value): PixKeyType
    {
        $cleaned = preg_replace('/\D/', '', $value);

        // Check if it's a CPF (11 digits)
        if (strlen($cleaned) === 11 && ctype_digit($cleaned)) {
            return PixKeyType::CPF;
        }

        // Check if it's a CNPJ (14 digits)
        if (strlen($cleaned) === 14 && ctype_digit($cleaned)) {
            return PixKeyType::CNPJ;
        }

        // Check if it's an email
        if (filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return PixKeyType::EMAIL;
        }

        // Check if it's a phone (10-15 digits with optional +)
        if (preg_match('/^\+?[1-9]\d{10,14}$/', $cleaned)) {
            return PixKeyType::PHONE;
        }

        // Check if it's a random key (UUID format)
        if (preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $value)) {
            return PixKeyType::RANDOM;
        }

        throw new InvalidArgumentException("Cannot determine PIX key type for: {$value}");
    }

    private function maskEmail(): string
    {
        $parts = explode('@', $this->value);
        $local = $parts[0];
        $domain = $parts[1] ?? '';

        if (strlen($local) <= 3) {
            return $local[0] . '***@' . $domain;
        }

        return substr($local, 0, 2) . '***' . substr($local, -1) . '@' . $domain;
    }

    private function maskPhone(): string
    {
        $length = strlen($this->value);

        return '+' . substr($this->value, 0, 4) . '*****' . substr($this->value, -4);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
