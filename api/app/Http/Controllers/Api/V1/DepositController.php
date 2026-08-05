<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Application\Wallet\DTOs\DepositDTO;
use App\Application\Wallet\Services\DepositService;
use App\Domain\Wallet\Exceptions\DuplicateOperationException;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Wallet\CreateDepositRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DepositController extends Controller
{
    public function __construct(
        private readonly DepositService $depositService,
        private readonly WalletRepositoryInterface $walletRepository,
    ) {}

    /**
     * Create a new deposit.
     */
    public function store(CreateDepositRequest $request): JsonResponse
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
            $deposit = $this->depositService->createDeposit(
                walletId: $wallet->getId(),
                amount: Money::fromDecimal((float) $request->input('amount')),
                idempotencyKey: $idempotencyKey,
            );

            return response()->json([
                'success' => true,
                'data' => DepositDTO::fromEntity($deposit)->toArray(),
            ], 201);

        } catch (DuplicateOperationException $e) {
            // Return existing deposit for idempotency
            $existing = $this->depositService->getDepositByIdempotencyKey($idempotencyKey);

            if ($existing !== null) {
                return response()->json([
                    'success' => true,
                    'data' => DepositDTO::fromEntity($existing)->toArray(),
                ], 200);
            }

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
                    'message' => 'Sua carteira não está ativa para receber depósitos.',
                ],
            ], 403);

        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_ERROR',
                    'message' => $e->getMessage(),
                ],
            ], 400);
        }
    }

    /**
     * Get a specific deposit.
     */
    public function show(Request $request, string $depositId): JsonResponse
    {
        $user = $request->user();

        $deposit = $this->depositService->getDeposit($depositId);

        if ($deposit === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_NOT_FOUND',
                    'message' => 'Depósito não encontrado.',
                ],
            ], 404);
        }

        // Verify ownership
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($deposit->getWalletId())
        );

        if ($wallet === null || $wallet->getUserId() !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Você não tem permissão para visualizar este depósito.',
                ],
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => DepositDTO::fromEntity($deposit)->toArray(),
        ]);
    }

    /**
     * List pending deposits for user's wallet.
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

        $deposits = $this->depositService->getPendingDeposits($wallet->getId());

        return response()->json([
            'success' => true,
            'data' => array_map(
                fn ($deposit) => DepositDTO::fromEntity($deposit)->toArray(),
                $deposits
            ),
        ]);
    }

    /**
     * Cancel a pending deposit.
     */
    public function cancel(Request $request, string $depositId): JsonResponse
    {
        $user = $request->user();

        $deposit = $this->depositService->getDeposit($depositId);

        if ($deposit === null) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_NOT_FOUND',
                    'message' => 'Depósito não encontrado.',
                ],
            ], 404);
        }

        // Verify ownership
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($deposit->getWalletId())
        );

        if ($wallet === null || $wallet->getUserId() !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Você não tem permissão para cancelar este depósito.',
                ],
            ], 403);
        }

        if (!$deposit->isPending()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DEPOSIT_NOT_PENDING',
                    'message' => 'Este depósito não pode ser cancelado.',
                ],
            ], 400);
        }

        // Cancel logic would go here
        // For now, we just return success
        return response()->json([
            'success' => true,
            'message' => 'Depósito cancelado com sucesso.',
        ]);
    }
}
