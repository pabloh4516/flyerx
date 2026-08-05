<?php

declare(strict_types=1);

namespace App\Domain\Identity\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use App\Domain\Identity\Exceptions\InvalidEmailException;

final class Email implements ValueObjectInterface
{
    private readonly string $value;

    private function __construct(string $value)
    {
        $normalized = strtolower(trim($value));

        if (!filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidEmailException("Invalid email address: {$value}");
        }

        $this->value = $normalized;
    }

    public static function fromString(string $email): self
    {
        return new self($email);
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getDomain(): string
    {
        return substr($this->value, strpos($this->value, '@') + 1);
    }

    public function getLocalPart(): string
    {
        return substr($this->value, 0, strpos($this->value, '@'));
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

    public function __toString(): string
    {
        return $this->value;
    }
}
