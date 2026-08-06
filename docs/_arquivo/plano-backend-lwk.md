# Plano de Implementação - Backend LWK para Saques com Taxa de Parceiro

## Visão Geral

Este documento descreve a arquitetura e implementação de um backend utilizando **LWK (Liquid Wallet Kit)** para processar saques (DePix → PIX) com cobrança de taxa de parceiro no Flyerx.

### Problema

A API Pix2Depix da Eulen **não suporta split de taxas em saques** (apenas em depósitos). Para cobrar taxa de parceiro em saques, é necessário um backend intermediário que:

1. Receba DePix do usuário em um endereço próprio
2. Separe a taxa do parceiro
3. Encaminhe o restante para a API Eulen processar o PIX

### Solução

Implementar um backend com LWK que atua como intermediário entre o usuário e a API Eulen.

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITETURA DO SISTEMA                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────┐
│   Frontend  │────▶│  Backend Flyerx │────▶│   API Eulen     │────▶│  Banco  │
│  (Next.js)  │     │  (Node/Python)  │     │  (Pix2Depix)    │     │  (PIX)  │
└─────────────┘     └────────┬────────┘     └─────────────────┘     └─────────┘
                             │
                    ┌────────▼────────┐
                    │   LWK Wallet    │
                    │ (Liquid Network)│
                    └─────────────────┘

Fluxo de Dados:
1. Frontend → Backend: Solicita saque
2. Backend → Eulen: Cria ordem de saque (recebe depositAddress)
3. Backend → LWK: Gera endereço para usuário
4. Usuário → LWK: Envia DePix
5. LWK Worker: Detecta, separa taxa, envia para Eulen
6. Eulen → Banco: Processa PIX
```

---

## Componentes

### 1. Backend API (Node.js/Python)

Responsável por:
- Receber solicitações de saque do frontend
- Comunicar com API Eulen
- Gerenciar endereços LWK
- Armazenar estado das transações

### 2. LWK Wallet Service

Responsável por:
- Gerar endereços Liquid para cada saque
- Monitorar transações recebidas
- Enviar DePix para endereços da Eulen

### 3. Worker de Processamento

Responsável por:
- Polling de transações pendentes
- Detecção de depósitos recebidos
- Processamento automático de envios

### 4. Banco de Dados

Armazena:
- Ordens de saque
- Mapeamento endereço → saque
- Status das transações
- Logs de auditoria

---

## Stack Tecnológica

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Backend API | Node.js + Express ou Python + FastAPI | Compatibilidade com LWK |
| LWK | Python (`pip install lwk`) | SDK oficial mais maduro |
| Banco de Dados | PostgreSQL | Confiabilidade, ACID |
| Cache | Redis | Filas, locks distribuídos |
| Worker | Bull (Node) ou Celery (Python) | Processamento assíncrono |

### Recomendação: Python + FastAPI

O LWK tem bindings mais maduros para Python, então recomendo:

```
Backend:     Python 3.11+ com FastAPI
LWK:         lwk (pip install lwk)
ORM:         SQLAlchemy ou Prisma
Worker:      Celery + Redis
Deploy:      Docker + Docker Compose
```

---

## Modelo de Dados

### Tabela: `withdrawals`

```sql
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Dados do usuário
    user_id UUID NOT NULL,
    pix_key VARCHAR(100) NOT NULL,
    pix_key_type VARCHAR(20) NOT NULL,
    beneficiary_tax_number VARCHAR(14) NOT NULL,

    -- Valores
    requested_amount_cents INTEGER NOT NULL,      -- Valor que usuário quer receber
    partner_fee_cents INTEGER NOT NULL,           -- Taxa do parceiro Flyerx
    eulen_fee_cents INTEGER NOT NULL,             -- Taxa da Eulen
    total_depix_cents INTEGER NOT NULL,           -- Total que usuário deve enviar

    -- Endereços Liquid
    flyerx_address VARCHAR(150) NOT NULL,         -- Endereço LWK gerado
    flyerx_address_index INTEGER NOT NULL,        -- Índice HD do endereço
    eulen_deposit_address VARCHAR(150),           -- Endereço da Eulen

    -- IDs externos
    eulen_withdrawal_id VARCHAR(100),             -- ID retornado pela Eulen

    -- Transações blockchain
    user_tx_id VARCHAR(100),                      -- TX do usuário → Flyerx
    flyerx_to_eulen_tx_id VARCHAR(100),           -- TX do Flyerx → Eulen

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    status_history JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    user_deposit_at TIMESTAMP,
    sent_to_eulen_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadados
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_flyerx_address ON withdrawals(flyerx_address);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);
```

### Enum: Status do Saque

```typescript
type WithdrawalStatus =
  | 'pending'              // Aguardando usuário enviar DePix
  | 'depix_received'       // DePix recebido no endereço Flyerx
  | 'processing'           // Processando envio para Eulen
  | 'sent_to_eulen'        // DePix enviado para Eulen
  | 'eulen_processing'     // Eulen processando PIX
  | 'completed'            // PIX enviado com sucesso
  | 'failed'               // Erro no processo
  | 'refunded'             // Reembolsado ao usuário
  | 'expired';             // Expirado (usuário não enviou)
