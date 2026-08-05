<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Authentication
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password_hash');

            // Personal Data
            $table->string('full_name');
            $table->string('tax_number', 14)->unique();
            $table->string('tax_number_type', 4); // CPF or CNPJ
            $table->string('phone', 20)->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->date('birth_date')->nullable();

            // Status
            $table->string('status', 20)->default('pending');
            $table->smallInteger('kyc_level')->default(0);
            $table->string('kyc_status', 20)->default('pending');
            $table->timestamp('kyc_verified_at')->nullable();

            // Security
            $table->boolean('two_factor_enabled')->default(false);
            $table->integer('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->ipAddress('last_login_ip')->nullable();

            // Metadata
            $table->json('metadata')->default('{}');

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('kyc_status');
            $table->index('created_at');
        });

        // Add check constraints (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_status CHECK (status IN ('pending', 'active', 'blocked', 'suspended'))");
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_kyc_status CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected'))");
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_tax_number_type CHECK (tax_number_type IN ('CPF', 'CNPJ'))");
            DB::statement("ALTER TABLE users ADD CONSTRAINT chk_users_kyc_level CHECK (kyc_level >= 0 AND kyc_level <= 3)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
