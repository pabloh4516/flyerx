<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Wallet\Services\DepositService;
use App\Application\Wallet\Services\WithdrawalService;
use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Webhook Controller para processar notificações da Eulen Pix2Depix.
 *
 * A Eulen envia webhooks com o seguinte formato:
 *
 * Deposit: { webhookType: "deposit", status: "depix_sent", qrId: "xxx", ... }
 * Withdraw: { webhookType: "withdraw", status: "sent", id: "xxx", ... }
 *
 * @see https://docs.eulen.app/-webhook-849106m0.md
 * @see https://docs.eulen.app/depositwebhookbody-5517307d0.md
 * @see https://docs.eulen.app/withdrawwebhookbody-13016756d0.md
 */
class WebhookController extends Controller
{
    /**
     * Status de depósito que indicam sucesso (DePix enviado).
     */
    private const DEPOSIT_SUCCESS_STATUSES = ['approved', 'depix_sent'];

    /**
     * Status de depósito que indicam falha.
     */
    private const DEPOSIT_FAILURE_STATUSES = ['canceled', 'refunded', 'error'];

    /**
     * Status de saque que indicam sucesso (PIX enviado).
     */
    private const WITHDRAWAL_SUCCESS_STATUSES = ['sent'];

    /**
     * Status de saque que indicam falha.
     */
    private const WITHDRAWAL_FAILURE_STATUSES = ['error', 'canceled', 'refunded'];

    public function __construct(
        private readonly DepositService $depositService,
        private readonly WithdrawalService $withdrawalService,
        private readonly DepositRepositoryInterface $depositRepository,
        private readonly WithdrawalRepositoryInterface $withdrawalRepository,
    ) {}

