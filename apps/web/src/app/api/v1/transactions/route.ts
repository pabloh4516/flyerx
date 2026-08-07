/**
 * Proxy para a raiz de transactions
 * /api/v1/transactions → Laravel /v1/transactions
 */

import { NextRequest } from 'next/server';
import { proxyToLaravel } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/transactions', path: [] });
}

export async function POST(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/transactions', path: [] });
}
