/**
 * Proxy para todas as rotas de deposits
 * /api/v1/deposits/* → Laravel /v1/deposits/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/deposits');
