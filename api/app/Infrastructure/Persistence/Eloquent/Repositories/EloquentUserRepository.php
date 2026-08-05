<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\TaxNumber;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Mappers\UserMapper;
use Illuminate\Support\Str;

final class EloquentUserRepository implements UserRepositoryInterface
{
    public function findById(Uuid $id): ?User
    {
        $model = UserModel::find($id->toString());

        if ($model === null) {
            return null;
        }

        return UserMapper::toDomain($model);
    }

    public function findByEmail(Email $email): ?User
    {
        $model = UserModel::where('email', $email->toString())->first();

        if ($model === null) {
            return null;
        }

        return UserMapper::toDomain($model);
    }

    public function findByTaxNumber(TaxNumber $taxNumber): ?User
    {
        $model = UserModel::where('tax_number', $taxNumber->getValue())->first();

        if ($model === null) {
            return null;
        }

        return UserMapper::toDomain($model);
    }

    public function existsByEmail(Email $email): bool
    {
        return UserModel::where('email', $email->toString())->exists();
    }

    public function existsByTaxNumber(TaxNumber $taxNumber): bool
    {
        return UserModel::where('tax_number', $taxNumber->getValue())->exists();
    }

    public function save(User $user): void
    {
        $model = UserMapper::toModel($user);
        $model->save();
    }

    public function update(User $user): void
    {
        $model = UserModel::findOrFail($user->getId());
        UserMapper::updateModel($model, $user);
        $model->save();
    }

    public function delete(User $user): void
    {
        $model = UserModel::findOrFail($user->getId());
        $model->delete();
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString((string) Str::uuid());
    }
}
