# Plano de Implementação - Webhooks Eulen

## Visão Geral

Este documento descreve os próximos passos para implementar webhooks da API Eulen (Pix2Depix) no sistema Flyerx, substituindo o polling atual por notificações em tempo real.

**Prioridade:** Pós-produção (Fase 2)
**Estimativa:** 2-3 dias de desenvolvimento

---

## Status Atual (Fase 1 - Produção)

### O que já funciona:
- [x] Depósitos via API Eulen direta
- [x] Saques via backend Python (LWK)
- [x] Validação de limite diário por CPF/CNPJ
- [x] Polling de status a cada 5 segundos
- [x] Normalização de chave PIX (+55)

### Limitações do polling:
- Alto consumo de requisições
- Latência de até 5 segundos
- Carga desnecessária no servidor

---

## Fase 2 - Webhooks

### 2.1 Configuração na Eulen (via Telegram)

```bash
# Registrar webhook de depósito
/registerwebhook deposit https://api.flyerx.com/webhooks/eulen/deposit <SECRET_32_CHARS>

# Registrar webhook de saque
/registerwebhook withdraw https://api.flyerx.com/webhooks/eulen/withdraw <SECRET_32_CHARS>
```

**Importante:** O secret deve ter no mínimo 32 caracteres hexadecimais.

---

### 2.2 Endpoints a Implementar

#### POST /webhooks/eulen/deposit

Recebe notificações de depósitos (PIX → DePix).

```python
# src/api/routes/webhooks.py

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import base64
import hmac

router = APIRouter(prefix="/webhooks/eulen", tags=["webhooks"])

class DepositWebhook(BaseModel):
    webhookType: str  # "deposit"
    qrId: str
    status: str  # pending, depix_sent, refunded, etc.
    valueInCents: int
    payerEUID: str
    payerTaxNumber: str
    payerName: str
    pixKey: str
    blockchainTxID: Optional[str] = None
    bankTxId: Optional[str] = None

@router.post("/deposit")
async def handle_deposit_webhook(
    payload: DepositWebhook,
    authorization: str = Header(...),
):
    """
    Webhook chamado pela Eulen quando status do depósito muda.

    Eventos importantes:
    - depix_sent: DePix foi enviado ao usuário (sucesso)
    - refunded: Depósito foi reembolsado
    - error: Erro no processamento
    """
    # 1. Validar autenticação
    if not verify_webhook_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Processar evento
    if payload.status == "depix_sent":
        # Atualizar saldo do usuário
        # Notificar frontend via WebSocket/SSE
        pass

    elif payload.status in ["refunded", "error", "canceled"]:
        # Marcar depósito como falho
        # Notificar usuário
        pass

    # 3. Retornar 200 OK (obrigatório em até 15s)
    return {"status": "ok"}
```

#### POST /webhooks/eulen/withdraw

Recebe notificações de saques (DePix → PIX).

```python
class WithdrawWebhook(BaseModel):
    webhookType: str  # "withdraw"
    id: str  # eulen_withdrawal_id
    status: str  # unsent, sending, sent, error, etc.
    pixKey: str
    depositAddress: str
    depositAmountInCents: int
    payoutAmountInCents: int
    blockchainTxID: Optional[str] = None
    receiptUrl: Optional[str] = None
    receiverName: Optional[str] = None
    receiverTaxNumber: Optional[str] = None

@router.post("/withdraw")
async def handle_withdraw_webhook(
    payload: WithdrawWebhook,
    authorization: str = Header(...),
):
    """
    Webhook chamado pela Eulen quando status do saque muda.

    Eventos importantes:
    - sent: PIX foi enviado ao beneficiário (sucesso)
    - error: Erro no envio do PIX
    - refunded: DePix foi devolvido
    """
    # 1. Validar autenticação
    if not verify_webhook_auth(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Buscar saque pelo eulen_withdrawal_id
    withdrawal = await get_withdrawal_by_eulen_id(payload.id)
    if not withdrawal:
        # Pode ser saque de outro parceiro, ignorar
        return {"status": "ignored"}

    # 3. Atualizar status do saque
    if payload.status == "sent":
        withdrawal.status = WithdrawalStatus.COMPLETED
        withdrawal.receipt_url = payload.receiptUrl
        withdrawal.completed_at = datetime.utcnow()

    elif payload.status == "error":
        withdrawal.status = WithdrawalStatus.FAILED
        withdrawal.error_message = "Erro no envio do PIX"

    elif payload.status == "refunded":
        withdrawal.status = WithdrawalStatus.REFUNDED

    await db.commit()

    # 4. Notificar frontend
    # await notify_user(withdrawal.user_id, withdrawal)

    return {"status": "ok"}
```

---

### 2.3 Validação de Autenticação

