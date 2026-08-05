<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Application\Identity\Services\TokenService;
use App\Domain\Identity\Repositories\UserRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\Models\UserModel;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    public function __construct(
        private readonly TokenService $tokenService,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        // Support Sanctum authentication for testing
        if (app()->environment('testing') && auth('sanctum')->check()) {
            /** @var UserModel $userModel */
            $userModel = auth('sanctum')->user();

            $request->setUserResolver(fn () => (object) [
                'id' => $userModel->id,
                'email' => $userModel->email,
                'full_name' => $userModel->full_name,
                'status' => $userModel->status,
                'kyc_level' => $userModel->kyc_level ?? 0,
                'kyc_status' => $userModel->kyc_status ?? 'pending',
                'two_factor_enabled' => $userModel->two_factor_enabled ?? false,
                'email_verified' => $userModel->email_verified_at !== null,
            ]);

            $request->attributes->set('user_model', $userModel);

            return $next($request);
        }

        $token = $this->extractToken($request);

        if ($token === null) {
            throw new AuthenticationException('Token não fornecido.');
        }

        $session = $this->tokenService->validateToken($token);

        if ($session === null) {
            throw new AuthenticationException('Token inválido ou expirado.');
        }

        // Load user
        $user = $this->userRepository->findById(Uuid::fromString($session['user_id']));

        if ($user === null || !$user->canLogin()) {
            throw new AuthenticationException('Usuário não encontrado ou inativo.');
        }

        // Set user and session on request
        $request->setUserResolver(fn () => (object) [
            'id' => $user->getId(),
            'email' => $user->getEmail()->toString(),
            'full_name' => $user->getFullName(),
            'status' => $user->getStatus()->value,
            'kyc_level' => $user->getKycLevel(),
            'kyc_status' => $user->getKycStatus()->value,
            'two_factor_enabled' => $user->isTwoFactorEnabled(),
            'email_verified' => $user->isEmailVerified(),
        ]);

        $request->attributes->set('session_id', $session['id']);
        $request->attributes->set('user_entity', $user);

        return $next($request);
    }

    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }
}
