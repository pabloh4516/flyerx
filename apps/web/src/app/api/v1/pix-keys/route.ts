/**
 * Proxy para a raiz de pix-keys
 * /api/v1/pix-keys → Laravel /v1/pix-keys
 */

import { NextRequest } from 'next/server';
import { proxyToLaravel } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/pix-keys', path: [] });
}

export async function POST(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/pix-keys', path: [] });
}