```

### Tabela: `wallet_addresses`

```sql
CREATE TABLE wallet_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(150) UNIQUE NOT NULL,
    address_index INTEGER NOT NULL,
    withdrawal_id UUID REFERENCES withdrawals(id),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `transactions_log`

```sql
CREATE TABLE transactions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID REFERENCES withdrawals(id),
    type VARCHAR(30) NOT NULL,                    -- 'received', 'sent', 'fee'
    tx_id VARCHAR(100),
    from_address VARCHAR(150),
    to_address VARCHAR(150),
    amount_cents INTEGER NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    block_height INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### POST /api/v1/withdrawals

Cria uma nova solicitação de saque.

**Request:**
```json
{
  "pixKey": "11999999999",
  "pixKeyType": "PHONE",
  "beneficiaryTaxNumber": "12345678901",
  "amountReais": 100.00
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "flyerxAddress": "lq1qqflyerx...",
  "totalDepixToSend": 102.50,
  "breakdown": {
    "requestedAmount": 100.00,
    "partnerFee": 1.50,
    "eulenFee": 1.00,
    "total": 102.50
  },
  "expiresAt": "2024-06-15T15:30:00Z",
  "status": "pending"
}
```

### GET /api/v1/withdrawals/:id

Consulta status de um saque.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "requestedAmount": 100.00,
  "partnerFee": 1.50,
  "eulenFee": 1.00,
  "pixKey": "11999999999",
  "userTxId": "abc123...",
  "eulenTxId": "def456...",
  "receiptUrl": "https://pix.bcb.gov.br/...",
  "createdAt": "2024-06-15T14:00:00Z",
  "completedAt": "2024-06-15T14:05:00Z"
}
```

### GET /api/v1/withdrawals

Lista saques do usuário.

**Query params:**
- `status`: Filtrar por status
- `limit`: Limite de resultados (default: 20)
- `offset`: Offset para paginação

### POST /api/v1/withdrawals/:id/cancel

Cancela um saque pendente.

---

## Fluxo Detalhado

### Fase 1: Solicitação de Saque

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FASE 1: SOLICITAÇÃO DE SAQUE                                                │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend                    Backend Flyerx                 API Eulen
    │                            │                            │
    │  POST /withdrawals         │                            │
    │  {amount, pixKey, cpf}     │                            │
    │ ──────────────────────────▶│                            │
    │                            │                            │
    │                            │  1. Validar dados          │
    │                            │  2. Calcular taxas         │
    │                            │     - partnerFee: 1.5%     │
    │                            │     - eulenFee: 1%         │
    │                            │                            │
    │                            │  POST /withdraw            │
    │                            │  {pixKey, taxNumber,       │
    │                            │   payoutAmountInCents}     │
    │                            │ ──────────────────────────▶│
    │                            │                            │
    │                            │  {withdrawalId,            │
    │                            │   depositAddress,          │
    │                            │   depositAmountInCents}    │
    │                            │ ◀──────────────────────────│
    │                            │                            │
    │                            │  3. Gerar endereço LWK     │
    │                            │     lwk.get_new_address()  │
    │                            │                            │
    │                            │  4. Salvar no banco        │
    │                            │                            │
    │  {flyerxAddress,           │                            │
    │   totalDepix,              │                            │
    │   breakdown}               │                            │
    │ ◀──────────────────────────│                            │
    │                            │                            │
