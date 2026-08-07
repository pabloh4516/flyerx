/**
 * Proxy para todas as rotas de KYC
 * /api/v1/kyc/* → Laravel /v1/kyc/*
 */

import { createProxyHandlers } from '@/lib/api/proxy';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS } = createProxyHandlers('/v1/kyc');
