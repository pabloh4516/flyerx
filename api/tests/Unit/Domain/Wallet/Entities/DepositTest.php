<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Wallet\Entities;

use App\Domain\Wallet\Entities\Deposit;
use App\Domain\Wallet\Enums\DepositStatus;
use App\Domain\Wallet\Events\DepositCompleted;
use App\Domain\Wallet\Events\DepositCreated;
use App\Domain\Wallet\Events\DepositFailed;
use App\Domain\Wallet\ValueObjects\Money;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class DepositTest extends TestCase
{
    private string $depositId = '550e8400-e29b-41d4-a716-446655440000';
    private string $walletId = '660e8400-e29b-41d4-a716-446655440001';
    private string $idempotencyKey = 'idem-key-123';

    #[Test]
    public function it_creates_deposit(): void
    {
        $deposit = Deposit::create(
            id: $this->depositId,
            walletId: $this->walletId,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::fromDecimal(2.00),
            idempotencyKey: $this->idempotencyKey,
        );

        $this->assertEquals($this->depositId, $deposit->getId());
        $this->assertEquals($this->walletId, $deposit->getWalletId());
        $this->assertEquals(100.00, $deposit->getAmount()->getDecimal());
        $this->assertEquals(2.00, $deposit->getFeeAmount()->getDecimal());
        $this->assertEquals(98.00, $deposit->getNetAmount()->getDecimal());
        $this->assertEquals(DepositStatus::PENDING, $deposit->getStatus());
        $this->assertEquals($this->idempotencyKey, $deposit->getIdempotencyKey());
        $this->assertEquals('pix', $deposit->getPaymentMethod());
        $this->assertEquals('eulen', $deposit->getProvider());
    }

    #[Test]
    public function it_records_created_event(): void
    {
        $deposit = Deposit::create(
            id: $this->depositId,
            walletId: $this->walletId,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::zero(),
            idempotencyKey: $this->idempotencyKey,
        );

        $events = $deposit->pullDomainEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(DepositCreated::class, $events[0]);
        $this->assertEquals($this->depositId, $events[0]->getAggregateId());
    }

    #[Test]
    public function it_sets_pix_data(): void
    {
        $deposit = $this->createDeposit();
        $expiresAt = new DateTimeImmutable('+30 minutes');

        $deposit->setPixData(
            qrCode: 'base64-qr-code',
            copyPaste: '00020126580014br.gov.bcb.pix...',
            txId: 'E123456789',
            expiresAt: $expiresAt
        );

        $this->assertEquals('base64-qr-code', $deposit->getPixQrCode());
        $this->assertEquals('00020126580014br.gov.bcb.pix...', $deposit->getPixCopyPaste());
        $this->assertEquals('E123456789', $deposit->getPixTxId());
        $this->assertEquals($expiresAt, $deposit->getPixExpiresAt());
        $this->assertEquals(DepositStatus::AWAITING_PAYMENT, $deposit->getStatus());
    }

    #[Test]
    public function it_sets_provider_data(): void
    {
        $deposit = $this->createDeposit();

        $deposit->setProviderData(
            providerId: 'provider-123',
            providerStatus: 'pending',
            providerResponse: ['key' => 'value']
        );

        $this->assertEquals('provider-123', $deposit->getProviderId());
        $this->assertEquals('pending', $deposit->getProviderStatus());
        $this->assertEquals(['key' => 'value'], $deposit->getProviderResponse());
    }

    #[Test]
    public function it_marks_as_processing(): void
    {
        $deposit = $this->createDeposit();

        $deposit->markAsProcessing();

        $this->assertEquals(DepositStatus::PROCESSING, $deposit->getStatus());
        $this->assertNotNull($deposit->getPaidAt());
    }

    #[Test]
    public function it_completes_deposit(): void
    {
        $deposit = $this->createDeposit();
        $deposit->pullDomainEvents();

        $deposit->complete('txn-123');

        $this->assertEquals(DepositStatus::COMPLETED, $deposit->getStatus());
        $this->assertEquals('txn-123', $deposit->getTransactionId());
        $this->assertNotNull($deposit->getConfirmedAt());

        $events = $deposit->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DepositCompleted::class, $events[0]);
    }

    #[Test]
    public function it_does_not_complete_already_final_deposit(): void
    {
        $deposit = $this->createDeposit();
        $deposit->complete('txn-123');
        $deposit->pullDomainEvents();

        $deposit->complete('txn-456');

        // Should still have original transaction ID
        $this->assertEquals('txn-123', $deposit->getTransactionId());
        // Should not record another event
        $this->assertEmpty($deposit->pullDomainEvents());
    }

    #[Test]
    public function it_fails_deposit(): void
    {
        $deposit = $this->createDeposit();
        $deposit->pullDomainEvents();

        $deposit->fail('Payment declined');

        $this->assertEquals(DepositStatus::FAILED, $deposit->getStatus());
        $this->assertEquals('Payment declined', $deposit->getFailureReason());
        $this->assertNotNull($deposit->getFailedAt());

        $events = $deposit->pullDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(DepositFailed::class, $events[0]);
    }

    #[Test]
    public function it_expires_deposit(): void
    {
        $deposit = $this->createDeposit();

        $deposit->expire();

        $this->assertEquals(DepositStatus::EXPIRED, $deposit->getStatus());
        $this->assertEquals('Payment expired', $deposit->getFailureReason());
    }

    #[Test]
    public function it_cancels_deposit(): void
    {
        $deposit = $this->createDeposit();

        $deposit->cancel();

        $this->assertEquals(DepositStatus::CANCELLED, $deposit->getStatus());
        $this->assertEquals('Cancelled by user', $deposit->getFailureReason());
    }

    #[Test]
    public function it_checks_if_pending(): void
    {
        $deposit = $this->createDeposit();

        $this->assertTrue($deposit->isPending());

        $deposit->complete('txn-123');

        $this->assertFalse($deposit->isPending());
    }

    #[Test]
    public function it_checks_if_expired(): void
    {
        $deposit = $this->createDeposit();
        $deposit->setPixData(
            qrCode: 'qr',
            copyPaste: 'copy',
            txId: 'tx',
            expiresAt: new DateTimeImmutable('-1 hour')
        );

        $this->assertTrue($deposit->isExpired());
    }

    #[Test]
    public function it_is_not_expired_without_expiry_date(): void
    {
        $deposit = $this->createDeposit();

        $this->assertFalse($deposit->isExpired());
    }

    #[Test]
    public function it_is_not_expired_with_future_expiry(): void
    {
        $deposit = $this->createDeposit();
        $deposit->setPixData(
            qrCode: 'qr',
            copyPaste: 'copy',
            txId: 'tx',
            expiresAt: new DateTimeImmutable('+1 hour')
        );

        $this->assertFalse($deposit->isExpired());
    }

    private function createDeposit(): Deposit
    {
        return Deposit::create(
            id: $this->depositId,
            walletId: $this->walletId,
            amount: Money::fromDecimal(100.00),
            feeAmount: Money::zero(),
            idempotencyKey: $this->idempotencyKey,
        );
    }
}
