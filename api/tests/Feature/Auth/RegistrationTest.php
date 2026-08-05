<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'John Doe',
            'tax_number' => '529.982.247-25',
            'accept_terms' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'email',
                    'full_name',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'user@example.com',
            'full_name' => 'John Doe',
            'status' => 'pending',
        ]);
    }

    #[Test]
    public function registration_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'invalid-email',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'John Doe',
            'tax_number' => '529.982.247-25',
            'accept_terms' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function registration_fails_with_weak_password(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'weak',
            'password_confirmation' => 'weak',
            'full_name' => 'John Doe',
            'tax_number' => '529.982.247-25',
            'accept_terms' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    #[Test]
    public function registration_fails_with_invalid_cpf(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'John Doe',
            'tax_number' => '123.456.789-00',
            'accept_terms' => true,
        ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function registration_fails_without_accepting_terms(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'John Doe',
            'tax_number' => '529.982.247-25',
            'accept_terms' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['accept_terms']);
    }

    #[Test]
    public function registration_fails_with_duplicate_email(): void
    {
        // First registration
        $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'John Doe',
            'tax_number' => '529.982.247-25',
            'accept_terms' => true,
        ]);

        // Second registration with same email
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'user@example.com',
            'password' => 'SecureP@ss1',
            'password_confirmation' => 'SecureP@ss1',
            'full_name' => 'Jane Doe',
            'tax_number' => '11222333000181',
            'accept_terms' => true,
        ]);

        $response->assertStatus(422);
    }
}
