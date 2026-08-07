/**
 * Proxy para a raiz de wallet
 * /api/v1/wallet → Laravel /v1/wallet
 */

import { NextRequest } from 'next/server';
import { proxyToLaravel } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/wallet', path: [] });
}

export async function POST(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/wallet', path: [] });
}
