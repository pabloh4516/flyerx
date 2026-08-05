# Flyerx - Estratégia de Segurança

## 9. Estratégia de Segurança

### 9.1 Defesa em Profundidade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAMADAS DE SEGURANÇA                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │ CAMADA 1: INFRAESTRUTURA                                        │
    │ ├── WAF (Web Application Firewall)                              │
    │ ├── DDoS Protection                                             │
    │ ├── Rate Limiting por IP                                        │
    │ └── TLS 1.3                                                     │
    └─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ CAMADA 2: APLICAÇÃO                                             │
    │ ├── Autenticação JWT + Refresh Token                            │
    │ ├── 2FA (TOTP)                                                  │
    │ ├── Rate Limiting por Usuário                                   │
    │ ├── CORS configurado                                            │
    │ ├── CSRF Protection                                             │
    │ └── Input Validation/Sanitization                               │
    └─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ CAMADA 3: NEGÓCIO                                               │
    │ ├── Verificação de KYC                                          │
    │ ├── Limites por operação                                        │
    │ ├── Aprovação manual (valores altos)                            │
    │ ├── Device tracking                                             │
    │ └── Análise de comportamento                                    │
    └─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ CAMADA 4: DADOS                                                 │
    │ ├── Encryption at rest (AES-256)                                │
    │ ├── Encryption in transit (TLS)                                 │
    │ ├── Hash seguro (Argon2id)                                      │
    │ ├── Masking de dados sensíveis                                  │
    │ └── Audit logging                                               │
    └─────────────────────────────────────────────────────────────────┘
```

### 9.2 Autenticação

#### JWT + Refresh Token

```php
// Configuração de tokens
return [
    'access_token' => [
        'ttl' => 15,           // 15 minutos
        'algorithm' => 'RS256', // Asymmetric para permitir validação sem secret
    ],
    'refresh_token' => [
        'ttl' => 60 * 24 * 7,  // 7 dias
        'rotation' => true,    // Rotação a cada uso
        'absolute_ttl' => 60 * 24 * 30, // 30 dias máximo absoluto
    ]
];

// Estrutura do JWT
[
    'iss' => 'flyerx',
    'sub' => $user->id,
    'iat' => time(),
    'exp' => time() + (15 * 60),
    'jti' => Str::uuid(),
    'scopes' => ['user'],
    'device_id' => $device->id,
    'session_id' => $session->id,
]
```

#### Fluxo de Refresh

```
1. Access Token expira
2. Client envia Refresh Token
3. Server valida:
   - Token não expirado
   - Token não revogado
   - Sessão ainda válida
   - Device ainda autorizado
4. Server emite novos tokens
5. Refresh Token antigo é invalidado (rotation)
```

### 9.3 Two-Factor Authentication (2FA)

```php
class TwoFactorService
{
    public function enable(User $user): TwoFactorSetup
    {
        // Gera secret TOTP
        $secret = $this->generator->generateSecretKey();

        // Gera códigos de backup
        $backupCodes = $this->generateBackupCodes(10);

        // Criptografa antes de salvar
        $encryptedSecret = $this->encryptor->encrypt($secret);
        $encryptedBackupCodes = $this->encryptor->encrypt(
            json_encode($backupCodes)
        );

        // Salva (ainda não ativado)
        $twoFactor = new UserTwoFactor(
            userId: $user->id,
            type: TwoFactorType::TOTP,
            secretEncrypted: $encryptedSecret,
            backupCodesEncrypted: $encryptedBackupCodes,
            isActive: false
        );

        $this->repository->save($twoFactor);

        return new TwoFactorSetup(
            secret: $secret,
            qrCodeUrl: $this->generateQrCodeUrl($user, $secret),
            backupCodes: $backupCodes
        );
    }

