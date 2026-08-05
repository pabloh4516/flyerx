<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Wallet\Entities;

use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Enums\WithdrawalStatus;
use App\Domain\Wallet\Events\WithdrawalCompleted;
use App\Domain\Wallet\Events\WithdrawalCreated;
use App\Domain\Wallet\Events\WithdrawalFailed;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class WithdrawalTest extends TestCase
{
    private string $withdrawalId = '550e8400-e29b-41d4-a716-446655440000';
    private string $walletId = '660e8400-e29b-41d4-a716-446655440001';
    private string $idempotencyKey = 'idem-key-123';

    #[Test]
    public function it_creates_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        $this->assertEquals($this->withdrawalId, $withdrawal->getId());
        $this->assertEquals($this->walletId, $withdrawal->getWalletId());
        $this->assertEquals(100.00, $withdrawal->getAmount()->getDecimal());
        $this->assertEquals(2.00, $withdrawal->getFeeAmount()->getDecimal());
        $this->assertEquals(98.00, $withdrawal->getNetAmount()->getDecimal());
        $this->assertEquals(WithdrawalStatus::PENDING, $withdrawal->getStatus());
        $this->assertEquals($this->idempotencyKey, $withdrawal->getIdempotencyKey());
        $this->assertEquals('eulen', $withdrawal->getProvider());
        $this->assertEquals(PixKeyType::CPF, $withdrawal->getPixKey()->getType());
    }

    #[Test]
    public function it_records_created_event(): void
    {
        $withdrawal = $this->createWithdrawal();

        $events = $withdrawal->pullDomainEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(WithdrawalCreated::class, $events[0]);
        $this->assertEquals($this->withdrawalId, $events[0]->getAggregateId());
    }

    #[Test]
    public function it_sets_recipient_info(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->setRecipientInfo('João Silva', '12345678901');

        $this->assertEquals('João Silva', $withdrawal->getRecipientName());
        $this->assertEquals('12345678901', $withdrawal->getRecipientDocument());
    }

    #[Test]
    public function it_sets_provider_data(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->setProviderData(
            providerId: 'prov-123',
            providerStatus: 'processing',
            endToEndId: 'E2E123456',
            providerResponse: ['key' => 'value']
        );

        $this->assertEquals('prov-123', $withdrawal->getProviderId());
        $this->assertEquals('processing', $withdrawal->getProviderStatus());
        $this->assertEquals('E2E123456', $withdrawal->getEndToEndId());
        $this->assertEquals(['key' => 'value'], $withdrawal->getProviderResponse());
    }

    #[Test]
    public function it_approves_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->approve('admin-user-id');

        $this->assertEquals(WithdrawalStatus::APPROVED, $withdrawal->getStatus());
        $this->assertEquals('admin-user-id', $withdrawal->getApprovedBy());
        $this->assertNotNull($withdrawal->getApprovedAt());
    }

    #[Test]
    public function it_auto_approves_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->autoApprove();

        $this->assertEquals(WithdrawalStatus::APPROVED, $withdrawal->getStatus());
        $this->assertEquals('system', $withdrawal->getApprovedBy());
    }

    #[Test]
    public function it_does_not_approve_non_pending_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->reject('Test');

        $withdrawal->approve('admin');

        // Should still be rejected
        $this->assertEquals(WithdrawalStatus::REJECTED, $withdrawal->getStatus());
    }

    #[Test]
    public function it_rejects_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->reject('Insufficient documentation');

        $this->assertEquals(WithdrawalStatus::REJECTED, $withdrawal->getStatus());
        $this->assertEquals('Insufficient documentation', $withdrawal->getFailureReason());
        $this->assertNotNull($withdrawal->getFailedAt());
    }

    #[Test]
    public function it_marks_as_processing(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->approve('admin');

        $withdrawal->markAsProcessing();

        $this->assertEquals(WithdrawalStatus::PROCESSING, $withdrawal->getStatus());
        $this->assertNotNull($withdrawal->getProcessedAt());
    }

    #[Test]
    public function it_completes_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->pullDomainEvents();

        $withdrawal->complete('txn-123');

        $this->assertEquals(WithdrawalStatus::COMPLETED, $withdrawal->getStatus());
        $this->assertEquals('txn-123', $withdrawal->getTransactionId());
        $this->assertNotNull($withdrawal->getCompletedAt());

        $events = $withdrawal->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(WithdrawalCompleted::class, $events[0]);
    }

    #[Test]
    public function it_does_not_complete_already_final_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->complete('txn-123');
        $withdrawal->pullDomainEvents();

        $withdrawal->complete('txn-456');

        $this->assertEquals('txn-123', $withdrawal->getTransactionId());
        $this->assertEmpty($withdrawal->pullDomainEvents());
    }

    #[Test]
    public function it_fails_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->pullDomainEvents();

        $withdrawal->fail('Bank rejected');

        $this->assertEquals(WithdrawalStatus::FAILED, $withdrawal->getStatus());
        $this->assertEquals('Bank rejected', $withdrawal->getFailureReason());
        $this->assertNotNull($withdrawal->getFailedAt());

        $events = $withdrawal->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(WithdrawalFailed::class, $events[0]);
    }

    #[Test]
    public function it_cancels_pending_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();

        $withdrawal->cancel();

        $this->assertEquals(WithdrawalStatus::CANCELLED, $withdrawal->getStatus());
        $this->assertEquals('Cancelled by user', $withdrawal->getFailureReason());
    }

    #[Test]
    public function it_cancels_approved_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->approve('admin');

        $withdrawal->cancel();

        $this->assertEquals(WithdrawalStatus::CANCELLED, $withdrawal->getStatus());
    }

    #[Test]
    public function it_does_not_cancel_processing_withdrawal(): void
    {
        $withdrawal = $this->createWithdrawal();
        $withdrawal->markAsProcessing();

        $withdrawal->cancel();

        // Should still be processing
        $this->assertEquals(WithdrawalStatus::PROCESSING, $withdrawal->getStatus());
    }

    #[Test]
    public function it_checks_if_pending(): void
    {
        $withdrawal = $this->createWithdrawal();

        $this->assertTrue($withdrawal->isPending());

        $withdrawal->approve('admin');

        $this->assertFalse($withdrawal->isPending());
    }

    #[Test]
    public function it_checks_if_can_be_cancelled(): void
    {
        $withdrawal = $this->createWithdrawal();
        $this->assertTrue($withdrawal->canBeCancelled());

        $withdrawal->approve('admin');
        $this->assertTrue($withdrawal->canBeCancelled());

        $withdrawal->markAsProcessing();
        $this->assertFalse($withdrawal->canBeCancelled());
    }

    #[Test]
    public function it_handles_pix_key_correctly(): void
    {
        $pixKey = new PixKey(PixKeyType::EMAIL, 'user@example.com');

        $withdrawal = Withdrawal::create(
            id: $this->withdrawalId,
            walletId: $this->walletId,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::zero(),
            pixKey: $pixKey,
            idempotencyKey: $this->idempotencyKey,
        );

        $this->assertEquals(PixKeyType::EMAIL, $withdrawal->getPixKey()->getType());
        $this->assertEquals('user@example.com', $withdrawal->getPixKey()->getValue());
    }

    private function createWithdrawal(): Withdrawal
    {
        return Withdrawal::create(
            id: $this->withdrawalId,
            walletId: $this->walletId,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::fromDecimal(2.00),
            pixKey: new PixKey(PixKeyType::CPF, '12345678901'),
            idempotencyKey: $this->idempotencyKey,
        );
    }
}
