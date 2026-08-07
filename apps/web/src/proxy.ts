import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que requerem autenticação
const protectedRoutes = [
  '/dashboard',
  '/history',
  '/receive',
  '/send',
  '/pix-keys',
  '/payment-links',
  '/subaccounts',
  '/developers',
  '/settings',
];

// Rotas públicas (não redirecionar se autenticado)
const authRoutes = ['/login', '/register', '/forgot-password', '/verify-email'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se há token no cookie
  const accessToken = request.cookies.get('accessToken')?.value;

  // Verificar se a rota é protegida
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Verificar se é rota de auth
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Se rota protegida e sem token, redirecionar para login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se rota de auth e tem token, redirecionar para dashboard
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