    /**
     * Handle Eulen payment webhook.
     *
     * Formato da Eulen:
     * - webhookType: "deposit" | "withdraw" | "med"
     * - status: status atual da transação
     * - qrId (deposit) ou id (withdraw): identificador da transação
     *
     * @see https://docs.eulen.app/-webhook-849106m0.md
     */
    public function eulen(Request $request): JsonResponse
    {
        $payload = $request->all();
        $webhookType = $payload['webhookType'] ?? null;
        $status = $payload['status'] ?? null;

        Log::info('Eulen webhook received', [
            'webhook_type' => $webhookType,
            'status' => $status,
            'payload' => $this->sanitizePayload($payload),
        ]);

        try {
            return match ($webhookType) {
                'deposit' => $this->handleDepositWebhook($payload),
                'withdraw' => $this->handleWithdrawWebhook($payload),
                'med' => $this->handleMedWebhook($payload),
                default => $this->handleUnknownWebhook($webhookType, $payload),
            };
        } catch (\Throwable $e) {
            Log::error('Eulen webhook processing error', [
                'webhook_type' => $webhookType,
                'status' => $status,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return 200 to acknowledge receipt (Eulen expects 200 within 15 seconds)
            // We'll handle retries internally
            return response()->json([
                'success' => true,
                'message' => 'Webhook received, processing failed internally',
            ]);
        }
    }

    /**
     * Handle deposit webhook.
     *
     * Payload inclui:
     * - qrId: ID do depósito (retornado na criação)
     * - status: pending, under_review, approved, depix_sent, delayed, refunded, canceled, expired, error
     * - valueInCents: valor em centavos
     * - payerName, payerTaxNumber, payerEUID: dados do pagador
     * - blockchainTxID: ID da transação na blockchain (quando depix_sent)
     * - rejectionReasons: motivos de rejeição (array)
     *
     * @see https://docs.eulen.app/depositwebhookbody-5517307d0.md
     */
    private function handleDepositWebhook(array $payload): JsonResponse
    {
        $qrId = $payload['qrId'] ?? null;
        $status = $payload['status'] ?? null;

        if ($qrId === null) {
            Log::warning('Deposit webhook missing qrId', ['payload' => $payload]);
            return response()->json(['success' => false, 'error' => 'Missing qrId'], 400);
        }

        // Find deposit by provider ID (qrId)
        $deposit = $this->depositRepository->findByProviderId($qrId);

        if ($deposit === null) {
            Log::warning('Deposit not found for webhook', [
                'qr_id' => $qrId,
                'status' => $status,
            ]);
            // Return 200 to avoid Eulen retries for unknown deposits
            return response()->json(['success' => true, 'message' => 'Deposit not found']);
        }

        // Skip if already in final state
        if ($deposit->getStatus()->isFinal()) {
            Log::debug('Deposit already in final state', [
                'deposit_id' => $deposit->getId(),
                'current_status' => $deposit->getStatus()->value,
            ]);
            return response()->json(['success' => true, 'message' => 'Already processed']);
        }

        // Process based on status
        if (in_array($status, self::DEPOSIT_SUCCESS_STATUSES, true)) {
            $this->depositService->confirmDeposit($deposit->getId());

            Log::info('Deposit confirmed via webhook', [
                'deposit_id' => $deposit->getId(),
                'qr_id' => $qrId,
                'status' => $status,
                'blockchain_tx_id' => $payload['blockchainTxID'] ?? null,
            ]);
        } elseif ($status === 'expired') {
            $this->depositService->confirmDeposit($deposit->getId());

            Log::info('Deposit expired via webhook', [
                'deposit_id' => $deposit->getId(),
                'qr_id' => $qrId,
            ]);
        } elseif (in_array($status, self::DEPOSIT_FAILURE_STATUSES, true)) {
            $this->depositService->confirmDeposit($deposit->getId());

            Log::info('Deposit failed via webhook', [
                'deposit_id' => $deposit->getId(),
                'qr_id' => $qrId,
                'status' => $status,
                'rejection_reasons' => $payload['rejectionReasons'] ?? [],
            ]);
        } else {
            // Status intermediário (pending, under_review, delayed)
            Log::debug('Deposit webhook intermediate status', [
                'deposit_id' => $deposit->getId(),
                'qr_id' => $qrId,
                'status' => $status,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Handle withdraw webhook.
     *
     * Payload inclui:
     * - id: ID do saque (retornado na criação como withdrawalId)
     * - status: unsent, sending, sent, error, canceled, refunded
     * - pixKey: chave PIX do destinatário
     * - depositAmountInCents, payoutAmountInCents: valores
     * - blockchainTxID: ID da transação na blockchain
     * - receiptUrl: URL do comprovante
     * - centralBankId: ID da transação PIX no Banco Central
     *
     * @see https://docs.eulen.app/withdrawwebhookbody-13016756d0.md
     */
    private function handleWithdrawWebhook(array $payload): JsonResponse
    {
        $withdrawalId = $payload['id'] ?? null;
        $status = $payload['status'] ?? null;

        if ($withdrawalId === null) {
            Log::warning('Withdraw webhook missing id', ['payload' => $payload]);
            return response()->json(['success' => false, 'error' => 'Missing id'], 400);
        }

        // Find withdrawal by provider ID
        $withdrawal = $this->withdrawalRepository->findByProviderId($withdrawalId);

        if ($withdrawal === null) {
            Log::warning('Withdrawal not found for webhook', [
                'withdrawal_id' => $withdrawalId,
                'status' => $status,
            ]);
            // Return 200 to avoid Eulen retries for unknown withdrawals
            return response()->json(['success' => true, 'message' => 'Withdrawal not found']);
        }

        // Skip if already in final state
        if ($withdrawal->getStatus()->isFinal()) {
            Log::debug('Withdrawal already in final state', [
                'withdrawal_id' => $withdrawal->getId(),
                'current_status' => $withdrawal->getStatus()->value,
            ]);
            return response()->json(['success' => true, 'message' => 'Already processed']);
        }

        // Process based on status
        if (in_array($status, self::WITHDRAWAL_SUCCESS_STATUSES, true)) {
            $this->withdrawalService->confirmWithdrawal($withdrawal->getId());

            Log::info('Withdrawal completed via webhook', [
                'withdrawal_id' => $withdrawal->getId(),
                'provider_id' => $withdrawalId,
                'status' => $status,
                'receipt_url' => $payload['receiptUrl'] ?? null,
                'central_bank_id' => $payload['centralBankId'] ?? null,
            ]);
        } elseif (in_array($status, self::WITHDRAWAL_FAILURE_STATUSES, true)) {
            $this->withdrawalService->confirmWithdrawal($withdrawal->getId());

            Log::info('Withdrawal failed via webhook', [
                'withdrawal_id' => $withdrawal->getId(),
                'provider_id' => $withdrawalId,
                'status' => $status,
            ]);
        } else {
            // Status intermediário (unsent, sending)
            Log::debug('Withdrawal webhook intermediate status', [
                'withdrawal_id' => $withdrawal->getId(),
                'provider_id' => $withdrawalId,
                'status' => $status,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Handle MED (Mecanismo Especial de Devolução) webhook.
     *
     * MEDs são notificações de devolução especial do Banco Central.
     * Por enquanto apenas logamos para análise.
     */
    private function handleMedWebhook(array $payload): JsonResponse
    {
        Log::warning('MED webhook received - requires manual review', [
            'payload' => $payload,
        ]);

        // TODO: Implementar tratamento de MED se necessário
        // MEDs geralmente requerem análise manual

        return response()->json(['success' => true, 'message' => 'MED logged for review']);
    }

    /**
     * Handle unknown webhook type.
     */
    private function handleUnknownWebhook(?string $webhookType, array $payload): JsonResponse
    {
        Log::info('Unknown webhook type received', [
            'webhook_type' => $webhookType,
            'payload' => $this->sanitizePayload($payload),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unknown webhook type',
        ]);
    }

    /**
     * Sanitize payload for logging (remove sensitive data).
     */
    private function sanitizePayload(array $payload): array
    {
        $sensitive = ['payerTaxNumber', 'receiverTaxNumber', 'taxNumber'];

        foreach ($sensitive as $key) {
            if (isset($payload[$key]) && is_string($payload[$key]) && strlen($payload[$key]) > 6) {
                $payload[$key] = substr($payload[$key], 0, 3) . '***' . substr($payload[$key], -3);
            }
        }

        return $payload;
    }
}
