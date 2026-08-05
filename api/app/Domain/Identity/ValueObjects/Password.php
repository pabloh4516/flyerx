<?php

declare(strict_types=1);

namespace App\Domain\Identity\ValueObjects;

use App\Domain\Shared\Contracts\ValueObjectInterface;
use App\Domain\Identity\Exceptions\WeakPasswordException;

final class Password implements ValueObjectInterface
{
    private const MIN_LENGTH = 8;

    private function __construct(
        private readonly string $hash
    ) {}

    /**
     * Create password from plain text (hashes it)
     */
    public static function fromPlainText(string $plainPassword): self
    {
        self::validateStrength($plainPassword);

        $hash = password_hash($plainPassword, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3,
        ]);

        return new self($hash);
    }

    /**
     * Create password from existing hash
     */
    public static function fromHash(string $hash): self
    {
        return new self($hash);
    }

    public function verify(string $plainPassword): bool
    {
        return password_verify($plainPassword, $this->hash);
    }

    public function needsRehash(): bool
    {
        return password_needs_rehash($this->hash, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3,
        ]);
    }

    public function getHash(): string
    {
        return $this->hash;
    }

    public function toString(): string
    {
        return $this->hash;
    }

    public function equals(ValueObjectInterface $other): bool
    {
        if (!$other instanceof self) {
            return false;
        }

        return $this->hash === $other->hash;
    }

    private static function validateStrength(string $password): void
    {
        $errors = [];

        if (strlen($password) < self::MIN_LENGTH) {
            $errors[] = 'Password must be at least ' . self::MIN_LENGTH . ' characters long';
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }

        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }

        if (count($errors) > 0) {
            throw new WeakPasswordException(implode('. ', $errors));
        }
    }

    public function __toString(): string
    {
        return '[PROTECTED]';
    }
}
