<?php

declare(strict_types=1);

namespace App\Domain\Wallet\Enums;

enum PixKeyType: string
{
    case CPF = 'cpf';
    case CNPJ = 'cnpj';
    case EMAIL = 'email';
    case PHONE = 'phone';
    case RANDOM = 'random';

    public function label(): string
    {
        return match ($this) {
            self::CPF => 'CPF',
            self::CNPJ => 'CNPJ',
            self::EMAIL => 'E-mail',
            self::PHONE => 'Telefone',
            self::RANDOM => 'Chave Aleatória',
        };
    }

    public function validate(string $value): bool
    {
        return match ($this) {
            self::CPF => (bool) preg_match('/^\d{11}$/', preg_replace('/\D/', '', $value)),
            self::CNPJ => (bool) preg_match('/^\d{14}$/', preg_replace('/\D/', '', $value)),
            self::EMAIL => filter_var($value, FILTER_VALIDATE_EMAIL) !== false,
            self::PHONE => (bool) preg_match('/^\+?[1-9]\d{10,14}$/', preg_replace('/\D/', '', $value)),
            self::RANDOM => (bool) preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $value),
        };
    }
}
