# Resumo Executivo - Backend LWK Flyerx

## Objetivo

Implementar backend com LWK (Liquid Wallet Kit) para processar saques com cobrança de taxa de parceiro.

## Problema

A API Eulen **não suporta split de taxas em saques** (apenas em depósitos).

## Solução

Backend intermediário que:
1. Recebe DePix do usuário
2. Separa taxa do parceiro (ex: 1.5%)
3. Envia restante para Eulen processar PIX

## Fluxo Resumido

```
Usuário → Flyerx (LWK) → Eulen → PIX → Beneficiário
         ↓
    Taxa parceiro fica aqui
```

## Stack Recomendada

| Componente | Tecnologia |
|------------|------------|
| Backend | Python + FastAPI |
| LWK | `pip install lwk` |
| Database | PostgreSQL |
| Queue | Redis + Celery |
| Deploy | Docker |

## Componentes Principais

1. **API REST** - Endpoints para criar/consultar saques
2. **LWK Service** - Geração de endereços, envio de DePix
3. **Worker** - Processa depósitos automaticamente
4. **Database** - Armazena estado das transações

## Taxas Configuráveis

```
partnerPercentFee: 1.5%   # Taxa percentual
partnerFixedFee: R$ 0     # Taxa fixa
partnerMinFee: R$ 0.50    # Taxa mínima
```

## Fases de Implementação

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Setup (FastAPI, PostgreSQL, Docker) | 5 dias |
| 2 | Integração LWK | 5 dias |
| 3 | Integração Eulen | 3 dias |
| 4 | API de Saques | 3 dias |
| 5 | Worker | 3 dias |
| 6 | Testes | 3 dias |
| 7 | Deploy | 2 dias |
| **Total** | | **~4 semanas** |

## Segurança

- Mnemonic em vault seguro (AWS Secrets Manager)
- Rate limiting
- Logs de auditoria
- Validação de endereços

## Arquivos de Referência

- Plano completo: `docs/plano-backend-lwk.md`
- Documentação LWK: https://github.com/Blockstream/lwk

## Decisão Necessária

Antes de iniciar, confirmar:

1. [ ] Stack aprovada (Python + FastAPI)
2. [ ] Percentual de taxa de parceiro
3. [ ] Ambiente de testes (testnet Liquid)
4. [ ] Infraestrutura (AWS/GCP/VPS)

---

**Documento completo:** `docs/plano-backend-lwk.md`
