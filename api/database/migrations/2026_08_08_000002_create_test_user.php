<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    public function up(): void
    {
        // Verificar se já existe
        $exists = DB::table('users')
            ->where('email', 'teste@flyerx.com')
            ->exists();

        if ($exists) {
            return;
        }

        $userId = Uuid::uuid4()->toString();

        // Criar usuário de teste
        DB::table('users')->insert([
            'id' => $userId,
            'email' => 'teste@flyerx.com',
            'password' => Hash::make('Teste@123'),
            'full_name' => 'Usuário Teste',
            'status' => 'active',
            'kyc_level' => 'basic',
            'two_factor_enabled' => false,
            'email_verified_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Criar wallet
        DB::table('wallets')->insert([
            'id' => Uuid::uuid4()->toString(),
            'user_id' => $userId,
            'currency' => 'BRL',
            'status' => 'active',
            'daily_withdrawal_limit' => 500000,
            'monthly_withdrawal_limit' => 5000000,
            'metadata' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        $user = DB::table('users')
            ->where('email', 'teste@flyerx.com')
            ->first();

        if ($user) {
            DB::table('wallets')->where('user_id', $user->id)->delete();
            DB::table('users')->where('id', $user->id)->delete();
        }
    }
};
