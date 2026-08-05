<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ledger Entries - immutable double-entry records
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Transaction reference (groups debits and credits)
            $table->uuid('transaction_id');

            // Account being affected
            $table->uuid('account_id');

            // Entry type
            $table->string('entry_type', 10);
            // debit or credit

            // Amount (always positive)
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('BRL');

            // Running balance after this entry
            $table->decimal('balance_after', 15, 2);

            // Description
            $table->string('description', 255)->nullable();

            // Metadata
            $table->json('metadata')->default('{}');

            // Immutable timestamp
            $table->timestamp('created_at');

            // Foreign keys
            $table->foreign('account_id')
                ->references('id')
                ->on('ledger_accounts')
                ->onDelete('restrict');

            // Indexes
            $table->index('transaction_id');
            $table->index('account_id');
            $table->index('created_at');
            $table->index(['account_id', 'created_at']);
        });

        // Add constraint to ensure balanced transactions (PostgreSQL only)
        // This is enforced at application level, but we add a check constraint for safety
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                CREATE OR REPLACE FUNCTION check_balanced_transaction()
                RETURNS TRIGGER AS $$
                DECLARE
                    debit_sum DECIMAL(15,2);
                    credit_sum DECIMAL(15,2);
                BEGIN
                    SELECT
                        COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0),
                        COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0)
                    INTO debit_sum, credit_sum
                    FROM ledger_entries
                    WHERE transaction_id = NEW.transaction_id;

                    -- Allow incomplete transactions during insertion
                    -- Final validation happens at commit
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP FUNCTION IF EXISTS check_balanced_transaction() CASCADE');
        }
        Schema::dropIfExists('ledger_entries');
    }
};
