<?php

declare(strict_types=1);

namespace Tests\Traits;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Wallet\Entities\Wallet;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Illuminate\Support\Str;

trait WithTestUser
{
    protected UserModel $testUser;
    protected ?Wallet $testWallet = null;

    protected function createTestUser(array $attributes = []): UserModel
    {
        $this->testUser = UserModel::create(array_merge([
            'id' => Str::uuid()->toString(),
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password_hash' => password_hash('password123', PASSWORD_BCRYPT),
            'cpf' => '12345678901',
            'email_verified_at' => now(),
            'kyc_status' => 'approved',
            'kyc_level' => 1,
            'status' => 'active',
        ], $attributes));

        return $this->testUser;
    }

    protected function createTestWallet(?string $userId = null): Wallet
    {
        $userId = $userId ?? $this->testUser->id;

        $walletRepository = app(WalletRepositoryInterface::class);
        $walletId = $walletRepository->nextIdentity();

        $wallet = Wallet::create(
            id: $walletId->toString(),
            userId: $userId
        );

        $walletRepository->save($wallet);

        $this->testWallet = $wallet;

        return $wallet;
    }

    protected function authenticateTestUser(): void
    {
        $this->actingAs($this->testUser);
    }

    protected function createAuthenticatedUserWithWallet(): void
    {
        $this->createTestUser();
        $this->createTestWallet();
        $this->authenticateTestUser();
    }

    protected function getAuthHeaders(): array
    {
        // For API testing, we'll use simple token-based auth in tests
        return [
            'Authorization' => 'Bearer test-token',
            'Accept' => 'application/json',
        ];
    }
}
