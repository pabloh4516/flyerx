<?php

declare(strict_types=1);

namespace App\Application\Identity\DTOs;

use App\Domain\Identity\Entities\User;

final readonly class UserDTO
{
    public function __construct(
        public string $id,
        public string $email,
        public bool $emailVerified,
        public string $fullName,
        public ?string $taxNumber,
        public ?string $taxNumberType,
        public ?string $phone,
        public bool $phoneVerified,
        public ?string $birthDate,
        public string $status,
        public int $kycLevel,
        public string $kycStatus,
        public bool $twoFactorEnabled,
        public bool $useDirectEulen,
        public string $createdAt,
    ) {}

    public static function fromEntity(User $user): self
    {
        return new self(
            id: $user->getId(),
            email: $user->getEmail()->toString(),
            emailVerified: $user->isEmailVerified(),
            fullName: $user->getFullName(),
            taxNumber: $user->getTaxNumber()?->getMasked(),
            taxNumberType: $user->getTaxNumber()?->getType(),
            phone: $user->getPhoneNumber()?->getMasked(),
            phoneVerified: $user->getPhoneNumber() !== null && $user->getPhoneVerifiedAt() !== null,
            birthDate: $user->getBirthDate()?->format('Y-m-d'),
            status: $user->getStatus()->value,
            kycLevel: $user->getKycLevel(),
            kycStatus: $user->getKycStatus()->value,
            twoFactorEnabled: $user->isTwoFactorEnabled(),
            useDirectEulen: $user->useDirectEulen(),
            createdAt: $user->getCreatedAt()->format('c'),
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'email_verified' => $this->emailVerified,
            'full_name' => $this->fullName,
            'tax_number' => $this->taxNumber,
            'tax_number_type' => $this->taxNumberType,
            'phone' => $this->phone,
            'phone_verified' => $this->phoneVerified,
            'birth_date' => $this->birthDate,
            'status' => $this->status,
            'kyc_level' => $this->kycLevel,
            'kyc_status' => $this->kycStatus,
            'two_factor_enabled' => $this->twoFactorEnabled,
            'use_direct_eulen' => $this->useDirectEulen,
            'created_at' => $this->createdAt,
        ];
    }
}
