import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização lazy: evita que o build quebre quando as variáveis ainda
// não estão disponíveis no servidor (ex: build na Vercel sem env vars)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error(
        "❌ CONFIGURAÇÃO DO SUPABASE AUSENTE:\n" +
        "Certifique-se de configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu painel da Vercel ou no arquivo .env.local localmente."
      );
    }

    _supabase = createClient(
      url || 'https://placeholder.supabase.co', 
      key || 'placeholder_anon_key'
    );
  }
  return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_admin_key';
    
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
