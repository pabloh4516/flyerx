<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepositModel extends Model
{
    use HasUuids;

    protected $table = 'deposits';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'wallet_id',
        'amount',
        'fee_amount',
        'net_amount',
        'currency',
        'status',
        'provider',
        'provider_id',
        'provider_status',
        'provider_response',
        'pix_qr_code',
        'pix_copy_paste',
        'pix_tx_id',
        'expires_at',
        'paid_at',
        'failed_at',
        'failure_reason',
        'idempotency_key',
        'transaction_id',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'integer',
        'fee_amount' => 'integer',
        'net_amount' => 'integer',
        'provider_response' => 'array',
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(WalletModel::class, 'wallet_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(TransactionModel::class, 'transaction_id');
    }
}