    public function verify(User $user, string $code): bool
    {
        $twoFactor = $this->repository->findActiveForUser($user->id);

        if (!$twoFactor) {
            return false;
        }

        $secret = $this->encryptor->decrypt($twoFactor->secretEncrypted);

        // Verifica TOTP
        if ($this->totp->verify($secret, $code)) {
            $twoFactor->markUsed();
            $this->repository->save($twoFactor);
            return true;
        }

        // Verifica código de backup
        return $this->verifyBackupCode($twoFactor, $code);
    }
}
```

### 9.4 Rate Limiting

```php
// Configuração de rate limits
return [
    'api' => [
        // Por IP (global)
        'ip' => [
            'requests' => 1000,
            'period' => 60, // por minuto
        ],
        // Por usuário autenticado
        'user' => [
            'requests' => 100,
            'period' => 60,
        ],
    ],

    'auth' => [
        // Login
        'login' => [
            'attempts' => 5,
            'period' => 60,
            'lockout' => 300, // 5 minutos de bloqueio
        ],
        // Password reset
        'password_reset' => [
            'attempts' => 3,
            'period' => 3600, // por hora
        ],
    ],

    'financial' => [
        // Depósitos
        'deposit' => [
            'per_minute' => 5,
            'per_hour' => 20,
            'per_day' => 50,
        ],
        // Saques
        'withdrawal' => [
            'per_minute' => 3,
            'per_hour' => 10,
            'per_day' => 20,
        ],
    ],
];

// Middleware de Rate Limit
class RateLimitMiddleware
{
    public function handle(Request $request, Closure $next, string $limiter): Response
    {
        $key = $this->resolveKey($request, $limiter);
        $limit = $this->getLimit($limiter);

        if ($this->rateLimiter->tooManyAttempts($key, $limit->maxAttempts)) {
            $retryAfter = $this->rateLimiter->availableIn($key);

            throw new TooManyRequestsException(
                "Too many requests. Retry after {$retryAfter} seconds."
            );
        }

        $this->rateLimiter->hit($key, $limit->decaySeconds);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit->maxAttempts,
            'X-RateLimit-Remaining' => $this->rateLimiter->remaining($key, $limit->maxAttempts),
        ]);
    }
}
```

### 9.5 Device Tracking

```php
class DeviceTracker
{
    public function track(Request $request, User $user): Device
    {
        $fingerprint = $this->generateFingerprint($request);

        $device = $this->deviceRepository->findByFingerprint(
            $user->id,
            $fingerprint
        );

        if (!$device) {
            $device = $this->createNewDevice($request, $user, $fingerprint);

            // Novo dispositivo requer verificação
            $this->eventDispatcher->dispatch(
                new NewDeviceDetected($user, $device, $request->ip())
            );
        }

        // Atualiza última atividade
        $device->markSeen($request->ip());
        $this->deviceRepository->save($device);

        return $device;
    }

    private function generateFingerprint(Request $request): string
    {
        $components = [
            $request->userAgent(),
            $request->header('Accept-Language'),
            $request->header('Accept-Encoding'),
            // Componentes adicionais do cliente (enviados pelo app)
            $request->input('device.screen_resolution'),
            $request->input('device.timezone'),
            $request->input('device.platform'),
        ];

        return hash('sha256', implode('|', $components));
    }
}
```

### 9.6 Criptografia

```php
// Configuração de criptografia
return [
    // Dados em repouso
    'at_rest' => [
        'algorithm' => 'aes-256-gcm',
        'key' => env('APP_ENCRYPTION_KEY'),
    ],

    // Hash de senhas
    'password' => [
        'algorithm' => PASSWORD_ARGON2ID,
        'memory_cost' => 65536, // 64 MB
        'time_cost' => 4,
        'threads' => 3,
    ],

    // Dados sensíveis específicos
    'sensitive_fields' => [
        'user_two_factor.secret_encrypted',
        'user_two_factor.backup_codes_encrypted',
        'kyc_documents.file_path',
        'provider_configurations.credentials_encrypted',
    ],
];

// Serviço de criptografia
class EncryptionService
{
    public function encrypt(string $data): string
    {
        $iv = random_bytes(16);
        $tag = '';

        $encrypted = openssl_encrypt(
            $data,
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16
        );

        // IV + Tag + Encrypted data
        return base64_encode($iv . $tag . $encrypted);
    }

