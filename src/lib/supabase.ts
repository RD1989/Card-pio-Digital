import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de cache para os instâncias
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Função auxiliar interna para ler variáveis do .env.local de forma robusta no servidor.
 * Prioriza process.env, mas lê o arquivo se necessário (ex: em tempo de build ou cache estático).
 */
function getEnvVar(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[name]) {
    const v = process.env[name];
    if (v && !v.includes('placeholder')) return v;
  }

  // Fallback: Leitura direta de arquivo no servidor (ignorado no browser)
  if (typeof window === 'undefined') {
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
      // Silencioso para não quebrar o build
    }
  }
  return undefined;
}

/**
 * Inicializa o cliente público (Browser/Client Components).
 * Retorna um objeto Supabase válido ou um placeholder seguro para o build.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Se estivermos em build e sem chaves, não chamamos o criador oficial para não dar throw
    if (!key || key.includes('placeholder')) {
      if (typeof window === 'undefined') {
        console.warn("[Supabase] Aviso: Chave Anon ausente. Usando placeholder seguro para build.");
      }
      // Retornamos um mock parcial para evitar crash de inicialização no build
      return { auth: {}, from: () => ({}) } as any; 
    }

    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

/**
 * Inicializa o cliente administrativo (Server Components/API Routes).
 * Retorna um objeto Supabase válido ou um placeholder seguro para o build.
 */
export function getSupabaseAdmin(forceRefresh = false): SupabaseClient {
  if (!_supabaseAdmin || forceRefresh) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (!key || key.includes('placeholder')) {
      if (typeof window === 'undefined') {
         console.warn("[SupabaseAdmin] Aviso: Chave Admin ausente/placeholder. Mocking para build.");
      }
      return { auth: { admin: {} }, from: () => ({}) } as any;
    }

    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

/**
 * EXPORTAÇÕES LAZY (PROXIES): 
 * Garante que o Supabase só seja instanciado no momento do uso real.
 * Isso resolve o erro de "API key is required" durante o `next build`.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    // Evita loop no console e ferramentas de inspeção
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    const client = getSupabase();
    return (client as any)[prop];
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    const client = getSupabaseAdmin();
    return (client as any)[prop];
  }
});
