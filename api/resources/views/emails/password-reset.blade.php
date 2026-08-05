@extends('emails.layout')

@section('content')
    <!-- GREETING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; padding-bottom: 20px;">
            Redefinir sua senha
        </td>
    </tr>

    <!-- MESSAGE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 20px;">
            Ola{{ isset($userName) ? ', ' . $userName : '' }}!
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 30px;">
            Recebemos uma solicitacao para redefinir a senha da sua conta no {{ config('app.name') }}. Clique no botao abaixo para criar uma nova senha.
        </td>
    </tr>

    <!-- BUTTON -->
    <tr>
        <td align="center" style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" bgcolor="#e74c3c" style="border-radius: 6px;">
                        <a href="{{ $resetUrl }}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 15px 40px; display: inline-block; border-radius: 6px;">
                            Redefinir Senha
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- LINK FALLBACK -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6; padding-bottom: 20px;">
            Se o botao acima nao funcionar, copie e cole o link abaixo no seu navegador:
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Courier New', monospace; font-size: 12px; color: #1a1a2e; line-height: 1.6; padding: 15px; background-color: #f8f8f8; border-radius: 4px; word-break: break-all; margin-bottom: 20px;">
            {{ $resetUrl }}
        </td>
    </tr>

    <!-- EXPIRATION WARNING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #999999; line-height: 1.6; padding-top: 20px;">
            <strong>Importante:</strong> Este link expira em {{ $expirationHours ?? 1 }} hora(s).
        </td>
    </tr>

    <!-- SECURITY NOTE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #e74c3c; line-height: 1.6; padding-top: 15px; padding-bottom: 20px;">
            <strong>Atencao:</strong> Se voce nao solicitou a redefinicao de senha, ignore este email. Sua senha permanecera inalterada.
        </td>
    </tr>

    <!-- SECURITY INFO -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6; padding: 15px; background-color: #fff8e1; border-radius: 4px; border-left: 4px solid #ffc107;">
            <strong>Dica de seguranca:</strong> Nunca compartilhe este link com ninguem. Nossa equipe nunca solicitara sua senha por email ou telefone.
        </td>
    </tr>
@endsection
