<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\Password;
use App\Domain\Identity\ValueObjects\TaxNumber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_can_login_with_valid_credentials(): void
    {
        $this->createAndVerifyUser('user@example.com', 'SecureP@ss1');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'refresh_token',
                'expires_in',
                'token_type',
                'user' => [
                    'id',
                    'email',
                    'full_name',
                ],
            ]);
    }

    #[Test]
    public function login_fails_with_wrong_password(): void
    {
        $this->createAndVerifyUser('user@example.com', 'SecureP@ss1');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'WrongPassword1!',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Credenciais inválidas.',
            ]);
    }

    #[Test]
    public function login_fails_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'SecureP@ss1',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Credenciais inválidas.',
            ]);
    }

    #[Test]
    public function unverified_user_cannot_login(): void
    {
        // Create user without verifying email
        $this->createUser('user@example.com', 'SecureP@ss1');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
        ]);

        $response->assertStatus(401);
    }

    #[Test]
    public function user_can_refresh_token(): void
    {
        $this->createAndVerifyUser('user@example.com', 'SecureP@ss1');

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
        ]);

        $refreshToken = $loginResponse->json('refresh_token');

        $response = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $refreshToken,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'access_token',
                'refresh_token',
                'expires_in',
            ]);
    }

    #[Test]
    public function user_can_logout(): void
    {
        $this->createAndVerifyUser('user@example.com', 'SecureP@ss1');

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
        ]);

        $accessToken = $loginResponse->json('access_token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $accessToken)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
    }

    private function createUser(string $email, string $password): void
    {
        $user = User::register(
            id: Uuid::uuid4()->toString(),
            email: Email::fromString($email),
            password: Password::fromPlainText($password),
            fullName: 'Test User',
            taxNumber: TaxNumber::fromString('52998224725'),
        );

        app(\App\Domain\Identity\Repositories\UserRepositoryInterface::class)->save($user);
    }

    private function createAndVerifyUser(string $email, string $password): void
    {
        $user = User::register(
            id: Uuid::uuid4()->toString(),
            email: Email::fromString($email),
            password: Password::fromPlainText($password),
            fullName: 'Test User',
            taxNumber: TaxNumber::fromString('52998224725'),
        );

        $user->verifyEmail();

        app(\App\Domain\Identity\Repositories\UserRepositoryInterface::class)->save($user);
    }
}
