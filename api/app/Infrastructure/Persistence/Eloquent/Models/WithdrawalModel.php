<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WithdrawalModel extends Model
{
    use HasUuids;

    protected $table = 'withdrawals';

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
        'pix_key_type',
        'pix_key',
        'recipient_name',
        'recipient_document',
        'provider',
        'provider_id',
        'provider_status',
        'provider_response',
        'end_to_end_id',
        'scheduled_for',
        'processed_at',
        'failed_at',
        'failure_reason',
        'approved_at',
        'approved_by',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
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
        'scheduled_for' => 'datetime',
        'processed_at' => 'datetime',
        'failed_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
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

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'approved_by');
    }

    public function rejectedByUser(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'rejected_by');
    }
}
