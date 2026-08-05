# Flyerx - Estratégia de Ledger e Wallet

## 6. Estratégia do Ledger

### 6.1 Princípios Fundamentais

| Princípio | Descrição |
|-----------|-----------|
| **Imutabilidade** | Entries NUNCA são alteradas ou deletadas |
| **Double-Entry** | Todo débito tem crédito correspondente |
| **Auditabilidade** | Toda movimentação é rastreável |
| **Consistência** | Saldo = soma das entries |
| **Atomicidade** | Transactions são atômicas (tudo ou nada) |

### 6.2 Estrutura de Contas

```
PLANO DE CONTAS FLYERX
======================

1.0.000 - ATIVOS
├── 1.1.000 - Ativos Circulantes
│   ├── 1.1.001 - Conta Liquidação Eulen
│   │              (fundos recebidos do provider)
│   │
│   └── 1.1.100 - Carteiras de Usuários
│       ├── 1.1.100.{user_uuid_1}
│       ├── 1.1.100.{user_uuid_2}
│       └── ...
│
2.0.000 - PASSIVOS
├── 2.1.000 - Obrigações
│   └── 2.1.001 - Saldos a Pagar (agregado)
│
3.0.000 - RECEITAS
├── 3.1.000 - Receitas Operacionais
│   ├── 3.1.001 - Taxas de Depósito
│   ├── 3.1.002 - Taxas de Saque
│   └── 3.1.003 - Outras Taxas
│
4.0.000 - DESPESAS
└── 4.1.000 - Despesas Operacionais
    ├── 4.1.001 - Taxas do Provider
    └── 4.1.002 - Estornos
```

### 6.3 Exemplos de Lançamentos

#### Depósito de R$ 100,00 com taxa de R$ 2,00

```
TRANSACTION: deposit_confirmed
Reference: deposits.{uuid}
Description: "Depósito PIX confirmado - R$ 100,00"
Total: R$ 100,00

ENTRIES:
┌────┬───────────────────────────┬──────────┬──────────┐
│ #  │ Conta                     │ Débito   │ Crédito  │
├────┼───────────────────────────┼──────────┼──────────┤
│ 1  │ 1.1.001 Liquidação Eulen  │ R$ 100,00│          │
│ 2  │ 1.1.100.user_x Carteira   │          │ R$ 98,00 │
│ 3  │ 3.1.001 Receita Taxa Dep. │          │ R$ 2,00  │
└────┴───────────────────────────┴──────────┴──────────┘
                                   R$ 100,00 = R$ 100,00 ✓
```

#### Saque de R$ 50,00 com taxa de R$ 1,50

```
TRANSACTION: withdrawal_confirmed
Reference: withdrawals.{uuid}
Description: "Saque PIX confirmado - R$ 50,00"
Total: R$ 51,50

ENTRIES:
┌────┬───────────────────────────┬──────────┬──────────┐
│ #  │ Conta                     │ Débito   │ Crédito  │
├────┼───────────────────────────┼──────────┼──────────┤
│ 1  │ 1.1.100.user_x Carteira   │ R$ 51,50 │          │
│ 2  │ 1.1.001 Liquidação Eulen  │          │ R$ 50,00 │
│ 3  │ 3.1.002 Receita Taxa Saque│          │ R$ 1,50  │
└────┴───────────────────────────┴──────────┴──────────┘
                                   R$ 51,50 = R$ 51,50 ✓
```

#### Estorno de Saque (falha no provider)

```
TRANSACTION: withdrawal_refunded
Reference: withdrawals.{uuid}
Description: "Estorno de saque - falha no processamento"
Total: R$ 51,50

ENTRIES:
┌────┬───────────────────────────┬──────────┬──────────┐
│ #  │ Conta                     │ Débito   │ Crédito  │
├────┼───────────────────────────┼──────────┼──────────┤
│ 1  │ 1.1.100.user_x Carteira   │          │ R$ 51,50 │
│ 2  │ 4.1.002 Despesa Estornos  │ R$ 1,50  │          │
│ 3  │ 1.1.001 Liquidação Eulen  │ R$ 50,00 │          │
└────┴───────────────────────────┴──────────┴──────────┘
                                   R$ 51,50 = R$ 51,50 ✓

Nota: Taxa não é devolvida ao usuário (configurável)
```

### 6.4 Tipos de Operações no Ledger

| Tipo | Descrição | Débito | Crédito |
|------|-----------|--------|---------|
| `deposit` | Depósito PIX | Liquidação | Carteira + Receita |
| `withdrawal` | Saque PIX | Carteira | Liquidação + Receita |
| `fee` | Cobrança de taxa | Carteira | Receita |
| `refund` | Estorno | Liquidação + Despesa | Carteira |
| `adjustment_credit` | Ajuste positivo | Ajustes | Carteira |
| `adjustment_debit` | Ajuste negativo | Carteira | Ajustes |
| `transfer` | Transferência P2P | Carteira A | Carteira B |
| `reversal` | Reversão de erro | Inverso do original |

