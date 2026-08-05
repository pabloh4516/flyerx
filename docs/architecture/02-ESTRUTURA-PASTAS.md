# Flyerx - Estrutura de Pastas

## 3. Estrutura do Projeto Backend (Laravel)

```
flyerx-api/
├── app/
│   ├── Domain/                           # CAMADA DE DOMÍNIO (DDD)
│   │   ├── Identity/
│   │   │   ├── Entities/
│   │   │   │   ├── User.php
│   │   │   │   ├── Device.php
│   │   │   │   └── Session.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── Email.php
│   │   │   │   ├── Password.php
│   │   │   │   ├── TaxNumber.php         # CPF/CNPJ
│   │   │   │   ├── PhoneNumber.php
│   │   │   │   └── DeviceFingerprint.php
│   │   │   ├── Events/
│   │   │   │   ├── UserRegistered.php
│   │   │   │   ├── UserVerified.php
│   │   │   │   ├── PasswordChanged.php
│   │   │   │   └── TwoFactorEnabled.php
│   │   │   ├── Exceptions/
│   │   │   │   ├── InvalidCredentialsException.php
│   │   │   │   ├── UserBlockedException.php
│   │   │   │   └── TwoFactorRequiredException.php
│   │   │   └── Contracts/
│   │   │       ├── UserRepositoryInterface.php
│   │   │       └── AuthServiceInterface.php
│   │   │
│   │   ├── Wallet/
│   │   │   ├── Entities/
│   │   │   │   ├── Wallet.php
│   │   │   │   └── BalanceReservation.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── Money.php
│   │   │   │   ├── Currency.php
│   │   │   │   └── WalletId.php
│   │   │   ├── Aggregates/
│   │   │   │   └── WalletAggregate.php
│   │   │   ├── Events/
│   │   │   │   ├── WalletCreated.php
│   │   │   │   ├── BalanceUpdated.php
│   │   │   │   ├── BalanceReserved.php
│   │   │   │   └── BalanceReleased.php
│   │   │   ├── Exceptions/
│   │   │   │   ├── InsufficientBalanceException.php
│   │   │   │   └── WalletBlockedException.php
│   │   │   └── Contracts/
│   │   │       └── WalletRepositoryInterface.php
│   │   │
│   │   ├── Payment/
│   │   │   ├── Entities/
│   │   │   │   ├── Deposit.php
│   │   │   │   ├── Withdrawal.php
│   │   │   │   ├── PixQrCode.php
│   │   │   │   └── Fee.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── PixKey.php
│   │   │   │   ├── TransactionId.php
│   │   │   │   ├── ProviderReference.php
│   │   │   │   └── PaymentStatus.php
│   │   │   ├── Enums/
│   │   │   │   ├── DepositStatus.php
│   │   │   │   ├── WithdrawalStatus.php
│   │   │   │   ├── PixKeyType.php
│   │   │   │   └── FeeType.php
│   │   │   ├── Events/
│   │   │   │   ├── DepositRequested.php
│   │   │   │   ├── DepositConfirmed.php
│   │   │   │   ├── DepositFailed.php
│   │   │   │   ├── WithdrawalRequested.php
│   │   │   │   ├── WithdrawalConfirmed.php
│   │   │   │   └── WithdrawalFailed.php
│   │   │   ├── Exceptions/
│   │   │   │   ├── DepositFailedException.php
│   │   │   │   ├── WithdrawalFailedException.php
│   │   │   │   └── InvalidPixKeyException.php
│   │   │   └── Contracts/
│   │   │       ├── DepositRepositoryInterface.php
│   │   │       └── WithdrawalRepositoryInterface.php
│   │   │
│   │   ├── Ledger/
│   │   │   ├── Entities/
│   │   │   │   ├── LedgerEntry.php
│   │   │   │   ├── LedgerTransaction.php
│   │   │   │   └── LedgerAccount.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── EntryType.php
│   │   │   │   ├── AccountType.php
│   │   │   │   └── TransactionReference.php
│   │   │   ├── Enums/
│   │   │   │   ├── LedgerEntryType.php
│   │   │   │   └── LedgerAccountType.php
│   │   │   ├── Events/
│   │   │   │   ├── EntryCreated.php
│   │   │   │   └── TransactionCompleted.php
│   │   │   └── Contracts/
│   │   │       ├── LedgerServiceInterface.php
│   │   │       └── LedgerRepositoryInterface.php
│   │   │
│   │   ├── Compliance/
│   │   │   ├── Entities/
│   │   │   │   ├── KycProcess.php
│   │   │   │   ├── KycDocument.php
│   │   │   │   └── RiskAssessment.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── KycLevel.php
│   │   │   │   └── RiskScore.php
│   │   │   ├── Enums/
│   │   │   │   ├── KycStatus.php
│   │   │   │   ├── DocumentType.php
│   │   │   │   └── RiskLevel.php
│   │   │   └── Events/
│   │   │       ├── KycSubmitted.php
│   │   │       ├── KycApproved.php
│   │   │       └── KycRejected.php
│   │   │
│   │   ├── Fee/
│   │   │   ├── Entities/
│   │   │   │   ├── FeeConfiguration.php
│   │   │   │   └── FeeCalculation.php
│   │   │   ├── ValueObjects/
│   │   │   │   ├── FeeAmount.php
│   │   │   │   └── FeePercentage.php
│   │   │   ├── Enums/
│   │   │   │   ├── FeeType.php
│   │   │   │   └── FeeApplicability.php
│   │   │   └── Services/
│   │   │       └── FeeCalculatorService.php
│   │   │
│   │   └── Shared/
│   │       ├── ValueObjects/
│   │       │   ├── Uuid.php
│   │       │   ├── Timestamp.php
│   │       │   └── IpAddress.php
│   │       ├── Contracts/
│   │       │   ├── EntityInterface.php
│   │       │   ├── AggregateRootInterface.php
│   │       │   └── ValueObjectInterface.php
│   │       └── Traits/
│   │           ├── HasUuid.php
│   │           └── HasTimestamps.php
│   │
│   ├── Application/                      # CAMADA DE APLICAÇÃO
│   │   ├── Identity/
│   │   │   ├── Commands/
│   │   │   │   ├── RegisterUserCommand.php
│   │   │   │   ├── AuthenticateUserCommand.php
│   │   │   │   ├── EnableTwoFactorCommand.php
│   │   │   │   └── ResetPasswordCommand.php
│   │   │   ├── Queries/
│   │   │   │   ├── GetUserQuery.php
│   │   │   │   └── GetUserDevicesQuery.php
│   │   │   ├── Handlers/
│   │   │   │   ├── RegisterUserHandler.php
│   │   │   │   ├── AuthenticateUserHandler.php
│   │   │   │   └── EnableTwoFactorHandler.php
│   │   │   ├── DTOs/
│   │   │   │   ├── UserDTO.php
│   │   │   │   ├── AuthResponseDTO.php
│   │   │   │   └── RegisterUserDTO.php
│   │   │   └── Services/
│   │   │       ├── AuthenticationService.php
│   │   │       ├── TwoFactorService.php
│   │   │       └── PasswordRecoveryService.php
│   │   │
│   │   ├── Wallet/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateWalletCommand.php
│   │   │   │   ├── ReserveBalanceCommand.php
│   │   │   │   └── ReleaseBalanceCommand.php
│   │   │   ├── Queries/
│   │   │   │   ├── GetWalletBalanceQuery.php
│   │   │   │   └── GetStatementQuery.php
│   │   │   ├── Handlers/
│   │   │   │   ├── CreateWalletHandler.php
│   │   │   │   └── ReserveBalanceHandler.php
│   │   │   ├── DTOs/
│   │   │   │   ├── WalletDTO.php
│   │   │   │   ├── BalanceDTO.php
│   │   │   │   └── StatementDTO.php
│   │   │   └── Services/
│   │   │       ├── WalletService.php
│   │   │       └── BalanceCalculatorService.php
│   │   │
│   │   ├── Payment/
│   │   │   ├── Commands/
│   │   │   │   ├── RequestDepositCommand.php
│   │   │   │   ├── ConfirmDepositCommand.php
│   │   │   │   ├── RequestWithdrawalCommand.php
│   │   │   │   └── ConfirmWithdrawalCommand.php
│   │   │   ├── Queries/
│   │   │   │   ├── GetDepositStatusQuery.php
│   │   │   │   ├── GetWithdrawalStatusQuery.php
│   │   │   │   └── GetTransactionHistoryQuery.php
│   │   │   ├── Handlers/
│   │   │   │   ├── RequestDepositHandler.php
│   │   │   │   ├── ConfirmDepositHandler.php
│   │   │   │   ├── RequestWithdrawalHandler.php
│   │   │   │   └── ConfirmWithdrawalHandler.php
│   │   │   ├── DTOs/
│   │   │   │   ├── DepositRequestDTO.php
│   │   │   │   ├── DepositResponseDTO.php
│   │   │   │   ├── WithdrawalRequestDTO.php
│   │   │   │   └── WithdrawalResponseDTO.php
│   │   │   ├── Services/
│   │   │   │   ├── DepositService.php
│   │   │   │   ├── WithdrawalService.php
│   │   │   │   └── PaymentOrchestrationService.php
│   │   │   └── Pipelines/
│   │   │       ├── DepositPipeline.php
│   │   │       └── WithdrawalPipeline.php
│   │   │
│   │   ├── Ledger/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateEntryCommand.php
│   │   │   │   └── CreateTransactionCommand.php
│   │   │   ├── Queries/
│   │   │   │   ├── GetEntriesQuery.php
│   │   │   │   └── GetBalanceFromLedgerQuery.php
│   │   │   ├── Services/
│   │   │   │   └── LedgerService.php
│   │   │   └── DTOs/
│   │   │       ├── LedgerEntryDTO.php
│   │   │       └── LedgerTransactionDTO.php
│   │   │
│   │   └── Shared/
│   │       ├── Contracts/
│   │       │   ├── CommandInterface.php
│   │       │   ├── QueryInterface.php
│   │       │   └── HandlerInterface.php
│   │       └── Bus/
│   │           ├── CommandBus.php
│   │           └── QueryBus.php
│   │
│   ├── Infrastructure/                   # CAMADA DE INFRAESTRUTURA
│   │   ├── Persistence/
│   │   │   ├── Eloquent/
│   │   │   │   ├── Models/
│   │   │   │   │   ├── UserModel.php
│   │   │   │   │   ├── WalletModel.php
│   │   │   │   │   ├── DepositModel.php
│   │   │   │   │   ├── WithdrawalModel.php
│   │   │   │   │   ├── LedgerEntryModel.php
│   │   │   │   │   └── ...
│   │   │   │   └── Repositories/
│   │   │   │       ├── EloquentUserRepository.php
│   │   │   │       ├── EloquentWalletRepository.php
│   │   │   │       ├── EloquentDepositRepository.php
│   │   │   │       └── ...
│   │   │   └── Mappers/
│   │   │       ├── UserMapper.php
│   │   │       ├── WalletMapper.php
│   │   │       └── ...
│   │   │
│   │   ├── Integration/
│   │   │   ├── PaymentProvider/
│   │   │   │   ├── Contracts/
│   │   │   │   │   ├── PaymentProviderInterface.php
│   │   │   │   │   ├── DepositProviderInterface.php
│   │   │   │   │   ├── WithdrawalProviderInterface.php
│   │   │   │   │   └── WebhookHandlerInterface.php
│   │   │   │   ├── DTOs/
│   │   │   │   │   ├── ProviderDepositRequest.php
│   │   │   │   │   ├── ProviderDepositResponse.php
│   │   │   │   │   ├── ProviderWithdrawRequest.php
│   │   │   │   │   └── ProviderWithdrawResponse.php
│   │   │   │   ├── Eulen/
│   │   │   │   │   ├── EulenProvider.php
│   │   │   │   │   ├── EulenHttpClient.php
│   │   │   │   │   ├── EulenAuthenticator.php
│   │   │   │   │   ├── EulenDepositService.php
│   │   │   │   │   ├── EulenWithdrawalService.php
│   │   │   │   │   ├── EulenWebhookHandler.php
│   │   │   │   │   ├── EulenWebhookValidator.php
│   │   │   │   │   ├── EulenStatusMapper.php
│   │   │   │   │   ├── DTOs/
│   │   │   │   │   │   ├── EulenDepositRequest.php
│   │   │   │   │   │   ├── EulenDepositResponse.php
│   │   │   │   │   │   ├── EulenWithdrawRequest.php
│   │   │   │   │   │   ├── EulenWithdrawResponse.php
│   │   │   │   │   │   └── EulenWebhookPayload.php
│   │   │   │   │   ├── Exceptions/
│   │   │   │   │   │   ├── EulenApiException.php
│   │   │   │   │   │   ├── EulenAuthException.php
│   │   │   │   │   │   └── EulenWebhookException.php
│   │   │   │   │   └── Config/
│   │   │   │   │       └── EulenConfig.php
│   │   │   │   └── Factory/
│   │   │   │       └── PaymentProviderFactory.php
│   │   │   │
│   │   │   └── Resilience/
│   │   │       ├── CircuitBreaker.php
│   │   │       ├── RetryPolicy.php
│   │   │       └── TimeoutPolicy.php
│   │   │
│   │   ├── Queue/
│   │   │   └── Jobs/
│   │   │       ├── ProcessDepositJob.php
│   │   │       ├── ProcessWithdrawalJob.php
│   │   │       ├── SyncDepositStatusJob.php
│   │   │       └── SendNotificationJob.php
│   │   │
│   │   ├── Cache/
│   │   │   ├── CacheService.php
│   │   │   └── Keys/
│   │   │       ├── WalletCacheKeys.php
│   │   │       └── UserCacheKeys.php
│   │   │
│   │   └── Logging/
│   │       ├── AuditLogger.php
│   │       ├── TransactionLogger.php
│   │       └── IntegrationLogger.php
│   │
│   ├── Http/                             # CAMADA HTTP (Interface)
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── V1/
│   │   │   │   │   ├── AuthController.php
│   │   │   │   │   ├── UserController.php
│   │   │   │   │   ├── WalletController.php
│   │   │   │   │   ├── DepositController.php
│   │   │   │   │   ├── WithdrawalController.php
│   │   │   │   │   └── KycController.php
│   │   │   │   └── Webhooks/
│   │   │   │       └── EulenWebhookController.php
│   │   │   └── Admin/
│   │   │       ├── DashboardController.php
│   │   │       ├── UserManagementController.php
│   │   │       ├── TransactionController.php
│   │   │       └── ConfigurationController.php
│   │   │
│   │   ├── Requests/
│   │   │   ├── Api/
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── LoginRequest.php
│   │   │   │   │   ├── RegisterRequest.php
│   │   │   │   │   └── TwoFactorRequest.php
│   │   │   │   ├── Deposit/
│   │   │   │   │   └── CreateDepositRequest.php
│   │   │   │   └── Withdrawal/
│   │   │   │       └── CreateWithdrawalRequest.php
│   │   │   └── Admin/
│   │   │       └── ...
│   │   │
│   │   ├── Resources/
│   │   │   ├── UserResource.php
│   │   │   ├── WalletResource.php
│   │   │   ├── DepositResource.php
│   │   │   └── WithdrawalResource.php
│   │   │
│   │   ├── Middleware/
│   │   │   ├── EnsureKycApproved.php
│   │   │   ├── EnsureWalletActive.php
│   │   │   ├── RateLimitByUser.php
│   │   │   ├── LogRequestResponse.php
│   │   │   ├── ValidateWebhookSignature.php
│   │   │   └── TrackDevice.php
│   │   │
│   │   └── Responses/
│   │       ├── ApiResponse.php
│   │       └── ErrorResponse.php
│   │
│   ├── Console/
│   │   └── Commands/
│   │       ├── SyncPendingDeposits.php
│   │       ├── SyncPendingWithdrawals.php
│   │       ├── ReconcileLedger.php
│   │       └── GenerateReports.php
│   │
│   ├── Events/
│   │   └── ...
│   │
│   ├── Listeners/
│   │   ├── UpdateWalletOnDeposit.php
│   │   ├── UpdateWalletOnWithdrawal.php
│   │   ├── CreateLedgerEntry.php
│   │   ├── SendNotification.php
│   │   └── LogAuditEvent.php
│   │
│   ├── Policies/
│   │   ├── WalletPolicy.php
│   │   ├── DepositPolicy.php
│   │   └── WithdrawalPolicy.php
│   │
│   └── Providers/
│       ├── AppServiceProvider.php
│       ├── AuthServiceProvider.php
│       ├── EventServiceProvider.php
│       ├── RepositoryServiceProvider.php
│       ├── PaymentProviderServiceProvider.php
│       └── DomainServiceProvider.php
│
├── config/
│   ├── payment.php                       # Configurações de pagamento
│   ├── eulen.php                         # Configurações Eulen
│   ├── wallet.php                        # Configurações de carteira
│   ├── fees.php                          # Configurações de taxas
│   └── kyc.php                           # Configurações KYC
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
│
├── routes/
│   ├── api.php
│   ├── api_v1.php
│   ├── webhooks.php
│   └── admin.php
│
├── tests/
│   ├── Unit/
│   │   ├── Domain/
│   │   ├── Application/
│   │   └── Infrastructure/
│   ├── Integration/
│   │   ├── Eulen/
│   │   └── Database/
│   └── Feature/
│       ├── Api/
│       └── Admin/
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   └── architecture/
│
├── docker/
│   ├── php/
│   ├── nginx/
│   └── postgres/
│
├── docker-compose.yml
├── Makefile
└── README.md
```

