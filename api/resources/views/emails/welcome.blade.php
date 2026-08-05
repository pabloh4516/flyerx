@extends('emails.layout')

@section('content')
    <!-- GREETING -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; padding-bottom: 20px;">
            Bem-vindo ao {{ config('app.name') }}!
        </td>
    </tr>

    <!-- MESSAGE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 20px;">
            Ola, {{ $userName }}!
        </td>
    </tr>
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 30px;">
            Estamos muito felizes em te-lo conosco! Sua conta foi criada com sucesso e agora voce tem acesso a todas as funcionalidades da plataforma {{ config('app.name') }}.
        </td>
    </tr>

    <!-- FEATURES LIST -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 20px;">
            <strong>Com sua conta voce pode:</strong>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #333333; line-height: 2; padding-left: 15px;">
                        &#10003; Realizar depositos via PIX de forma rapida e segura<br>
                        &#10003; Solicitar saques para qualquer chave PIX<br>
                        &#10003; Acompanhar seu historico de transacoes<br>
                        &#10003; Gerenciar sua carteira digital
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
                    <td align="center" bgcolor="#27ae60" style="border-radius: 6px;">
                        <a href="{{ $dashboardUrl ?? config('app.frontend_url', config('app.url')) }}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 15px 40px; display: inline-block; border-radius: 6px;">
                            Acessar Minha Conta
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- NEXT STEPS -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-bottom: 15px;">
            <strong>Proximos passos:</strong>
        </td>
    </tr>
    <tr>
        <td style="padding-bottom: 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; color: #666666; line-height: 1.8; padding-left: 15px;">
                        1. Complete seu perfil com seus dados<br>
                        2. Ative a verificacao em duas etapas para maior seguranca<br>
                        3. Faca seu primeiro deposito
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- SUPPORT -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6; padding: 15px; background-color: #f8f8f8; border-radius: 4px;">
            Precisa de ajuda? Nossa equipe de suporte esta disponivel para auxiliar voce. Entre em contato conosco atraves do chat na plataforma ou por email.
        </td>
    </tr>

    <!-- SIGNATURE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; line-height: 1.6; padding-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe {{ config('app.name') }}</strong>
        </td>
    </tr>
@endsection
