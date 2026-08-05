<?php

declare(strict_types=1);

namespace App\Application\Audit\Enums;

/**
 * Enum representing all auditable actions in the system.
 * These actions are used for compliance and regulatory requirements.
 */
enum AuditAction: string
{
    // User Authentication
    case USER_REGISTERED = 'user.registered';
    case USER_LOGIN = 'user.login';
    case USER_LOGIN_FAILED = 'user.login_failed';
    case USER_LOGOUT = 'user.logout';
    case USER_EMAIL_VERIFIED = 'user.email_verified';
    case USER_PASSWORD_CHANGED = 'user.password_changed';
    case USER_PASSWORD_RESET_REQUESTED = 'user.password_reset_requested';
    case USER_PASSWORD_RESET_COMPLETED = 'user.password_reset_completed';
    case USER_BLOCKED = 'user.blocked';
    case USER_UNBLOCKED = 'user.unblocked';
    case USER_KYC_UPDATED = 'user.kyc_updated';

    // Two-Factor Authentication
    case TWO_FACTOR_ENABLED = 'user.2fa_enabled';
    case TWO_FACTOR_DISABLED = 'user.2fa_disabled';
    case TWO_FACTOR_VERIFIED = 'user.2fa_verified';
    case TWO_FACTOR_FAILED = 'user.2fa_failed';

    // Wallet Operations
    case WALLET_CREATED = 'wallet.created';
    case WALLET_SUSPENDED = 'wallet.suspended';
    case WALLET_ACTIVATED = 'wallet.activated';
    case WALLET_BALANCE_UPDATED = 'wallet.balance_updated';

    // Deposit Operations
    case DEPOSIT_CREATED = 'deposit.created';
    case DEPOSIT_PENDING = 'deposit.pending';
    case DEPOSIT_COMPLETED = 'deposit.completed';
    case DEPOSIT_FAILED = 'deposit.failed';
    case DEPOSIT_CANCELLED = 'deposit.cancelled';

    // Withdrawal Operations
    case WITHDRAWAL_CREATED = 'withdrawal.created';
    case WITHDRAWAL_PENDING = 'withdrawal.pending';
    case WITHDRAWAL_COMPLETED = 'withdrawal.completed';
    case WITHDRAWAL_FAILED = 'withdrawal.failed';
    case WITHDRAWAL_CANCELLED = 'withdrawal.cancelled';

    // Session Management
    case SESSION_CREATED = 'session.created';
    case SESSION_REVOKED = 'session.revoked';
    case SESSION_EXPIRED = 'session.expired';

    // System Actions
    case SYSTEM_ACTION = 'system.action';

    /**
     * Get human-readable description of the action.
     */
    public function description(): string
    {
        return match ($this) {
            self::USER_REGISTERED => 'User account created',
            self::USER_LOGIN => 'User logged in',
            self::USER_LOGIN_FAILED => 'Failed login attempt',
            self::USER_LOGOUT => 'User logged out',
            self::USER_EMAIL_VERIFIED => 'Email address verified',
            self::USER_PASSWORD_CHANGED => 'Password changed',
            self::USER_PASSWORD_RESET_REQUESTED => 'Password reset requested',
            self::USER_PASSWORD_RESET_COMPLETED => 'Password reset completed',
            self::USER_BLOCKED => 'User account blocked',
            self::USER_UNBLOCKED => 'User account unblocked',
            self::USER_KYC_UPDATED => 'KYC information updated',
            self::TWO_FACTOR_ENABLED => 'Two-factor authentication enabled',
            self::TWO_FACTOR_DISABLED => 'Two-factor authentication disabled',
            self::TWO_FACTOR_VERIFIED => 'Two-factor code verified',
            self::TWO_FACTOR_FAILED => 'Two-factor verification failed',
            self::WALLET_CREATED => 'Wallet created',
            self::WALLET_SUSPENDED => 'Wallet suspended',
            self::WALLET_ACTIVATED => 'Wallet activated',
            self::WALLET_BALANCE_UPDATED => 'Wallet balance updated',
            self::DEPOSIT_CREATED => 'Deposit initiated',
            self::DEPOSIT_PENDING => 'Deposit pending confirmation',
            self::DEPOSIT_COMPLETED => 'Deposit completed',
            self::DEPOSIT_FAILED => 'Deposit failed',
            self::DEPOSIT_CANCELLED => 'Deposit cancelled',
            self::WITHDRAWAL_CREATED => 'Withdrawal initiated',
            self::WITHDRAWAL_PENDING => 'Withdrawal pending',
            self::WITHDRAWAL_COMPLETED => 'Withdrawal completed',
            self::WITHDRAWAL_FAILED => 'Withdrawal failed',
            self::WITHDRAWAL_CANCELLED => 'Withdrawal cancelled',
            self::SESSION_CREATED => 'Session created',
            self::SESSION_REVOKED => 'Session revoked',
            self::SESSION_EXPIRED => 'Session expired',
            self::SYSTEM_ACTION => 'System action performed',
        };
    }

    /**
     * Check if this action is security-sensitive.
     */
    public function isSecuritySensitive(): bool
    {
        return match ($this) {
            self::USER_LOGIN,
            self::USER_LOGIN_FAILED,
            self::USER_PASSWORD_CHANGED,
            self::USER_PASSWORD_RESET_REQUESTED,
            self::USER_PASSWORD_RESET_COMPLETED,
            self::USER_BLOCKED,
            self::TWO_FACTOR_ENABLED,
            self::TWO_FACTOR_DISABLED,
            self::TWO_FACTOR_FAILED,
            self::SESSION_REVOKED => true,
            default => false,
        };
    }

    /**
     * Check if this action is financial.
     */
    public function isFinancial(): bool
    {
        return match ($this) {
            self::DEPOSIT_CREATED,
            self::DEPOSIT_COMPLETED,
            self::DEPOSIT_FAILED,
            self::WITHDRAWAL_CREATED,
            self::WITHDRAWAL_COMPLETED,
            self::WITHDRAWAL_FAILED,
            self::WALLET_BALANCE_UPDATED => true,
            default => false,
        };
    }

    /**
     * Get severity level for alerting purposes.
     */
    public function severity(): string
    {
        return match ($this) {
            self::USER_LOGIN_FAILED,
            self::TWO_FACTOR_FAILED,
            self::DEPOSIT_FAILED,
            self::WITHDRAWAL_FAILED => 'warning',
            self::USER_BLOCKED,
            self::WALLET_SUSPENDED,
            self::SESSION_REVOKED => 'critical',
            default => 'info',
        };
    }
}
