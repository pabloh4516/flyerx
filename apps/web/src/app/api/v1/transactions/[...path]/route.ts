/**
 * Proxy para todas as rotas de transactions
 * /api/v1/transactions/* → Laravel /v1/transactions/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/transactions');
