<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DepositConfirmedMail extends Mailable implements ShouldQueue
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
        public readonly string $amount,
        public readonly string $transactionId,
        public readonly string $processedAt,
        public readonly ?string $userName = null,
        public readonly ?string $feeAmount = null,
        public readonly ?string $netAmount = null,
        public readonly ?string $currentBalance = null,
        public readonly ?string $dashboardUrl = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Deposito Confirmado - R$ ' . $this->amount . ' - ' . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.deposit-confirmed',
            with: [
                'amount' => $this->amount,
                'transactionId' => $this->transactionId,
                'processedAt' => $this->processedAt,
                'userName' => $this->userName,
                'feeAmount' => $this->feeAmount ?? '0,00',
                'netAmount' => $this->netAmount ?? $this->amount,
                'currentBalance' => $this->currentBalance,
                'dashboardUrl' => $this->dashboardUrl ?? config('app.frontend_url', config('app.url')),
                'title' => 'Deposito Confirmado',
                'preheader' => 'Seu deposito de R$ ' . $this->amount . ' foi confirmado com sucesso!',
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
}
