import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de cache
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Função auxiliar interna para ler variáveis do .env.local de forma robusta no servidor
function getEnvVar(name: string): string | undefined {
  // 1. Tenta o padrão do Node/Vercel
  const value = typeof process !== 'undefined' ? process.env[name] : undefined;
  
  if (value && !value.includes('placeholder')) {
    return value;
  }

  // 2. Fallback: Leitura direta do arquivo no servidor (ignorado no browser)
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
  return value || undefined;
}

// Inicializa o cliente público (Browser/Client Components)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';

    // No SSR (Next.js 15), evitamos logs pesados que podem travar o render
    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

// Inicializa o cliente administrativo (Server Components/API Routes)
export function getSupabaseAdmin(forceRefresh = false): SupabaseClient {
  if (!_supabaseAdmin || forceRefresh) {
    const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 'https://upgdrlotzruvbneodrqj.supabase.co';
    const key = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    _supabaseAdmin = createClient(url, key || 'placeholder_admin_key', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Exportações legadas para compatibilidade (Evitando Proxy problemático no SSR)
// Nota: Em Next.js 15, Proxies em módulos exportados podem causar 500 se acessados no render
export const supabase = getSupabase();
export const supabaseAdmin = getSupabaseAdmin();
