<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Domain\Wallet\Repositories\DepositRepositoryInterface;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\Services\LedgerService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly DepositRepositoryInterface $depositRepository,
        private readonly WithdrawalRepositoryInterface $withdrawalRepository,
        private readonly LedgerService $ledgerService,
    ) {}

    /**
     * Get user's wallet information.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $wallet = $this->walletRepository->findByUserId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($user->id)
        );

        if ($wallet === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                    'message' => 'Carteira não encontrada. Por favor, entre em contato com o suporte.',
                ],
            ], 404);
        }

        // Get balance from ledger
        $balance = $this->ledgerService->getWalletBalance($wallet->getId());

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $wallet->getId(),
                'status' => $wallet->getStatus()->value,
                'currency' => $wallet->getCurrency(),
                'balance' => $balance->getDecimal(),
                'formatted_balance' => $balance->getFormatted(),
                'limits' => [
                    'daily_withdrawal' => $wallet->getDailyWithdrawalLimit()->getDecimal(),
                    'monthly_withdrawal' => $wallet->getMonthlyWithdrawalLimit()->getDecimal(),
                ],
                'can_deposit' => $wallet->canDeposit(),
                'can_withdraw' => $wallet->canWithdraw(),
                'created_at' => $wallet->getCreatedAt()->format('c'),
            ],
        ]);
    }

    /**
     * Get wallet balance.
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        $wallet = $this->walletRepository->findByUserId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($user->id)
        );

        if ($wallet === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                    'message' => 'Carteira não encontrada.',
                ],
            ], 404);
        }

        $balance = $this->ledgerService->getWalletBalance($wallet->getId());

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $balance->getDecimal(),
                'formatted' => $balance->getFormatted(),
                'currency' => $wallet->getCurrency(),
            ],
        ]);
    }

    /**
     * Get wallet transaction history.
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $wallet = $this->walletRepository->findByUserId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($user->id)
        );

        if ($wallet === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_FOUND',
                    'message' => 'Carteira não encontrada.',
                ],
            ], 404);
        }

        // Get recent deposits and withdrawals
        $page = (int) $request->input('page', 1);
        $limit = min((int) $request->input('limit', 20), 100);
        $type = $request->input('type'); // 'deposit', 'withdrawal', or null for all

        $history = [];

        // For now, return a simplified history structure
        // In production, this would query from a dedicated history/transactions table

        if ($type !== 'withdrawal') {
            $pendingDeposits = $this->depositRepository->findPendingByWalletId(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($wallet->getId())
            );

            foreach ($pendingDeposits as $deposit) {
                $history[] = [
                    'id' => $deposit->getId(),
                    'type' => 'deposit',
                    'status' => $deposit->getStatus()->value,
                    'amount' => $deposit->getAmount()->getDecimal(),
                    'fee' => $deposit->getFeeAmount()->getDecimal(),
                    'net_amount' => $deposit->getNetAmount()->getDecimal(),
                    'created_at' => $deposit->getCreatedAt()->format('c'),
                ];
            }
        }

        if ($type !== 'deposit') {
            $pendingWithdrawals = $this->withdrawalRepository->findPendingByWalletId(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($wallet->getId())
            );

            foreach ($pendingWithdrawals as $withdrawal) {
                $history[] = [
                    'id' => $withdrawal->getId(),
                    'type' => 'withdrawal',
                    'status' => $withdrawal->getStatus()->value,
                    'amount' => $withdrawal->getAmount()->getDecimal(),
                    'fee' => $withdrawal->getFeeAmount()->getDecimal(),
                    'net_amount' => $withdrawal->getNetAmount()->getDecimal(),
                    'created_at' => $withdrawal->getCreatedAt()->format('c'),
                ];
            }
        }

        // Sort by created_at descending
        usort($history, fn ($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $history,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => count($history),
                ],
            ],
        ]);
    }
}
