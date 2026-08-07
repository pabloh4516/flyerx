/**
 * Proxy Helper para API Routes
 *
 * Todas as chamadas ao Laravel passam por aqui.
 * O Gateway Key é adicionado server-side, nunca exposto ao browser.
 */

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '';

interface ProxyOptions {
  /** Prefixo da rota no Laravel (ex: '/v1/auth') */
  prefix: string;
  /** Path segments da rota (ex: ['login'] ou ['2fa', 'setup']) */
  path: string[];
}

/**
 * Faz proxy de uma requisição para o Laravel adicionando o Gateway Key
 */
export async function proxyToLaravel(
  request: NextRequest,
  options: ProxyOptions
): Promise<NextResponse> {
  const { prefix, path } = options;

  // Montar URL de destino
  const targetPath = path.length > 0 ? `/${path.join('/')}` : '';
  const url = new URL(`${LARAVEL_API_URL}${prefix}${targetPath}`);

  // Copiar query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Preparar headers
  const headers = new Headers();

  // Copiar headers relevantes da requisição original
  const headersToForward = [
    'content-type',
    'authorization',
    'accept',
    'accept-language',
    'x-requested-with',
    'x-idempotency-key',
  ];

  headersToForward.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  // Adicionar Gateway Key (server-side only)
  if (GATEWAY_API_KEY) {
    headers.set('X-Gateway-Key', GATEWAY_API_KEY);
  }

  // Preparar body (se não for GET/HEAD)
  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      // Body vazio ou já consumido
    }
  }

  try {
    // Fazer requisição para o Laravel
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    // Ler resposta
    const responseBody = await response.text();

    // Preparar headers de resposta
    const responseHeaders = new Headers();

    // Copiar headers relevantes da resposta
    const responseHeadersToForward = [
      'content-type',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-request-id',
    ];

    responseHeadersToForward.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy Error]', error);

    return NextResponse.json(
      {
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

/**
 * Cria handlers para todas as HTTP methods de uma rota
 */
export function createProxyHandlers(prefix: string) {
  const handler = async (
    request: NextRequest,
    context: { params: Promise<{ path?: string[] }> }
  ) => {
    const params = await context.params;
    const path = params.path || [];
    return proxyToLaravel(request, { prefix, path });
  };

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    PATCH: handler,
    DELETE: handler,
    OPTIONS: handler,
  };
}
