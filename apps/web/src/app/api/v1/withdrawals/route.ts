/**
 * Proxy para rota base de withdrawals
 * POST /api/v1/withdrawals → Laravel POST /v1/withdrawals
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/withdrawals');
