<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');

            // Device identification
            $table->string('device_fingerprint');
            $table->string('device_name', 100)->nullable();
            $table->string('device_type', 20); // mobile, tablet, desktop

            // System info
            $table->string('os_name', 50)->nullable();
            $table->string('os_version', 20)->nullable();
            $table->string('browser_name', 50)->nullable();
            $table->string('browser_version', 20)->nullable();
            $table->string('app_version', 20)->nullable();

            // Push notifications
            $table->string('push_token', 500)->nullable();

            // Trust status
            $table->boolean('is_trusted')->default(false);
            $table->boolean('is_blocked')->default(false);

            // Activity tracking
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->ipAddress('last_ip')->nullable();
            $table->json('last_location')->nullable();

            $table->timestamps();

            // Foreign key
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Indexes
            $table->index('user_id');
            $table->index('device_fingerprint');
            $table->index(['user_id', 'is_trusted']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
