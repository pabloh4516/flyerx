/**
 * Proxy para todas as rotas de pix-keys
 * /api/v1/pix-keys/* → Laravel /v1/pix-keys/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/pix-keys');
