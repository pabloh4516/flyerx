<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Torna tax_number opcional para permitir registro simplificado.
     * O CPF/CNPJ será solicitado posteriormente durante o KYC.
     */
    public function up(): void
    {
        // Remove unique constraint e altera para nullable
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['tax_number']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('tax_number', 14)->nullable()->change();
            $table->string('tax_number_type', 4)->nullable()->change();
        });

        // Remove o CHECK constraint (PostgreSQL)
        if (config('database.default') === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_tax_number_type');
        }

        // Recria unique index apenas para valores não nulos
        Schema::table('users', function (Blueprint $table) {
            $table->unique('tax_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Não é seguro reverter se houver registros com tax_number null
        // A reversão exigiria preencher valores para todos os usuários sem CPF
    }
};
