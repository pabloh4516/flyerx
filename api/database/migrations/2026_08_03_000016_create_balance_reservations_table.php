<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Balance Reservations - prevents double spending during async operations
        Schema::create('balance_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wallet_id');

            // Amount reserved
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('BRL');

            // Reason for reservation
            $table->string('reason', 50);
            // withdrawal, transfer, fee

            // Reference
            $table->string('reference_type', 50);
            $table->uuid('reference_id');

            // Status
            $table->string('status', 20)->default('active');
            // active, consumed, released, expired

            // Expiry
            $table->timestamp('expires_at');

            // Resolution
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('released_at')->nullable();

            $table->timestamp('created_at');

            // Foreign keys
            $table->foreign('wallet_id')
                ->references('id')
                ->on('wallets')
                ->onDelete('restrict');

            // Indexes
            $table->index('wallet_id');
            $table->index('status');
            $table->index('expires_at');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_reservations');
    }
};
