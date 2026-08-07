/**
 * Proxy para todas as rotas de users
 * /api/v1/users/* → Laravel /v1/users/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/users');
