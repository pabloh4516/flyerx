<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class UserModel extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasUuids;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'users';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'email',
        'email_verified_at',
        'password_hash',
        'full_name',
        'tax_number',
        'tax_number_type',
        'phone',
        'phone_verified_at',
        'birth_date',
        'status',
        'kyc_level',
        'kyc_status',
        'kyc_verified_at',
        'two_factor_enabled',
        'failed_login_attempts',
        'locked_until',
        'last_login_at',
        'last_login_ip',
        'metadata',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'birth_date' => 'date',
            'kyc_verified_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
            'metadata' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function devices(): HasMany
    {
        return $this->hasMany(UserDeviceModel::class, 'user_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSessionModel::class, 'user_id');
    }

    public function activeSessions(): HasMany
    {
        return $this->sessions()
            ->where('is_revoked', false)
            ->where('expires_at', '>', now());
    }

    public function twoFactorMethods(): HasMany
    {
        return $this->hasMany(UserTwoFactorModel::class, 'user_id');
    }

    public function activeTwoFactor(): HasMany
    {
        return $this->twoFactorMethods()->where('is_active', true);
    }

    public function passwordResets(): HasMany
    {
        return $this->hasMany(PasswordResetModel::class, 'user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            RoleModel::class,
            'user_roles',
            'user_id',
            'role_id'
        )->withPivot('assigned_by', 'created_at');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    public function scopeWithKycLevel($query, int $level)
    {
        return $query->where('kyc_level', '>=', $level);
    }

    public function scopeNotLocked($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('locked_until')
              ->orWhere('locked_until', '<', now());
        });
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    public function isPhoneVerified(): bool
    {
        return $this->phone_verified_at !== null;
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_enabled;
    }
}
