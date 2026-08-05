<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWalletActive
{
    public function handle(Request $request, Closure $next): Response
    {
        // TODO: Implement wallet check when wallet context is implemented
        // For now, we just pass through

        return $next($request);
    }
}
