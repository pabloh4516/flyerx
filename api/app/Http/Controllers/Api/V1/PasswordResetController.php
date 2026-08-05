<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\Services\PasswordResetService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Response;

class PasswordResetController extends Controller
{
    public function __construct(
        private readonly PasswordResetService $passwordResetService,
    ) {}

    /**
     * Request a password reset email.
     */
    public function requestReset(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $this->passwordResetService->requestReset(
            $request->input('email'),
            $request->ip()
        );

        // Always return success to prevent email enumeration
        return response()->json([
            'message' => 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
        ]);
    }

    /**
     * Validate a password reset token.
     */
    public function validateToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $result = $this->passwordResetService->validateToken(
            $request->input('token')
        );

        if ($result === null) {
            return response()->json([
                'valid' => false,
                'message' => 'Token inválido ou expirado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'valid' => true,
            'expires_at' => $result['expires_at']->format('c'),
        ]);
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
                'confirmed',
            ],
        ]);

        $success = $this->passwordResetService->resetPassword(
            $request->input('token'),
            $request->input('password')
        );

        if (!$success) {
            return response()->json([
                'message' => 'Token inválido ou expirado.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'message' => 'Senha redefinida com sucesso. Faça login com sua nova senha.',
        ]);
    }
}
