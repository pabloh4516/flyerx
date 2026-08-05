<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalCompletedMail extends Mailable implements ShouldQueue
{
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 60;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public readonly string $grossAmount,
        public readonly string $netAmount,
        public readonly string $pixKey,
        public readonly string $pixKeyType,
        public readonly string $transactionId,
        public readonly string $processedAt,
        public readonly ?string $userName = null,
        public readonly ?string $feeAmount = null,
        public readonly ?string $recipientName = null,
        public readonly ?string $endToEndId = null,
        public readonly ?string $currentBalance = null,
        public readonly ?string $dashboardUrl = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Saque Realizado - R$ ' . $this->netAmount . ' - ' . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.withdrawal-completed',
            with: [
                'grossAmount' => $this->grossAmount,
                'netAmount' => $this->netAmount,
                'pixKey' => $this->pixKey,
                'pixKeyType' => $this->getPixKeyTypeLabel(),
                'transactionId' => $this->transactionId,
                'processedAt' => $this->processedAt,
                'userName' => $this->userName,
                'feeAmount' => $this->feeAmount ?? '0,00',
                'recipientName' => $this->recipientName,
                'endToEndId' => $this->endToEndId,
                'currentBalance' => $this->currentBalance,
                'dashboardUrl' => $this->dashboardUrl ?? config('app.frontend_url', config('app.url')),
                'title' => 'Saque Realizado',
                'preheader' => 'Seu saque de R$ ' . $this->netAmount . ' foi processado com sucesso!',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Get human-readable PIX key type label.
     */
    private function getPixKeyTypeLabel(): string
    {
        return match (strtolower($this->pixKeyType)) {
            'cpf' => 'CPF',
            'cnpj' => 'CNPJ',
            'email' => 'Email',
            'phone', 'telefone' => 'Telefone',
            'random', 'evp', 'aleatoria' => 'Chave Aleatoria',
            default => $this->pixKeyType,
        };
    }
}
