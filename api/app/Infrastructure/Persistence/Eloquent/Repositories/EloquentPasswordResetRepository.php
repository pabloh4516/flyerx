<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Identity\Repositories\PasswordResetRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\PasswordResetModel;
use Illuminate\Support\Str;

final class EloquentPasswordResetRepository implements PasswordResetRepositoryInterface
{
    public function findValidByTokenHash(string $tokenHash): ?array
    {
        $model = PasswordResetModel::where('token_hash', $tokenHash)
            ->valid()
            ->first();

        if ($model === null) {
            return null;
        }

        return $this->toArray($model);
    }

    public function findValidByUserId(Uuid $userId): array
    {
        return PasswordResetModel::where('user_id', $userId->toString())
            ->valid()
            ->get()
            ->map(fn ($model) => $this->toArray($model))
            ->toArray();
    }

    public function create(array $data): Uuid
    {
        $id = Str::uuid()->toString();

        PasswordResetModel::create([
            'id' => $id,
            'user_id' => $data['user_id'],
            'token_hash' => $data['token_hash'],
            'ip_address' => $data['ip_address'],
            'expires_at' => $data['expires_at'],
            'created_at' => now(),
        ]);

        return Uuid::fromString($id);
    }

    public function markAsUsed(Uuid $id): void
    {
        PasswordResetModel::where('id', $id->toString())
            ->update(['used_at' => now()]);
    }

    public function invalidateAllForUser(Uuid $userId): void
    {
        PasswordResetModel::where('user_id', $userId->toString())
            ->valid()
            ->update(['used_at' => now()]);
    }

    public function deleteExpired(): int
    {
        return PasswordResetModel::expired()
            ->where('created_at', '<', now()->subDays(7))
            ->delete();
    }

    public function countRecentByUserId(Uuid $userId, int $minutes = 60): int
    {
        return PasswordResetModel::where('user_id', $userId->toString())
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString((string) Str::uuid());
    }

    private function toArray(PasswordResetModel $model): array
    {
        return [
            'id' => $model->id,
            'user_id' => $model->user_id,
            'token_hash' => $model->token_hash,
            'ip_address' => $model->ip_address,
            'expires_at' => $model->expires_at,
            'used_at' => $model->used_at,
            'created_at' => $model->created_at,
        ];
    }
}
