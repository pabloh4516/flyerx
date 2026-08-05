<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BalanceReservationModel extends Model
{
    use HasUuids;

    protected $table = 'balance_reservations';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'wallet_id',
        'amount',
        'currency',
        'reason',
        'reference_type',
        'reference_id',
        'status',
        'expires_at',
        'released_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'expires_at' => 'datetime',
        'released_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(WalletModel::class, 'wallet_id');
    }
}
