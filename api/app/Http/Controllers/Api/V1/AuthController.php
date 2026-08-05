<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Identity\DTOs\LoginDTO;
use App\Application\Identity\DTOs\RegisterUserDTO;
use App\Application\Identity\Services\AuthenticationService;
use App\Application\Identity\Services\EmailVerificationService;
use App\Domain\Identity\Exceptions\InvalidCredentialsException;
use App\Domain\Identity\Exceptions\TwoFactorRequiredException;
use App\Domain\Identity\Exceptions\UserBlockedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthenticationService $authService,
        private readonly EmailVerificationService $emailVerificationService,
    ) {}

    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $dto = RegisterUserDTO::fromArray($request->validated());
            $user = $this->authService->register($dto, $request->ip());

            // Send verification email
            $this->emailVerificationService->sendVerificationEmail(
                userId: $user->id,
                email: $request->input('email'),
                userName: $user->fullName,
            );

            return response()->json([
                'message' => 'Usuário registrado com sucesso. Verifique seu email para ativar sua conta.',
                'user' => $user->toArray(),
            ], Response::HTTP_CREATED);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Authenticate user and return tokens.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $dto = LoginDTO::fromArray($request->validated());

            $result = $this->authService->login(
                dto: $dto,
                ipAddress: $request->ip(),
                userAgent: $request->userAgent(),
            );

            return response()->json($result->toArray());
        } catch (TwoFactorRequiredException $e) {
            return response()->json([
                'requires_two_factor' => true,
                'two_factor_token' => $e->getToken(),
                'message' => 'Verificação de dois fatores necessária.',
            ], Response::HTTP_OK);
        } catch (InvalidCredentialsException $e) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], Response::HTTP_UNAUTHORIZED);
        } catch (UserBlockedException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_FORBIDDEN);
        }
    }

    /**
     * Refresh access token.
     */
    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        $result = $this->authService->refreshToken(
            refreshToken: $request->input('refresh_token'),
            ipAddress: $request->ip(),
        );

        if ($result === null) {
            return response()->json([
                'message' => 'Token de atualização inválido ou expirado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json($result->toArray());
    }

    /**
     * Logout current session.
     */
    public function logout(Request $request): JsonResponse
    {
        $sessionId = $request->attributes->get('session_id');

        if ($sessionId) {
            $this->authService->logout($sessionId);
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    /**
     * Logout from all devices.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $currentSessionId = $request->attributes->get('session_id');

        $this->authService->logoutAll($userId, $currentSessionId);

        return response()->json([
            'message' => 'Logout realizado em todos os dispositivos.',
        ]);
    }

    /**
     * Get current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $this->authService->getUserById($request->user()->id);

        if ($user === null) {
            return response()->json([
                'message' => 'Usuário não encontrado.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'user' => $user->toArray(),
        ]);
    }

    /**
     * Verify email address.
     */
    public function verifyEmail(Request $request, string $id, string $token): JsonResponse
    {
        if (!$request->hasValidSignature()) {
            return response()->json([
                'message' => 'Link de verificação inválido ou expirado.',
            ], Response::HTTP_FORBIDDEN);
        }

        $verified = $this->emailVerificationService->verify($id, $token);

        if (!$verified) {
            return response()->json([
                'message' => 'Falha ao verificar email.',
            ], Response::HTTP_BAD_REQUEST);
        }

        return response()->json([
            'message' => 'Email verificado com sucesso.',
        ]);
    }

    /**
     * Resend verification email.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $sent = $this->emailVerificationService->resend($userId);

        if (!$sent) {
            return response()->json([
                'message' => 'Não foi possível enviar o email. Tente novamente mais tarde.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        return response()->json([
            'message' => 'Email de verificação enviado.',
        ]);
    }
}
