<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewDeviceDetectedMail extends Mailable implements ShouldQueue
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
        public readonly string $userName,
        public readonly string $deviceType,
        public readonly string $browserName,
        public readonly string $osName,
        public readonly string $ipAddress,
        public readonly string $loginTime,
        public readonly ?string $securityUrl = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Novo dispositivo detectado - ' . config('app.name'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.new-device-detected',
            with: [
                'userName' => $this->userName,
                'deviceType' => $this->formatDeviceType($this->deviceType),
                'browserName' => $this->browserName,
                'osName' => $this->osName,
                'ipAddress' => $this->ipAddress,
                'loginTime' => $this->loginTime,
                'securityUrl' => $this->securityUrl ?? config('app.frontend_url', config('app.url')) . '/settings/security',
                'title' => 'Novo Dispositivo Detectado',
                'preheader' => 'Um novo dispositivo acessou sua conta no ' . config('app.name'),
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
     * Format device type to Portuguese.
     */
    private function formatDeviceType(string $deviceType): string
    {
        return match (strtolower($deviceType)) {
            'mobile' => 'Celular',
            'tablet' => 'Tablet',
            'desktop' => 'Computador',
            default => 'Dispositivo',
        };
    }
}
