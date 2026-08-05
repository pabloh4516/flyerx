<?php

declare(strict_types=1);

namespace App\Domain\Shared\Contracts;

interface EntityInterface
{
    public function getId(): string;

    public function equals(EntityInterface $other): bool;
}
