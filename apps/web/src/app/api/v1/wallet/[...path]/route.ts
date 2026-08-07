/**
 * Proxy para todas as rotas de wallet
 * /api/v1/wallet/* → Laravel /v1/wallet/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/wallet');
