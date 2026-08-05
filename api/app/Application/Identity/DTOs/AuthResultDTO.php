<?php

declare(strict_types=1);

namespace App\Application\Identity\DTOs;

final readonly class AuthResultDTO
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresIn,
        public string $tokenType = 'Bearer',
        public ?array $user = null,
        public bool $requiresTwoFactor = false,
        public ?string $twoFactorToken = null,
    ) {}

    public function toArray(): array
    {
        $result = [
            'access_token' => $this->accessToken,
            'refresh_token' => $this->refreshToken,
            'expires_in' => $this->expiresIn,
            'token_type' => $this->tokenType,
        ];

        if ($this->requiresTwoFactor) {
            return [
                'requires_two_factor' => true,
                'two_factor_token' => $this->twoFactorToken,
            ];
        }

        if ($this->user !== null) {
            $result['user'] = $this->user;
        }

        return $result;
    }
}
