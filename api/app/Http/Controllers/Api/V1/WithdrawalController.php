<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Wallet\DTOs\WithdrawalDTO;
use App\Application\Wallet\Services\WithdrawalService;
use App\Domain\Wallet\Enums\PixKeyType;
use App\Domain\Wallet\Exceptions\DuplicateOperationException;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Wallet\CreateWithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WithdrawalController extends Controller
{
    public function __construct(
        private readonly WithdrawalService $withdrawalService,
        private readonly WalletRepositoryInterface $walletRepository,
    ) {}

    /**
     * Create a new withdrawal.
     */
    public function store(CreateWithdrawalRequest $request): JsonResponse
    {
        $user = $request->user();

        // Get user's wallet
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

        // Generate idempotency key if not provided
        $idempotencyKey = $request->header('X-Idempotency-Key') ?? Str::uuid()->toString();

        try {
            $pixKey = new PixKey(
                PixKeyType::from($request->input('pix_key_type')),
                $request->input('pix_key')
            );

            $withdrawal = $this->withdrawalService->createWithdrawal(
                walletId: $wallet->getId(),
                amount: Money::fromDecimal((float) $request->input('amount')),
                pixKey: $pixKey,
                idempotencyKey: $idempotencyKey,
                recipientName: $request->input('recipient_name'),
                recipientDocument: $request->input('recipient_document'),
            );

            return response()->json([
                'success' => true,
                'data' => WithdrawalDTO::fromEntity($withdrawal)->toArray(),
            ], 201);

        } catch (DuplicateOperationException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DUPLICATE_OPERATION',
                    'message' => 'Esta operação já foi processada.',
                ],
            ], 409);

        } catch (WalletNotActiveException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WALLET_NOT_ACTIVE',
                    'message' => 'Sua carteira não está ativa para realizar saques.',
                ],
            ], 403);

        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WITHDRAWAL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 400);
        }
    }

    /**
     * Get a specific withdrawal.
     */
    public function show(Request $request, string $withdrawalId): JsonResponse
    {
        $user = $request->user();

        $withdrawal = $this->withdrawalService->getWithdrawal($withdrawalId);

        if ($withdrawal === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WITHDRAWAL_NOT_FOUND',
                    'message' => 'Saque não encontrado.',
                ],
            ], 404);
        }

        // Verify ownership
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawal->getWalletId())
        );

        if ($wallet === null || $wallet->getUserId() !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Você não tem permissão para visualizar este saque.',
                ],
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => WithdrawalDTO::fromEntity($withdrawal)->toArray(),
        ]);
    }

    /**
     * List pending withdrawals for user's wallet.
     */
    public function pending(Request $request): JsonResponse
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

        $withdrawals = $this->withdrawalService->getPendingWithdrawals($wallet->getId());

        return response()->json([
            'success' => true,
            'data' => array_map(
                fn ($withdrawal) => WithdrawalDTO::fromEntity($withdrawal)->toArray(),
                $withdrawals
            ),
        ]);
    }

    /**
     * Cancel a pending withdrawal.
     */
    public function cancel(Request $request, string $withdrawalId): JsonResponse
    {
        $user = $request->user();

        $withdrawal = $this->withdrawalService->getWithdrawal($withdrawalId);

        if ($withdrawal === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WITHDRAWAL_NOT_FOUND',
                    'message' => 'Saque não encontrado.',
                ],
            ], 404);
        }

        // Verify ownership
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawal->getWalletId())
        );

        if ($wallet === null || $wallet->getUserId() !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Você não tem permissão para cancelar este saque.',
                ],
            ], 403);
        }

        try {
            $this->withdrawalService->cancelWithdrawal($withdrawalId);

            return response()->json([
                'success' => true,
                'message' => 'Saque cancelado com sucesso.',
            ]);

        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CANCEL_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 400);
        }
    }

    /**
     * Estimate fee for withdrawal.
     */
    public function estimateFee(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        $amount = Money::fromDecimal((float) $request->input('amount'));

        // Get user's KYC level (simplified)
        $kycLevel = 1; // TODO: Get from user entity

        $feeService = app(\App\Application\Wallet\Services\FeeService::class);
        $fee = $feeService->calculateWithdrawalFee($amount, $kycLevel);

        return response()->json([
            'success' => true,
            'data' => [
                'amount' => $amount->getDecimal(),
                'fee' => $fee->getDecimal(),
                'net_amount' => $amount->subtract($fee)->getDecimal(),
                'currency' => 'BRL',
            ],
        ]);
    }
}
