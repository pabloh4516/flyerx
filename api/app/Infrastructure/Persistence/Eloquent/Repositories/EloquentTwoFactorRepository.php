<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Identity\Repositories\TwoFactorRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserTwoFactorModel;
use Illuminate\Support\Str;

final class EloquentTwoFactorRepository implements TwoFactorRepositoryInterface
{
    public function findByUserIdAndType(Uuid $userId, string $type): ?array
    {
        $model = UserTwoFactorModel::where('user_id', $userId->toString())
            ->where('type', $type)
            ->first();

        if ($model === null) {
            return null;
        }

        return $this->toArray($model);
    }

    public function findAllByUserId(Uuid $userId): array
    {
        return UserTwoFactorModel::where('user_id', $userId->toString())
            ->get()
            ->map(fn ($model) => $this->toArray($model))
            ->toArray();
    }

    public function findActiveByUserId(Uuid $userId): ?array
    {
        $model = UserTwoFactorModel::where('user_id', $userId->toString())
            ->active()
            ->first();

        if ($model === null) {
            return null;
        }

        return $this->toArray($model);
    }

    public function create(array $data): Uuid
    {
        $id = Str::uuid()->toString();

        UserTwoFactorModel::create([
            'id' => $id,
            'user_id' => $data['user_id'],
            'type' => $data['type'],
            'secret_encrypted' => $data['secret_encrypted'],
            'backup_codes_encrypted' => $data['backup_codes_encrypted'] ?? null,
            'is_active' => false,
        ]);

        return Uuid::fromString($id);
    }

    public function update(Uuid $id, array $data): void
    {
        UserTwoFactorModel::where('id', $id->toString())->update($data);
    }

    public function activate(Uuid $id): void
    {
        UserTwoFactorModel::where('id', $id->toString())->update([
            'is_active' => true,
            'verified_at' => now(),
        ]);
    }

    public function deactivate(Uuid $id): void
    {
        UserTwoFactorModel::where('id', $id->toString())->update([
            'is_active' => false,
        ]);
    }

    public function updateBackupCodes(Uuid $id, string $encryptedCodes): void
    {
        UserTwoFactorModel::where('id', $id->toString())->update([
            'backup_codes_encrypted' => $encryptedCodes,
        ]);
    }

    public function recordUsage(Uuid $id): void
    {
        UserTwoFactorModel::where('id', $id->toString())->update([
            'last_used_at' => now(),
        ]);
    }

    public function delete(Uuid $id): void
    {
        UserTwoFactorModel::where('id', $id->toString())->delete();
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString((string) Str::uuid());
    }

    private function toArray(UserTwoFactorModel $model): array
    {
        return [
            'id' => $model->id,
            'user_id' => $model->user_id,
            'type' => $model->type,
            'secret_encrypted' => $model->secret_encrypted,
            'backup_codes_encrypted' => $model->backup_codes_encrypted,
            'is_active' => $model->is_active,
            'verified_at' => $model->verified_at,
            'last_used_at' => $model->last_used_at,
            'created_at' => $model->created_at,
            'updated_at' => $model->updated_at,
        ];
    }
}
