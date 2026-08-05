<?php

declare(strict_types=1);

namespace App\Domain\Identity\Enums;

enum KycStatus: string
{
    case PENDING = 'pending';
    case IN_REVIEW = 'in_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pendente',
            self::IN_REVIEW => 'Em análise',
            self::APPROVED => 'Aprovado',
            self::REJECTED => 'Rejeitado',
        };
    }

    public function isApproved(): bool
    {
        return $this === self::APPROVED;
    }

    public function isPending(): bool
    {
        return $this === self::PENDING || $this === self::IN_REVIEW;
    }
}
