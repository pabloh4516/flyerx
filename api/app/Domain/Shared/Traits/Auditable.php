<?php

declare(strict_types=1);

namespace App\Domain\Shared\Traits;

use App\Application\Audit\Context\AuditContext;
use App\Application\Audit\Enums\AuditAction;
use App\Application\Audit\Services\AuditService;

/**
 * Trait for entities that need audit logging capabilities.
 *
 * This trait provides methods for entities to log their own state changes
 * in a consistent and compliant manner.
 *
 * Usage:
 *   class User extends AggregateRoot
 *   {
 *       use Auditable;
 *
 *       public function changeEmail(Email $newEmail): void
 *       {
 *           $oldEmail = $this->email;
 *           $this->email = $newEmail;
 *
 *           $this->auditChange(
 *               action: 'email_changed',
 *               oldData: ['email' => $oldEmail->toString()],
 *               newData: ['email' => $newEmail->toString()]
 *           );
 *       }
 *   }
 */
trait Auditable
{
    /**
     * Get the entity type for audit logging.
     * Override this method to customize the entity type name.
     */
    protected function getAuditEntityType(): string
    {
        // Get the short class name (e.g., "User" from "App\Domain\Identity\Entities\User")
        $reflection = new \ReflectionClass($this);
        return $reflection->getShortName();
    }

    /**
     * Get the entity ID for audit logging.
     * Override this method if your entity uses a different ID property.
     */
    protected function getAuditEntityId(): ?string
    {
        if (method_exists($this, 'getId')) {
            return $this->getId();
        }

        if (property_exists($this, 'id')) {
            return (string) $this->id;
        }

        return null;
    }

    /**
     * Log an audit event for this entity.
     */
    protected function audit(
        AuditAction $action,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void {
        $this->getAuditService()->log(
            action: $action,
            entityType: $this->getAuditEntityType(),
            entityId: $this->getAuditEntityId(),
            oldData: $oldData,
            newData: $newData,
            metadata: $metadata,
            context: $context,
        );
    }

    /**
     * Log a custom audit event for this entity.
     */
    protected function auditCustom(
        string $action,
        ?array $oldData = null,
        ?array $newData = null,
        array $metadata = [],
        ?AuditContext $context = null,
    ): void {
        $this->getAuditService()->logRaw(
            action: $action,
            entityType: $this->getAuditEntityType(),
            entityId: $this->getAuditEntityId(),
            oldData: $oldData,
            newData: $newData,
            metadata: $metadata,
            context: $context,
        );
    }

    /**
     * Log a state change with automatic old/new data tracking.
     *
     * @param string $action The action name (e.g., 'email_changed', 'status_updated')
     * @param array $oldData The previous state
     * @param array $newData The new state
     * @param array $metadata Additional metadata
     */
    protected function auditChange(
        string $action,
        array $oldData,
        array $newData,
        array $metadata = [],
    ): void {
        $this->auditCustom(
            action: $this->getAuditEntityType() . '.' . $action,
            oldData: $oldData,
            newData: $newData,
            metadata: array_merge($metadata, [
                'change_type' => 'state_change',
                'changed_fields' => array_keys(array_diff_assoc($newData, $oldData)),
            ]),
        );
    }

    /**
     * Log entity creation.
     */
    protected function auditCreation(array $data = [], array $metadata = []): void
    {
        $entityType = $this->getAuditEntityType();

        $this->auditCustom(
            action: strtolower($entityType) . '.created',
            oldData: null,
            newData: $data,
            metadata: array_merge($metadata, [
                'change_type' => 'creation',
            ]),
        );
    }

    /**
     * Log entity deletion (soft delete).
     */
    protected function auditDeletion(array $data = [], array $metadata = []): void
    {
        $entityType = $this->getAuditEntityType();

        $this->auditCustom(
            action: strtolower($entityType) . '.deleted',
            oldData: $data,
            newData: null,
            metadata: array_merge($metadata, [
                'change_type' => 'deletion',
            ]),
        );
    }

    /**
     * Get the audit service instance.
     */
    private function getAuditService(): AuditService
    {
        return app(AuditService::class);
    }
}
