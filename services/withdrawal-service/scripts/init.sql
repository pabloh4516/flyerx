-- ===== Flyerx Backend - Script de Inicialização =====
-- Este script é executado automaticamente pelo Docker na primeira inicialização

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Flyerx Backend database initialized at %', NOW();
END $$;
