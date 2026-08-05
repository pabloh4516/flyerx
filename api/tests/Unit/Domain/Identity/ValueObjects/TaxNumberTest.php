<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Identity\ValueObjects;

use App\Domain\Identity\Exceptions\InvalidTaxNumberException;
use App\Domain\Identity\ValueObjects\TaxNumber;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class TaxNumberTest extends TestCase
{
    #[Test]
    public function it_creates_valid_cpf(): void
    {
        $taxNumber = TaxNumber::fromString('529.982.247-25');

        $this->assertSame('52998224725', $taxNumber->getValue());
        $this->assertSame('CPF', $taxNumber->getType());
        $this->assertTrue($taxNumber->isCpf());
        $this->assertFalse($taxNumber->isCnpj());
    }

    #[Test]
    public function it_creates_valid_cpf_without_formatting(): void
    {
        $taxNumber = TaxNumber::fromString('52998224725');

        $this->assertSame('52998224725', $taxNumber->getValue());
        $this->assertSame('CPF', $taxNumber->getType());
    }

    #[Test]
    public function it_creates_valid_cnpj(): void
    {
        $taxNumber = TaxNumber::fromString('11.222.333/0001-81');

        $this->assertSame('11222333000181', $taxNumber->getValue());
        $this->assertSame('CNPJ', $taxNumber->getType());
        $this->assertFalse($taxNumber->isCpf());
        $this->assertTrue($taxNumber->isCnpj());
    }

    #[Test]
    public function it_creates_valid_cnpj_without_formatting(): void
    {
        $taxNumber = TaxNumber::fromString('11222333000181');

        $this->assertSame('11222333000181', $taxNumber->getValue());
        $this->assertSame('CNPJ', $taxNumber->getType());
    }

    #[Test]
    #[DataProvider('invalidTaxNumbers')]
    public function it_throws_exception_for_invalid_tax_number(string $invalidTaxNumber): void
    {
        $this->expectException(InvalidTaxNumberException::class);

        TaxNumber::fromString($invalidTaxNumber);
    }

    public static function invalidTaxNumbers(): array
    {
        return [
            'empty string' => [''],
            'too short' => ['1234567890'],
            'too long' => ['123456789012345'],
            'wrong length' => ['1234567890123'],
            'all same digits cpf' => ['11111111111'],
            'all same digits cnpj' => ['11111111111111'],
            'invalid cpf check digit' => ['52998224724'],
            'invalid cnpj check digit' => ['11222333000182'],
        ];
    }

    #[Test]
    public function it_formats_cpf(): void
    {
        $taxNumber = TaxNumber::fromString('52998224725');

        $this->assertSame('529.982.247-25', $taxNumber->getFormatted());
    }

    #[Test]
    public function it_formats_cnpj(): void
    {
        $taxNumber = TaxNumber::fromString('11222333000181');

        $this->assertSame('11.222.333/0001-81', $taxNumber->getFormatted());
    }

    #[Test]
    public function it_masks_cpf(): void
    {
        $taxNumber = TaxNumber::fromString('52998224725');

        $this->assertSame('529.***.***-25', $taxNumber->getMasked());
    }

    #[Test]
    public function it_masks_cnpj(): void
    {
        $taxNumber = TaxNumber::fromString('11222333000181');

        $this->assertSame('11.***.***/****-81', $taxNumber->getMasked());
    }

    #[Test]
    public function it_compares_equality(): void
    {
        $taxNumber1 = TaxNumber::fromString('529.982.247-25');
        $taxNumber2 = TaxNumber::fromString('52998224725');
        $taxNumber3 = TaxNumber::fromString('11222333000181');

        $this->assertTrue($taxNumber1->equals($taxNumber2));
        $this->assertFalse($taxNumber1->equals($taxNumber3));
    }
}
