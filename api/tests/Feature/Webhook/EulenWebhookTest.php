<?php

declare(strict_types=1);

namespace Tests\Feature\Webhook;

use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Enums\WithdrawalStatus;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use App\Infrastructure\Persistence\Eloquent\Models\WalletModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EulenWebhookTest extends TestCase
{
    use RefreshDatabase;

    private WalletModel $wallet;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $user = UserModel::create([
            'id' => Str::uuid()->toString(),
            'full_name' => 'Test User',
            'email' => 'test@example.com',
            'password_hash' => password_hash('password', PASSWORD_BCRYPT),
            'tax_number' => '12345678901',
            'tax_number_type' => 'CPF',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        // Create test wallet
        $this->wallet = WalletModel::create([
            'id' => Str::uuid()->toString(),
            'user_id' => $user->id,
            'currency' => 'BRL',
            'status' => 'active',
            'daily_withdrawal_limit' => 500000,
            'monthly_withdrawal_limit' => 5000000,
        ]);

        // Disable webhook signature verification for business logic tests
        Config::set('services.eulen.webhook_secret', null);
        Config::set('services.eulen.webhook_signature_validation', false);
    }

    /**
     * Helper to send a signed webhook request.
     *
     * @param array<string, mixed> $payload
     * @param string $secret
     * @param int|null $timestamp Unix timestamp (null = current time)
     * @return \Illuminate\Testing\TestResponse
     */
    private function sendSignedWebhook(array $payload, string $secret, ?int $timestamp = null): \Illuminate\Testing\TestResponse
    {
        $timestamp = $timestamp ?? time();
        $jsonPayload = json_encode($payload);
        $signature = hash_hmac('sha256', $timestamp . '.' . $jsonPayload, $secret);

        return $this->postJson(
            '/api/webhooks/eulen',
            $payload,
            [
                'X-Eulen-Signature' => $signature,
                'X-Eulen-Timestamp' => (string) $timestamp,
                'Content-Type' => 'application/json',
            ]
        );
    }

    #[Test]
    public function it_handles_deposit_confirmed_webhook(): void
    {
        $deposit = $this->createDeposit();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.confirmed',
            'data' => [
                'id' => $deposit->getProviderId(),
                'pix_tx_id' => $deposit->getPixTxId(),
                'status' => 'paid',
                'amount' => 100.00,
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    #[Test]
    public function it_handles_deposit_paid_webhook(): void
    {
        $deposit = $this->createDeposit();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.paid',
            'data' => [
                'id' => $deposit->getProviderId(),
                'status' => 'paid',
            ],
        ]);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_handles_deposit_expired_webhook(): void
    {
        $deposit = $this->createDeposit();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.expired',
            'data' => [
                'id' => $deposit->getProviderId(),
                'status' => 'expired',
            ],
        ]);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_handles_deposit_failed_webhook(): void
    {
        $deposit = $this->createDeposit();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.failed',
            'data' => [
                'id' => $deposit->getProviderId(),
                'status' => 'failed',
                'error_message' => 'Payment declined',
            ],
        ]);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_handles_withdrawal_completed_webhook(): void
    {
        $withdrawal = $this->createWithdrawal();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.withdrawal.completed',
            'data' => [
                'id' => $withdrawal->getProviderId(),
                'status' => 'completed',
                'end_to_end_id' => 'E2E123456789',
            ],
        ]);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_handles_withdrawal_failed_webhook(): void
    {
        $withdrawal = $this->createWithdrawal();

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.withdrawal.failed',
            'data' => [
                'id' => $withdrawal->getProviderId(),
                'status' => 'failed',
                'error_message' => 'Bank rejected',
            ],
        ]);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_returns_404_for_non_existent_deposit(): void
    {
        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.confirmed',
            'data' => [
                'id' => 'non-existent-id',
            ],
        ]);

        $response->assertStatus(404);
    }

    #[Test]
    public function it_returns_404_for_non_existent_withdrawal(): void
    {
        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.withdrawal.completed',
            'data' => [
                'id' => 'non-existent-id',
            ],
        ]);

        $response->assertStatus(404);
    }

    #[Test]
    public function it_handles_unknown_event(): void
    {
        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'unknown.event',
            'data' => [
                'id' => 'some-id',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Event not handled',
            ]);
    }

    #[Test]
    public function it_returns_400_for_missing_identifier(): void
    {
        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.confirmed',
            'data' => [
                // No id or tx_id
            ],
        ]);

        $response->assertStatus(400);
    }

    // ========================================================================
    // Signature Validation Tests
    // ========================================================================

    #[Test]
    public function it_rejects_webhook_without_signature_when_validation_enabled(): void
    {
        Config::set('services.eulen.webhook_secret', 'test-secret-key');
        Config::set('services.eulen.webhook_signature_validation', true);

        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'pix.deposit.confirmed',
            'data' => [
                'id' => 'test-id',
            ],
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_without_timestamp_when_validation_enabled(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $payload = json_encode([
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => 'test-id'],
        ]);

        // Send signature without timestamp
        $signature = hash_hmac('sha256', time() . '.' . $payload, $secret);

        $response = $this->postJson(
            '/api/webhooks/eulen',
            json_decode($payload, true),
            [
                'X-Eulen-Signature' => $signature,
                // Missing X-Eulen-Timestamp header
            ]
        );

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_with_invalid_signature(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $timestamp = time();

        $response = $this->postJson(
            '/api/webhooks/eulen',
            [
                'event' => 'pix.deposit.confirmed',
                'data' => ['id' => 'test-id'],
            ],
            [
                'X-Eulen-Signature' => 'invalid-signature-value',
                'X-Eulen-Timestamp' => (string) $timestamp,
            ]
        );

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_with_tampered_payload(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        // Generate signature for one payload
        $originalPayload = ['event' => 'pix.deposit.confirmed', 'data' => ['id' => 'original-id']];
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp . '.' . json_encode($originalPayload), $secret);

        // Send different payload with the original signature
        $tamperedPayload = ['event' => 'pix.deposit.confirmed', 'data' => ['id' => 'tampered-id']];

        $response = $this->postJson(
            '/api/webhooks/eulen',
            $tamperedPayload,
            [
                'X-Eulen-Signature' => $signature,
                'X-Eulen-Timestamp' => (string) $timestamp,
            ]
        );

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_with_expired_timestamp_replay_attack(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $payload = [
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => 'test-id'],
        ];

        // Timestamp older than 5 minutes (301 seconds ago)
        $oldTimestamp = time() - 301;

        $response = $this->sendSignedWebhook($payload, $secret, $oldTimestamp);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_with_future_timestamp_replay_attack(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $payload = [
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => 'test-id'],
        ];

        // Timestamp 6 minutes in the future
        $futureTimestamp = time() + 360;

        $response = $this->sendSignedWebhook($payload, $secret, $futureTimestamp);

        $response->assertStatus(401);
    }

    #[Test]
    public function it_accepts_webhook_with_timestamp_within_tolerance(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $deposit = $this->createDeposit();
        $payload = [
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => $deposit->getProviderId()],
        ];

        // Timestamp 4 minutes ago (within 5-minute tolerance)
        $validTimestamp = time() - 240;

        $response = $this->sendSignedWebhook($payload, $secret, $validTimestamp);

        $response->assertStatus(200);
    }

    #[Test]
    public function it_accepts_valid_webhook_signature(): void
    {
        $secret = 'test-secret-key-abc123';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $deposit = $this->createDeposit();
        $payload = [
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => $deposit->getProviderId()],
        ];

        $response = $this->sendSignedWebhook($payload, $secret);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    #[Test]
    public function it_rejects_webhook_signed_with_wrong_secret(): void
    {
        Config::set('services.eulen.webhook_secret', 'correct-secret');
        Config::set('services.eulen.webhook_signature_validation', true);

        $payload = [
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => 'test-id'],
        ];

        // Sign with wrong secret
        $response = $this->sendSignedWebhook($payload, 'wrong-secret');

        $response->assertStatus(401);
    }

    #[Test]
    public function it_rejects_webhook_with_non_numeric_timestamp(): void
    {
        $secret = 'test-secret-key';
        Config::set('services.eulen.webhook_secret', $secret);
        Config::set('services.eulen.webhook_signature_validation', true);

        $payload = json_encode([
            'event' => 'pix.deposit.confirmed',
            'data' => ['id' => 'test-id'],
        ]);

        $signature = hash_hmac('sha256', 'invalid-timestamp.' . $payload, $secret);

        $response = $this->postJson(
            '/api/webhooks/eulen',
            json_decode($payload, true),
            [
                'X-Eulen-Signature' => $signature,
                'X-Eulen-Timestamp' => 'invalid-timestamp',
            ]
        );

        $response->assertStatus(401);
    }

    #[Test]
    public function it_skips_validation_when_disabled(): void
    {
        Config::set('services.eulen.webhook_secret', 'test-secret');
        Config::set('services.eulen.webhook_signature_validation', false);

        // Send without any signature headers
        $response = $this->postJson('/api/webhooks/eulen', [
            'event' => 'unknown.event',
            'data' => ['id' => 'test-id'],
        ]);

        // Should pass through to handler (unknown event returns 200 with message)
        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Event not handled']);
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

        // Set provider data
        $deposit->setProviderData(
            'provider-' . Str::uuid()->toString(),
            'pending',
            []
        );

        $deposit->setPixData(
            'qr-code',
            'copy-paste',
            'E' . Str::random(10),
            new \DateTimeImmutable('+30 minutes')
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

        // Set provider data
        $withdrawal->setProviderData(
            'provider-' . Str::uuid()->toString(),
            'processing',
            null,
            []
        );

        $withdrawalRepository->save($withdrawal);

        return $withdrawal;
    }
}
