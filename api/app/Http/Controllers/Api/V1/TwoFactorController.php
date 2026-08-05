<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\DTOs\AuthResultDTO;
use App\Application\Identity\Services\AuthenticationService;
use App\Application\Identity\Services\TokenService;
use App\Application\Identity\Services\TwoFactorService;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorController extends Controller
{
    public function __construct(
        private readonly TwoFactorService $twoFactorService,
        private readonly TokenService $tokenService,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Initialize 2FA setup.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $result = $this->twoFactorService->initializeSetup(
                $user->id,
                $user->email
            );

            return response()->json([
                'message' => 'Configure seu aplicativo autenticador com o código abaixo.',
                'secret' => $result['secret'],
                'qr_code_url' => $result['qr_code_url'],
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Confirm 2FA setup with verification code.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        try {
            $backupCodes = $this->twoFactorService->confirmSetup(
                $user->id,
                $request->input('code')
            );

            return response()->json([
                'message' => '2FA ativado com sucesso.',
                'backup_codes' => array_map(
                    fn ($code) => $code['code'],
                    $backupCodes
                ),
                'warning' => 'Guarde esses códigos de backup em um local seguro. Eles são sua única forma de acesso caso perca seu dispositivo.',
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Verify 2FA code during login.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token' => 'required|string',
            'code' => 'required|string|min:6|max:8',
        ]);

        $result = $this->twoFactorService->verifyAndAuthenticate(
            $request->input('two_factor_token'),
            $request->input('code'),
            $request->ip(),
            $request->userAgent()
        );

        if ($result === null) {
            return response()->json([
                'message' => 'Código de verificação inválido ou expirado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Generate tokens for the user
        $user = $this->userRepository->findById(Uuid::fromString($result['user_id']));

        if ($user === null) {
            return response()->json([
                'message' => 'Usuário não encontrado.',
            ], Response::HTTP_NOT_FOUND);
        }

        $tokens = $this->tokenService->generateTokenPair(
            user: $user,
            ipAddress: $request->ip(),
            userAgent: $request->userAgent()
        );

        // Mark session as 2FA verified
        cache()->put(
            '2fa_verified:' . $tokens['session_id'],
            true,
            now()->addMinutes(config('flyerx.security.two_factor_session_lifetime', 60))
        );

        // Create user DTO
        $userDto = \App\Application\Identity\DTOs\UserDTO::fromEntity($user);

        return response()->json([
            'access_token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'expires_in' => $tokens['expires_in'],
            'token_type' => 'Bearer',
            'user' => $userDto->toArray(),
        ]);
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        try {
            $this->twoFactorService->disable(
                $user->id,
                $request->input('password')
            );

            return response()->json([
                'message' => '2FA desativado com sucesso.',
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Regenerate backup codes.
     */
    public function regenerateBackupCodes(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        try {
            $backupCodes = $this->twoFactorService->regenerateBackupCodes(
                $user->id,
                $request->input('code')
            );

            return response()->json([
                'message' => 'Novos códigos de backup gerados.',
                'backup_codes' => array_map(
                    fn ($code) => $code['code'],
                    $backupCodes
                ),
                'warning' => 'Seus códigos anteriores foram invalidados. Guarde esses novos códigos em um local seguro.',
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Get 2FA status.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        $isEnabled = $this->twoFactorService->isEnabled($user->id);
        $remainingBackupCodes = $isEnabled
            ? $this->twoFactorService->getRemainingBackupCodesCount($user->id)
            : 0;

        return response()->json([
            'enabled' => $isEnabled,
            'remaining_backup_codes' => $remainingBackupCodes,
        ]);
    }
}
