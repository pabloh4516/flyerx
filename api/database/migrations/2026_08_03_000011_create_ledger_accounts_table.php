<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger Accounts - represents different account types in double-entry bookkeeping
        Schema::create('ledger_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Account identification
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();

            // Account type (based on accounting equation)
            $table->string('type', 20);
            // asset, liability, equity, revenue, expense

            // Account category for grouping
            $table->string('category', 50);
            // user_balance, platform_revenue, provider_payable, fee_revenue, etc.

            // Parent account for hierarchy
            $table->uuid('parent_id')->nullable();

            // Account behavior
            $table->string('normal_balance', 10);
            // debit or credit - the side that increases the account

            // Is this a system account or user-specific?
            $table->boolean('is_system')->default(false);
            $table->uuid('wallet_id')->nullable();

            // Currency
            $table->string('currency', 3)->default('BRL');

            // Status
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Foreign key to wallets (external table)
            $table->foreign('wallet_id')
                ->references('id')
                ->on('wallets')
                ->onDelete('cascade');

            // Indexes
            $table->index('type');
            $table->index('category');
            $table->index('wallet_id');
        });

        // Self-referencing FK must be added AFTER table creation (PostgreSQL requirement)
        Schema::table('ledger_accounts', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')
                ->on('ledger_accounts')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_accounts');
    }
};