```

### Fase 2: Usuário Envia DePix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FASE 2: USUÁRIO ENVIA DEPIX                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Usuário                     Carteira Liquid              Blockchain Liquid
    │                            │                            │
    │  Abre carteira Liquid      │                            │
    │  (Aqua, SideSwap, etc)     │                            │
    │ ──────────────────────────▶│                            │
    │                            │                            │
    │  Envia 102.50 DePix        │                            │
    │  para: lq1qqflyerx...      │                            │
    │ ──────────────────────────▶│                            │
    │                            │  Broadcast TX              │
    │                            │ ──────────────────────────▶│
    │                            │                            │
    │                            │  TX confirmada             │
    │                            │ ◀──────────────────────────│
    │                            │                            │
```

### Fase 3: Worker Processa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FASE 3: WORKER PROCESSA AUTOMATICAMENTE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Worker LWK                  LWK Wallet                   API Eulen
    │                            │                            │
    │  Polling a cada 10s        │                            │
    │  lwk.sync()                │                            │
    │ ──────────────────────────▶│                            │
    │                            │                            │
    │  Verificar balanço         │                            │
    │  lq1qqflyerx...            │                            │
    │ ──────────────────────────▶│                            │
    │                            │                            │
    │  balance = 102.50          │                            │
    │ ◀──────────────────────────│                            │
    │                            │                            │
    │  102.50 >= 102.50? ✓       │                            │
    │                            │                            │
    │  Separar taxa:             │                            │
    │  - 1.50 → carteira Flyerx  │                            │
    │  - 101.00 → Eulen          │                            │
    │                            │                            │
    │  lwk.send(                 │                            │
    │    to=eulen_address,       │                            │
    │    amount=101.00           │                            │
    │  )                         │                            │
    │ ──────────────────────────▶│                            │
    │                            │                            │
    │  tx_id: abc123...          │                            │
    │ ◀──────────────────────────│                            │
    │                            │                            │
    │  Atualizar status:         │                            │
    │  'sent_to_eulen'           │                            │
    │                            │                            │
    │  Polling status Eulen      │                            │
    │ ──────────────────────────────────────────────────────▶│
    │                            │                            │
    │  {status: 'sent',          │                            │
    │   receiptUrl: '...'}       │                            │
    │ ◀──────────────────────────────────────────────────────│
    │                            │                            │
    │  Atualizar status:         │                            │
    │  'completed'               │                            │
    │                            │                            │
```

---

## Código de Implementação

### Estrutura do Projeto

```
flyerx-backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── withdrawals.py
│   │   │   └── health.py
│   │   ├── schemas/
│   │   │   └── withdrawal.py
│   │   └── dependencies.py
│   ├── services/
│   │   ├── withdrawal_service.py
│   │   ├── eulen_service.py
│   │   └── lwk_service.py
│   ├── workers/
│   │   ├── withdrawal_processor.py
│   │   └── status_checker.py
│   ├── models/
│   │   ├── withdrawal.py
│   │   └── transaction_log.py
│   ├── config/
│   │   └── settings.py
│   └── main.py
├── tests/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

### LWK Service (lwk_service.py)

