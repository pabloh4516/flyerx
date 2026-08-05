<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // If user doesn't have 2FA enabled, allow access
        if (!$user->two_factor_enabled) {
            return $next($request);
        }

        // Check if 2FA was verified in this session
        $session = $request->attributes->get('session_id');
        $twoFactorVerifiedKey = '2fa_verified:' . $session;

        if (!cache()->has($twoFactorVerifiedKey)) {
            return response()->json([
                'message' => 'Verificação de dois fatores necessária.',
                'requires_two_factor' => true,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
