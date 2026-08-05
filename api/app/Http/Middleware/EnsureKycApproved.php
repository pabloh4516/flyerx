<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKycApproved
{
    public function handle(Request $request, Closure $next, int $requiredLevel = 1): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->kyc_status !== 'approved') {
            return response()->json([
                'message' => 'KYC não aprovado. Complete sua verificação de identidade.',
                'kyc_status' => $user->kyc_status,
                'kyc_level' => $user->kyc_level,
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->kyc_level < $requiredLevel) {
            return response()->json([
                'message' => "Nível de KYC insuficiente. Requerido: {$requiredLevel}, atual: {$user->kyc_level}.",
                'required_level' => $requiredLevel,
                'current_level' => $user->kyc_level,
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
