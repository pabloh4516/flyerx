<?php

declare(strict_types=1);

namespace App\Application\Identity\DTOs;

final readonly class RegisterUserDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public string $fullName,
        public string $taxNumber,
        public ?string $phone = null,
        public ?string $birthDate = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
            fullName: $data['full_name'],
            taxNumber: $data['tax_number'],
            phone: $data['phone'] ?? null,
            birthDate: $data['birth_date'] ?? null,
        );
    }
}
