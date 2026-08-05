<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wallet_id');
            $table->uuid('transaction_id')->nullable();

            // Status
            $table->string('status', 20)->default('pending');
            // pending, approved, processing, completed, failed, cancelled, rejected

            // Amount
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->decimal('net_amount', 15, 2);
            $table->string('currency', 3)->default('BRL');

            // PIX destination
            $table->string('pix_key_type', 20);
            // cpf, cnpj, email, phone, random
            $table->string('pix_key', 100);
            $table->string('recipient_name', 100)->nullable();
            $table->string('recipient_document', 20)->nullable();

            // Provider info
            $table->string('provider', 20)->default('eulen');
            $table->string('provider_id', 100)->nullable();
            $table->string('provider_status', 50)->nullable();
            $table->string('end_to_end_id', 100)->nullable();
            $table->json('provider_response')->nullable();

            // Metadata
            $table->json('metadata')->default('{}');

            // Idempotency
            $table->string('idempotency_key', 100);

            // Approval (for manual review if needed)
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            // Timestamps
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_reason', 255)->nullable();

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

            $table->foreign('approved_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            // Indexes
            $table->index('wallet_id');
            $table->index('status');
            $table->index('provider_id');
            $table->index('end_to_end_id');
            $table->index('created_at');
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('withdrawals');
    }
};
