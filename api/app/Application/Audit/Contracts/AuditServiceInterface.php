<?php

declare(strict_types=1);

namespace App\Application\Audit\Contracts;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;

/**
 * Contract for audit logging service.
 * Implementations must ensure logs are immutable and never deleted.
 */
interface AuditServiceInterface
{
    /**
     * Log an audit event.
     *
     * @param AuditAction $action The action being audited
     * @param string $entityType The type of entity (User, Wallet, Deposit, etc.)
     * @param string|null $entityId The ID of the entity
     * @param array|null $oldData Previous state of the entity
     * @param array|null $newData New state of the entity
     * @param array $metadata Additional metadata for the log
     * @param AuditContext|null $context Request context (IP, User-Agent, etc.)
     */
    public function log(
        AuditAction $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void;

    /**
     * Log an audit event with raw action string.
     * Use this for custom actions not covered by AuditAction enum.
     */
    public function logRaw(
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void;

    /**
     * Get audit logs for a specific entity.
     */
    public function getLogsForEntity(string $entityType, string $entityId, int $limit = 100): array;

    /**
     * Get audit logs for a specific user (actor).
     */
    public function getLogsForUser(string $userId, int $limit = 100): array;

    /**
     * Get audit logs by action type.
     */
    public function getLogsByAction(AuditAction $action, int $limit = 100): array;
}