```python
import lwk
from typing import Optional
from dataclasses import dataclass

@dataclass
class LWKConfig:
    network: str = "liquid"  # ou "liquid-testnet"
    electrum_url: str = "blockstream.info:995"
    mnemonic: str = ""  # Carregar de variável de ambiente segura

class LWKService:
    def __init__(self, config: LWKConfig):
        self.config = config
        self.network = lwk.Network.mainnet() if config.network == "liquid" else lwk.Network.testnet()

        # Inicializar signer com mnemonic
        mnemonic = lwk.Mnemonic(config.mnemonic)
        self.signer = lwk.Signer(mnemonic, self.network)

        # Criar descriptor para watch-only wallet
        descriptor = self.signer.wpkh_slip77_descriptor()
        self.wollet = lwk.Wollet(self.network, descriptor, None)

        # Cliente Electrum
        self.client = lwk.ElectrumClient(config.electrum_url)

    def sync(self):
        """Sincroniza a carteira com a blockchain"""
        update = self.client.full_scan(self.wollet)
        if update:
            self.wollet.apply_update(update)

    def get_new_address(self) -> tuple[str, int]:
        """Gera um novo endereço e retorna (address, index)"""
        address = self.wollet.address(None)  # None = próximo índice
        return str(address.address()), address.index()

    def get_address_balance(self, address: str) -> int:
        """Retorna o balanço de um endereço em satoshis"""
        self.sync()
        # LWK retorna balanço total, precisamos filtrar por endereço
        # usando as UTXOs
        balance = 0
        for utxo in self.wollet.utxos():
            if str(utxo.script_pubkey()) == address:
                balance += utxo.value()
        return balance

    def get_total_balance(self) -> dict:
        """Retorna balanço total da carteira"""
        self.sync()
        balance = self.wollet.balance()
        return {
            "confirmed": balance.confirmed,
            "unconfirmed": balance.unconfirmed,
            "total": balance.confirmed + balance.unconfirmed
        }

    def send(self, to_address: str, amount_sats: int, asset_id: str = None) -> str:
        """
        Envia DePix para um endereço
        Retorna o txid
        """
        self.sync()

        # Asset ID do DePix (L-BTC para mainnet)
        if asset_id is None:
            asset_id = self.network.policy_asset()

        # Criar transação
        builder = lwk.TxBuilder(self.network)
        builder.add_recipient(
            lwk.Address(to_address),
            amount_sats,
            asset_id
        )

        # Construir PSET (Partially Signed Elements Transaction)
        pset = builder.finish(self.wollet)

        # Assinar
        signed_pset = self.signer.sign(pset)

        # Finalizar e extrair transação
        tx = self.wollet.finalize(signed_pset)

        # Broadcast
        txid = self.client.broadcast(tx)

        return txid

    def check_transaction_confirmed(self, txid: str, min_confirmations: int = 1) -> bool:
        """Verifica se uma transação foi confirmada"""
        self.sync()
        for tx in self.wollet.transactions():
            if tx.txid() == txid:
                return tx.confirmations() >= min_confirmations
        return False
```

### Withdrawal Service (withdrawal_service.py)

