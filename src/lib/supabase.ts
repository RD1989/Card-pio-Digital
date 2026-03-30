import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache para instâncias
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Função recursiva para criar um mock indestrutível que permite encadeamento infinito.
 * Resolve o erro de "unhandled property" durante a renderização no servidor.
 */
function createRecursiveMock(): any {
  const mock: any = new Proxy(() => mock, {
    get: (target, prop) => {
      if (prop === 'then') return (cb: any) => cb({ data: null, error: null });
      if (prop === 'catch') return () => mock;
      if (prop === 'finally') return (cb: any) => cb();
      if (typeof prop === 'symbol') return undefined;
      return mock;
    },
    apply: () => mock
  });
  return mock;
}

/**
 * Lê variáveis de ambiente do process.env (modo padrão Next.js).
 * Removemos o uso de 'fs' para evitar erros de runtime na Vercel.
 */
function getEnv(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[name]) {
    const v = process.env[name];
    if (v && !v.includes('placeholder')) return v;
  }
  return undefined;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Se chaves ausentes (ex: build ou deploy incompleto), prevent crash via mock
    if (!key) {
      if (typeof window === 'undefined') {
        console.warn("[Supabase] ⚠️ Chave ausente. Usando mock recursivo para estabilidade.");
      }
      return createRecursiveMock();
    }

    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

export function getSupabaseAdmin(forceRefresh = false): SupabaseClient {
  if (!_supabaseAdmin || forceRefresh) {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (!key) {
      if (typeof window === 'undefined') {
        console.warn("[SupabaseAdmin] ⚠️ Chave admin ausente. Usando mock.");
      }
      return createRecursiveMock();
    }

    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Proxies estáveis: preservam o objeto mas só inicializam no acesso à propriedade
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
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
