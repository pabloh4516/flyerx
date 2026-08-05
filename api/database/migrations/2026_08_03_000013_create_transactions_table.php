<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Wallet reference
            $table->uuid('wallet_id');

            // Transaction type
            $table->string('type', 30);
            // deposit, withdrawal, transfer_in, transfer_out, fee, refund, adjustment

            // Status
            $table->string('status', 20)->default('pending');
            // pending, processing, completed, failed, cancelled, reversed

            // Amounts
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            $table->string('currency', 3)->default('BRL');

            // Reference to external entity
            $table->string('reference_type', 50)->nullable();
            // deposit, withdrawal, transfer, etc.
            $table->uuid('reference_id')->nullable();

            // Idempotency
            $table->string('idempotency_key', 100)->nullable();

            // Description
            $table->string('description', 255)->nullable();

            // Metadata
            $table->json('metadata')->default('{}');

            // Timestamps
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_reason', 255)->nullable();

            $table->timestamps();

            // Foreign keys
            $table->foreign('wallet_id')
                ->references('id')
                ->on('wallets')
                ->onDelete('restrict');

            // Indexes
            $table->index('wallet_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
            $table->index(['reference_type', 'reference_id']);
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
