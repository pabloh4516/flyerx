# Flyerx - Estratégia de Taxas

## 10. Sistema de Taxas Configurável

### 10.1 Tipos de Taxas Suportados

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Fixed** | Valor fixo por operação | R$ 3,00 por saque |
| **Percentage** | Percentual do valor | 2% do depósito |
| **Mixed** | Fixo + Percentual | R$ 1,00 + 1.5% |
| **Tiered** | Varia por faixa de valor | 2% até R$ 1.000, 1.5% acima |
| **Dynamic** | Baseado em regras complexas | Horário, volume, etc. |

### 10.2 Dimensões de Configuração

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DIMENSÕES DE CONFIGURAÇÃO DE TAXA                         │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   OPERAÇÃO      │  deposit | withdrawal | transfer
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   APLICAÇÃO     │  all | kyc_level | user_tier | user_specific
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   TIPO TAXA     │  fixed | percentage | mixed | tiered
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   LIMITES       │  min_fee | max_fee | min_transaction | max_transaction
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   VIGÊNCIA      │  starts_at | ends_at | is_active
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   PRIORIDADE    │  Maior prioridade = preferência
    └─────────────────┘
```

### 10.3 Exemplos de Configurações

```json
// Taxa padrão de depósito: 2% (mín R$ 1, máx R$ 50)
{
  "name": "Taxa Padrão Depósito",
  "operation_type": "deposit",
  "fee_type": "percentage",
  "percentage": 2.0000,
  "min_fee_cents": 100,
  "max_fee_cents": 5000,
  "applies_to": "all",
  "priority": 0,
  "is_active": true
}

// Taxa KYC Nível 3: 1% (sem mínimo, máx R$ 30)
{
  "name": "Taxa VIP Depósito",
  "operation_type": "deposit",
  "fee_type": "percentage",
  "percentage": 1.0000,
  "min_fee_cents": null,
  "max_fee_cents": 3000,
  "applies_to": "kyc_level",
  "applies_to_value": "3",
  "priority": 10,
  "is_active": true
}

// Taxa de saque: R$ 3 fixo + 0.5%
{
  "name": "Taxa Padrão Saque",
  "operation_type": "withdrawal",
  "fee_type": "mixed",
  "fixed_amount_cents": 300,
  "percentage": 0.5000,
  "min_fee_cents": 300,
  "max_fee_cents": 10000,
  "applies_to": "all",
  "priority": 0,
  "is_active": true
}

// Promoção: 0% de taxa (tempo limitado)
{
  "name": "Promoção Lançamento",
  "operation_type": "deposit",
  "fee_type": "percentage",
  "percentage": 0,
  "applies_to": "all",
  "priority": 100,
  "is_active": true,
  "starts_at": "2026-08-01T00:00:00Z",
  "ends_at": "2026-08-31T23:59:59Z"
}
```

### 10.4 Serviço de Cálculo de Taxas

```php
<?php

namespace App\Application\Fee\Services;

class FeeCalculatorService
{
    public function __construct(
        private readonly FeeConfigurationRepository $configRepository,
        private readonly FeeCalculationRepository $calculationRepository
    ) {}

    public function calculate(
        string $operationType,
        Money $amount,
        User $user
    ): FeeCalculation {

        // Busca configuração aplicável com maior prioridade
        $config = $this->findApplicableConfiguration(
            $operationType,
            $amount,
            $user
        );

        if (!$config) {
            // Sem taxa configurada (ou usar default)
            return FeeCalculation::zero($operationType, $amount, $user);
        }

        // Calcula taxa base
        $calculatedFee = $this->calculateBaseFee($config, $amount);

        // Aplica limites mín/máx
        $finalFee = $this->applyLimits($config, $calculatedFee);

        // Registra cálculo para auditoria
        $calculation = new FeeCalculation(
            feeConfigurationId: $config->id,
            operationType: $operationType,
            userId: $user->id,
            baseAmountCents: $amount->cents(),
            calculatedFeeCents: $calculatedFee->cents(),
            finalFeeCents: $finalFee->cents(),
            calculationDetails: $this->buildDetails($config, $amount, $calculatedFee, $finalFee)
        );

        $this->calculationRepository->save($calculation);

        return $calculation;
    }