```python
from decimal import Decimal
from uuid import UUID
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from models.withdrawal import Withdrawal, WithdrawalStatus
from services.lwk_service import LWKService
from services.eulen_service import EulenService
from config.settings import settings

class WithdrawalService:
    def __init__(
        self,
        db: Session,
        lwk_service: LWKService,
        eulen_service: EulenService
    ):
        self.db = db
        self.lwk = lwk_service
        self.eulen = eulen_service

    def calculate_fees(self, amount_cents: int) -> dict:
        """Calcula as taxas do saque"""
        # Taxa do parceiro Flyerx
        partner_percent = Decimal(settings.PARTNER_WITHDRAW_FEE_PERCENT)  # 0.015 = 1.5%
        partner_fixed = settings.PARTNER_WITHDRAW_FEE_FIXED_CENTS  # 0
        partner_min = settings.PARTNER_WITHDRAW_FEE_MIN_CENTS  # 50 = R$ 0.50

        partner_fee = max(
            int(amount_cents * partner_percent) + partner_fixed,
            partner_min
        )

        # Taxa da Eulen (1% com mínimo de R$ 1.00)
        eulen_percent = Decimal("0.01")
        eulen_min = 100  # R$ 1.00 em centavos
        eulen_fee = max(int(amount_cents * eulen_percent), eulen_min)

        return {
            "partner_fee_cents": partner_fee,
            "eulen_fee_cents": eulen_fee,
            "total_fee_cents": partner_fee + eulen_fee,
            "total_depix_cents": amount_cents + partner_fee + eulen_fee
        }

    async def create_withdrawal(
        self,
        user_id: UUID,
        pix_key: str,
        pix_key_type: str,
        beneficiary_tax_number: str,
        amount_cents: int
    ) -> Withdrawal:
        """Cria uma nova solicitação de saque"""

        # 1. Calcular taxas
        fees = self.calculate_fees(amount_cents)

        # 2. Chamar API Eulen para criar ordem de saque
        eulen_response = await self.eulen.create_withdraw(
            pix_key=pix_key,
            tax_number=beneficiary_tax_number,
            payout_amount_cents=amount_cents
        )

        # 3. Gerar endereço LWK para o usuário
        flyerx_address, address_index = self.lwk.get_new_address()

        # 4. Criar registro no banco
        withdrawal = Withdrawal(
            user_id=user_id,
            pix_key=pix_key,
            pix_key_type=pix_key_type,
            beneficiary_tax_number=beneficiary_tax_number,
            requested_amount_cents=amount_cents,
            partner_fee_cents=fees["partner_fee_cents"],
            eulen_fee_cents=fees["eulen_fee_cents"],
            total_depix_cents=fees["total_depix_cents"],
            flyerx_address=flyerx_address,
            flyerx_address_index=address_index,
            eulen_deposit_address=eulen_response["depositAddress"],
            eulen_withdrawal_id=eulen_response["withdrawalId"],
            status=WithdrawalStatus.PENDING,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )

        self.db.add(withdrawal)
        self.db.commit()
        self.db.refresh(withdrawal)

        return withdrawal

    async def process_received_deposit(self, withdrawal_id: UUID) -> bool:
        """
        Processa um depósito recebido:
        1. Verifica se o valor está correto
        2. Separa a taxa do parceiro
        3. Envia o restante para Eulen
        """
        withdrawal = self.db.query(Withdrawal).filter(
            Withdrawal.id == withdrawal_id
        ).first()

        if not withdrawal:
            return False

        # Verificar balanço no endereço
        balance_sats = self.lwk.get_address_balance(withdrawal.flyerx_address)
        balance_cents = balance_sats  # DePix: 1 sat = 1 centavo

        if balance_cents < withdrawal.total_depix_cents:
            return False  # Valor insuficiente

        # Atualizar status
        withdrawal.status = WithdrawalStatus.PROCESSING
        withdrawal.user_deposit_at = datetime.utcnow()
        self.db.commit()

        try:
            # Calcular valor a enviar para Eulen
            # (total recebido - taxa do parceiro)
            amount_to_eulen_cents = balance_cents - withdrawal.partner_fee_cents

            # Enviar para endereço da Eulen
            txid = self.lwk.send(
                to_address=withdrawal.eulen_deposit_address,
                amount_sats=amount_to_eulen_cents  # 1 sat = 1 centavo
            )

            # Atualizar registro
            withdrawal.flyerx_to_eulen_tx_id = txid
            withdrawal.sent_to_eulen_at = datetime.utcnow()
            withdrawal.status = WithdrawalStatus.SENT_TO_EULEN
            self.db.commit()

            return True

        except Exception as e:
            withdrawal.status = WithdrawalStatus.FAILED
            withdrawal.error_message = str(e)
            self.db.commit()
            return False

    async def check_eulen_status(self, withdrawal_id: UUID) -> Optional[str]:
        """Verifica status do saque na Eulen e atualiza"""
        withdrawal = self.db.query(Withdrawal).filter(
            Withdrawal.id == withdrawal_id
        ).first()

        if not withdrawal or not withdrawal.eulen_withdrawal_id:
            return None

        eulen_status = await self.eulen.get_withdraw_status(
            withdrawal.eulen_withdrawal_id
        )

        if eulen_status["status"] == "sent":
            withdrawal.status = WithdrawalStatus.COMPLETED
            withdrawal.completed_at = datetime.utcnow()
        elif eulen_status["status"] == "error":
            withdrawal.status = WithdrawalStatus.FAILED
            withdrawal.error_message = eulen_status.get("error", "Erro desconhecido")

        self.db.commit()
        return withdrawal.status
```

### Worker de Processamento (withdrawal_processor.py)