    public function decrypt(string $payload): string
    {
        $data = base64_decode($payload);

        $iv = substr($data, 0, 16);
        $tag = substr($data, 16, 16);
        $encrypted = substr($data, 32);

        return openssl_decrypt(
            $encrypted,
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
    }
}
```

### 9.7 Prevenção de Vulnerabilidades

#### SQL Injection
- Uso exclusivo de Eloquent ORM e Query Builder
- Bindings parametrizados em raw queries quando necessário
- Validação rigorosa de inputs

#### XSS
- Sanitização de outputs com `e()` ou `{{ }}`
- Content-Security-Policy headers
- HttpOnly cookies

#### CSRF
- Tokens CSRF em todas as mutações
- SameSite=Strict em cookies
- Verificação de Origin/Referer

```php
// Middleware de segurança
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        return $response->withHeaders([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block',
            'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy' => $this->buildCsp(),
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'geolocation=(), microphone=(), camera=()',
        ]);
    }
}
```

### 9.8 LGPD Compliance

```php
// Dados pessoais armazenados
$personalData = [
    'users' => ['email', 'full_name', 'tax_number', 'phone_number', 'birth_date'],
    'kyc_documents' => ['file_path'],
    'audit_logs' => ['ip_address'],
];

// Direitos do titular
class LgpdService
{
    /**
     * Direito de acesso - exporta todos os dados do usuário
     */
    public function exportUserData(User $user): array
    {
        return [
            'user' => $user->toArray(),
            'wallet' => $user->wallet?->toArray(),
            'deposits' => $user->deposits->toArray(),
            'withdrawals' => $user->withdrawals->toArray(),
            'kyc' => $this->exportKycData($user),
            'devices' => $user->devices->toArray(),
            'audit_logs' => $this->exportAuditLogs($user),
        ];
    }

    /**
     * Direito de exclusão (com retenção legal)
     */
    public function deleteUserData(User $user): void
    {
        // Anonimiza dados pessoais
        $user->anonymize();

        // Mantém dados financeiros por 5 anos (obrigação legal)
        // Mas remove identificação pessoal
    }

    /**
     * Direito de retificação
     */
    public function rectifyData(User $user, array $corrections): void
    {
        // Valida e aplica correções
        // Registra em audit log
    }
}
```

### 9.9 Auditoria de Segurança

```php
// Eventos auditados automaticamente
$auditableEvents = [
    // Autenticação
    'auth.login.success',
    'auth.login.failed',
    'auth.logout',
    'auth.password_changed',
    'auth.2fa_enabled',
    'auth.2fa_disabled',

    // Financeiro
    'deposit.requested',
    'deposit.confirmed',
    'withdrawal.requested',
    'withdrawal.confirmed',
    'withdrawal.approved',
    'withdrawal.rejected',

    // Admin
    'admin.user_blocked',
    'admin.user_unblocked',
    'admin.kyc_approved',
    'admin.kyc_rejected',
    'admin.config_changed',

    // Segurança
    'security.device_added',
    'security.device_blocked',
    'security.session_revoked',
    'security.ip_blocked',
];

// Logger de auditoria
class AuditLogger
{
    public function log(
        string $action,
        ?User $actor,
        ?string $resourceType = null,
        ?string $resourceId = null,
        array $metadata = []
    ): void {
        $this->repository->create(new AuditLog(
            actorType: $actor ? 'user' : 'system',
            actorId: $actor?->id,
            action: $action,
            resourceType: $resourceType,
            resourceId: $resourceId,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            requestId: request()->header('X-Request-ID'),
            metadata: $metadata,
            createdAt: now()
        ));
    }
}
```

### 9.10 Detecção de Fraude (Preparação Futura)

```php
// Interface para sistema de detecção de fraude
interface FraudDetectionInterface
{
    public function analyzeTransaction(Transaction $tx): RiskAssessment;
    public function reportFraud(Transaction $tx, string $reason): void;
    public function getBlocklist(): Blocklist;
}

// Implementação básica (pode ser expandida)
class BasicFraudDetection implements FraudDetectionInterface
{
    public function analyzeTransaction(Transaction $tx): RiskAssessment
    {
        $score = 0;
        $flags = [];

        // Novo dispositivo
        if (!$tx->device->isTrusted) {
            $score += 20;
            $flags[] = 'new_device';
        }

        // Horário incomum
        if ($this->isUnusualTime($tx)) {
            $score += 10;
            $flags[] = 'unusual_time';
        }

        // Valor alto para o perfil
        if ($this->isHighValueForProfile($tx)) {
            $score += 30;
            $flags[] = 'high_value';
        }

        // Velocidade de transações
        if ($this->hasRapidTransactions($tx)) {
            $score += 40;
            $flags[] = 'rapid_transactions';
        }

        return new RiskAssessment(
            score: $score,
            level: $this->scoreToLevel($score),
            flags: $flags,
            recommendation: $this->getRecommendation($score)
        );
    }
}
```
