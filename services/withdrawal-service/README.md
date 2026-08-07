# Flyerx LWK Microservice

**Microserviço interno** para operações com Liquid Wallet Kit (LWK).

⚠️ Este serviço é chamado apenas pelo **Laravel**, não pelo frontend.

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│            (flyerx-web, flyerx-mobile)                  │
└─────────────────────┬───────────────────────────────────┘
                      │ 100% das chamadas
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  LARAVEL (api/)                         │
│  • Auth, Users, 2FA                                     │
│  • Deposits, Withdrawals                                │
│  • Audit logs, Business logic                           │
└─────────────────────┬───────────────────────────────────┘
                      │ Chamadas internas (HTTP)
                      │ Header: X-API-Key
                      ▼
┌─────────────────────────────────────────────────────────┐
│              PYTHON (flyerx-backend/)                   │
│  • LWK (Liquid Wallet Kit)                              │
│  • Gerar endereços Liquid                               │
│  • Enviar transações DePix                              │
└─────────────────────────────────────────────────────────┘
```

## Stack

- **Python 3.11+**
- **FastAPI** - Framework web async
- **SQLAlchemy 2.0** - ORM async
- **SQLite** (dev) / **PostgreSQL** (prod)
- **LWK** - Liquid Wallet Kit

## Estrutura

```
flyerx-backend/
├── src/
│   ├── api/
│   │   ├── routes/        # Endpoints da API
│   │   └── schemas/       # Schemas Pydantic
│   ├── config/            # Configurações
│   ├── models/            # Modelos SQLAlchemy
│   ├── services/          # Lógica de negócio
│   └── workers/           # Workers de processamento
├── requirements.txt       # Dependências completas
├── requirements-minimal.txt  # Dependências sem Docker
└── .env                   # Configuração
```

## Instalação

```bash
cd flyerx-backend

# Instalar dependências (sem Docker)
pip install -r requirements-minimal.txt
```

## Configuração

Configure o `.env`:

```env
# Ambiente
APP_ENV=development
APP_DEBUG=true

# Banco SQLite (desenvolvimento)
DATABASE_URL=sqlite+aiosqlite:///./flyerx.db

# LWK (Liquid Wallet Kit)
LWK_NETWORK=liquid
LWK_ELECTRUM_URL=blockstream.info:995
LWK_MNEMONIC=sua mnemonic de 12 palavras aqui

# API Eulen
EULEN_API_URL=https://depix.eulen.app/api
EULEN_API_TOKEN=seu_token_aqui
EULEN_MOCK_MODE=true  # true para desenvolvimento

# Taxas do parceiro
PARTNER_WITHDRAW_FEE_PERCENT=0.015
PARTNER_WITHDRAW_FEE_FIXED_CENTS=0
PARTNER_WITHDRAW_FEE_MIN_CENTS=50

# Autenticação interna (Laravel -> Python)
INTERNAL_API_KEY=flyerx-internal-api-key-dev-2024
```

## Execução

```bash
# Desenvolvimento
python -m src.main

# Ou com uvicorn diretamente
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

### Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| POST | `/internal/withdrawals/estimate-fee` | Estimar taxas |

### Autenticados (requer header `X-API-Key`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/internal/withdrawals` | Criar saque |
| GET | `/internal/withdrawals/{id}?user_id=X` | Consultar saque |
| GET | `/internal/withdrawals/{id}/status?user_id=X` | Status do saque |
| GET | `/internal/withdrawals?user_id=X` | Listar saques |
| POST | `/internal/withdrawals/{id}/cancel` | Cancelar saque |
| GET | `/internal/withdrawals/limit/{tax_number}` | Consultar limite diário |
| GET | `/internal/withdrawals/admin/pending` | Listar pendentes (admin) |
| GET | `/internal/withdrawals/admin/by-address/{address}` | Buscar por endereço |

### Exemplo de chamada (do Laravel)

```bash
curl -X POST http://localhost:8000/internal/withdrawals \
  -H "X-API-Key: flyerx-internal-api-key-dev-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "pix_key": "11999999999",
    "pix_key_type": "PHONE",
    "beneficiary_tax_number": "52998224725",
    "amount_cents": 10000
  }'
```

