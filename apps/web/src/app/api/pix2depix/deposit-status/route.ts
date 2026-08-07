import { NextRequest, NextResponse } from 'next/server';

// Variáveis server-side (sem NEXT_PUBLIC_ = não expostas no browser)
const PIX2DEPIX_BASE_URL = process.env.EULEN_API_URL || 'https://depix.eulen.app/api';
const PIX2DEPIX_TOKEN = process.env.EULEN_API_TOKEN || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const response = await fetch(`${PIX2DEPIX_BASE_URL}/deposit-status?id=${id}`, {
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
