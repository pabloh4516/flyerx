<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FeeConfigurationModel extends Model
{
    use HasUuids;

    protected $table = 'fee_configurations';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'operation_type',
        'fee_type',
        'fixed_amount',
        'percentage',
        'min_amount',
        'max_amount',
        'tier_from',
        'tier_to',
        'kyc_level',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'fixed_amount' => 'integer',
        'percentage' => 'decimal:4',
        'min_amount' => 'integer',
        'max_amount' => 'integer',
        'tier_from' => 'integer',
        'tier_to' => 'integer',
        'kyc_level' => 'integer',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForOperation($query, string $operationType)
    {
        return $query->where('operation_type', $operationType);
    }
}