```python
import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models.withdrawal import Withdrawal, WithdrawalStatus
from services.withdrawal_service import WithdrawalService
from services.lwk_service import LWKService
from services.eulen_service import EulenService
from config.database import get_db

logger = logging.getLogger(__name__)

class WithdrawalProcessor:
    def __init__(self):
        self.running = False
        self.poll_interval = 10  # segundos

    async def start(self):
        """Inicia o worker de processamento"""
        self.running = True
        logger.info("Withdrawal processor started")

        while self.running:
            try:
                await self.process_pending_withdrawals()
                await self.check_sent_withdrawals()
                await self.expire_old_withdrawals()
            except Exception as e:
                logger.error(f"Error in withdrawal processor: {e}")

            await asyncio.sleep(self.poll_interval)

    def stop(self):
        """Para o worker"""
        self.running = False
        logger.info("Withdrawal processor stopped")

    async def process_pending_withdrawals(self):
        """Processa saques aguardando depósito do usuário"""
        db = next(get_db())
        lwk = LWKService()
        eulen = EulenService()
        service = WithdrawalService(db, lwk, eulen)

        # Sincronizar carteira LWK
        lwk.sync()

        # Buscar saques pendentes
        pending = db.query(Withdrawal).filter(
            Withdrawal.status == WithdrawalStatus.PENDING,
            Withdrawal.expires_at > datetime.utcnow()
        ).all()

        for withdrawal in pending:
            # Verificar se recebeu depósito
            balance = lwk.get_address_balance(withdrawal.flyerx_address)

            if balance >= withdrawal.total_depix_cents:
                logger.info(f"Deposit received for withdrawal {withdrawal.id}")

                # Processar envio para Eulen
                success = await service.process_received_deposit(withdrawal.id)

                if success:
                    logger.info(f"Withdrawal {withdrawal.id} sent to Eulen")
                else:
                    logger.error(f"Failed to process withdrawal {withdrawal.id}")

        db.close()

    async def check_sent_withdrawals(self):
        """Verifica status dos saques enviados para Eulen"""
        db = next(get_db())
        lwk = LWKService()
        eulen = EulenService()
        service = WithdrawalService(db, lwk, eulen)

        # Buscar saques enviados para Eulen
        sent = db.query(Withdrawal).filter(
            Withdrawal.status == WithdrawalStatus.SENT_TO_EULEN
        ).all()

        for withdrawal in sent:
            status = await service.check_eulen_status(withdrawal.id)

            if status == WithdrawalStatus.COMPLETED:
                logger.info(f"Withdrawal {withdrawal.id} completed")
            elif status == WithdrawalStatus.FAILED:
                logger.error(f"Withdrawal {withdrawal.id} failed")

        db.close()

    async def expire_old_withdrawals(self):
        """Expira saques que não receberam depósito"""
        db = next(get_db())

        expired = db.query(Withdrawal).filter(
            Withdrawal.status == WithdrawalStatus.PENDING,
            Withdrawal.expires_at <= datetime.utcnow()
        ).all()

        for withdrawal in expired:
            withdrawal.status = WithdrawalStatus.EXPIRED
            logger.info(f"Withdrawal {withdrawal.id} expired")

        db.commit()
        db.close()


# Entry point
if __name__ == "__main__":
    processor = WithdrawalProcessor()
    asyncio.run(processor.start())
```

### API Routes (withdrawals.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from api.schemas.withdrawal import (
    CreateWithdrawalRequest,
    WithdrawalResponse,
    WithdrawalListResponse
)
from api.dependencies import get_current_user, get_db
from services.withdrawal_service import WithdrawalService
from services.lwk_service import LWKService
from services.eulen_service import EulenService
from models.user import User

router = APIRouter(prefix="/withdrawals", tags=["withdrawals"])

def get_withdrawal_service(db: Session = Depends(get_db)):
    lwk = LWKService()
    eulen = EulenService()
    return WithdrawalService(db, lwk, eulen)


