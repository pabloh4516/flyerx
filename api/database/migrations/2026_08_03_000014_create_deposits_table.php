<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wallet_id');
            $table->uuid('transaction_id')->nullable();

            // Status
            $table->string('status', 20)->default('pending');
            // pending, awaiting_payment, processing, completed, failed, expired, cancelled

            // Amount
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            $table->string('currency', 3)->default('BRL');

            // Payment method
            $table->string('payment_method', 20)->default('pix');

            // PIX specific
            $table->text('pix_qr_code')->nullable();
            $table->text('pix_copy_paste')->nullable();
            $table->string('pix_tx_id', 100)->nullable();

            // Metadata
            $table->json('metadata')->default('[]');

            // Provider info
            $table->string('provider', 20)->default('eulen');
            $table->string('provider_id', 100)->nullable();
            $table->string('provider_status', 50)->nullable();
            $table->json('provider_response')->nullable();

            // Idempotency
            $table->string('idempotency_key', 100);

            // Timestamps
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_reason', 255)->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->timestamps();

            // Foreign keys
            $table->foreign('wallet_id')
                ->references('id')
                ->on('wallets')
                ->onDelete('restrict');

            $table->foreign('transaction_id')
                ->references('id')
                ->on('transactions')
                ->onDelete('set null');

            // Indexes
            $table->index('wallet_id');
            $table->index('status');
            $table->index('provider_id');
            $table->index('pix_tx_id');
            $table->index('created_at');
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
