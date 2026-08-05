import { NextRequest, NextResponse } from 'next/server';

const PIX2DEPIX_BASE_URL = process.env.NEXT_PUBLIC_PIX2DEPIX_API_URL || 'https://depix.eulen.app/api';
const PIX2DEPIX_TOKEN = process.env.NEXT_PUBLIC_PIX2DEPIX_TOKEN || '';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const USE_BACKEND_LWK = process.env.NEXT_PUBLIC_USE_BACKEND_LWK === 'true';
const BACKEND_API_KEY = process.env.LWK_MICROSERVICE_API_KEY || 'flyerx-internal-api-key-dev-2024';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // Se USE_BACKEND_LWK=true, usar o backend Python (LWK)
    if (USE_BACKEND_LWK) {
      const response = await fetch(`${BACKEND_URL}/internal/withdrawals/${id}/status?user_id=user-frontend`, {
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
