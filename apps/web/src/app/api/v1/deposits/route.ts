/**
 * Proxy para rota base de deposits
 * POST /api/v1/deposits → Laravel POST /v1/deposits
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/deposits');
