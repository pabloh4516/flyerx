<?php

declare(strict_types=1);

namespace App\Domain\Shared\Contracts;

interface ValueObjectInterface
{
    public function equals(ValueObjectInterface $other): bool;

    public function toString(): string;
}
