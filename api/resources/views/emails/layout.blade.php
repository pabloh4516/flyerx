<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>{{ $title ?? config('app.name') }}</title>
    <style>
        /* Reset */
        body, table, td, a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
        }

        /* Remove default styles */
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        table {
            border-collapse: collapse !important;
        }
        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width: 600px) {
            .responsive-table {
                width: 100% !important;
            }
            .mobile-padding {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
        }
    </style>
</head>
<body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">

    <!-- HIDDEN PREHEADER TEXT -->
    @isset($preheader)
    <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        {{ $preheader }}
    </div>
    @endisset

    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <!-- HEADER -->
        <tr>
            <td bgcolor="#1a1a2e" align="center" style="padding: 30px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
                            <h1 style="font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 2px;">
                                {{ config('app.name', 'Flyerx') }}
                            </h1>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- MAIN CONTENT -->
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 20px 10px 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;" class="responsive-table">
                    <!-- CONTENT BOX -->
                    <tr>
                        <td bgcolor="#ffffff" align="left" style="padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                @yield('content')
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- FOOTER -->
        <tr>
            <td bgcolor="#f4f4f4" align="center" style="padding: 0 10px 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <!-- DIVIDER -->
                    <tr>
                        <td align="center" style="padding: 0 0 20px 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="border-bottom: 1px solid #e0e0e0;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- FOOTER TEXT -->
                    <tr>
                        <td align="center" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #666666; line-height: 1.6;">
                            <p style="margin: 0 0 10px 0;">
                                &copy; {{ date('Y') }} {{ config('app.name', 'Flyerx') }}. Todos os direitos reservados.
                            </p>
                            <p style="margin: 0 0 10px 0;">
                                Este email foi enviado automaticamente. Por favor, nao responda.
                            </p>
                            @isset($supportEmail)
                            <p style="margin: 0;">
                                Duvidas? Entre em contato: <a href="mailto:{{ $supportEmail }}" style="color: #1a1a2e; text-decoration: underline;">{{ $supportEmail }}</a>
                            </p>
                            @endisset
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>
