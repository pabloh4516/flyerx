<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DebugUserCommand extends Command
{
    protected $signature = 'debug:user {email}';
    protected $description = 'Debug user data';

    public function handle(): int
    {
        $email = $this->argument('email');

        $user = DB::table('users')->where('email', $email)->first();

        if (!$user) {
            $this->error("User not found: {$email}");
            return 1;
        }

        $this->info("=== USER ===");
        $this->info(json_encode([
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'status' => $user->status,
            'kyc_level' => $user->kyc_level,
            'created_at' => $user->created_at,
        ], JSON_PRETTY_PRINT));

        $wallet = DB::table('wallets')->where('user_id', $user->id)->first();

        if ($wallet) {
            $this->info("\n=== WALLET ===");
            $this->info(json_encode([
                'id' => $wallet->id,
                'currency' => $wallet->currency,
                'status' => $wallet->status,
                'daily_limit' => $wallet->daily_withdrawal_limit,
                'monthly_limit' => $wallet->monthly_withdrawal_limit,
            ], JSON_PRETTY_PRINT));

            // Balance from ledger
            $balance = DB::table('ledger_entries')
                ->where('wallet_id', $wallet->id)
                ->sum('amount');

            $this->info("\n=== BALANCE ===");
            $this->info("Total: R$ " . number_format($balance / 100, 2, ',', '.'));

            // Transactions
            $deposits = DB::table('deposits')->where('wallet_id', $wallet->id)->count();
            $withdrawals = DB::table('withdrawals')->where('wallet_id', $wallet->id)->count();

            $this->info("\n=== TRANSACTIONS ===");
            $this->info("Deposits: {$deposits}");
            $this->info("Withdrawals: {$withdrawals}");
        } else {
            $this->warn("No wallet found for user");
        }

        return 0;
    }
}
