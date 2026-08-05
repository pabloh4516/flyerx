<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WithdrawalTest extends TestCase
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
    public function it_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/withdrawals', [
            'amount' => 100.00,
            'pix_key_type' => 'cpf',
            'pix_key' => '12345678901',
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_validates_required_fields(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/withdrawals', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount', 'pix_key_type', 'pix_key']);
    }

    #[Test]
    public function it_validates_minimum_amount(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/withdrawals', [
            'amount' => 1.00, // Below minimum
            'pix_key_type' => 'cpf',
            'pix_key' => '12345678901',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_maximum_amount(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/withdrawals', [
            'amount' => 50000.00, // Above maximum
            'pix_key_type' => 'cpf',
            'pix_key' => '12345678901',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_pix_key_type(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/withdrawals', [
            'amount' => 100.00,
            'pix_key_type' => 'invalid_type',
            'pix_key' => '12345678901',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['pix_key_type']);
    }

    #[Test]
    public function it_gets_withdrawal_by_id(): void
    {
        $withdrawal = $this->createWithdrawal();

        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/withdrawals/{$withdrawal->getId()}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $withdrawal->getId(),
                ],
            ]);
    }

    #[Test]
    public function it_returns_404_for_non_existent_withdrawal(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/withdrawals/' . Str::uuid()->toString());

        $response->assertStatus(404);
    }

    #[Test]
    public function it_prevents_access_to_other_users_withdrawals(): void
    {
        // Create another user
        $otherUser = UserModel::create([
            'id' => Str::uuid()->toString(),
            'full_name' => 'Other User',
            'email' => 'other@example.com',
            'password_hash' => password_hash('password', PASSWORD_BCRYPT),
            'tax_number' => '98765432100',
            'tax_number_type' => 'CPF',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        // Create other user's wallet
        $otherWallet = WalletModel::create([
            'id' => Str::uuid()->toString(),
            'user_id' => $otherUser->id,
            'currency' => 'BRL',
            'status' => 'active',
            'daily_withdrawal_limit' => 500000,
            'monthly_withdrawal_limit' => 5000000,
        ]);

        // Create withdrawal for other user's wallet
        $withdrawal = $this->createWithdrawal(null, $otherWallet->id);

        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/withdrawals/{$withdrawal->getId()}");

        $response->assertStatus(403);
    }

    #[Test]
    public function it_lists_pending_withdrawals(): void
    {
        // Create some withdrawals
        $this->createWithdrawal();
        $this->createWithdrawal();

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/withdrawals/pending');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'status',
                        'amount',
                    ],
                ],
            ]);
    }

    #[Test]
    public function it_cancels_pending_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/withdrawals/{$withdrawal->getId()}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    #[Test]
    public function it_estimates_withdrawal_fee(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/withdrawals/estimate-fee', [
            'amount' => 500.00,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'amount',
                    'fee',
                    'net_amount',
                    'currency',
                ],
            ]);
    }

    #[Test]
    public function it_handles_wallet_not_found(): void
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

        $response = $this->postJson('/api/v1/withdrawals', [
            'amount' => 100.00,
            'pix_key_type' => 'cpf',
            'pix_key' => '12345678901',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                ],
            ]);
    }

    #[Test]
    public function it_accepts_different_pix_key_types(): void
    {
        $keyTypes = [
            ['type' => 'cpf', 'value' => '12345678901'],
            ['type' => 'cnpj', 'value' => '12345678000199'],
            ['type' => 'email', 'value' => 'recipient@example.com'],
            ['type' => 'phone', 'value' => '5511999999999'],
            ['type' => 'random', 'value' => '123e4567-e89b-12d3-a456-426614174000'],
        ];

        Sanctum::actingAs($this->user);

        foreach ($keyTypes as $keyData) {
            // We expect validation to pass for all types
            $response = $this->postJson('/api/v1/withdrawals', [
                'amount' => 100.00,
                'pix_key_type' => $keyData['type'],
                'pix_key' => $keyData['value'],
            ]);

            // Should not have validation errors for pix_key_type
            $this->assertNotContains('pix_key_type', array_keys($response->json('errors') ?? []));
        }
    }

    private function createWithdrawal(?string $idempotencyKey = null, ?string $walletId = null): Withdrawal
    {
        $withdrawalRepository = app(WithdrawalRepositoryInterface::class);

        $withdrawal = Withdrawal::create(
            id: $withdrawalRepository->nextIdentity()->toString(),
            walletId: $walletId ?? $this->wallet->id,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::fromDecimal(1.50),
            pixKey: new PixKey(PixKeyType::CPF, '12345678901'),
            idempotencyKey: $idempotencyKey ?? Str::uuid()->toString(),
        );

        $withdrawalRepository->save($withdrawal);

        return $withdrawal;
    }
}