### 6.5 Implementação do Serviço de Ledger

```php
// Interfaces
interface LedgerServiceInterface
{
    public function createTransaction(
        string $referenceType,
        string $referenceId,
        string $description,
        array $entries
    ): LedgerTransaction;

    public function getAccountBalance(string $accountId): Money;

    public function getAccountStatement(
        string $accountId,
        DateTimeInterface $from,
        DateTimeInterface $to
    ): Collection;

    public function reverseTransaction(
        string $transactionId,
        string $reason
    ): LedgerTransaction;
}

// Value Object para Entry
class LedgerEntryData
{
    public function __construct(
        public readonly string $accountId,
        public readonly EntryType $type, // debit | credit
        public readonly Money $amount,
        public readonly ?string $description = null
    ) {}
}

// Uso no DepositService
class DepositConfirmationHandler
{
    public function handle(DepositConfirmed $event): void
    {
        $deposit = $event->deposit;

        $this->ledger->createTransaction(
            referenceType: 'deposit',
            referenceId: $deposit->id,
            description: "Depósito PIX #{$deposit->id}",
            entries: [
                new LedgerEntryData(
                    accountId: $this->accounts->liquidation(),
                    type: EntryType::DEBIT,
                    amount: $deposit->amount
                ),
                new LedgerEntryData(
                    accountId: $this->accounts->userWallet($deposit->userId),
                    type: EntryType::CREDIT,
                    amount: $deposit->netAmount
                ),
                new LedgerEntryData(
                    accountId: $this->accounts->depositFeeRevenue(),
                    type: EntryType::CREDIT,
                    amount: $deposit->fee
                ),
            ]
        );
    }
}
```

### 6.6 Sequence Number e Ordenação

Cada entry recebe um `sequence_number` global auto-incrementado:

```sql
-- Garantir sequência atômica
CREATE SEQUENCE ledger_entry_seq;

-- No insert
INSERT INTO ledger_entries (id, ..., sequence_number)
VALUES (gen_random_uuid(), ..., nextval('ledger_entry_seq'));
```

**Benefício**: Ordenação determinística mesmo com timestamps iguais.

---

## 7. Estratégia da Wallet

### 7.1 Composição do Saldo

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPOSIÇÃO DO SALDO                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SALDO TOTAL = Soma de todos os créditos - débitos          │
│                (calculado do ledger)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   SALDO TOTAL                        │    │
│  │                   R$ 1.000,00                        │    │
│  └─────────────────────────────────────────────────────┘    │
│              │                    │                          │
│              ▼                    ▼                          │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ SALDO RESERVADO  │  │ SALDO DISPONÍVEL │                 │
│  │ R$ 150,00        │  │ R$ 850,00        │                 │
│  │ (saques pending) │  │ (pode usar)      │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                │                             │
│                    ┌───────────┴───────────┐                │
│                    ▼                       ▼                │
│         ┌──────────────────┐    ┌──────────────────┐        │
│         │ SALDO BLOQUEADO  │    │ SALDO UTILIZÁVEL │        │
│         │ R$ 0,00          │    │ R$ 850,00        │        │
│         │ (freeze judicial)│    │ (pode sacar)     │        │
│         └──────────────────┘    └──────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

FÓRMULAS:
- Saldo Total = SUM(credits) - SUM(debits) do ledger
- Saldo Disponível = Saldo Total - Saldo Reservado
- Saldo Utilizável = Saldo Disponível - Saldo Bloqueado
```

### 7.2 Cálculo de Saldo

```php
class BalanceCalculatorService
{
    public function calculateBalance(Wallet $wallet): WalletBalance
    {
        // Saldo total do ledger (view materializada para performance)
        $totalBalance = $this->ledger->getAccountBalance(
            $wallet->ledgerAccountId
        );

        // Reservas ativas
        $reservedBalance = $this->reservations->sumActive($wallet->id);

        // Bloqueios ativos
        $blockedBalance = $this->blocks->sumActive($wallet->id);

        // Cálculos
        $availableBalance = $totalBalance->subtract($reservedBalance);
        $usableBalance = $availableBalance->subtract($blockedBalance);

        return new WalletBalance(
            total: $totalBalance,
            reserved: $reservedBalance,
            blocked: $blockedBalance,
            available: $availableBalance,
            usable: $usableBalance
        );
    }
}
```

### 7.3 Sistema de Reservas

```php
class BalanceReservationService
{
    /**
     * Reserva saldo para uma operação
     */
    public function reserve(
        Wallet $wallet,
        Money $amount,
        string $operationType,
        string $operationId,
        DateTimeInterface $expiresAt
    ): BalanceReservation {

        return DB::transaction(function () use (...) {
            // Lock pessimista na wallet
            $wallet = $this->walletRepository->lockForUpdate($wallet->id);

            // Calcula saldo utilizável
            $balance = $this->balanceCalculator->calculateBalance($wallet);

            // Valida saldo suficiente
            if ($balance->usable->isLessThan($amount)) {
                throw new InsufficientBalanceException(
                    required: $amount,
                    available: $balance->usable
                );
            }

            // Cria reserva
            return $this->reservationRepository->create(
                new BalanceReservation(
                    walletId: $wallet->id,
                    amount: $amount,
                    operationType: $operationType,
                    operationId: $operationId,
                    status: ReservationStatus::ACTIVE,
                    expiresAt: $expiresAt
                )
            );
        });
    }

