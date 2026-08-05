<?php

declare(strict_types=1);

namespace App\Domain\Identity\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use App\Domain\Identity\Exceptions\InvalidPhoneNumberException;

final class PhoneNumber implements ValueObjectInterface
{
    private function __construct(
        private readonly string $countryCode,
        private readonly string $number
    ) {}

    public static function fromString(string $phone): self
    {
        // Remove all non-numeric characters except +
        $cleaned = preg_replace('/[^0-9+]/', '', $phone);

        // Handle Brazilian format
        if (str_starts_with($cleaned, '+')) {
            // International format: +5511999999999
            $countryCode = substr($cleaned, 1, 2);
            $number = substr($cleaned, 3);
        } elseif (strlen($cleaned) === 13 && str_starts_with($cleaned, '55')) {
            // Without +: 5511999999999
            $countryCode = '55';
            $number = substr($cleaned, 2);
        } elseif (strlen($cleaned) === 11) {
            // Just the number: 11999999999
            $countryCode = '55';
            $number = $cleaned;
        } elseif (strlen($cleaned) === 10) {
            // Without 9: 1199999999 (old format)
            $countryCode = '55';
            $number = $cleaned;
        } else {
            throw new InvalidPhoneNumberException("Invalid phone number format: {$phone}");
        }

        // Validate Brazilian number
        if ($countryCode === '55') {
            if (!preg_match('/^[1-9]{2}9?[0-9]{8}$/', $number)) {
                throw new InvalidPhoneNumberException("Invalid Brazilian phone number: {$phone}");
            }
        }

        return new self($countryCode, $number);
    }

    public function getCountryCode(): string
    {
        return $this->countryCode;
    }

    public function getNumber(): string
    {
        return $this->number;
    }

    public function getAreaCode(): string
    {
        return substr($this->number, 0, 2);
    }

    public function getLocalNumber(): string
    {
        return substr($this->number, 2);
    }

    public function getInternationalFormat(): string
    {
        return '+' . $this->countryCode . $this->number;
    }

    public function getFormatted(): string
    {
        if ($this->countryCode === '55') {
            $area = $this->getAreaCode();
            $local = $this->getLocalNumber();

            if (strlen($local) === 9) {
                return "+{$this->countryCode} ({$area}) " .
                    substr($local, 0, 5) . '-' . substr($local, 5);
            }

            return "+{$this->countryCode} ({$area}) " .
                substr($local, 0, 4) . '-' . substr($local, 4);
        }

        return $this->getInternationalFormat();
    }

    public function getMasked(): string
    {
        $local = $this->getLocalNumber();
        return "+{$this->countryCode} ({$this->getAreaCode()}) *****-" . substr($local, -4);
    }

    public function toString(): string
    {
        return $this->getInternationalFormat();
    }

    public function equals(ValueObjectInterface $other): bool
    {
        if (!$other instanceof self) {
            return false;
        }

        return $this->countryCode === $other->countryCode &&
            $this->number === $other->number;
    }

    public function __toString(): string
    {
        return $this->getInternationalFormat();
    }
}
