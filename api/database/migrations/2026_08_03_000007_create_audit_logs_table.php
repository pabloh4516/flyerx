<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Actor
            $table->string('actor_type', 20); // user, admin, system, provider
            $table->uuid('actor_id')->nullable();

            // Action
            $table->string('action', 100);
            $table->string('resource_type', 50);
            $table->uuid('resource_id')->nullable();

            // Change tracking
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Request context
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('request_id', 100)->nullable();

            // Metadata
            $table->json('metadata')->default('{}');

            $table->timestamp('created_at');

            // Indexes
            $table->index(['actor_type', 'actor_id']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
