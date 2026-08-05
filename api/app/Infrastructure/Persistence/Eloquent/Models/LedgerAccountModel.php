<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LedgerAccountModel extends Model
{
    use HasUuids;

    protected $table = 'ledger_accounts';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'wallet_id',
        'type',
        'category',
        'code',
        'name',
        'description',
        'currency',
        'balance',
        'is_system',
    ];

    protected $casts = [
        'balance' => 'integer',
        'is_system' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(WalletModel::class, 'wallet_id');
    }

    public function debitEntries(): HasMany
    {
        return $this->hasMany(LedgerEntryModel::class, 'debit_account_id');
    }

    public function creditEntries(): HasMany
    {
        return $this->hasMany(LedgerEntryModel::class, 'credit_account_id');
    }
}