    private function findApplicableConfiguration(
        string $operationType,
        Money $amount,
        User $user
    ): ?FeeConfiguration {

        $configs = $this->configRepository->findActive($operationType);

        // Filtra por critérios
        $applicable = $configs->filter(function ($config) use ($amount, $user) {
            // Verifica vigência
            if (!$config->isInEffect()) {
                return false;
            }

            // Verifica faixa de valor
            if ($config->minTransactionCents && $amount->cents() < $config->minTransactionCents) {
                return false;
            }
            if ($config->maxTransactionCents && $amount->cents() > $config->maxTransactionCents) {
                return false;
            }

            // Verifica aplicabilidade
            return match ($config->appliesTo) {
                'all' => true,
                'kyc_level' => $user->kycLevel === (int) $config->appliesToValue,
                'user_tier' => $user->tier === $config->appliesToValue,
                'user_specific' => $user->id === $config->appliesToValue,
                default => false
            };
        });

        // Retorna a de maior prioridade
        return $applicable->sortByDesc('priority')->first();
    }

    private function calculateBaseFee(FeeConfiguration $config, Money $amount): Money
    {
        return match ($config->feeType) {
            'fixed' => Money::fromCents($config->fixedAmountCents ?? 0),

            'percentage' => $amount->multiply($config->percentage / 100),

            'mixed' => Money::fromCents($config->fixedAmountCents ?? 0)
                ->add($amount->multiply($config->percentage / 100)),

            default => Money::zero()
        };
    }

    private function applyLimits(FeeConfiguration $config, Money $fee): Money
    {
        $finalFee = $fee;

        // Aplica mínimo
        if ($config->minFeeCents !== null) {
            $minFee = Money::fromCents($config->minFeeCents);
            if ($finalFee->isLessThan($minFee)) {
                $finalFee = $minFee;
            }
        }

        // Aplica máximo
        if ($config->maxFeeCents !== null) {
            $maxFee = Money::fromCents($config->maxFeeCents);
            if ($finalFee->isGreaterThan($maxFee)) {
                $finalFee = $maxFee;
            }
        }

        return $finalFee;
    }

