import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache para instâncias
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Função recursiva para criar um mock indestrutível que permite encadeamento infinito.
 * Ex: supabase.from().select().eq().order().then()
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
 * Função auxiliar interna para ler variáveis do .env.local de forma robusta no servidor.
 */
function getEnvVar(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env[name]) {
    const v = process.env[name];
    if (v && !v.includes('placeholder')) return v;
  }

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
      // Silencioso
    }
  }
  return undefined;
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!key || key.includes('placeholder')) {
      if (typeof window === 'undefined') {
        console.warn(`[Supabase] DIAGNÓSTICO: Chave Anon ausente (Site renderizando em Mock).`);
      }
      return createRecursiveMock() as SupabaseClient;
    }

    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

export function getSupabaseAdmin(forceRefresh = false): SupabaseClient {
  if (!_supabaseAdmin || forceRefresh) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (!key || key.includes('placeholder')) {
      if (typeof window === 'undefined') {
         console.warn(`[SupabaseAdmin] DIAGNÓSTICO: Chave Admin ausente (Executando Mock).`);
      }
      return createRecursiveMock() as SupabaseClient;
    }

    _supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (typeof window === 'undefined') {
      console.log(`[SupabaseAdmin] ✅ CONECTADO (Key: ${key.substring(0, 5)}...)`);
    }
  }
  return _supabaseAdmin;
}

// Proxies estáveis para o ecossistema Next.js
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    return (getSupabase() as any)[prop];
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
    return (getSupabaseAdmin() as any)[prop];
  }
});
