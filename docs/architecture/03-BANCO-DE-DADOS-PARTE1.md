# Flyerx - Modelagem do Banco de Dados (Parte 1)

## 4. Modelagem do Banco de Dados

### 4.1 Diagrama ER Simplificado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IDENTITY CONTEXT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐               │
│  │   users     │────▶│ user_devices │     │ user_sessions   │               │
│  └─────────────┘     └──────────────┘     └─────────────────┘               │
│        │                                                                     │
│        │             ┌──────────────┐     ┌─────────────────┐               │
│        ├────────────▶│ user_2fa     │     │ password_resets │               │
│        │             └──────────────┘     └─────────────────┘               │
│        │                                                                     │
│        │             ┌──────────────┐     ┌─────────────────┐               │
│        └────────────▶│ user_roles   │────▶│     roles       │               │
│                      └──────────────┘     └─────────────────┘               │
│                                                  │                          │
│                                           ┌──────┴──────┐                   │
│                                           ▼             ▼                   │
│                                    ┌────────────┐ ┌────────────┐            │
│                                    │permissions │ │role_perms  │            │
│                                    └────────────┘ └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           WALLET CONTEXT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌──────────────────────┐                               │
│  │   wallets   │────▶│ balance_reservations │                               │
│  └─────────────┘     └──────────────────────┘                               │
│        │                                                                     │
│        │             ┌──────────────────────┐                               │
│        └────────────▶│   wallet_limits      │                               │
│                      └──────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT CONTEXT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                          ┌─────────────┐                   │
│  │  deposits   │──────────────────────────│ withdrawals │                   │
│  └─────────────┘                          └─────────────┘                   │
│        │                                         │                          │
│        │     ┌─────────────────────┐            │                          │
│        └────▶│ deposit_status_logs │            │                          │
│              └─────────────────────┘            │                          │
│                                                  │                          │
│              ┌───────────────────────┐          │                          │
│              │ withdrawal_status_logs│◀─────────┘                          │
│              └───────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEDGER CONTEXT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌──────────────────┐                              │
│  │ ledger_accounts  │◀───▶│  ledger_entries  │                              │
│  └──────────────────┘     └──────────────────┘                              │
│                                   │                                          │
│                                   ▼                                          │
│                           ┌──────────────────┐                              │
│                           │ledger_transactions│                              │
│                           └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Tabelas - Identity Context

#### 4.2.1 `users`

**Finalidade**: Armazena os dados principais dos usuários da plataforma.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `email` | VARCHAR(255) | NO | - | Email único do usuário |
| `email_verified_at` | TIMESTAMP | YES | NULL | Data de verificação do email |
| `password_hash` | VARCHAR(255) | NO | - | Hash da senha (Argon2id) |
| `full_name` | VARCHAR(255) | NO | - | Nome completo |
| `tax_number` | VARCHAR(14) | NO | - | CPF ou CNPJ (apenas números) |
| `tax_number_type` | VARCHAR(4) | NO | - | 'CPF' ou 'CNPJ' |
| `phone_number` | VARCHAR(20) | YES | NULL | Telefone com DDI |
| `phone_verified_at` | TIMESTAMP | YES | NULL | Data de verificação do telefone |
| `birth_date` | DATE | YES | NULL | Data de nascimento |
| `status` | VARCHAR(20) | NO | 'pending' | Status: pending, active, blocked, suspended |
| `kyc_level` | SMALLINT | NO | 0 | Nível de KYC (0-3) |
| `kyc_status` | VARCHAR(20) | NO | 'pending' | Status KYC: pending, approved, rejected |
| `two_factor_enabled` | BOOLEAN | NO | FALSE | 2FA habilitado |
| `failed_login_attempts` | INTEGER | NO | 0 | Tentativas de login falhas |
| `locked_until` | TIMESTAMP | YES | NULL | Bloqueio temporário até |
| `last_login_at` | TIMESTAMP | YES | NULL | Último login |
| `last_login_ip` | INET | YES | NULL | IP do último login |
| `metadata` | JSONB | YES | '{}' | Metadados adicionais |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |
| `deleted_at` | TIMESTAMP | YES | NULL | Soft delete |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_users_email (email)`
- `UNIQUE INDEX idx_users_tax_number (tax_number)`
- `INDEX idx_users_status (status)`
- `INDEX idx_users_kyc_status (kyc_status)`
- `INDEX idx_users_created_at (created_at)`

**Restrições**:
- `CHECK (status IN ('pending', 'active', 'blocked', 'suspended'))`
- `CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected'))`
- `CHECK (tax_number_type IN ('CPF', 'CNPJ'))`
- `CHECK (kyc_level >= 0 AND kyc_level <= 3)`

