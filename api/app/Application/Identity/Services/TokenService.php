<?php

declare(strict_types=1);

namespace App\Application\Identity\Services;

use App\Domain\Identity\Entities\User;
use App\Domain\Identity\Repositories\SessionRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use DateTimeImmutable;
use Illuminate\Support\Str;

class TokenService
{
    private const ACCESS_TOKEN_BYTES = 32;
    private const REFRESH_TOKEN_BYTES = 64;

    public function __construct(
        private readonly SessionRepositoryInterface $sessionRepository,
    ) {}

    /**
     * Generate a new access token and refresh token pair.
     */
    public function generateTokenPair(
        User $user,
        string $ipAddress,
        ?string $userAgent = null,
        ?string $deviceId = null,
    ): array {
        $accessToken = $this->generateAccessToken();
        $refreshToken = $this->generateRefreshToken();

        $expiresAt = (new DateTimeImmutable())
            ->modify('+' . config('flyerx.security.token_ttl', 3600) . ' seconds');

        $sessionId = $this->sessionRepository->create([
            'user_id' => $user->getId(),
            'device_id' => $deviceId,
            'token_hash' => $this->hashToken($accessToken),
            'refresh_token_hash' => $this->hashToken($refreshToken),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => $expiresAt,
        ]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'session_id' => $sessionId->toString(),
            'expires_in' => config('flyerx.security.token_ttl', 3600),
        ];
    }

    /**
     * Refresh an access token using a refresh token.
     */
    public function refreshToken(string $refreshToken, string $ipAddress): ?array
    {
        $session = $this->findSessionByRefreshToken($refreshToken);

        if ($session === null) {
            return null;
        }

        // Generate new tokens
        $newAccessToken = $this->generateAccessToken();
        $newRefreshToken = $this->generateRefreshToken();

        $expiresAt = (new DateTimeImmutable())
            ->modify('+' . config('flyerx.security.token_ttl', 3600) . ' seconds');

        // Revoke old session
        $this->sessionRepository->revoke(
            Uuid::fromString($session['id']),
            'token_refreshed'
        );

        // Create new session
        $sessionId = $this->sessionRepository->create([
            'user_id' => $session['user_id'],
            'device_id' => $session['device_id'],
            'token_hash' => $this->hashToken($newAccessToken),
            'refresh_token_hash' => $this->hashToken($newRefreshToken),
            'ip_address' => $ipAddress,
            'user_agent' => $session['user_agent'],
            'expires_at' => $expiresAt,
        ]);

        return [
            'access_token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
            'session_id' => $sessionId->toString(),
            'user_id' => $session['user_id'],
            'expires_in' => config('flyerx.security.token_ttl', 3600),
        ];
    }

    /**
     * Validate an access token and return the session data.
     */
    public function validateToken(string $accessToken): ?array
    {
        $tokenHash = $this->hashToken($accessToken);
        $session = $this->sessionRepository->findByTokenHash($tokenHash);

        if ($session === null) {
            return null;
        }

        // Check if session is revoked
        if ($session['is_revoked']) {
            return null;
        }

        // Check if session is expired
        if (new DateTimeImmutable() > $session['expires_at']) {
            return null;
        }

        // Update last activity
        $this->sessionRepository->updateLastActivity(Uuid::fromString($session['id']));

        return $session;
    }

    /**
     * Revoke a specific session.
     */
    public function revokeSession(string $sessionId, string $reason = 'logout'): void
    {
        $this->sessionRepository->revoke(Uuid::fromString($sessionId), $reason);
    }

    /**
     * Revoke all sessions for a user.
     */
    public function revokeAllUserSessions(
        string $userId,
        string $reason = 'logout_all',
        ?string $exceptSessionId = null
    ): void {
        $this->sessionRepository->revokeAllForUser(
            Uuid::fromString($userId),
            $reason,
            $exceptSessionId ? Uuid::fromString($exceptSessionId) : null
        );
    }

    /**
     * Find session by refresh token.
     */
    private function findSessionByRefreshToken(string $refreshToken): ?array
    {
        $refreshTokenHash = $this->hashToken($refreshToken);

        return $this->sessionRepository->findByRefreshTokenHash($refreshTokenHash);
    }

    /**
     * Generate a cryptographically secure access token.
     */
    private function generateAccessToken(): string
    {
        return 'fyx_' . bin2hex(random_bytes(self::ACCESS_TOKEN_BYTES));
    }

    /**
     * Generate a cryptographically secure refresh token.
     */
    private function generateRefreshToken(): string
    {
        return 'fyx_rt_' . bin2hex(random_bytes(self::REFRESH_TOKEN_BYTES));
    }

    /**
     * Hash a token for storage.
     */
    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }
}
