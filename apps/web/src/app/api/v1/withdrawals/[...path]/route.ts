/**
 * Proxy para todas as rotas de withdrawals
 * /api/v1/withdrawals/* → Laravel /v1/withdrawals/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/withdrawals');