## Integração com Laravel

O Laravel usa o `LwkService` para se comunicar:

```php
use App\Application\Lwk\Contracts\LwkServiceInterface;

class WithdrawalController extends Controller
{
    public function __construct(
        private LwkServiceInterface $lwkService
    ) {}

    public function store(Request $request)
    {
        $withdrawal = $this->lwkService->createWithdrawal(
            userId: auth()->id(),
            pixKey: $request->pix_key,
            pixKeyType: $request->pix_key_type,
            beneficiaryTaxNumber: $request->beneficiary_tax_number,
            amountCents: $request->amount_cents,
        );

        return response()->json([
            'flyerx_address' => $withdrawal->flyerxAddress,
            'total_depix' => $withdrawal->totalDepix,
        ]);
    }
}
```

## Configuração do Laravel

No `.env` do Laravel:

```env
LWK_MICROSERVICE_URL=http://localhost:8000
LWK_MICROSERVICE_API_KEY=flyerx-internal-api-key-dev-2024
LWK_MICROSERVICE_TIMEOUT=30
```

## Fluxo de Saque

1. **Frontend** consulta limite diário do CPF/CNPJ
2. **Laravel** recebe requisição do frontend
3. **Laravel** valida usuário, KYC
4. **Laravel** chama `POST /internal/withdrawals` (Python)
5. **Python** valida limite diário do CPF/CNPJ
6. **Python** gera endereço LWK único
7. **Python** retorna `flyerx_address` para Laravel
8. **Laravel** retorna endereço para frontend
9. **Usuário** envia DePix para o endereço
10. **Worker Python** detecta depósito via LWK
11. **Worker Python** separa taxa do parceiro
12. **Worker Python** envia resto para Eulen
13. **Eulen** processa e envia PIX

## Limite Diário

O sistema rastreia o volume de saques por CPF/CNPJ para evitar exceder os limites da Eulen.

### Modelo `DailyWithdrawLimit`

```python
class DailyWithdrawLimit(Base):
    tax_number: str          # CPF/CNPJ (primary key)
    euid: str | None         # Eulen User ID (capturado de depósitos)
    daily_volume_cents: int  # Volume do dia atual
    max_daily_cents: int     # Limite diário (default: R$ 5.000)
    last_reset_date: datetime
```

### Endpoint de Consulta

```bash
GET /internal/withdrawals/limit/52998224725
```

Resposta:
```json
{
  "tax_number": "529.***.***-25",
  "daily_limit_cents": 500000,
  "daily_volume_cents": 200000,
  "remaining_cents": 300000,
  "daily_limit_reais": 5000.0,
  "daily_volume_reais": 2000.0,
  "remaining_reais": 3000.0,
  "has_euid": false
}
```

### Validação Automática

Ao criar um saque, o sistema valida automaticamente:

1. Se o CPF/CNPJ já excedeu o limite diário
2. Se o valor solicitado + volume atual > limite diário

Se exceder, retorna erro 400:
```json
{
  "detail": "Limite diário excedido. Disponível: R$ 3000.00"
}
```

### Normalização de Chave PIX

Chaves PIX de telefone são normalizadas automaticamente:
- `11999999999` → `+5511999999999`

Isso evita erros da API Eulen que exige o formato internacional.

## Modos de Operação

### Modo Mock (desenvolvimento)

- `LWK_MNEMONIC` vazio → LWK em modo mock
- `EULEN_MOCK_MODE=true` → Eulen em modo mock

### Modo Produção

- `LWK_MNEMONIC` com 12 palavras válidas
- `EULEN_MOCK_MODE=false`
- `DATABASE_URL` com PostgreSQL
- `INTERNAL_API_KEY` com chave segura

## Documentação da API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Segurança

- **NUNCA** commitar `.env` ou mnemonic
- Em produção, usar vault seguro para secrets
- Configurar `DEBUG=false` em produção
- `INTERNAL_API_KEY` deve ser longa e aleatória