@router.post("", response_model=WithdrawalResponse)
async def create_withdrawal(
    request: CreateWithdrawalRequest,
    current_user: User = Depends(get_current_user),
    service: WithdrawalService = Depends(get_withdrawal_service)
):
    """Cria uma nova solicitação de saque"""

    # Validações
    if request.amount_reais < 10:
        raise HTTPException(400, "Valor mínimo: R$ 10,00")

    if request.amount_reais > 6000:
        raise HTTPException(400, "Valor máximo: R$ 6.000,00")

    # Converter para centavos
    amount_cents = int(request.amount_reais * 100)

    # Criar saque
    withdrawal = await service.create_withdrawal(
        user_id=current_user.id,
        pix_key=request.pix_key,
        pix_key_type=request.pix_key_type,
        beneficiary_tax_number=request.beneficiary_tax_number,
        amount_cents=amount_cents
    )

    return WithdrawalResponse.from_orm(withdrawal)


@router.get("/{withdrawal_id}", response_model=WithdrawalResponse)
async def get_withdrawal(
    withdrawal_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WithdrawalService = Depends(get_withdrawal_service)
):
    """Consulta status de um saque"""
    withdrawal = service.get_withdrawal(withdrawal_id)

    if not withdrawal:
        raise HTTPException(404, "Saque não encontrado")

    if withdrawal.user_id != current_user.id:
        raise HTTPException(403, "Acesso negado")

    return WithdrawalResponse.from_orm(withdrawal)


@router.get("", response_model=WithdrawalListResponse)
async def list_withdrawals(
    status: str = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    service: WithdrawalService = Depends(get_withdrawal_service)
):
    """Lista saques do usuário"""
    withdrawals = service.list_withdrawals(
        user_id=current_user.id,
        status=status,
        limit=limit,
        offset=offset
    )

    return WithdrawalListResponse(
        items=[WithdrawalResponse.from_orm(w) for w in withdrawals],
        total=len(withdrawals)
    )


@router.post("/{withdrawal_id}/cancel")
async def cancel_withdrawal(
    withdrawal_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WithdrawalService = Depends(get_withdrawal_service)
):
    """Cancela um saque pendente"""
    success = await service.cancel_withdrawal(
        withdrawal_id=withdrawal_id,
        user_id=current_user.id
    )

    if not success:
        raise HTTPException(400, "Não foi possível cancelar o saque")

    return {"message": "Saque cancelado com sucesso"}
```

---

## Configurações

### Variáveis de Ambiente (.env)

```env
# Aplicação
APP_ENV=production
APP_PORT=8000
APP_SECRET_KEY=your-secret-key-here

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/flyerx

# Redis
REDIS_URL=redis://localhost:6379/0

# LWK
LWK_NETWORK=liquid
LWK_ELECTRUM_URL=blockstream.info:995
LWK_MNEMONIC=your mnemonic words here  # MUITO SENSÍVEL!

# Eulen API
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=your-eulen-jwt-token

# Taxas de Parceiro
PARTNER_WITHDRAW_FEE_PERCENT=0.015
PARTNER_WITHDRAW_FEE_FIXED_CENTS=0
PARTNER_WITHDRAW_FEE_MIN_CENTS=50

# Worker
WITHDRAWAL_POLL_INTERVAL_SECONDS=10
WITHDRAWAL_EXPIRATION_HOURS=1
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://flyerx:flyerx@db:5432/flyerx
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./src:/app/src
    command: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build: .
    environment:
      - DATABASE_URL=postgresql://flyerx:flyerx@db:5432/flyerx
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    command: python -m src.workers.withdrawal_processor

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=flyerx
      - POSTGRES_PASSWORD=flyerx
      - POSTGRES_DB=flyerx
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Segurança

### 1. Proteção do Mnemonic

```python
# NUNCA armazenar em código ou .env em produção
# Usar vault seguro como:
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault

import boto3

def get_mnemonic():
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId='flyerx/lwk/mnemonic')
    return response['SecretString']
```

### 2. Validação de Endereços

```python
def validate_liquid_address(address: str) -> bool:
    """Valida endereço Liquid"""
    if not address:
        return False

    # Prefixos válidos
    valid_prefixes = ['lq1', 'ex1', 'VJL', 'VTp']

    if not any(address.startswith(p) for p in valid_prefixes):
        return False

    # Tamanho mínimo
    if len(address) < 40:
        return False

    return True
```

