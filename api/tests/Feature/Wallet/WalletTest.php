<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    private UserModel $user;
    private WalletModel $wallet;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $this->user = UserModel::create([
            'id' => Str::uuid()->toString(),
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'password_hash' => password_hash('password', PASSWORD_BCRYPT),
            'tax_number' => '12345678901',
            'tax_number_type' => 'CPF',
            'email_verified_at' => now(),
            'kyc_status' => 'approved',
            'kyc_level' => 1,
            'status' => 'active',
        ]);

        // Create test wallet
        $this->wallet = WalletModel::create([
            'id' => Str::uuid()->toString(),
            'user_id' => $this->user->id,
            'currency' => 'BRL',
            'status' => 'active',
            'daily_withdrawal_limit' => 500000,
            'monthly_withdrawal_limit' => 5000000,
        ]);
    }

    #[Test]
    public function it_requires_authentication_for_wallet(): void
    {
        $response = $this->getJson('/api/v1/wallet');

        $response->assertStatus(401);
    }

    #[Test]
    public function it_returns_wallet_information(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'status',
                    'currency',
                    'balance',
                    'formatted_balance',
                    'limits' => [
                        'daily_withdrawal',
                        'monthly_withdrawal',
                    ],
                    'can_deposit',
                    'can_withdraw',
                    'created_at',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $this->wallet->id,
                    'status' => 'active',
                    'currency' => 'BRL',
                    'can_deposit' => true,
                    'can_withdraw' => true,
                ],
            ]);
    }

    #[Test]
    public function it_returns_wallet_not_found_for_user_without_wallet(): void
    {
        // Create user without wallet
        $userWithoutWallet = UserModel::create([
            'id' => Str::uuid()->toString(),
            'full_name' => 'No Wallet User',
            'email' => 'nowallet@example.com',
            'password_hash' => password_hash('password', PASSWORD_BCRYPT),
            'tax_number' => '11122233344',
            'tax_number_type' => 'CPF',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        Sanctum::actingAs($userWithoutWallet);

        $response = $this->getJson('/api/v1/wallet');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                ],
            ]);
    }

    #[Test]
    public function it_returns_wallet_balance(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet/balance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'balance',
                    'formatted',
                    'currency',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'currency' => 'BRL',
                ],
            ]);
    }

    #[Test]
    public function it_requires_authentication_for_balance(): void
    {
        $response = $this->getJson('/api/v1/wallet/balance');

        $response->assertStatus(401);
    }

    #[Test]
    public function it_returns_wallet_history(): void
    {
        // Create some transactions
        $this->createDeposit();
        $this->createWithdrawal();

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet/history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'transactions' => [
                        '*' => [
                            'id',
                            'type',
                            'status',
                            'amount',
                            'fee',
                            'net_amount',
                            'created_at',
                        ],
                    ],
                    'pagination' => [
                        'page',
                        'limit',
                        'total',
                    ],
                ],
            ]);
    }

    #[Test]
    public function it_filters_history_by_type(): void
    {
        // Create deposits and withdrawals
        $this->createDeposit();
        $this->createWithdrawal();

        Sanctum::actingAs($this->user);

        // Filter only deposits
        $response = $this->getJson('/api/v1/wallet/history?type=deposit');

        $response->assertStatus(200);

        $transactions = $response->json('data.transactions');

        foreach ($transactions as $tx) {
            $this->assertEquals('deposit', $tx['type']);
        }
    }

    #[Test]
    public function it_paginates_history(): void
    {
        // Create multiple transactions
        for ($i = 0; $i < 5; $i++) {
            $this->createDeposit();
        }

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet/history?page=1&limit=2');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'page' => 1,
                        'limit' => 2,
                    ],
                ],
            ]);
    }

    #[Test]
    public function it_requires_authentication_for_history(): void
    {
        $response = $this->getJson('/api/v1/wallet/history');

        $response->assertStatus(401);
    }

    #[Test]
    public function it_shows_correct_withdrawal_limits(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'limits' => [
                        'daily_withdrawal' => 5000.00,
                        'monthly_withdrawal' => 50000.00,
                    ],
                ],
            ]);
    }

    #[Test]
    public function it_shows_suspended_wallet_status(): void
    {
        // Suspend the wallet
        $this->wallet->update([
            'status' => 'suspended',
            'suspended_at' => now(),
            'suspended_reason' => 'Test suspension',
        ]);

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/wallet');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'status' => 'suspended',
                    'can_deposit' => false,
                    'can_withdraw' => false,
                ],
            ]);
    }

    private function createDeposit(): Deposit
    {
        $depositRepository = app(DepositRepositoryInterface::class);

        $deposit = Deposit::create(
            id: $depositRepository->nextIdentity()->toString(),
            walletId: $this->wallet->id,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::zero(),
            idempotencyKey: Str::uuid()->toString(),
        );

        $depositRepository->save($deposit);

        return $deposit;
    }

    private function createWithdrawal(): Withdrawal
    {
        $withdrawalRepository = app(WithdrawalRepositoryInterface::class);

        $withdrawal = Withdrawal::create(
            id: $withdrawalRepository->nextIdentity()->toString(),
            walletId: $this->wallet->id,
            amount: Money::fromDecimal(50.00),
            feeAmount: Money::fromDecimal(1.00),
            pixKey: new PixKey(PixKeyType::CPF, '12345678901'),
            idempotencyKey: Str::uuid()->toString(),
        );

        $withdrawalRepository->save($withdrawal);

        return $withdrawal;
    }
}
