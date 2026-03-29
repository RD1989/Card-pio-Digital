import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { api_key } = await request.json();

    if (!api_key) {
      return NextResponse.json(
        { status: 'error', message: 'A chave API (api_key) não foi fornecida.' },
        { status: 400 }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          status: 'error',
          message: data.error?.message || 'Chave API inválida, revogada ou com erro de conexão.',
        },
        { status: 401 }
      );
    }

    const keyData = data.data || {};

    return NextResponse.json({
      status: 'ok',
      message: 'Conexão autenticada com sucesso! A chave está ativa.',
      label: keyData.label || 'Chave da API',
      usage: typeof keyData.usage === 'number' ? keyData.usage : 0,
      limit: keyData.limit || null,
    });
    
  } catch (error: any) {
    console.error('Erro na API Route de Teste AI:', error);
    return NextResponse.json(
      { status: 'error', message: 'Falha de comunicação interna com a OpenRouter.' },
      { status: 500 }
    );
  }
}
