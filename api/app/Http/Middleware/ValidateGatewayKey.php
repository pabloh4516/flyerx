<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware que valida a chave de gateway em todas as requisições.
 *
 * Garante que apenas requisições vindas de fontes autorizadas
 * (frontend via Vercel/Cloudflare) possam acessar a API.
 */
class ValidateGatewayKey
{
    /**
     * Rotas que não precisam de validação de gateway key.
     */
    private array $excludedPaths = [
        'api/health',
        'api/up',
        'api/webhooks/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Pular validação em rotas excluídas
        if ($this->isExcludedPath($request->path())) {
            return $next($request);
        }

        $gatewayKey = $request->header('X-Gateway-Key');
        $expectedKey = config('auth.gateway_key');

        // Se não há chave configurada, bloquear em produção
        if (empty($expectedKey)) {
            if (app()->environment('production')) {
                return $this->unauthorizedResponse('Gateway key not configured');
            }
            // Em desenvolvimento, permitir sem chave
            return $next($request);
        }

        // Validar chave
        if (empty($gatewayKey) || !hash_equals($expectedKey, $gatewayKey)) {
            return $this->unauthorizedResponse('Invalid gateway key');
        }

        return $next($request);
    }

    private function isExcludedPath(string $path): bool
    {
        foreach ($this->excludedPaths as $excludedPath) {
            if (str_ends_with($excludedPath, '*')) {
                $prefix = rtrim($excludedPath, '*');
                if (str_starts_with($path, $prefix)) {
                    return true;
                }
            } elseif ($path === $excludedPath) {
                return true;
            }
        }

        return false;
    }

    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'error' => 'Unauthorized',
            'message' => $message,
        ], 401);
    }
}
