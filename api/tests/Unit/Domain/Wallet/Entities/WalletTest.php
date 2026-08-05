<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Wallet\Entities;

use App\Domain\Wallet\Entities\Wallet;
use App\Domain\Wallet\Enums\WalletStatus;
use App\Domain\Wallet\Events\WalletCreated;
use App\Domain\Wallet\Events\WalletSuspended;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\ValueObjects\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class WalletTest extends TestCase
{
    private string $walletId = '550e8400-e29b-41d4-a716-446655440000';
    private string $userId = '660e8400-e29b-41d4-a716-446655440001';

    #[Test]
    public function it_creates_wallet_with_default_values(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $this->assertEquals($this->walletId, $wallet->getId());
        $this->assertEquals($this->userId, $wallet->getUserId());
        $this->assertEquals('BRL', $wallet->getCurrency());
        $this->assertEquals(WalletStatus::ACTIVE, $wallet->getStatus());
        $this->assertTrue($wallet->isActive());
    }

    #[Test]
    public function it_creates_wallet_with_custom_currency(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId, 'USD');

        $this->assertEquals('USD', $wallet->getCurrency());
    }

    #[Test]
    public function it_has_default_withdrawal_limits(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $this->assertEquals(5000.00, $wallet->getDailyWithdrawalLimit()->getDecimal());
        $this->assertEquals(50000.00, $wallet->getMonthlyWithdrawalLimit()->getDecimal());
    }

    #[Test]
    public function it_records_created_event(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $events = $wallet->pullDomainEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(WalletCreated::class, $events[0]);
        $this->assertEquals($this->walletId, $events[0]->getAggregateId());
    }

    #[Test]
    public function it_can_deposit_when_active(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $this->assertTrue($wallet->canDeposit());
    }

    #[Test]
    public function it_can_withdraw_when_active(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $this->assertTrue($wallet->canWithdraw());
    }

    #[Test]
    public function it_suspends_wallet(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->pullDomainEvents(); // Clear creation event

        $wallet->suspend('Suspicious activity');

        $this->assertEquals(WalletStatus::SUSPENDED, $wallet->getStatus());
        $this->assertFalse($wallet->isActive());
        $this->assertEquals('Suspicious activity', $wallet->getMetadata()['suspended_reason']);
    }

    #[Test]
    public function it_records_suspended_event(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->pullDomainEvents(); // Clear creation event

        $wallet->suspend('Fraud detected');

        $events = $wallet->pullDomainEvents();

        $this->assertCount(1, $events);
        $this->assertInstanceOf(WalletSuspended::class, $events[0]);
    }

    #[Test]
    public function it_cannot_deposit_when_suspended(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->suspend('Test');

        $this->assertFalse($wallet->canDeposit());
    }

    #[Test]
    public function it_cannot_withdraw_when_suspended(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->suspend('Test');

        $this->assertFalse($wallet->canWithdraw());
    }

    #[Test]
    public function it_activates_suspended_wallet(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->suspend('Test');

        $wallet->activate();

        $this->assertEquals(WalletStatus::ACTIVE, $wallet->getStatus());
        $this->assertTrue($wallet->isActive());
        $this->assertArrayNotHasKey('suspended_reason', $wallet->getMetadata());
    }

    #[Test]
    public function it_does_not_re_suspend_already_suspended_wallet(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->suspend('First reason');
        $wallet->pullDomainEvents();

        $wallet->suspend('Second reason');

        // Should not record another event
        $this->assertEmpty($wallet->pullDomainEvents());
    }

    #[Test]
    public function it_does_not_re_activate_already_active_wallet(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $wallet->activate();

        // Should remain active without issues
        $this->assertTrue($wallet->isActive());
    }

    #[Test]
    public function it_updates_limits(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);

        $wallet->updateLimits(
            Money::fromDecimal(10000.00),
            Money::fromDecimal(100000.00)
        );

        $this->assertEquals(10000.00, $wallet->getDailyWithdrawalLimit()->getDecimal());
        $this->assertEquals(100000.00, $wallet->getMonthlyWithdrawalLimit()->getDecimal());
    }

    #[Test]
    public function it_throws_when_operating_on_suspended_wallet(): void
    {
        $wallet = Wallet::create($this->walletId, $this->userId);
        $wallet->suspend('Test');

        $this->expectException(WalletNotActiveException::class);

        $wallet->assertCanOperate();
    }

    #[Test]
    public function it_reconstitutes_from_persistence(): void
    {
        $wallet = Wallet::reconstitute(
            id: $this->walletId,
            userId: $this->userId,
            currency: 'BRL',
            status: WalletStatus::ACTIVE,
            dailyWithdrawalLimit: Money::fromDecimal(10000.00),
            monthlyWithdrawalLimit: Money::fromDecimal(100000.00),
            metadata: ['key' => 'value'],
            createdAt: new \DateTimeImmutable('2024-01-01'),
            updatedAt: new \DateTimeImmutable('2024-01-02')
        );

        $this->assertEquals($this->walletId, $wallet->getId());
        $this->assertEquals($this->userId, $wallet->getUserId());
        $this->assertEquals(10000.00, $wallet->getDailyWithdrawalLimit()->getDecimal());
        $this->assertEquals(['key' => 'value'], $wallet->getMetadata());

        // Reconstituted entity should not have events
        $this->assertEmpty($wallet->pullDomainEvents());
    }
}
