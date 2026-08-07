/**
 * Proxy para todas as rotas de autenticação
 * /api/v1/auth/* → Laravel /v1/auth/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/auth');
