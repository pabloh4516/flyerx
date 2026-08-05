<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Application\Wallet\Services\DepositService;
use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Payment\DTOs\CreateDepositResponse;
use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use DateTimeImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DepositTest extends TestCase
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
    public function it_creates_deposit_successfully(): void
    {
        // Mock payment provider
        $mockProvider = Mockery::mock(PaymentProviderInterface::class);
        $mockProvider->shouldReceive('createDeposit')
            ->once()
            ->andReturn(CreateDepositResponse::success(
                providerId: 'prov-123',
                status: 'pending',
                pixQrCode: 'base64-qr-code',
                pixCopyPaste: '00020126...',
                pixTxId: 'E123456',
                expiresAt: new DateTimeImmutable('+30 minutes'),
                rawResponse: []
            ));

        $this->app->instance(PaymentProviderInterface::class, $mockProvider);

        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 100.00,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'wallet_id',
                    'status',
                    'amount',
                    'fee_amount',
                    'net_amount',
                    'currency',
                    'pix' => [
                        'qr_code',
                        'copy_paste',
                        'tx_id',
                    ],
                    'expires_at',
                    'created_at',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'amount' => 100.00,
                    'currency' => 'BRL',
                ],
            ]);
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 100.00,
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_validates_minimum_amount(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 1.00, // Below minimum
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_maximum_amount(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 100000.00, // Above maximum
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_amount_is_required(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/deposits', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_validates_amount_is_numeric(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 'not-a-number',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    #[Test]
    public function it_returns_existing_deposit_for_idempotent_request(): void
    {
        // Create existing deposit with a specific idempotency key
        $idempotencyKey = Str::uuid()->toString();
        $existingDeposit = $this->createDeposit($idempotencyKey);

        Sanctum::actingAs($this->user);

        $response = $this->withHeader('X-Idempotency-Key', $idempotencyKey)
            ->postJson('/api/v1/deposits', [
                'amount' => 100.00,
            ]);

        // Should return the existing deposit (idempotent behavior)
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $existingDeposit->getId(),
                ],
            ]);
    }

    #[Test]
    public function it_gets_deposit_by_id(): void
    {
        $deposit = $this->createDeposit();

        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/deposits/{$deposit->getId()}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $deposit->getId(),
                ],
            ]);
    }

    #[Test]
    public function it_returns_404_for_non_existent_deposit(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/deposits/' . Str::uuid()->toString());

        $response->assertStatus(404);
    }

    #[Test]
    public function it_prevents_access_to_other_users_deposits(): void
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

        // Create deposit for other user's wallet
        $deposit = $this->createDeposit(null, $otherWallet->id);

        Sanctum::actingAs($this->user);

        $response = $this->getJson("/api/v1/deposits/{$deposit->getId()}");

        $response->assertStatus(403);
    }

    #[Test]
    public function it_lists_pending_deposits(): void
    {
        // Create some deposits
        $this->createDeposit();
        $this->createDeposit();

        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/deposits/pending');

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
    public function it_cancels_pending_deposit(): void
    {
        $deposit = $this->createDeposit();

        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/deposits/{$deposit->getId()}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
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

        $response = $this->postJson('/api/v1/deposits', [
            'amount' => 100.00,
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                ],
            ]);
    }

    private function createDeposit(?string $idempotencyKey = null, ?string $walletId = null): Deposit
    {
        $depositRepository = app(DepositRepositoryInterface::class);

        $deposit = Deposit::create(
            id: $depositRepository->nextIdentity()->toString(),
            walletId: $walletId ?? $this->wallet->id,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::zero(),
            idempotencyKey: $idempotencyKey ?? Str::uuid()->toString(),
        );

        $depositRepository->save($deposit);

        return $deposit;
    }
}
