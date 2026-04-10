import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("⚠️ Variáveis do Supabase não encontradas no ambiente Vercel. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function getGlobalSetting(key: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('global_settings')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) return null;
  return data.value;
}
