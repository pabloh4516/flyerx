<?php

declare(strict_types=1);

namespace App\Domain\Identity\Enums;

enum UserStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case BLOCKED = 'blocked';
    case SUSPENDED = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pendente',
            self::ACTIVE => 'Ativo',
            self::BLOCKED => 'Bloqueado',
            self::SUSPENDED => 'Suspenso',
        };
    }

    public function canLogin(): bool
    {
        // TODO: Reverter para apenas ACTIVE quando email estiver configurado
        return $this === self::ACTIVE || $this === self::PENDING;
    }

    public function canTransact(): bool
    {
        return $this === self::ACTIVE;
    }
}
