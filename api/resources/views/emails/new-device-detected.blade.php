@extends('emails.layout')

@section('content')
    <!-- WARNING ICON -->
    <tr>
        <td align="center" style="padding-bottom: 20px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="width: 60px; height: 60px; background-color: #fff3cd; border-radius: 50%;">
                        <span style="font-size: 28px; line-height: 60px;">&#9888;</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- GREETING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; padding-bottom: 20px; text-align: center;">
            Novo dispositivo detectado
        </td>
    </tr>

    <!-- MESSAGE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 20px;">
            Ola, {{ $userName }}!
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 25px;">
            Detectamos um acesso a sua conta a partir de um novo dispositivo. Se foi voce, pode ignorar este email com seguranca.
        </td>
    </tr>

    <!-- DEVICE INFO BOX -->
    <tr>
        <td style="padding-bottom: 25px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #ffc107;">
                <tr>
                    <td style="padding: 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #666666; padding-bottom: 15px;">
                                    DETALHES DO ACESSO
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #333333; line-height: 2;">
                                    <strong>Tipo de dispositivo:</strong> {{ $deviceType }}<br>
                                    <strong>Navegador:</strong> {{ $browserName }}<br>
                                    <strong>Sistema operacional:</strong> {{ $osName }}<br>
                                    <strong>Endereco IP:</strong> {{ $ipAddress }}<br>
                                    <strong>Data e hora:</strong> {{ $loginTime }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- WARNING MESSAGE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 25px;">
            <strong>Nao reconhece este acesso?</strong> Recomendamos que voce tome as seguintes medidas imediatamente:
        </td>
    </tr>

    <!-- SECURITY STEPS -->
    <tr>
        <td style="padding-bottom: 25px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #333333; line-height: 2; padding-left: 15px;">
                        1. Altere sua senha imediatamente<br>
                        2. Revise os dispositivos conectados a sua conta<br>
                        3. Ative a verificacao em duas etapas se ainda nao ativou<br>
                        4. Entre em contato com nosso suporte se precisar de ajuda
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- BUTTON -->
    <tr>
        <td align="center" style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" bgcolor="#dc3545" style="border-radius: 6px;">
                        <a href="{{ $securityUrl }}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 15px 40px; display: inline-block; border-radius: 6px;">
                            Revisar Seguranca da Conta
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- FOOTER NOTE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6; padding: 15px; background-color: #f8f8f8; border-radius: 4px;">
            Este email foi enviado automaticamente para manter a seguranca da sua conta. Voce esta recebendo porque houve um acesso de um novo dispositivo.
        </td>
    </tr>

    <!-- SIGNATURE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe de Seguranca {{ config('app.name') }}</strong>
        </td>
    </tr>
@endsection
