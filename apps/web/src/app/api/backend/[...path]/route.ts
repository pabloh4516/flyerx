/**
 * Proxy para o Backend Python (LWK)
 *
 * /api/backend/* → Python withdrawal-service
 *
 * IMPORTANTE: A INTERNAL_API_KEY é adicionada server-side,
 * nunca exposta ao browser.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.LWK_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

async function proxyToBackend(
  request: NextRequest,
  path: string[]
): Promise<NextResponse> {
  // Montar URL de destino
  const targetPath = path.length > 0 ? `/${path.join('/')}` : '';
  const url = new URL(`${BACKEND_URL}${targetPath}`);

  // Copiar query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  // Preparar headers
  const headers = new Headers();

  // Copiar headers relevantes
  const headersToForward = [
    'content-type',
    'authorization',
    'accept',
  ];

  headersToForward.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  // Adicionar API Key (server-side only)
  if (INTERNAL_API_KEY) {
    headers.set('X-API-Key', INTERNAL_API_KEY);
  }

  // Preparar body
  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    try {
      body = await request.text();
    } catch {
      // Body vazio
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    const responseBody = await response.text();

    const responseHeaders = new Headers();
    const responseHeadersToForward = ['content-type'];
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
    console.error('[Backend Proxy Error]', error);

    return NextResponse.json(
      {
        error: 'Backend proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyToBackend(request, params.path || []);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyToBackend(request, params.path || []);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyToBackend(request, params.path || []);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxyToBackend(request, params.path || []);
}
