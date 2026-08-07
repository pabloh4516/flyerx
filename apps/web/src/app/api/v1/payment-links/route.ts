/**
 * Proxy para a raiz de payment-links
 * /api/v1/payment-links → Laravel /v1/payment-links
 */

import { NextRequest } from 'next/server';
import { proxyToLaravel } from '@/lib/api/proxy';

export async function GET(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/payment-links', path: [] });
}

export async function POST(request: NextRequest) {
  return proxyToLaravel(request, { prefix: '/v1/payment-links', path: [] });
}
