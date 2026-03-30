import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização lazy: evita que o build quebre quando as variáveis ainda
// não estão disponíveis no servidor (ex: build na Vercel sem env vars)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Função auxiliar interna para ler variáveis do .env.local de forma robusta no servidor
function getEnvVar(name: string): string | undefined {
  // 1. Tenta o padrão do Node/Vercel
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  
  // Se o valor existe e não é um placeholder comum do nosso template, retornamos ele.
  if (value && value !== 'placeholder_admin_key' && !value.includes('placeholder')) {
    return value;
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
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith(name + '=')) {
            const val = trimmedLine.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
            if (val && !val.includes('placeholder')) return val;
          }
        }
      }
    } catch (e) {
      // Silencioso
    }
  }
  return value || undefined;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!url || !key || key.includes('placeholder')) {
       console.error("❌ SUPABASE_ANON_KEY NÃO CONFIGURADA OU INVÁLIDA NO NAVEGADOR");
    }

    _supabase = createBrowserClient(
      url || 'https://upgdrlotzruvbneodrqj.supabase.co', 
      key || ''
    );
  }
  return _supabase;
}

export function getSupabaseAdmin(forceRefresh = false): SupabaseClient {
  if (!_supabaseAdmin || forceRefresh) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    _supabaseAdmin = createClient(url, key || 'placeholder_admin_key', {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Diagnóstico simples no console do servidor (mascarado)
    if (typeof window === 'undefined') {
      console.log(`[SupabaseAdmin] Inicializado com key: ${key?.substring(0, 10)}... (Ref: ${forceRefresh ? 'FORCE' : 'LAZY'})`);
    }
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
