import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente Padrão: Interações públicas ou de Auth que respeitam RLS (Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Adicional: Cliente Service Role, útil se criar uma Variável SUPABASE_SERVICE_ROLE_KEY
// Útil para contornar bloqueios do RLS em rotas seguras do servidor (API/Serverless)
export const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
