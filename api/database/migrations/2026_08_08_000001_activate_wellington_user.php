<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    public function up(): void
    {
        // Ativar usuário
        $user = DB::table('users')
            ->where('email', 'welligtoncardoso4516@gmail.com')
            ->first();

        if (!$user) {
            return;
        }

        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'status' => 'active',
                'email_verified_at' => now(),
            ]);

        // Criar wallet se não existir
        $walletExists = DB::table('wallets')
            ->where('user_id', $user->id)
            ->exists();

        if (!$walletExists) {
            DB::table('wallets')->insert([
                'id' => Uuid::uuid4()->toString(),
                'user_id' => $user->id,
                'currency' => 'BRL',
                'status' => 'active',
                'daily_withdrawal_limit' => 500000, // 5000.00 em centavos
                'monthly_withdrawal_limit' => 5000000, // 50000.00 em centavos
                'metadata' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Não reverter
    }
};
