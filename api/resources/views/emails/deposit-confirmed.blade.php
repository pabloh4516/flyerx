@extends('emails.layout')

@section('content')
    <!-- SUCCESS ICON -->
    <tr>
        <td align="center" style="padding-bottom: 20px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" style="width: 60px; height: 60px; background-color: #27ae60; border-radius: 50%;">
                        <span style="font-size: 30px; color: #ffffff;">&#10003;</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- GREETING -->
    <tr>
        <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #27ae60; padding-bottom: 20px;">
            Deposito Confirmado!
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
            Seu deposito via PIX foi processado com sucesso e o valor ja esta disponivel em sua carteira.
        </td>
    </tr>

    <!-- TRANSACTION DETAILS -->
    <tr>
        <td style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f8f8; border-radius: 8px;">
                <tr>
                    <td style="padding: 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px;">
                                    Valor depositado:
                                </td>
                                <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 700; color: #27ae60; padding-bottom: 10px;">
                                    R$ {{ $amount }}
                                </td>
                            </tr>
                            @if(isset($feeAmount) && $feeAmount !== '0,00')
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px;">
                                    Taxa:
                                </td>
                                <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #e74c3c; padding-bottom: 10px;">
                                    - R$ {{ $feeAmount }}
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                                    Valor creditado:
                                </td>
                                <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 700; color: #1a1a2e; padding-bottom: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                                    R$ {{ $netAmount }}
                                </td>
                            </tr>
                            @endif
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; padding-bottom: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                                    ID da transacao:
                                </td>
                                <td align="right" style="font-family: 'Courier New', monospace; font-size: 12px; color: #1a1a2e; padding-bottom: 10px; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                                    {{ $transactionId }}
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666;">
                                    Data e hora:
                                </td>
                                <td align="right" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #1a1a2e;">
                                    {{ $processedAt }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- CURRENT BALANCE -->
    @isset($currentBalance)
    <tr>
        <td align="center" style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; border-radius: 8px;">
                <tr>
                    <td style="padding: 15px 30px;">
                        <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">
                                    Saldo atual
                                </td>
                            </tr>
                            <tr>
                                <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #ffffff;">
                                    R$ {{ $currentBalance }}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
    @endisset

    <!-- BUTTON -->
    <tr>
        <td align="center" style="padding-bottom: 30px;">
            <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="center" bgcolor="#1a1a2e" style="border-radius: 6px;">
                        <a href="{{ $dashboardUrl ?? config('app.frontend_url', config('app.url')) }}" target="_blank" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 15px 40px; display: inline-block; border-radius: 6px;">
                            Ver Minha Carteira
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- NOTE -->
    <tr>
        <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #666666; line-height: 1.6;">
            Guarde este email como comprovante da sua transacao.
        </td>
    </tr>
@endsection