**Motivação**: Tabela central do sistema. Contém todos os dados de identificação e status do usuário. O `tax_number` (CPF/CNPJ) é obrigatório para operações financeiras no Brasil.

---

#### 4.2.2 `user_devices`

**Finalidade**: Rastreia dispositivos utilizados pelo usuário para detecção de fraude e segurança.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `device_fingerprint` | VARCHAR(255) | NO | - | Hash do fingerprint |
| `device_name` | VARCHAR(100) | YES | NULL | Nome do dispositivo |
| `device_type` | VARCHAR(20) | NO | - | mobile, tablet, desktop |
| `os_name` | VARCHAR(50) | YES | NULL | Sistema operacional |
| `os_version` | VARCHAR(20) | YES | NULL | Versão do SO |
| `browser_name` | VARCHAR(50) | YES | NULL | Navegador |
| `browser_version` | VARCHAR(20) | YES | NULL | Versão do navegador |
| `app_version` | VARCHAR(20) | YES | NULL | Versão do app |
| `push_token` | VARCHAR(500) | YES | NULL | Token para push notification |
| `is_trusted` | BOOLEAN | NO | FALSE | Dispositivo confiável |
| `is_blocked` | BOOLEAN | NO | FALSE | Dispositivo bloqueado |
| `first_seen_at` | TIMESTAMP | NO | NOW() | Primeira vez visto |
| `last_seen_at` | TIMESTAMP | NO | NOW() | Última vez visto |
| `last_ip` | INET | YES | NULL | Último IP |
| `last_location` | JSONB | YES | NULL | Última localização |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_user_devices_user_id (user_id)`
- `INDEX idx_user_devices_fingerprint (device_fingerprint)`
- `INDEX idx_user_devices_trusted (user_id, is_trusted)`

**Foreign Keys**:
- `FK user_devices_user_id REFERENCES users(id) ON DELETE CASCADE`

**Motivação**: Essencial para segurança. Permite identificar dispositivos suspeitos, exigir verificação adicional em novos dispositivos, e detectar padrões de fraude.

---

#### 4.2.3 `user_sessions`

**Finalidade**: Gerencia sessões ativas dos usuários.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `device_id` | UUID | YES | NULL | FK para user_devices |
| `token_hash` | VARCHAR(255) | NO | - | Hash do token |
| `refresh_token_hash` | VARCHAR(255) | YES | NULL | Hash do refresh token |
| `ip_address` | INET | NO | - | IP da sessão |
| `user_agent` | TEXT | YES | NULL | User agent |
| `expires_at` | TIMESTAMP | NO | - | Expiração da sessão |
| `last_activity_at` | TIMESTAMP | NO | NOW() | Última atividade |
| `is_revoked` | BOOLEAN | NO | FALSE | Sessão revogada |
| `revoked_at` | TIMESTAMP | YES | NULL | Data de revogação |
| `revoked_reason` | VARCHAR(100) | YES | NULL | Motivo da revogação |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_user_sessions_user_id (user_id)`
- `INDEX idx_user_sessions_token_hash (token_hash)`
- `INDEX idx_user_sessions_expires_at (expires_at)`

**Foreign Keys**:
- `FK user_sessions_user_id REFERENCES users(id) ON DELETE CASCADE`
- `FK user_sessions_device_id REFERENCES user_devices(id) ON DELETE SET NULL`

**Motivação**: Controle de sessões ativas permite logout remoto, revogação de tokens comprometidos, e análise de segurança.

