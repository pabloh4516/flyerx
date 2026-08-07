import { NextRequest, NextResponse } from 'next/server';

// Variáveis server-side (sem NEXT_PUBLIC_ = não expostas no browser)
const PIX2DEPIX_BASE_URL = process.env.EULEN_API_URL || 'https://depix.eulen.app/api';
const PIX2DEPIX_TOKEN = process.env.EULEN_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PIX2DEPIX_BASE_URL}/deposit`, {
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
        { error: data.response?.errorMessage || data.errorMessage || 'Erro ao criar depósito' },
        { status: response.status }
      );
    }

    // A API retorna { response: { id, qrCopyPaste, qrImageUrl }, async: false }
    return NextResponse.json(data.response || data);
  } catch (error) {
    console.error('Erro ao chamar API Pix2Depix:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar depósito' },
      { status: 500 }
    );
  }
}
