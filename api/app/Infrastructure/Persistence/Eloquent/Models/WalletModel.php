<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WalletModel extends Model
{
    use HasUuids;

    protected $table = 'wallets';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'user_id',
        'currency',
        'status',
        'daily_withdrawal_limit',
        'monthly_withdrawal_limit',
        'suspended_at',
        'suspended_reason',
    ];

    protected $casts = [
        'daily_withdrawal_limit' => 'integer',
        'monthly_withdrawal_limit' => 'integer',
        'suspended_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'user_id');
    }

    public function deposits(): HasMany
    {
        return $this->hasMany(DepositModel::class, 'wallet_id');
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(WithdrawalModel::class, 'wallet_id');
    }

    public function ledgerAccount(): HasMany
    {
        return $this->hasMany(LedgerAccountModel::class, 'wallet_id');
    }

    public function balanceReservations(): HasMany
    {
        return $this->hasMany(BalanceReservationModel::class, 'wallet_id');
    }
}
