<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Wallet\ValueObjects;

use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\ValueObjects\PixKey;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class PixKeyTest extends TestCase
{
    #[Test]
    public function it_creates_cpf_key(): void
    {
        $pixKey = new PixKey(PixKeyType::CPF, '12345678901');

        $this->assertEquals(PixKeyType::CPF, $pixKey->getType());
        $this->assertEquals('12345678901', $pixKey->getValue());
    }

    #[Test]
    public function it_creates_cnpj_key(): void
    {
        $pixKey = new PixKey(PixKeyType::CNPJ, '12345678000199');

        $this->assertEquals(PixKeyType::CNPJ, $pixKey->getType());
        $this->assertEquals('12345678000199', $pixKey->getValue());
    }

    #[Test]
    public function it_creates_email_key(): void
    {
        $pixKey = new PixKey(PixKeyType::EMAIL, 'user@example.com');

        $this->assertEquals(PixKeyType::EMAIL, $pixKey->getType());
        $this->assertEquals('user@example.com', $pixKey->getValue());
    }

    #[Test]
    public function it_creates_phone_key(): void
    {
        $pixKey = new PixKey(PixKeyType::PHONE, '5511999999999');

        $this->assertEquals(PixKeyType::PHONE, $pixKey->getType());
        $this->assertEquals('5511999999999', $pixKey->getValue());
    }

    #[Test]
    public function it_creates_random_key(): void
    {
        $uuid = '123e4567-e89b-12d3-a456-426614174000';
        $pixKey = new PixKey(PixKeyType::RANDOM, $uuid);

        $this->assertEquals(PixKeyType::RANDOM, $pixKey->getType());
        $this->assertEquals($uuid, $pixKey->getValue());
    }

    #[Test]
    public function it_normalizes_cpf_with_formatting(): void
    {
        $pixKey = PixKey::create(PixKeyType::CPF, '123.456.789-01');

        $this->assertEquals('12345678901', $pixKey->getValue());
    }

    #[Test]
    public function it_normalizes_cnpj_with_formatting(): void
    {
        $pixKey = PixKey::create(PixKeyType::CNPJ, '12.345.678/0001-99');

        $this->assertEquals('12345678000199', $pixKey->getValue());
    }

    #[Test]
    public function it_normalizes_phone_with_plus(): void
    {
        $pixKey = PixKey::create(PixKeyType::PHONE, '+55 11 99999-9999');

        $this->assertEquals('5511999999999', $pixKey->getValue());
    }

    #[Test]
    public function it_normalizes_email_to_lowercase(): void
    {
        $pixKey = PixKey::create(PixKeyType::EMAIL, 'User@Example.COM');

        $this->assertEquals('user@example.com', $pixKey->getValue());
    }

    #[Test]
    public function it_detects_cpf_from_string(): void
    {
        $pixKey = PixKey::fromString('123.456.789-01');

        $this->assertEquals(PixKeyType::CPF, $pixKey->getType());
    }

    #[Test]
    public function it_detects_cnpj_from_string(): void
    {
        $pixKey = PixKey::fromString('12.345.678/0001-99');

        $this->assertEquals(PixKeyType::CNPJ, $pixKey->getType());
    }

    #[Test]
    public function it_detects_email_from_string(): void
    {
        $pixKey = PixKey::fromString('user@example.com');

        $this->assertEquals(PixKeyType::EMAIL, $pixKey->getType());
    }

    #[Test]
    public function it_detects_random_uuid_from_string(): void
    {
        $pixKey = PixKey::fromString('123e4567-e89b-12d3-a456-426614174000');

        $this->assertEquals(PixKeyType::RANDOM, $pixKey->getType());
    }

    #[Test]
    public function it_masks_cpf(): void
    {
        $pixKey = new PixKey(PixKeyType::CPF, '12345678901');

        $masked = $pixKey->getMasked();

        $this->assertEquals('123.***.***-01', $masked);
    }

    #[Test]
    public function it_masks_cnpj(): void
    {
        $pixKey = new PixKey(PixKeyType::CNPJ, '12345678000199');

        $masked = $pixKey->getMasked();

        $this->assertEquals('12.***.***/****-99', $masked);
    }

    #[Test]
    public function it_masks_email(): void
    {
        $pixKey = new PixKey(PixKeyType::EMAIL, 'username@example.com');

        $masked = $pixKey->getMasked();

        $this->assertEquals('us***e@example.com', $masked);
    }

    #[Test]
    public function it_masks_short_email(): void
    {
        $pixKey = new PixKey(PixKeyType::EMAIL, 'ab@example.com');

        $masked = $pixKey->getMasked();

        $this->assertEquals('a***@example.com', $masked);
    }

    #[Test]
    public function it_masks_phone(): void
    {
        $pixKey = new PixKey(PixKeyType::PHONE, '5511999999999');

        $masked = $pixKey->getMasked();

        $this->assertEquals('+5511*****9999', $masked);
    }

    #[Test]
    public function it_formats_cpf(): void
    {
        $pixKey = new PixKey(PixKeyType::CPF, '12345678901');

        $formatted = $pixKey->getFormatted();

        $this->assertEquals('123.456.789-01', $formatted);
    }

    #[Test]
    public function it_formats_cnpj(): void
    {
        $pixKey = new PixKey(PixKeyType::CNPJ, '12345678000199');

        $formatted = $pixKey->getFormatted();

        $this->assertEquals('12.345.678/0001-99', $formatted);
    }

    #[Test]
    public function it_compares_equality(): void
    {
        $key1 = new PixKey(PixKeyType::CPF, '12345678901');
        $key2 = new PixKey(PixKeyType::CPF, '12345678901');
        $key3 = new PixKey(PixKeyType::CPF, '98765432100');

        $this->assertTrue($key1->equals($key2));
        $this->assertFalse($key1->equals($key3));
    }

    #[Test]
    public function it_converts_to_string(): void
    {
        $pixKey = new PixKey(PixKeyType::EMAIL, 'user@example.com');

        $this->assertEquals('user@example.com', (string) $pixKey);
        $this->assertEquals('user@example.com', $pixKey->toString());
    }

    #[Test]
    #[DataProvider('invalidPixKeyDataProvider')]
    public function it_throws_on_invalid_key(PixKeyType $type, string $value): void
    {
        $this->expectException(InvalidArgumentException::class);

        new PixKey($type, $value);
    }

    public static function invalidPixKeyDataProvider(): array
    {
        return [
            'cpf_too_short' => [PixKeyType::CPF, '1234567890'],
            'cpf_too_long' => [PixKeyType::CPF, '123456789012'],
            'cnpj_too_short' => [PixKeyType::CNPJ, '1234567800019'],
            'cnpj_too_long' => [PixKeyType::CNPJ, '123456780001990'],
            'invalid_email' => [PixKeyType::EMAIL, 'not-an-email'],
            'invalid_random' => [PixKeyType::RANDOM, 'not-a-uuid'],
        ];
    }
}
