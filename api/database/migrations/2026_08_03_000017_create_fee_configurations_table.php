<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Fee identification
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();

            // Operation type
            $table->string('operation_type', 30);
            // deposit, withdrawal, transfer

            // Fee calculation
            $table->string('calculation_type', 20);
            // fixed, percentage, tiered

            // Values
            $table->decimal('fixed_amount', 15, 2)->default(0);
            $table->decimal('percentage', 8, 4)->default(0);
            // percentage is stored as decimal (e.g., 1.5% = 1.5000)

            // Limits
            $table->decimal('min_fee', 15, 2)->nullable();
            $table->decimal('max_fee', 15, 2)->nullable();

            // Tiered pricing (JSON array)
            // [{"from": 0, "to": 100, "fixed": 1.00, "percentage": 0}, ...]
            $table->json('tiers')->nullable();

            // Applicability
            $table->integer('min_kyc_level')->default(0);
            $table->decimal('min_amount', 15, 2)->nullable();
            $table->decimal('max_amount', 15, 2)->nullable();

            // Priority for matching (lower = higher priority)
            $table->integer('priority')->default(100);

            // Status
            $table->boolean('is_active')->default(true);

            // Validity period
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();

            $table->timestamps();

            // Indexes
            $table->index('operation_type');
            $table->index('is_active');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_configurations');
    }
};
