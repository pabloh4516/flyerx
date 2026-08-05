<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('device_id')->nullable();

            // Tokens
            $table->string('token_hash');
            $table->string('refresh_token_hash')->nullable();

            // Request info
            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();

            // Lifecycle
            $table->timestamp('expires_at');
            $table->timestamp('last_activity_at');
            $table->boolean('is_revoked')->default(false);
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_reason', 100)->nullable();

            $table->timestamp('created_at');

            // Foreign keys
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('device_id')
                ->references('id')
                ->on('user_devices')
                ->onDelete('set null');

            // Indexes
            $table->index('user_id');
            $table->index('token_hash');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
