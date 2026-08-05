<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserDeviceModel extends Model
{
    protected $table = 'user_devices';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = true;

    protected $fillable = [
        'id',
        'user_id',
        'device_fingerprint',
        'device_name',
        'device_type',
        'os_name',
        'os_version',
        'browser_name',
        'browser_version',
        'app_version',
        'push_token',
        'is_trusted',
        'is_blocked',
        'first_seen_at',
        'last_seen_at',
        'last_ip',
        'last_location',
    ];

    protected function casts(): array
    {
        return [
            'is_trusted' => 'boolean',
            'is_blocked' => 'boolean',
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'last_location' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSessionModel::class, 'device_id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeTrusted($query)
    {
        return $query->where('is_trusted', true);
    }

    public function scopeBlocked($query)
    {
        return $query->where('is_blocked', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_blocked', false);
    }

    public function scopeRecentlyUsed($query, int $days = 30)
    {
        return $query->where('last_seen_at', '>=', now()->subDays($days));
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getDisplayNameAttribute(): string
    {
        if ($this->device_name) {
            return $this->device_name;
        }

        $parts = [];

        if ($this->browser_name) {
            $parts[] = $this->browser_name;
        }

        if ($this->os_name) {
            $parts[] = 'em ' . $this->os_name;
        }

        return implode(' ', $parts) ?: 'Dispositivo desconhecido';
    }
}
