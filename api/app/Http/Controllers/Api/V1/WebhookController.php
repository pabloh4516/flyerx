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

class WebhookController extends Controller
{
    public function __construct(
        private readonly DepositService $depositService,
        private readonly WithdrawalService $withdrawalService,
        private readonly DepositRepositoryInterface $depositRepository,
        private readonly WithdrawalRepositoryInterface $withdrawalRepository,
    ) {}

    /**
     * Handle Eulen payment webhook.
     *
     * Note: Signature validation is handled by the webhook.signature:eulen middleware.
     * If we reach this method, the signature has already been validated.
     */
    public function eulen(Request $request): JsonResponse
    {
        $payload = $request->all();
        $eventType = $payload['event'] ?? null;

        Log::info('Eulen webhook received', [
            'event' => $eventType,
            'payload' => $payload,
        ]);

        try {
            return match ($eventType) {
                'pix.deposit.confirmed',
                'pix.deposit.paid' => $this->handleDepositConfirmed($payload),

                'pix.deposit.expired' => $this->handleDepositExpired($payload),

                'pix.deposit.failed' => $this->handleDepositFailed($payload),

                'pix.withdrawal.completed',
                'pix.withdrawal.confirmed' => $this->handleWithdrawalCompleted($payload),

                'pix.withdrawal.failed' => $this->handleWithdrawalFailed($payload),

                default => $this->handleUnknownEvent($eventType, $payload),
            };

        } catch (\Throwable $e) {
            Log::error('Eulen webhook processing error', [
                'event' => $eventType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return 200 to acknowledge receipt, we'll retry internally
            return response()->json([
                'success' => true,
                'message' => 'Webhook received, processing failed',
            ]);
        }
    }

    private function handleDepositConfirmed(array $payload): JsonResponse
    {
        $providerId = $payload['data']['id'] ?? null;
        $txId = $payload['data']['pix_tx_id'] ?? $payload['data']['txid'] ?? null;

        if ($providerId === null && $txId === null) {
            Log::warning('Deposit webhook missing identifier', ['payload' => $payload]);
            return response()->json(['success' => false, 'error' => 'Missing identifier'], 400);
        }

        // Find deposit by provider ID or TX ID
        $deposit = $providerId
            ? $this->depositRepository->findByProviderId($providerId)
            : $this->depositRepository->findByPixTxId($txId);

        if ($deposit === null) {
            Log::warning('Deposit not found for webhook', [
                'provider_id' => $providerId,
                'tx_id' => $txId,
            ]);
            return response()->json(['success' => false, 'error' => 'Deposit not found'], 404);
        }

        // Confirm the deposit
        $this->depositService->confirmDeposit($deposit->getId());

        Log::info('Deposit confirmed via webhook', [
            'deposit_id' => $deposit->getId(),
            'provider_id' => $providerId,
        ]);

        return response()->json(['success' => true]);
    }

    private function handleDepositExpired(array $payload): JsonResponse
    {
        $providerId = $payload['data']['id'] ?? null;
        $txId = $payload['data']['pix_tx_id'] ?? $payload['data']['txid'] ?? null;

        $deposit = $providerId
            ? $this->depositRepository->findByProviderId($providerId)
            : $this->depositRepository->findByPixTxId($txId);

        if ($deposit === null) {
            return response()->json(['success' => false, 'error' => 'Deposit not found'], 404);
        }

        if ($deposit->getStatus()->isFinal()) {
            return response()->json(['success' => true, 'message' => 'Already processed']);
        }

        // Mark deposit as expired (using confirmDeposit which checks provider status)
        $this->depositService->confirmDeposit($deposit->getId());

        Log::info('Deposit expired via webhook', ['deposit_id' => $deposit->getId()]);

        return response()->json(['success' => true]);
    }

    private function handleDepositFailed(array $payload): JsonResponse
    {
        $providerId = $payload['data']['id'] ?? null;
        $reason = $payload['data']['error_message'] ?? $payload['data']['reason'] ?? 'Unknown error';

        $deposit = $this->depositRepository->findByProviderId($providerId);

        if ($deposit === null) {
            return response()->json(['success' => false, 'error' => 'Deposit not found'], 404);
        }

        if ($deposit->getStatus()->isFinal()) {
            return response()->json(['success' => true, 'message' => 'Already processed']);
        }

        // Update deposit status
        $this->depositService->confirmDeposit($deposit->getId());

        Log::info('Deposit failed via webhook', [
            'deposit_id' => $deposit->getId(),
            'reason' => $reason,
        ]);

        return response()->json(['success' => true]);
    }

    private function handleWithdrawalCompleted(array $payload): JsonResponse
    {
        $providerId = $payload['data']['id'] ?? null;
        $endToEndId = $payload['data']['end_to_end_id'] ?? null;

        if ($providerId === null) {
            return response()->json(['success' => false, 'error' => 'Missing provider ID'], 400);
        }

        $withdrawal = $this->withdrawalRepository->findByProviderId($providerId);

        if ($withdrawal === null) {
            Log::warning('Withdrawal not found for webhook', ['provider_id' => $providerId]);
            return response()->json(['success' => false, 'error' => 'Withdrawal not found'], 404);
        }

        // Confirm the withdrawal
        $this->withdrawalService->confirmWithdrawal($withdrawal->getId());

        Log::info('Withdrawal completed via webhook', [
            'withdrawal_id' => $withdrawal->getId(),
            'end_to_end_id' => $endToEndId,
        ]);

        return response()->json(['success' => true]);
    }

    private function handleWithdrawalFailed(array $payload): JsonResponse
    {
        $providerId = $payload['data']['id'] ?? null;
        $reason = $payload['data']['error_message'] ?? $payload['data']['reason'] ?? 'Unknown error';

        $withdrawal = $this->withdrawalRepository->findByProviderId($providerId);

        if ($withdrawal === null) {
            return response()->json(['success' => false, 'error' => 'Withdrawal not found'], 404);
        }

        // Confirm (which will check status and fail the withdrawal)
        $this->withdrawalService->confirmWithdrawal($withdrawal->getId());

        Log::info('Withdrawal failed via webhook', [
            'withdrawal_id' => $withdrawal->getId(),
            'reason' => $reason,
        ]);

        return response()->json(['success' => true]);
    }

    private function handleUnknownEvent(?string $eventType, array $payload): JsonResponse
    {
        Log::info('Unknown webhook event received', [
            'event' => $eventType,
            'payload' => $payload,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Event not handled',
        ]);
    }
}
