<?php

declare(strict_types=1);

namespace App\Domain\Shared;

use App\Domain\Shared\Contracts\EntityInterface;

abstract class Entity implements EntityInterface
{
    protected string $id;

    public function getId(): string
    {
        return $this->id;
    }

    public function equals(EntityInterface $other): bool
    {
        if (!$other instanceof static) {
            return false;
        }

        return $this->getId() === $other->getId();
    }
}
