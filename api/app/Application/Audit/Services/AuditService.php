<?php

declare(strict_types=1);

namespace App\Application\Audit\Services;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Contracts\AuditServiceInterface;
use App\Application\Audit\Enums\AuditAction;
use App\Infrastructure\Persistence\Eloquent\Models\AuditLogModel;
use Illuminate\Support\Facades\Log;

/**
 * Production-ready audit logging service for fintech compliance.
 *
 * This service ensures:
 * - All critical operations are logged immutably
 * - Request context is captured for forensic analysis
 * - Logs are never deleted (soft-delete only if needed)
 * - Sensitive data is redacted before logging
 *
 * @see PCI-DSS Requirement 10: Track and monitor all access
 * @see LGPD/GDPR: Audit trail requirements
 */
final class AuditService implements AuditServiceInterface
{
    /**
     * Fields that should be redacted from audit logs.
     */
    private const SENSITIVE_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'secret',
        'token',
        'api_key',
        'api_secret',
        'private_key',
        'credit_card',
        'card_number',
        'cvv',
        'cvc',
        'pin',
        'otp',
        'recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Log an audit event using the AuditAction enum.
     */
    public function log(
        AuditAction $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void {
        $this->logRaw(
            action: $action->value,
            entityType: $entityType,
            entityId: $entityId,
            oldData: $oldData,
            newData: $newData,
            metadata: array_merge($metadata, [
                'action_description' => $action->description(),
                'is_security_sensitive' => $action->isSecuritySensitive(),
                'is_financial' => $action->isFinancial(),
                'severity' => $action->severity(),
            ]),
            context: $context,
        );
    }

    /**
     * Log an audit event with a raw action string.
     */
    public function logRaw(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void {
        $context = $context ?? AuditContext::fromRequest();

        try {
            AuditLogModel::create([
                'actor_type' => $context->getActorType(),
                'actor_id' => $context->getUserId(),
                'action' => $action,
                'resource_type' => $entityType,
                'resource_id' => $entityId,
                'old_values' => $this->redactSensitiveData($oldData),
                'new_values' => $this->redactSensitiveData($newData),
                'ip_address' => $context->getIpAddress(),
                'user_agent' => $this->truncateUserAgent($context->getUserAgent()),
                'request_id' => $context->getRequestId(),
                'session_id' => $context->getSessionId(),
                'metadata' => array_merge($metadata, [
                    'logged_at' => now()->toIso8601String(),
                ]),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Audit logging should NEVER fail silently in production
            // Log to system logger as fallback
            Log::critical('Audit logging failed', [
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'error' => $e->getMessage(),
                'context' => $context->toArray(),
            ]);

            // In production, you might want to send this to an external service
            // like Sentry, DataDog, or a dedicated audit service

            // Re-throw in non-production environments
            if (app()->environment('local', 'testing')) {
                throw $e;
            }
        }
    }

    /**
     * Get audit logs for a specific entity.
     */
    public function getLogsForEntity(string $entityType, string $entityId, int $limit = 100): array
    {
        return AuditLogModel::query()
            ->byResource($entityType, $entityId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get audit logs for a specific user (as actor).
     */
    public function getLogsForUser(string $userId, int $limit = 100): array
    {
        return AuditLogModel::query()
            ->byActor('user', $userId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get audit logs by action type.
     */
    public function getLogsByAction(AuditAction $action, int $limit = 100): array
    {
        return AuditLogModel::query()
            ->byAction($action->value)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get audit logs for compliance reporting.
     */
    public function getComplianceReport(
        \DateTimeInterface $startDate,
        \DateTimeInterface $endDate,
        ?string $entityType = null,
    ): array {
        $query = AuditLogModel::query()
            ->inDateRange($startDate, $endDate);

        if ($entityType !== null) {
            $query->where('resource_type', $entityType);
        }

        return $query
            ->orderBy('created_at')
            ->get()
            ->toArray();
    }

    /**
     * Get security-sensitive audit logs.
     */
    public function getSecurityLogs(int $days = 7, int $limit = 500): array
    {
        $securityActions = array_map(
            fn(AuditAction $action) => $action->value,
            array_filter(
                AuditAction::cases(),
                fn(AuditAction $action) => $action->isSecuritySensitive()
            )
        );

        return AuditLogModel::query()
            ->whereIn('action', $securityActions)
            ->recent($days)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get financial audit logs.
     */
    public function getFinancialLogs(int $days = 30, int $limit = 1000): array
    {
        $financialActions = array_map(
            fn(AuditAction $action) => $action->value,
            array_filter(
                AuditAction::cases(),
                fn(AuditAction $action) => $action->isFinancial()
            )
        );

        return AuditLogModel::query()
            ->whereIn('action', $financialActions)
            ->recent($days)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get audit logs for a specific session.
     */
    public function getLogsForSession(string $sessionId, int $limit = 100): array
    {
        return AuditLogModel::query()
            ->bySession($sessionId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Redact sensitive data from arrays before logging.
     */
    private function redactSensitiveData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        return $this->recursiveRedact($data);
    }

    /**
     * Recursively redact sensitive fields.
     */
    private function recursiveRedact(array $data): array
    {
        foreach ($data as $key => $value) {
            // Check if the key matches a sensitive field
            $lowercaseKey = strtolower((string) $key);

            foreach (self::SENSITIVE_FIELDS as $sensitiveField) {
                if (str_contains($lowercaseKey, $sensitiveField)) {
                    $data[$key] = '[REDACTED]';
                    continue 2;
                }
            }

            // Recursively process nested arrays
            if (is_array($value)) {
                $data[$key] = $this->recursiveRedact($value);
            }
        }

        return $data;
    }

    /**
     * Truncate user agent to prevent excessive storage.
     */
    private function truncateUserAgent(?string $userAgent): ?string
    {
        if ($userAgent === null) {
            return null;
        }

        // Limit to 500 characters
        return mb_substr($userAgent, 0, 500);
    }
}