    private function buildDetails(
        FeeConfiguration $config,
        Money $amount,
        Money $calculated,
        Money $final
    ): array {
        return [
            'configuration' => [
                'id' => $config->id,
                'name' => $config->name,
                'type' => $config->feeType,
                'fixed' => $config->fixedAmountCents,
                'percentage' => $config->percentage,
                'min' => $config->minFeeCents,
                'max' => $config->maxFeeCents,
            ],
            'calculation' => [
                'base_amount_cents' => $amount->cents(),
                'calculated_fee_cents' => $calculated->cents(),
                'final_fee_cents' => $final->cents(),
                'min_applied' => $final->cents() !== $calculated->cents() &&
                                 $final->cents() === $config->minFeeCents,
                'max_applied' => $final->cents() !== $calculated->cents() &&
                                 $final->cents() === $config->maxFeeCents,
            ],
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
```

### 10.5 Taxa por Faixa (Tiered)

```php
// Configuração de taxas por faixa
{
  "name": "Taxa Tiered Depósito",
  "operation_type": "deposit",
  "fee_type": "tiered",
  "tiers": [
    {"min": 0, "max": 100000, "percentage": 2.5},      // Até R$ 1.000: 2.5%
    {"min": 100001, "max": 500000, "percentage": 2.0}, // R$ 1.001 a R$ 5.000: 2%
    {"min": 500001, "max": 1000000, "percentage": 1.5},// R$ 5.001 a R$ 10.000: 1.5%
    {"min": 1000001, "max": null, "percentage": 1.0}   // Acima de R$ 10.000: 1%
  ]
}

// Cálculo de taxa tiered
private function calculateTieredFee(array $tiers, Money $amount): Money
{
    $cents = $amount->cents();

    foreach ($tiers as $tier) {
        if ($cents >= $tier['min'] && ($tier['max'] === null || $cents <= $tier['max'])) {
            return $amount->multiply($tier['percentage'] / 100);
        }
    }

    return Money::zero();
}
```

### 10.6 Cobrança de Taxa

| Momento | Descrição | Comportamento |
|---------|-----------|---------------|
| **Na entrada** | Taxa descontada do valor creditado | Deposita R$ 100, recebe R$ 98 |
| **Na saída** | Taxa adicionada ao valor debitado | Saca R$ 100, debita R$ 103 |
| **Separado** | Taxa cobrada em transação separada | Uso específico (cobrança mensal) |

```php
// Exemplo: Depósito com taxa na entrada
public function processDeposit(Deposit $deposit): void
{
    $amount = $deposit->amount;
    $fee = $deposit->fee;
    $netAmount = $amount->subtract($fee); // R$ 100 - R$ 2 = R$ 98

    // Usuário recebe valor líquido
    $this->ledger->createTransaction(
        referenceType: 'deposit',
        referenceId: $deposit->id,
        entries: [
            // Entra R$ 100 no caixa
            new LedgerEntry(
                accountId: $this->accounts->liquidation(),
                type: EntryType::DEBIT,
                amount: $amount
            ),
            // Credita R$ 98 na carteira
            new LedgerEntry(
                accountId: $this->accounts->userWallet($deposit->userId),
                type: EntryType::CREDIT,
                amount: $netAmount
            ),
            // Credita R$ 2 como receita
            new LedgerEntry(
                accountId: $this->accounts->feeRevenue($deposit->operationType),
                type: EntryType::CREDIT,
                amount: $fee
            ),
        ]
    );
}

// Exemplo: Saque com taxa na saída
public function processWithdrawal(Withdrawal $withdrawal): void
{
    $netAmount = $withdrawal->netAmount; // R$ 100 (usuário recebe)
    $fee = $withdrawal->fee; // R$ 3
    $totalDebit = $netAmount->add($fee); // R$ 103 (debitado da carteira)

    $this->ledger->createTransaction(
        referenceType: 'withdrawal',
        referenceId: $withdrawal->id,
        entries: [
            // Debita R$ 103 da carteira
            new LedgerEntry(
                accountId: $this->accounts->userWallet($withdrawal->userId),
                type: EntryType::DEBIT,
                amount: $totalDebit
            ),
            // Credita R$ 100 para liquidação (sai do sistema)
            new LedgerEntry(
                accountId: $this->accounts->liquidation(),
                type: EntryType::CREDIT,
                amount: $netAmount
            ),
            // Credita R$ 3 como receita
            new LedgerEntry(
                accountId: $this->accounts->feeRevenue('withdrawal'),
                type: EntryType::CREDIT,
                amount: $fee
            ),
        ]
    );
}
```

### 10.7 Interface Administrativa

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAINEL DE CONFIGURAÇÃO DE TAXAS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ TAXAS DE DEPÓSITO                                         [+ Nova]  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Nome            │ Tipo      │ Valor    │ Aplica a   │ Status │ Ação │    │
│  ├─────────────────┼───────────┼──────────┼────────────┼────────┼──────│    │
│  │ Taxa Padrão     │ %         │ 2%       │ Todos      │ Ativo  │ ✎ 🗑 │    │
│  │ Taxa VIP        │ %         │ 1%       │ KYC 3      │ Ativo  │ ✎ 🗑 │    │
│  │ Promoção Agosto │ %         │ 0%       │ Todos      │ Ativo  │ ✎ 🗑 │    │
│  │                 │           │          │ (até 31/08)│        │      │    │
│  └─────────────────┴───────────┴──────────┴────────────┴────────┴──────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ TAXAS DE SAQUE                                            [+ Nova]  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Nome            │ Tipo      │ Valor       │ Aplica a │ Status │ Ação│    │
│  ├─────────────────┼───────────┼─────────────┼──────────┼────────┼─────│    │
│  │ Taxa Padrão     │ Misto     │ R$3 + 0.5%  │ Todos    │ Ativo  │ ✎ 🗑│    │
│  │ Taxa Emergência │ Fixo      │ R$ 10       │ Todos    │Inativo │ ✎ 🗑│    │
│  └─────────────────┴───────────┴─────────────┴──────────┴────────┴─────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ SIMULADOR DE TAXA                                                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ Operação: [Depósito ▼]  Valor: [R$ 500,00]  KYC: [Nível 2 ▼]       │    │
│  │                                                                     │    │
│  │ [Calcular]                                                          │    │
│  │                                                                     │    │
│  │ Resultado:                                                          │    │
│  │   Taxa aplicada: Taxa Padrão Depósito                               │    │
│  │   Valor da taxa: R$ 10,00 (2%)                                      │    │
│  │   Valor líquido: R$ 490,00                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.8 Relatórios de Taxas

```php
class FeeReportService
{
    public function generateDailyReport(DateTimeInterface $date): FeeReport
    {
        return new FeeReport(
            date: $date,
            depositFees: $this->sumFees('deposit', $date),
            withdrawalFees: $this->sumFees('withdrawal', $date),
            totalFees: $this->sumAllFees($date),
            feesByConfiguration: $this->groupByConfiguration($date),
            feesByKycLevel: $this->groupByKycLevel($date),
            averageFeePercentage: $this->calculateAveragePercentage($date)
        );
    }

    private function sumFees(string $type, DateTimeInterface $date): Money
    {
        return Money::fromCents(
            $this->repository->sumFeesForDate($type, $date)
        );
    }
}
```
