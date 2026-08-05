<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLogModel extends Model
{
    use HasUuids;

    protected $table = 'audit_logs';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'actor_type',
        'actor_id',
        'action',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'request_id',
        'session_id',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeByActor($query, string $type, ?string $id = null)
    {
        $query->where('actor_type', $type);

        if ($id !== null) {
            $query->where('actor_id', $id);
        }

        return $query;
    }

    public function scopeByResource($query, string $type, ?string $id = null)
    {
        $query->where('resource_type', $type);

        if ($id !== null) {
            $query->where('resource_id', $id);
        }

        return $query;
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeBySession($query, string $sessionId)
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeSecuritySensitive($query)
    {
        return $query->whereIn('action', [
            'user.login',
            'user.login_failed',
            'user.password_changed',
            'user.password_reset_requested',
            'user.password_reset_completed',
            'user.blocked',
            'user.2fa_enabled',
            'user.2fa_disabled',
            'user.2fa_failed',
            'session.revoked',
        ]);
    }

    public function scopeFinancialOperations($query)
    {
        return $query->whereIn('action', [
            'deposit.created',
            'deposit.completed',
            'deposit.failed',
            'withdrawal.created',
            'withdrawal.completed',
            'withdrawal.failed',
            'wallet.balance_updated',
        ]);
    }

    // -------------------------------------------------------------------------
    // Static Factory
    // -------------------------------------------------------------------------

    public static function log(
        string $action,
        string $resourceType,
        ?string $resourceId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $actorType = null,
        ?string $actorId = null,
        ?array $metadata = null,
    ): static {
        return static::create([
            'actor_type' => $actorType ?? 'system',
            'actor_id' => $actorId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'request_id' => request()->header('X-Request-ID'),
            'metadata' => $metadata ?? [],
            'created_at' => now(),
        ]);
    }
}