### 3. Rate Limiting

```python
from fastapi import Request
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("")
@limiter.limit("5/minute")
async def create_withdrawal(request: Request, ...):
    ...
```

### 4. Logs de Auditoria

```python
async def log_transaction(
    db: Session,
    withdrawal_id: UUID,
    action: str,
    details: dict
):
    log = TransactionLog(
        withdrawal_id=withdrawal_id,
        action=action,
        details=details,
        ip_address=get_client_ip(),
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
```

---

## Monitoramento

### Métricas

```python
from prometheus_client import Counter, Histogram, Gauge

# Contadores
withdrawals_created = Counter(
    'flyerx_withdrawals_created_total',
    'Total de saques criados'
)

withdrawals_completed = Counter(
    'flyerx_withdrawals_completed_total',
    'Total de saques completados'
)

withdrawals_failed = Counter(
    'flyerx_withdrawals_failed_total',
    'Total de saques que falharam'
)

# Histograma de tempo
withdrawal_processing_time = Histogram(
    'flyerx_withdrawal_processing_seconds',
    'Tempo de processamento de saques'
)

# Gauge para balanço
wallet_balance = Gauge(
    'flyerx_wallet_balance_cents',
    'Balanço da carteira LWK'
)
```

### Alertas

- Balanço da carteira abaixo de threshold
- Saques pendentes por mais de 30 minutos
- Taxa de erro acima de 5%
- Worker offline

---

## Fases de Implementação

### Fase 1: Setup Básico (1 semana)

- [ ] Setup projeto Python + FastAPI
- [ ] Configurar banco PostgreSQL
- [ ] Configurar Redis
- [ ] Implementar modelos básicos
- [ ] Implementar autenticação JWT
- [ ] Docker Compose

### Fase 2: Integração LWK (1 semana)

- [ ] Instalar e configurar LWK
- [ ] Implementar LWKService
- [ ] Testar geração de endereços
- [ ] Testar envio de transações (testnet)
- [ ] Implementar sincronização

### Fase 3: Integração Eulen (3 dias)

- [ ] Implementar EulenService
- [ ] Testar criação de saques
- [ ] Testar consulta de status
- [ ] Mapear erros

### Fase 4: API de Saques (3 dias)

- [ ] Endpoint criar saque
- [ ] Endpoint consultar status
- [ ] Endpoint listar saques
- [ ] Endpoint cancelar
- [ ] Validações

### Fase 5: Worker (3 dias)

- [ ] Implementar processor principal
- [ ] Detecção de depósitos
- [ ] Processamento automático
- [ ] Tratamento de erros
- [ ] Retentativas

### Fase 6: Testes (3 dias)

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E em testnet
- [ ] Testes de carga

### Fase 7: Deploy (2 dias)

- [ ] Setup ambiente produção
- [ ] Configurar secrets
- [ ] Deploy inicial
- [ ] Monitoramento

---

## Estimativa de Tempo Total

| Fase | Duração |
|------|---------|
| Setup Básico | 5 dias |
| Integração LWK | 5 dias |
| Integração Eulen | 3 dias |
| API de Saques | 3 dias |
| Worker | 3 dias |
| Testes | 3 dias |
| Deploy | 2 dias |
| **Total** | **~4 semanas** |

---

## Considerações Finais

### Vantagens desta Arquitetura

1. **Controle total** sobre taxas e fluxo
2. **Auditoria completa** de todas as transações
3. **Flexibilidade** para adicionar features
4. **Independência** da API Eulen para taxa de parceiro

### Desvantagens

1. **Complexidade adicional** de manter carteira Liquid
2. **Responsabilidade** de segurança do mnemonic
3. **Custo operacional** de infraestrutura

### Alternativas

Se a complexidade for muito alta, considerar:

1. **Negociar com Eulen** para suporte a split em saques
2. **Parceria com outro gateway** que suporte split
3. **Não cobrar taxa em saques** inicialmente

---

## Próximos Passos

1. Validar arquitetura com a equipe
2. Decidir stack (Python vs Node.js)
3. Criar repositório `flyerx-backend`
4. Iniciar Fase 1
