<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');

            $table->string('currency', 3)->default('BRL');
            $table->string('status', 20)->default('active');
            // active, suspended, closed
            $table->timestamp('suspended_at')->nullable();
            $table->string('suspended_reason', 255)->nullable();

            // Limits
            $table->decimal('daily_withdrawal_limit', 15, 2)->default(5000.00);
            $table->decimal('monthly_withdrawal_limit', 15, 2)->default(50000.00);

            // Metadata
            $table->json('metadata')->default('{}');

            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Unique constraint: one wallet per user per currency
            $table->unique(['user_id', 'currency']);

            // Indexes
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
