import { NextRequest, NextResponse } from 'next/server';

const PIX2DEPIX_BASE_URL = process.env.NEXT_PUBLIC_PIX2DEPIX_API_URL || 'https://depix.eulen.app/api';
const PIX2DEPIX_TOKEN = process.env.NEXT_PUBLIC_PIX2DEPIX_TOKEN || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const USE_BACKEND_LWK = process.env.NEXT_PUBLIC_USE_BACKEND_LWK === 'true';
const BACKEND_API_KEY = process.env.LWK_MICROSERVICE_API_KEY || 'flyerx-internal-api-key-dev-2024';

// Detectar tipo de chave PIX
function detectPixKeyType(pixKey: string): string {
  const cleanKey = pixKey.replace(/\D/g, '');

  if (/^\d{11}$/.test(cleanKey)) {
    // 11 dígitos pode ser CPF ou telefone
    // Se começar com código de área válido (11-99), é telefone
    const ddd = parseInt(cleanKey.substring(0, 2));
    if (ddd >= 11 && ddd <= 99) {
      return 'PHONE';
    }
    return 'CPF';
  }
  if (/^\d{14}$/.test(cleanKey)) return 'CNPJ';
  if (/@/.test(pixKey)) return 'EMAIL';
  if (/^[a-f0-9-]{32,36}$/i.test(pixKey)) return 'RANDOM';

  // Se começar com +55, é telefone
  if (pixKey.startsWith('+55')) return 'PHONE';

  return 'RANDOM';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Se USE_BACKEND_LWK=true, usar o backend Python (LWK)
    if (USE_BACKEND_LWK) {
      // Converter formato da requisição
      const pixKeyType = detectPixKeyType(body.pixKey);
      const amountCents = body.payoutAmountInCents || body.depositAmountInCents || 0;

      const backendBody = {
        user_id: 'user-frontend', // TODO: pegar do usuário logado
        pix_key: body.pixKey,
        pix_key_type: pixKeyType,
        beneficiary_tax_number: (body.taxNumber || '').replace(/\D/g, ''),
        amount_cents: amountCents,
      };

      const response = await fetch(`${BACKEND_URL}/internal/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY,
        },
        body: JSON.stringify(backendBody),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.detail || 'Erro ao criar saque' },
          { status: response.status }
        );
      }

      // Converter resposta do backend para formato esperado pelo frontend
      return NextResponse.json({
        withdrawalId: data.id,
        depositAddress: data.flyerx_address,
        depositAmountInCents: Math.round(data.breakdown.total_depix * 100),
        payoutAmountInCents: Math.round(data.breakdown.requested_amount * 100),
      });
    }

    // Fallback: chamar Eulen diretamente
    const response = await fetch(`${PIX2DEPIX_BASE_URL}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PIX2DEPIX_TOKEN && { Authorization: `Bearer ${PIX2DEPIX_TOKEN}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.response?.errorMessage || data.errorMessage || 'Erro ao criar saque' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.response || data);
  } catch (error) {
    console.error('Erro ao chamar API:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar saque' },
      { status: 500 }
    );
  }
}
