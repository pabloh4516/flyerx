<?php

declare(strict_types=1);

namespace App\Application\Wallet\Services;

use App\Domain\Payment\Contracts\PaymentProviderInterface;
use App\Domain\Payment\DTOs\CreateWithdrawalRequest;
use App\Domain\Wallet\Entities\Withdrawal;
use App\Domain\Wallet\Exceptions\DuplicateOperationException;
use App\Domain\Wallet\Exceptions\WalletNotActiveException;
use App\Domain\Wallet\Repositories\WalletRepositoryInterface;
use App\Domain\Wallet\Repositories\WithdrawalRepositoryInterface;
use App\Domain\Wallet\ValueObjects\Money;
use App\Domain\Wallet\ValueObjects\PixKey;
use App\Infrastructure\Payment\PaymentProviderFactory;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

/**
 * Serviço de Saques - Modelo Non-Custodial
 *
 * Fluxo Eulen (DePix → PIX):
 * 1. Usuário solicita saque → Eulen retorna depositAddress (endereço Liquid)
 * 2. Usuário envia DePix da sua carteira Liquid para esse endereço
 * 3. Eulen detecta o DePix e envia PIX para a chave PIX informada
 *
 * NÃO há verificação de saldo - o usuário tem DePix na carteira Liquid dele.
 */
class WithdrawalService
{
    public function __construct(
        private readonly WalletRepositoryInterface $walletRepository,
        private readonly WithdrawalRepositoryInterface $withdrawalRepository,
        private readonly FeeService $feeService,
        private readonly Dispatcher $eventDispatcher,
        private readonly PaymentProviderInterface $paymentProvider,
    ) {}

    /**
     * Criar solicitação de saque.
     *
     * Chama a Eulen e retorna o endereço Liquid para o usuário enviar DePix.
     */
    public function createWithdrawal(
        string $walletId,
        Money $amount,
        PixKey $pixKey,
        string $idempotencyKey,
        ?string $recipientName = null,
        ?string $recipientDocument = null
    ): Withdrawal {
        // Check for duplicate
        $existing = $this->withdrawalRepository->findByIdempotencyKey($idempotencyKey);
        if ($existing !== null) {
            throw new DuplicateOperationException($idempotencyKey);
        }

        // Validate wallet exists
        $wallet = $this->walletRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($walletId)
        );

        if ($wallet === null) {
            throw new \DomainException('Wallet not found');
        }

        if (!$wallet->canWithdraw()) {
            throw new WalletNotActiveException('Wallet cannot process withdrawals');
        }

        // Calcular taxa da Eulen (informativo - a Eulen desconta automaticamente)
        $fee = $this->feeService->calculateWithdrawalFee($amount);

        // Chamar Eulen para criar o saque e obter o endereço de depósito
        $response = $this->paymentProvider->createWithdrawal(new CreateWithdrawalRequest(
            pixKey: $pixKey->getValue(),
            taxNumber: $recipientDocument,
            payoutAmountInCents: (int) ($amount->getDecimal() * 100),
            idempotencyKey: $idempotencyKey,
        ));

        if (!$response->success) {
            throw new \DomainException($response->errorMessage ?? 'Failed to create withdrawal');
        }

        // Criar entidade de saque com dados da Eulen
        $withdrawal = Withdrawal::create(
            id: $this->withdrawalRepository->nextIdentity()->toString(),
            walletId: $walletId,
            amount: $amount,
            feeAmount: $fee,
            pixKey: $pixKey,
            idempotencyKey: $idempotencyKey,
        );

        if ($recipientName !== null) {
            $withdrawal->setRecipientInfo($recipientName, $recipientDocument);
        }

        // Salvar dados do provider (depositAddress, etc)
        $withdrawal->setProviderData(
            $response->providerId,
            'pending', // Aguardando usuário enviar DePix
            null,
            [
                'depositAddress' => $response->depositAddress,
                'depositAmountInCents' => $response->depositAmountInCents,
                'payoutAmountInCents' => $response->payoutAmountInCents,
                'rawResponse' => $response->rawResponse,
            ]
        );

        $this->withdrawalRepository->save($withdrawal);

        // Dispatch events
        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $withdrawal;
    }

    /**
     * Confirmar saque (chamado pelo webhook da Eulen).
     *
     * A Eulen chama o webhook quando:
     * - DePix é recebido no depositAddress
     * - PIX é enviado para a chave PIX
     */
    public function confirmWithdrawal(string $withdrawalId): void
    {
        DB::transaction(function () use ($withdrawalId) {
            $withdrawal = $this->withdrawalRepository->findById(
                \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
            );

            if ($withdrawal === null) {
                throw new \DomainException('Withdrawal not found');
            }

            if ($withdrawal->getStatus()->isFinal()) {
                return;
            }

            // Check status with provider
            $provider = $this->paymentProvider;
            $status = $provider->getWithdrawalStatus($withdrawal->getProviderId());

            if (!$status->success) {
                throw new \DomainException('Failed to get withdrawal status');
            }

            // Update provider data
            $withdrawal->setProviderData(
                $withdrawal->getProviderId(),
                $status->status,
                $status->endToEndId ?? $withdrawal->getEndToEndId(),
                $status->rawResponse
            );

            if ($status->isCompleted()) {
                $transactionId = \Illuminate\Support\Str::uuid()->toString();
                $withdrawal->complete($transactionId);
            } elseif ($status->isFailed()) {
                $withdrawal->fail($status->errorMessage ?? 'Withdrawal failed');
            }

            $this->withdrawalRepository->update($withdrawal);

            foreach ($withdrawal->pullDomainEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }
        });
    }

    /**
     * Confirmar saque pelo provider ID (usado pelo webhook).
     */
    public function confirmWithdrawalByProviderId(string $providerId, string $status, ?string $endToEndId = null): void
    {
        $withdrawal = $this->withdrawalRepository->findByProviderId($providerId);

        if ($withdrawal === null) {
            throw new \DomainException("Withdrawal not found for provider ID: {$providerId}");
        }

        if ($withdrawal->getStatus()->isFinal()) {
            return;
        }

        $withdrawal->setProviderData(
            $providerId,
            $status,
            $endToEndId,
            null
        );

        if (in_array($status, ['sent', 'completed'])) {
            $transactionId = \Illuminate\Support\Str::uuid()->toString();
            $withdrawal->complete($transactionId);
        } elseif (in_array($status, ['failed', 'error', 'refunded'])) {
            $withdrawal->fail("Withdrawal {$status}");
        }

        $this->withdrawalRepository->update($withdrawal);

        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }
    }

    /**
     * Cancelar saque pendente.
     */
    public function cancelWithdrawal(string $withdrawalId): void
    {
        $withdrawal = $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );

        if ($withdrawal === null) {
            throw new \DomainException('Withdrawal not found');
        }

        if (!$withdrawal->canBeCancelled()) {
            throw new \DomainException('Withdrawal cannot be cancelled');
        }

        $withdrawal->cancel();
        $this->withdrawalRepository->update($withdrawal);

        foreach ($withdrawal->pullDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }
    }

    /**
     * Obter saque por ID.
     */
    public function getWithdrawal(string $withdrawalId): ?Withdrawal
    {
        return $this->withdrawalRepository->findById(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($withdrawalId)
        );
    }

    /**
     * Obter saques pendentes de uma carteira.
     */
    public function getPendingWithdrawals(string $walletId): array
    {
        return $this->withdrawalRepository->findPendingByWalletId(
            \App\Domain\Shared\ValueObjects\Uuid::fromString($walletId)
        );
    }
}