    /**
     * Libera reserva (operação cancelada/falhou)
     */
    public function release(
        BalanceReservation $reservation,
        string $reason
    ): void {
        $reservation->release($reason);
        $this->reservationRepository->save($reservation);

        $this->eventDispatcher->dispatch(
            new BalanceReservationReleased($reservation)
        );
    }

    /**
     * Consome reserva (operação concluída)
     */
    public function consume(BalanceReservation $reservation): void
    {
        $reservation->consume();
        $this->reservationRepository->save($reservation);
    }
}
```

### 7.4 Job de Expiração de Reservas

```php
class ExpireBalanceReservationsJob implements ShouldQueue
{
    public function handle(): void
    {
        $expiredReservations = $this->reservationRepository
            ->findExpired(now());

        foreach ($expiredReservations as $reservation) {
            DB::transaction(function () use ($reservation) {
                // Libera a reserva
                $this->reservationService->release(
                    $reservation,
                    'Reservation expired automatically'
                );

                // Se for saque, marca como expirado
                if ($reservation->operationType === 'withdrawal') {
                    $withdrawal = $this->withdrawalRepository->find(
                        $reservation->operationId
                    );
                    $withdrawal->expire('Reservation expired');
                    $this->withdrawalRepository->save($withdrawal);
                }

                // Notifica usuário
                $this->notificationService->sendReservationExpired(
                    $reservation
                );
            });
        }
    }
}
```

### 7.5 Extrato

```php
class StatementService
{
    public function getStatement(
        Wallet $wallet,
        DateTimeInterface $from,
        DateTimeInterface $to,
        int $page = 1,
        int $perPage = 50
    ): LengthAwarePaginator {

        $entries = $this->ledger->getAccountStatement(
            accountId: $wallet->ledgerAccountId,
            from: $from,
            to: $to
        );

        return $entries->map(function (LedgerEntry $entry) {
            return new StatementItem(
                id: $entry->id,
                date: $entry->createdAt,
                type: $this->mapEntryType($entry),
                description: $entry->description,
                amount: $entry->amount,
                direction: $entry->type, // credit/debit
                balanceAfter: $entry->balanceAfter,
                reference: $this->loadReference($entry->transaction),
                metadata: $entry->metadata
            );
        })->paginate($perPage);
    }

    private function mapEntryType(LedgerEntry $entry): string
    {
        return match ($entry->transaction->referenceType) {
            'deposit' => 'Depósito PIX',
            'withdrawal' => 'Saque PIX',
            'fee' => 'Taxa',
            'refund' => 'Estorno',
            default => 'Movimentação'
        };
    }
}
```

### 7.6 Conciliação

```php
class ReconciliationService
{
    /**
     * Executa conciliação diária
     */
    public function reconcile(DateTimeInterface $date): ReconciliationReport
    {
        $report = new ReconciliationReport($date);

        // 1. Soma dos saldos de todas as wallets
        $totalWalletBalances = $this->walletRepository
            ->sumAllBalances();

        // 2. Soma do ledger (conta agregada de usuários)
        $ledgerBalance = $this->ledger
            ->getAccountBalance($this->accounts->userWalletsAggregate());

        // 3. Compara
        $difference = $totalWalletBalances->subtract($ledgerBalance);

        if (!$difference->isZero()) {
            $report->addDiscrepancy(
                type: 'wallet_ledger_mismatch',
                expected: $ledgerBalance,
                actual: $totalWalletBalances,
                difference: $difference
            );

            // Alerta crítico
            $this->alertService->critical(
                "Discrepância de conciliação: {$difference}"
            );
        }

        // 4. Verifica depósitos pendentes há muito tempo
        $staleDeposits = $this->depositRepository
            ->findStale($date, hours: 24);

        foreach ($staleDeposits as $deposit) {
            $report->addStaleDeposit($deposit);
        }

        // 5. Verifica reservas expiradas não processadas
        $orphanReservations = $this->reservationRepository
            ->findOrphan($date);

        foreach ($orphanReservations as $reservation) {
            $report->addOrphanReservation($reservation);
        }

        return $report;
    }
}
```