```python
import base64
import hmac
import hashlib
from src.config.settings import settings

def verify_webhook_auth(authorization: str) -> bool:
    """
    Valida header Authorization: Basic base64(partner:secret)
    """
    if not authorization.startswith("Basic "):
        return False

    try:
        encoded = authorization[6:]  # Remove "Basic "
        decoded = base64.b64decode(encoded).decode("utf-8")
        partner, secret = decoded.split(":", 1)

        # Comparar com secret configurado
        expected_secret = settings.eulen_webhook_secret
        return hmac.compare_digest(secret, expected_secret)

    except Exception:
        return False
```

---

### 2.4 Configuração (.env)

```env
# Webhook Eulen
EULEN_WEBHOOK_SECRET=seu_secret_de_32_caracteres_aqui
EULEN_WEBHOOK_PARTNER=flyerx
```

---

### 2.5 Idempotência

Para evitar processamento duplicado (Eulen pode reenviar webhooks):

```python
from functools import lru_cache
import hashlib

# Cache simples em memória (usar Redis em produção)
processed_webhooks = set()

def is_duplicate_webhook(payload: dict) -> bool:
    """Verifica se webhook já foi processado."""
    # Criar hash único do payload
    payload_hash = hashlib.sha256(
        f"{payload.get('webhookType')}:{payload.get('id', payload.get('qrId'))}:{payload.get('status')}".encode()
    ).hexdigest()

    if payload_hash in processed_webhooks:
        return True

    processed_webhooks.add(payload_hash)
    return False
```

**Produção:** Usar Redis ou banco de dados para persistir webhooks processados.

---

### 2.6 Retry e Fallback

A Eulen tenta reenviar webhooks que falham. Mas como fallback:

```python
# Worker que roda a cada 1 minuto
async def check_pending_deposits():
    """Fallback: verifica depósitos pendentes via API."""
    pending = await get_pending_deposits(older_than_minutes=5)

    for deposit in pending:
        status = await eulen_api.get_deposit_status(deposit.qr_id)
        if status.status != deposit.status:
            await update_deposit_status(deposit, status)

async def check_pending_withdrawals():
    """Fallback: verifica saques pendentes via API."""
    pending = await get_pending_withdrawals(older_than_minutes=5)

    for withdrawal in pending:
        if withdrawal.eulen_withdrawal_id:
            status = await eulen_api.get_withdraw_status(withdrawal.eulen_withdrawal_id)
            if status.status != withdrawal.status:
                await update_withdrawal_status(withdrawal, status)
```

---

### 2.7 Notificação em Tempo Real (Opcional)

Para notificar o frontend instantaneamente:

#### Opção A: Server-Sent Events (SSE)
```python
from fastapi import Response
from sse_starlette.sse import EventSourceResponse

@router.get("/events/{user_id}")
async def user_events(user_id: str):
    async def event_generator():
        while True:
            event = await get_user_event(user_id)
            if event:
                yield {"event": event.type, "data": event.data}
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
```

#### Opção B: WebSocket
```python
from fastapi import WebSocket

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            event = await get_user_event(user_id)
            if event:
                await websocket.send_json(event)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
```

---

## Checklist de Implementação

### Pré-requisitos
- [ ] Sistema em produção com polling funcionando
- [ ] URL pública acessível (HTTPS obrigatório)
- [ ] Secret de 32+ caracteres gerado

### Desenvolvimento
- [ ] Criar arquivo `src/api/routes/webhooks.py`
- [ ] Implementar endpoint `/webhooks/eulen/deposit`
- [ ] Implementar endpoint `/webhooks/eulen/withdraw`
- [ ] Implementar validação de autenticação
- [ ] Implementar idempotência (Redis)
- [ ] Adicionar variáveis ao `.env`
- [ ] Registrar router no `main.py`

### Testes
- [ ] Testar com payload mock
- [ ] Testar autenticação inválida (401)
- [ ] Testar idempotência (duplicatas)
- [ ] Testar timeout (responder < 15s)

### Deploy
- [ ] Deploy do backend atualizado
- [ ] Registrar webhooks via Telegram
- [ ] Monitorar logs por 24h
- [ ] Desativar polling gradualmente

---

## Arquivos a Criar/Modificar

```
flyerx-backend/
├── src/
│   ├── api/
│   │   └── routes/
│   │       └── webhooks.py  # NOVO
│   ├── services/
│   │   └── webhook_service.py  # NOVO
│   └── main.py  # Adicionar router
└── .env  # Adicionar EULEN_WEBHOOK_SECRET
```

---

## Cronograma Sugerido

| Dia | Tarefa |
|-----|--------|
| 1 | Implementar endpoints e validação |
| 2 | Testes locais + idempotência |
| 3 | Deploy + registro webhooks + monitoramento |

---

## Referências

- [Documentação Webhook Eulen](https://docs.eulen.app/-webhook-849106m0.md)
- [DepositWebhookBody Schema](https://docs.eulen.app/depositwebhookbody-5517307d0.md)
- [WithdrawWebhookBody Schema](https://docs.eulen.app/withdrawwebhookbody-13016756d0.md)
