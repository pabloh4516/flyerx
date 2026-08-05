<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Identity\Repositories\SessionRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserSessionModel;
use Illuminate\Support\Str;

final class EloquentSessionRepository implements SessionRepositoryInterface
{
    public function findByTokenHash(string $tokenHash): ?array
    {
        $model = UserSessionModel::where('token_hash', $tokenHash)->first();

        if ($model === null) {
            return null;
        }

        return $this->toArray($model);
    }

    public function findByRefreshTokenHash(string $refreshTokenHash): ?array
    {
        $model = UserSessionModel::where('refresh_token_hash', $refreshTokenHash)
            ->where('is_revoked', false)
            ->first();

        if ($model === null) {
            return null;
        }

        return $this->toArray($model);
    }

    public function findActiveByUserId(Uuid $userId): array
    {
        return UserSessionModel::where('user_id', $userId->toString())
            ->active()
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(fn ($model) => $this->toArray($model))
            ->toArray();
    }

    public function create(array $data): Uuid
    {
        $id = Str::uuid()->toString();

        UserSessionModel::create([
            'id' => $id,
            'user_id' => $data['user_id'],
            'device_id' => $data['device_id'] ?? null,
            'token_hash' => $data['token_hash'],
            'refresh_token_hash' => $data['refresh_token_hash'] ?? null,
            'ip_address' => $data['ip_address'],
            'user_agent' => $data['user_agent'] ?? null,
            'expires_at' => $data['expires_at'],
            'last_activity_at' => now(),
            'is_revoked' => false,
            'created_at' => now(),
        ]);

        return Uuid::fromString($id);
    }

    public function updateLastActivity(Uuid $sessionId): void
    {
        UserSessionModel::where('id', $sessionId->toString())
            ->update(['last_activity_at' => now()]);
    }

    public function revoke(Uuid $sessionId, string $reason): void
    {
        UserSessionModel::where('id', $sessionId->toString())
            ->update([
                'is_revoked' => true,
                'revoked_at' => now(),
                'revoked_reason' => $reason,
            ]);
    }

    public function revokeAllForUser(Uuid $userId, string $reason, ?Uuid $exceptSessionId = null): void
    {
        $query = UserSessionModel::where('user_id', $userId->toString())
            ->where('is_revoked', false);

        if ($exceptSessionId !== null) {
            $query->where('id', '!=', $exceptSessionId->toString());
        }

        $query->update([
            'is_revoked' => true,
            'revoked_at' => now(),
            'revoked_reason' => $reason,
        ]);
    }

    public function deleteExpired(): int
    {
        return UserSessionModel::expired()
            ->where('created_at', '<', now()->subDays(30))
            ->delete();
    }

    public function nextIdentity(): Uuid
    {
        return Uuid::fromString((string) Str::uuid());
    }

    private function toArray(UserSessionModel $model): array
    {
        return [
            'id' => $model->id,
            'user_id' => $model->user_id,
            'device_id' => $model->device_id,
            'token_hash' => $model->token_hash,
            'refresh_token_hash' => $model->refresh_token_hash,
            'ip_address' => $model->ip_address,
            'user_agent' => $model->user_agent,
            'expires_at' => $model->expires_at,
            'last_activity_at' => $model->last_activity_at,
            'is_revoked' => $model->is_revoked,
            'revoked_at' => $model->revoked_at,
            'revoked_reason' => $model->revoked_reason,
            'created_at' => $model->created_at,
        ];
    }
}
