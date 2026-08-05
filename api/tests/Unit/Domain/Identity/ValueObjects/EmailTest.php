<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Identity\ValueObjects;

use App\Domain\Identity\Exceptions\InvalidEmailException;
use App\Domain\Identity\ValueObjects\Email;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class EmailTest extends TestCase
{
    #[Test]
    public function it_creates_valid_email(): void
    {
        $email = Email::fromString('user@example.com');

        $this->assertSame('user@example.com', $email->toString());
    }

    #[Test]
    public function it_normalizes_email_to_lowercase(): void
    {
        $email = Email::fromString('User@Example.COM');

        $this->assertSame('user@example.com', $email->toString());
    }

    #[Test]
    public function it_trims_whitespace(): void
    {
        $email = Email::fromString('  user@example.com  ');

        $this->assertSame('user@example.com', $email->toString());
    }

    #[Test]
    #[DataProvider('invalidEmails')]
    public function it_throws_exception_for_invalid_email(string $invalidEmail): void
    {
        $this->expectException(InvalidEmailException::class);

        Email::fromString($invalidEmail);
    }

    public static function invalidEmails(): array
    {
        return [
            'empty string' => [''],
            'no at symbol' => ['userexample.com'],
            'no domain' => ['user@'],
            'no local part' => ['@example.com'],
            'spaces in middle' => ['user @example.com'],
            'double at' => ['user@@example.com'],
        ];
    }

    #[Test]
    public function it_extracts_local_part(): void
    {
        $email = Email::fromString('user@example.com');

        $this->assertSame('user', $email->getLocalPart());
    }

    #[Test]
    public function it_extracts_domain(): void
    {
        $email = Email::fromString('user@example.com');

        $this->assertSame('example.com', $email->getDomain());
    }

    #[Test]
    public function it_compares_equality(): void
    {
        $email1 = Email::fromString('user@example.com');
        $email2 = Email::fromString('USER@EXAMPLE.COM');
        $email3 = Email::fromString('other@example.com');

        $this->assertTrue($email1->equals($email2));
        $this->assertFalse($email1->equals($email3));
    }
}