---

#### 4.2.4 `user_two_factor`

**Finalidade**: Armazena configurações de autenticação de dois fatores.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `type` | VARCHAR(20) | NO | - | Tipo: totp, sms, email |
| `secret_encrypted` | TEXT | NO | - | Segredo criptografado |
| `backup_codes_encrypted` | TEXT | YES | NULL | Códigos de backup criptografados |
| `is_active` | BOOLEAN | NO | FALSE | 2FA ativo |
| `verified_at` | TIMESTAMP | YES | NULL | Data de verificação |
| `last_used_at` | TIMESTAMP | YES | NULL | Último uso |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_user_2fa_user_type (user_id, type)`

**Foreign Keys**:
- `FK user_two_factor_user_id REFERENCES users(id) ON DELETE CASCADE`

**Motivação**: Suporte a múltiplos métodos de 2FA aumenta a segurança e flexibilidade para o usuário.

---

#### 4.2.5 `password_resets`

**Finalidade**: Tokens de recuperação de senha.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `user_id` | UUID | NO | - | FK para users |
| `token_hash` | VARCHAR(255) | NO | - | Hash do token |
| `ip_address` | INET | NO | - | IP da solicitação |
| `expires_at` | TIMESTAMP | NO | - | Expiração |
| `used_at` | TIMESTAMP | YES | NULL | Data de uso |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `INDEX idx_password_resets_token_hash (token_hash)`
- `INDEX idx_password_resets_user_id (user_id)`

**Foreign Keys**:
- `FK password_resets_user_id REFERENCES users(id) ON DELETE CASCADE`

**Motivação**: Tokens de reset devem ser rastreáveis e expirarem. Single-use para segurança.

---

#### 4.2.6 `roles`

**Finalidade**: Definição de papéis do sistema (RBAC).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `name` | VARCHAR(50) | NO | - | Nome do papel |
| `slug` | VARCHAR(50) | NO | - | Slug único |
| `description` | TEXT | YES | NULL | Descrição |
| `is_system` | BOOLEAN | NO | FALSE | Papel de sistema (não removível) |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |
| `updated_at` | TIMESTAMP | NO | NOW() | Data de atualização |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_roles_slug (slug)`

**Motivação**: RBAC permite controle granular de permissões para diferentes tipos de usuários (admin, operador, usuário).

---

#### 4.2.7 `permissions`

**Finalidade**: Definição de permissões granulares.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | UUID | NO | gen_random_uuid() | Identificador único |
| `name` | VARCHAR(100) | NO | - | Nome da permissão |
| `slug` | VARCHAR(100) | NO | - | Slug único |
| `group` | VARCHAR(50) | NO | - | Grupo da permissão |
| `description` | TEXT | YES | NULL | Descrição |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_permissions_slug (slug)`
- `INDEX idx_permissions_group (group)`

---

#### 4.2.8 `role_permissions`

**Finalidade**: Relacionamento N:N entre roles e permissions.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `role_id` | UUID | NO | - | FK para roles |
| `permission_id` | UUID | NO | - | FK para permissions |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (role_id, permission_id)`

**Foreign Keys**:
- `FK role_permissions_role_id REFERENCES roles(id) ON DELETE CASCADE`
- `FK role_permissions_permission_id REFERENCES permissions(id) ON DELETE CASCADE`

---

#### 4.2.9 `user_roles`

**Finalidade**: Relacionamento N:N entre users e roles.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `user_id` | UUID | NO | - | FK para users |
| `role_id` | UUID | NO | - | FK para roles |
| `assigned_by` | UUID | YES | NULL | Quem atribuiu |
| `created_at` | TIMESTAMP | NO | NOW() | Data de criação |

**Índices**:
- `PRIMARY KEY (user_id, role_id)`

**Foreign Keys**:
- `FK user_roles_user_id REFERENCES users(id) ON DELETE CASCADE`
- `FK user_roles_role_id REFERENCES roles(id) ON DELETE CASCADE`
- `FK user_roles_assigned_by REFERENCES users(id) ON DELETE SET NULL`
