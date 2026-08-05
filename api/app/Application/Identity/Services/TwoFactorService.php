<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Domain\Identity\Repositories\TwoFactorRepositoryInterface;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    private const BACKUP_CODES_COUNT = 8;
    private const BACKUP_CODE_LENGTH = 8;

    public function __construct(
        private readonly TwoFactorRepositoryInterface $twoFactorRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly Encrypter $encrypter,
    ) {}

    /**
     * Initialize 2FA setup for a user.
     * Returns the secret and QR code URL.
     */
    public function initializeSetup(string $userId, string $email): array
    {
        $google2fa = new Google2FA();

        // Generate secret
        $secret = $google2fa->generateSecretKey(32);

        // Check if setup already exists
        $existing = $this->twoFactorRepository->findByUserIdAndType(
            Uuid::fromString($userId),
            'totp'
        );

        if ($existing !== null && $existing['is_active']) {
            throw new \DomainException('2FA já está ativo para este usuário.');
        }

        // Delete any existing pending setup
        if ($existing !== null) {
            $this->twoFactorRepository->delete(Uuid::fromString($existing['id']));
        }

        // Create new pending 2FA record
        $this->twoFactorRepository->create([
            'user_id' => $userId,
            'type' => 'totp',
            'secret_encrypted' => $this->encrypter->encrypt($secret),
        ]);

        // Generate QR code URL
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'Flyerx'),
            $email,
            $secret
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }

    /**
     * Confirm 2FA setup with verification code.
     * Returns backup codes.
     */
    public function confirmSetup(string $userId, string $code): array
    {
        $twoFactor = $this->twoFactorRepository->findByUserIdAndType(
            Uuid::fromString($userId),
            'totp'
        );

        if ($twoFactor === null) {
            throw new \DomainException('Nenhuma configuração de 2FA pendente.');
        }

        if ($twoFactor['is_active']) {
            throw new \DomainException('2FA já está ativo.');
        }

        // Verify the code
        $secret = $this->encrypter->decrypt($twoFactor['secret_encrypted']);

        if (!$this->verifyCode($secret, $code)) {
            throw new \DomainException('Código de verificação inválido.');
        }

        // Generate backup codes
        $backupCodes = $this->generateBackupCodes();

        return DB::transaction(function () use ($userId, $twoFactor, $backupCodes) {
            // Encrypt and store backup codes
            $this->twoFactorRepository->updateBackupCodes(
                Uuid::fromString($twoFactor['id']),
                $this->encrypter->encrypt(json_encode($backupCodes))
            );

            // Activate 2FA
            $this->twoFactorRepository->activate(Uuid::fromString($twoFactor['id']));

            // Update user
            $user = $this->userRepository->findById(Uuid::fromString($userId));
            if ($user !== null) {
                $user->enableTwoFactor();
                $this->userRepository->update($user);
            }

            return $backupCodes;
        });
    }

    /**
     * Verify a 2FA code.
     */
    public function verify(string $userId, string $code): bool
    {
        $twoFactor = $this->twoFactorRepository->findActiveByUserId(
            Uuid::fromString($userId)
        );

        if ($twoFactor === null) {
            return false;
        }

        $secret = $this->encrypter->decrypt($twoFactor['secret_encrypted']);

        // Try TOTP code first
        if ($this->verifyCode($secret, $code)) {
            $this->twoFactorRepository->recordUsage(Uuid::fromString($twoFactor['id']));
            return true;
        }

        // Try backup code
        if ($this->verifyBackupCode($twoFactor, $code)) {
            return true;
        }

        return false;
    }

    /**
     * Verify a 2FA code and return tokens if valid.
     */
    public function verifyAndAuthenticate(
        string $twoFactorToken,
        string $code,
        string $ipAddress,
        ?string $userAgent = null
    ): ?array {
        // Get user ID from pending 2FA token
        $cacheKey = '2fa_pending:' . hash('sha256', $twoFactorToken);
        $userId = cache()->pull($cacheKey);

        if ($userId === null) {
            return null;
        }

        if (!$this->verify($userId, $code)) {
            // Put back the token for more attempts
            cache()->put($cacheKey, $userId, now()->addMinutes(5));
            return null;
        }

        return [
            'user_id' => $userId,
            'verified' => true,
        ];
    }

    /**
     * Disable 2FA for a user.
     */
    public function disable(string $userId, string $password): void
    {
        $user = $this->userRepository->findById(Uuid::fromString($userId));

        if ($user === null) {
            throw new \DomainException('Usuário não encontrado.');
        }

        // Verify password
        if (!$user->getPassword()->verify($password)) {
            throw new \DomainException('Senha incorreta.');
        }

        $twoFactor = $this->twoFactorRepository->findActiveByUserId(
            Uuid::fromString($userId)
        );

        if ($twoFactor === null) {
            throw new \DomainException('2FA não está ativo.');
        }

        DB::transaction(function () use ($userId, $twoFactor, $user) {
            $this->twoFactorRepository->delete(Uuid::fromString($twoFactor['id']));

            $user->disableTwoFactor();
            $this->userRepository->update($user);
        });
    }

    /**
     * Regenerate backup codes.
     */
    public function regenerateBackupCodes(string $userId, string $code): array
    {
        // First verify the user's 2FA code
        if (!$this->verify($userId, $code)) {
            throw new \DomainException('Código de verificação inválido.');
        }

        $twoFactor = $this->twoFactorRepository->findActiveByUserId(
            Uuid::fromString($userId)
        );

        if ($twoFactor === null) {
            throw new \DomainException('2FA não está ativo.');
        }

        $backupCodes = $this->generateBackupCodes();

        $this->twoFactorRepository->updateBackupCodes(
            Uuid::fromString($twoFactor['id']),
            $this->encrypter->encrypt(json_encode($backupCodes))
        );

        return $backupCodes;
    }

    /**
     * Check if user has 2FA enabled.
     */
    public function isEnabled(string $userId): bool
    {
        $twoFactor = $this->twoFactorRepository->findActiveByUserId(
            Uuid::fromString($userId)
        );

        return $twoFactor !== null;
    }

    /**
     * Get remaining backup codes count.
     */
    public function getRemainingBackupCodesCount(string $userId): int
    {
        $twoFactor = $this->twoFactorRepository->findActiveByUserId(
            Uuid::fromString($userId)
        );

        if ($twoFactor === null || $twoFactor['backup_codes_encrypted'] === null) {
            return 0;
        }

        $backupCodes = json_decode(
            $this->encrypter->decrypt($twoFactor['backup_codes_encrypted']),
            true
        );

        return count(array_filter($backupCodes, fn ($code) => !$code['used']));
    }

    /**
     * Verify TOTP code.
     */
    private function verifyCode(string $secret, string $code): bool
    {
        $google2fa = new Google2FA();

        // Allow 1 window before and after (30 seconds each)
        return $google2fa->verifyKey($secret, $code, 1);
    }

    /**
     * Verify and consume a backup code.
     */
    private function verifyBackupCode(array $twoFactor, string $code): bool
    {
        if ($twoFactor['backup_codes_encrypted'] === null) {
            return false;
        }

        $backupCodes = json_decode(
            $this->encrypter->decrypt($twoFactor['backup_codes_encrypted']),
            true
        );

        $normalizedCode = strtoupper(str_replace(['-', ' '], '', $code));

        foreach ($backupCodes as $index => $backupCode) {
            if (!$backupCode['used'] && $backupCode['code'] === $normalizedCode) {
                // Mark as used
                $backupCodes[$index]['used'] = true;
                $backupCodes[$index]['used_at'] = now()->toIso8601String();

                $this->twoFactorRepository->updateBackupCodes(
                    Uuid::fromString($twoFactor['id']),
                    $this->encrypter->encrypt(json_encode($backupCodes))
                );

                $this->twoFactorRepository->recordUsage(Uuid::fromString($twoFactor['id']));

                return true;
            }
        }

        return false;
    }

    /**
     * Generate backup codes.
     */
    private function generateBackupCodes(): array
    {
        $codes = [];

        for ($i = 0; $i < self::BACKUP_CODES_COUNT; $i++) {
            $code = strtoupper(bin2hex(random_bytes(self::BACKUP_CODE_LENGTH / 2)));
            $codes[] = [
                'code' => $code,
                'used' => false,
                'used_at' => null,
            ];
        }

        return $codes;
    }
}
