<?php

declare(strict_types=1);

namespace App\Domain\Identity\Repositories;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\ValueObjects\Email;
use App\Domain\Identity\ValueObjects\TaxNumber;
use App\Domain\Shared\ValueObjects\Uuid;

interface UserRepositoryInterface
{
    /**
     * Find a user by their unique identifier.
     */
    public function findById(Uuid $id): ?User;

    /**
     * Find a user by their email address.
     */
    public function findByEmail(Email $email): ?User;

    /**
     * Find a user by their tax number (CPF/CNPJ).
     */
    public function findByTaxNumber(TaxNumber $taxNumber): ?User;

    /**
     * Check if an email is already registered.
     */
    public function existsByEmail(Email $email): bool;

    /**
     * Check if a tax number is already registered.
     */
    public function existsByTaxNumber(TaxNumber $taxNumber): bool;

    /**
     * Persist a new user.
     */
    public function save(User $user): void;

    /**
     * Update an existing user.
     */
    public function update(User $user): void;

    /**
     * Delete a user (soft delete).
     */
    public function delete(User $user): void;

    /**
     * Get the next available UUID.
     */
    public function nextIdentity(): Uuid;
}
