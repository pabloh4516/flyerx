# Integração Frontend ↔ Backend LWK

## Visão Geral

Este documento descreve como integrar o frontend Next.js (flyerx-web) com o novo backend Python (flyerx-backend) para processar saques com taxa de parceiro.

## URLs

| Ambiente | Backend URL |
|----------|-------------|
| Desenvolvimento | http://localhost:8000 |
| Produção | https://api.flyerx.com (configurar) |

## Autenticação

O backend usa JWT. O frontend precisa:

1. Obter token via `/api/v1/auth/login` ou `/api/v1/auth/dev-token`
2. Incluir em todas as requisições: `Authorization: Bearer <token>`

## Fluxo de Saque Atualizado

### Antes (API Eulen direta)

```
Frontend → Eulen API → Usuário envia DePix → Eulen processa PIX
```

### Depois (Com Backend LWK)

```
Frontend → Backend Flyerx → Eulen API
                ↓
         Usuário envia DePix para endereço Flyerx
                ↓
         Worker separa taxa e envia para Eulen
                ↓
         Eulen processa PIX
```

## Endpoints do Backend

### POST /api/v1/withdrawals

Cria um novo saque.

**Request:**
```typescript
{
  pix_key: string;           // Chave PIX do destinatário
  pix_key_type: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM";
  beneficiary_tax_number: string;  // CPF/CNPJ do titular
  amount_reais: number;      // Valor a receber em reais
}
```

**Response:**
```typescript
{
  id: string;
  status: "pending";
  flyerx_address: string;    // Endereço Liquid para enviar DePix
  breakdown: {
    requested_amount: number;  // Valor solicitado
    partner_fee: number;       // Taxa Flyerx
    eulen_fee: number;         // Taxa Eulen
    total_fee: number;         // Total de taxas
    total_depix: number;       // DePix a enviar
  };
  pix_key: string;
  created_at: string;
  expires_at: string;
}
```

### GET /api/v1/withdrawals/{id}/status

Consulta status do saque (polling).

**Response:**
```typescript
{
  id: string;
  status: "pending" | "depix_received" | "processing" | "sent_to_eulen" | "completed" | "failed";
  breakdown: {...};
  user_tx_id?: string;
  receipt_url?: string;
  completed_at?: string;
}
```

### POST /api/v1/withdrawals/estimate-fee

Estima taxas (não requer autenticação).

## Alterações no Frontend

### 1. Novo cliente API

Criar `src/lib/api/flyerx-backend.ts`:

```typescript
import axios from 'axios';

const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
backendApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('backend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateWithdrawalRequest {
  pix_key: string;
  pix_key_type: string;
  beneficiary_tax_number: string;
  amount_reais: number;
}

export interface WithdrawalResponse {
  id: string;
  status: string;
  flyerx_address: string;
  breakdown: {
    requested_amount: number;
    partner_fee: number;
    eulen_fee: number;
    total_fee: number;
    total_depix: number;
  };
  pix_key: string;
  created_at: string;
  expires_at: string;
}

export const createWithdrawal = async (
  data: CreateWithdrawalRequest
): Promise<WithdrawalResponse> => {
  const response = await backendApi.post('/api/v1/withdrawals', data);
  return response.data;
};

export const getWithdrawalStatus = async (id: string) => {
  const response = await backendApi.get(`/api/v1/withdrawals/${id}/status`);
  return response.data;
};

export const estimateFee = async (amount: number) => {
  const response = await backendApi.post('/api/v1/withdrawals/estimate-fee', {
    amount_reais: amount,
  });
  return response.data;
};
```

### 2. Atualizar página de saque

Modificar `src/app/(dashboard)/withdraw/page.tsx`:

```typescript
// Ao invés de chamar Eulen diretamente, chamar backend Flyerx
import { createWithdrawal, getWithdrawalStatus } from '@/lib/api/flyerx-backend';

const onSubmit = async (data) => {
  // Criar saque via backend Flyerx (não mais Eulen diretamente)
  const result = await createWithdrawal({
    pix_key: data.pixKey,
    pix_key_type: data.pixKeyType,
    beneficiary_tax_number: data.recipientTaxNumber,
    amount_reais: data.amount,
  });

  // Agora o endereço é do Flyerx, não da Eulen
  setWithdrawal({
    withdrawalId: result.id,
    depositAddress: result.flyerx_address,  // Endereço Flyerx!
    // ...
  });
};
```

### 3. Variáveis de ambiente

Adicionar em `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Migração Gradual

Recomendo migrar em fases:

### Fase 1: Rodar em paralelo
- Manter código atual funcionando
- Adicionar flag para usar novo backend
- Testar com usuários selecionados

### Fase 2: Migrar gradualmente
- Aumentar % de usuários no novo backend
- Monitorar erros e performance

### Fase 3: Desativar código antigo
- Remover chamadas diretas à Eulen
- Usar exclusivamente backend Flyerx

## Configuração de Taxas

As taxas são configuradas no backend via variáveis de ambiente:

```env
# Backend .env
PARTNER_WITHDRAW_FEE_PERCENT=0.015   # 1.5%
PARTNER_WITHDRAW_FEE_FIXED_CENTS=0   # Taxa fixa
PARTNER_WITHDRAW_FEE_MIN_CENTS=50    # Mínimo R$ 0,50
```

O frontend recebe as taxas calculadas na resposta do backend, não precisa calcular localmente.

## Diagrama de Sequência

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │   LWK    │     │  Eulen   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /withdraw │                │                │
     │───────────────>│                │                │
     │                │ POST /withdraw │                │
     │                │───────────────────────────────>│
     │                │                │ depositAddress │
     │                │<───────────────────────────────│
     │                │                │                │
     │                │ get_new_address│                │
     │                │───────────────>│                │
     │                │ flyerx_address │                │
     │                │<───────────────│                │
     │                │                │                │
     │ {flyerx_addr}  │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ [User sends DePix to flyerx_addr]               │
     │                │                │                │
     │                │ Worker: detect │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │ send to eulen  │                │
     │                │───────────────>│                │
     │                │                │ DePix received │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ [Eulen sends PIX]
     │                │                │                │
     │ GET /status    │                │                │
     │───────────────>│                │                │
     │ {completed}    │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

## Testes

Para testar localmente:

1. Inicie o backend:
```bash
cd flyerx-backend
docker-compose up -d
```

2. Gere um token de teste:
```bash
curl -X POST http://localhost:8000/api/v1/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'
```

3. Crie um saque:
```bash
curl -X POST http://localhost:8000/api/v1/withdrawals \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pix_key": "11999999999",
    "pix_key_type": "PHONE",
    "beneficiary_tax_number": "12345678909",
    "amount_reais": 100
  }'
```

4. Consulte o status:
```bash
curl http://localhost:8000/api/v1/withdrawals/<id>/status \
  -H "Authorization: Bearer <token>"
```
