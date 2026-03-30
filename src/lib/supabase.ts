import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização lazy: evita que o build quebre quando as variáveis ainda
// não estão disponíveis no servidor (ex: build na Vercel sem env vars)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Função auxiliar interna para ler variáveis do .env.local de forma robusta no servidor
function getEnvVar(name: string): string | undefined {
  // 1. Tenta o padrão do Node/Vercel
  if (typeof process !== 'undefined' && process.env[name]) {
    return process.env[name];
  }

  // 2. Fallback: Leitura direta do arquivo no servidor (ignorado no browser)
  if (typeof process !== 'undefined' && typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const [key, ...valueParts] = line.split('=');
          if (key?.trim() === name) {
            return valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      }
    } catch (e) {
      // Silencioso: Fallback falhou ou fs não disponível (ex: Edge Runtime limitado)
    }
  }
  return undefined;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!url || !key) {
      console.error(
        "❌ CONFIGURAÇÃO DO SUPABASE AUSENTE:\n" +
        "Certifique-se de configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }

    _supabase = createBrowserClient(
      url || 'https://placeholder.supabase.co', 
      key || 'placeholder_anon_key'
    );
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'placeholder_admin_key';
    
    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Aliases de conveniência para componentes Client-Side (browser)
// Esses só funcionam com NEXT_PUBLIC_ vars, disponíveis no cliente
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    return (getSupabase() as any)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    return (getSupabaseAdmin() as any)[prop];
  },
});
