// ============================================================
// SCRIPT: list-categories.mjs
// Lista as categorias do lojista "rodrigo-admin".
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = 'https://jxmjedkhlxfpnnhmmdgi.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWplZGtobHhmcG5uaG1tZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTE1NDYsImV4cCI6MjA5MDcyNzU0Nn0.CBTPe2aJC2rF1VJwvKxNOXGVnqzlq6-XulHTEIaqCAE';
const RESTAURANT_SLUG = 'rodrigo-admin';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function main() {
  const { data: profile } = await supabase.from('profiles').select('user_id').eq('slug', RESTAURANT_SLUG).single();
  const userId = profile.user_id;

  const { data: categories } = await supabase.from('categories').select('name').eq('user_id', userId);
  console.log('Categorias encontradas:', categories.map(c => c.name));
}

main().catch(console.error);