## 3.1 Justificativa da Estrutura

### Por que separar Domain de Infrastructure?

| Aspecto | Benefício |
|---------|-----------|
| **Testabilidade** | Domínio pode ser testado sem banco de dados |
| **Flexibilidade** | Troca de ORM/banco sem impacto no domínio |
| **Clareza** | Regras de negócio isoladas e explícitas |
| **Manutenibilidade** | Mudanças técnicas não afetam regras |

### Por que usar Mappers?

Os Mappers convertem entre Models (Eloquent) e Entities (Domínio):

```php
// Exemplo: WalletMapper
class WalletMapper
{
    public function toDomain(WalletModel $model): Wallet
    {
        return new Wallet(
            id: new WalletId($model->id),
            userId: new UserId($model->user_id),
            currency: Currency::BRL,
            status: WalletStatus::from($model->status),
            createdAt: $model->created_at
        );
    }

    public function toModel(Wallet $entity): WalletModel
    {
        // Converte entidade para model
    }
}
```

### Por que Commands e Queries separados (CQRS)?

| Tipo | Responsabilidade | Característica |
|------|------------------|----------------|
| **Command** | Modificar estado | Write operations |
| **Query** | Ler dados | Read operations |

Benefícios:
- Otimização de leitura vs escrita
- Cache mais eficiente para queries
- Escalabilidade horizontal
- Auditoria clara de mudanças
