import { NextRequest, NextResponse } from 'next/server';

// Variáveis server-side (sem NEXT_PUBLIC_ = não expostas no browser)
const PIX2DEPIX_BASE_URL = process.env.EULEN_API_URL || 'https://depix.eulen.app/api';
const PIX2DEPIX_TOKEN = process.env.EULEN_API_TOKEN || '';
const BACKEND_URL = process.env.LWK_SERVICE_URL || 'http://localhost:8000';
const USE_BACKEND_LWK = process.env.USE_BACKEND_LWK === 'true';
const BACKEND_API_KEY = process.env.INTERNAL_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isDirect = searchParams.get('direct') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // Se direct=true (usuário direto) OU USE_BACKEND_LWK=false, usar Eulen diretamente
    // Caso contrário, usar o backend Python (LWK)
    if (USE_BACKEND_LWK && !isDirect) {
      const response = await fetch(`${BACKEND_URL}/internal/withdrawals/${id}/status?user_id=anonymous`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BACKEND_API_KEY,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.detail || 'Erro ao consultar status' },
          { status: response.status }
        );
      }

      // Converter resposta do backend para formato esperado pelo frontend
      return NextResponse.json({
        id: data.id,
        status: data.status,
        depositAmountInCents: Math.round(data.breakdown.total_depix * 100),
        payoutAmountInCents: Math.round(data.breakdown.requested_amount * 100),
        receiptUrl: data.receipt_url,
      });
    }

    // Fallback: chamar Eulen diretamente
    const response = await fetch(`${PIX2DEPIX_BASE_URL}/withdraw-status?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(PIX2DEPIX_TOKEN && { Authorization: `Bearer ${PIX2DEPIX_TOKEN}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.response?.errorMessage || data.errorMessage || 'Erro ao consultar status' },
        { status: response.status }
      );
    }

    return NextResponse.json(data.response || data);
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar status' },
      { status: 500 }
    );
  }
}
