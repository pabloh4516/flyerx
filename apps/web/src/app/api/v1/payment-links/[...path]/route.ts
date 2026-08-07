/**
 * Proxy para todas as rotas de payment-links
 * /api/v1/payment-links/* → Laravel /v1/payment-links/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/payment-links');
