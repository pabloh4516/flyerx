<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Identity\ValueObjects;

use App\Domain\Identity\Exceptions\WeakPasswordException;
use App\Domain\Identity\ValueObjects\Password;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class PasswordTest extends TestCase
{
    #[Test]
    public function it_creates_password_from_plain_text(): void
    {
        $password = Password::fromPlainText('SecureP@ss1');

        $this->assertNotEmpty($password->getHash());
        $this->assertTrue(str_starts_with($password->getHash(), '$argon2id$'));
    }

    #[Test]
    public function it_creates_password_from_hash(): void
    {
        $hash = password_hash('test', PASSWORD_ARGON2ID);
        $password = Password::fromHash($hash);

        $this->assertSame($hash, $password->getHash());
    }

    #[Test]
    public function it_verifies_correct_password(): void
    {
        $password = Password::fromPlainText('SecureP@ss1');

        $this->assertTrue($password->verify('SecureP@ss1'));
    }

    #[Test]
    public function it_rejects_wrong_password(): void
    {
        $password = Password::fromPlainText('SecureP@ss1');

        $this->assertFalse($password->verify('WrongPassword'));
    }

    #[Test]
    #[DataProvider('weakPasswords')]
    public function it_throws_exception_for_weak_password(string $weakPassword): void
    {
        $this->expectException(WeakPasswordException::class);

        Password::fromPlainText($weakPassword);
    }

    public static function weakPasswords(): array
    {
        return [
            'too short' => ['Sh0rt!'],
            'no uppercase' => ['lowercase1!'],
            'no lowercase' => ['UPPERCASE1!'],
            'no number' => ['NoNumber!a'],
            'no special char' => ['NoSpecial1a'],
        ];
    }

    #[Test]
    public function it_returns_protected_string_representation(): void
    {
        $password = Password::fromPlainText('SecureP@ss1');

        $this->assertSame('[PROTECTED]', (string) $password);
    }

    #[Test]
    public function it_compares_equality_by_hash(): void
    {
        $password1 = Password::fromPlainText('SecureP@ss1');
        $password2 = Password::fromHash($password1->getHash());
        $password3 = Password::fromPlainText('SecureP@ss1');

        $this->assertTrue($password1->equals($password2));
        // Different hashes even for same password due to salt
        $this->assertFalse($password1->equals($password3));
    }
}
