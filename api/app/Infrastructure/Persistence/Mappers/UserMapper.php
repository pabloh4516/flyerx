<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Mappers;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Enums\KycStatus;
use App\Domain\Identity\Enums\UserStatus;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Identity\ValueObjects\PhoneNumber;
use App\Domain\Identity\ValueObjects\TaxNumber;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use DateTimeImmutable;

final class UserMapper
{
    /**
     * Map an Eloquent model to a Domain entity.
     */
    public static function toDomain(UserModel $model): User
    {
        return User::reconstitute(
            id: $model->id,
            email: Email::fromString($model->email),
            emailVerifiedAt: $model->email_verified_at
                ? DateTimeImmutable::createFromMutable($model->email_verified_at->toDateTime())
                : null,
            password: Password::fromHash($model->password_hash),
            fullName: $model->full_name,
            taxNumber: $model->tax_number ? TaxNumber::fromString($model->tax_number) : null,
            phoneNumber: $model->phone ? PhoneNumber::fromString($model->phone) : null,
            phoneVerifiedAt: $model->phone_verified_at
                ? DateTimeImmutable::createFromMutable($model->phone_verified_at->toDateTime())
                : null,
            birthDate: $model->birth_date
                ? DateTimeImmutable::createFromMutable($model->birth_date->toDateTime())
                : null,
            status: UserStatus::from($model->status),
            kycLevel: $model->kyc_level,
            kycStatus: KycStatus::from($model->kyc_status),
            kycVerifiedAt: $model->kyc_verified_at
                ? DateTimeImmutable::createFromMutable($model->kyc_verified_at->toDateTime())
                : null,
            twoFactorEnabled: $model->two_factor_enabled,
            failedLoginAttempts: $model->failed_login_attempts,
            lockedUntil: $model->locked_until
                ? DateTimeImmutable::createFromMutable($model->locked_until->toDateTime())
                : null,
            lastLoginAt: $model->last_login_at
                ? DateTimeImmutable::createFromMutable($model->last_login_at->toDateTime())
                : null,
            lastLoginIp: $model->last_login_ip,
            metadata: $model->metadata ?? [],
            createdAt: DateTimeImmutable::createFromMutable($model->created_at->toDateTime()),
            updatedAt: DateTimeImmutable::createFromMutable($model->updated_at->toDateTime()),
        );
    }

    /**
     * Map a Domain entity to Eloquent model attributes.
     */
    public static function toModelAttributes(User $entity): array
    {
        return [
            'id' => $entity->getId(),
            'email' => $entity->getEmail()->toString(),
            'password_hash' => $entity->getPasswordHash(),
            'full_name' => $entity->getFullName(),
            'tax_number' => $entity->getTaxNumber()?->getValue(),
            'tax_number_type' => $entity->getTaxNumber()?->getType(),
            'phone' => $entity->getPhoneNumber()?->toString(),
            'birth_date' => $entity->getBirthDate()?->format('Y-m-d'),
            'status' => $entity->getStatus()->value,
            'kyc_level' => $entity->getKycLevel(),
            'kyc_status' => $entity->getKycStatus()->value,
            'kyc_verified_at' => $entity->getKycVerifiedAt()?->format('Y-m-d H:i:s'),
            'two_factor_enabled' => $entity->isTwoFactorEnabled(),
            'email_verified_at' => $entity->getEmailVerifiedAt()?->format('Y-m-d H:i:s'),
            'phone_verified_at' => $entity->getPhoneVerifiedAt()?->format('Y-m-d H:i:s'),
            'failed_login_attempts' => $entity->getFailedLoginAttempts(),
            'locked_until' => $entity->getLockedUntil()?->format('Y-m-d H:i:s'),
            'last_login_at' => $entity->getLastLoginAt()?->format('Y-m-d H:i:s'),
            'last_login_ip' => $entity->getLastLoginIp(),
            'metadata' => $entity->getMetadata(),
        ];
    }

    /**
     * Create a new Eloquent model from a Domain entity.
     */
    public static function toModel(User $entity): UserModel
    {
        $model = new UserModel();
        $model->forceFill(self::toModelAttributes($entity));

        return $model;
    }

    /**
     * Update an existing Eloquent model from a Domain entity.
     */
    public static function updateModel(UserModel $model, User $entity): void
    {
        $model->forceFill(self::toModelAttributes($entity));
    }
}
