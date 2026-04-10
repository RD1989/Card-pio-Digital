import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = 'https://jxmjedkhlxfpnnhmmdgi.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWplZGtobHhmcG5uaG1tZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTE1NDYsImV4cCI6MjA5MDcyNzU0Nn0.CBTPe2aJC2rF1VJwvKxNOXGVnqzlq6-XulHTEIaqCAE';
const RESTAURANT_SLUG = 'rodrigo-admin';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function main() {
  const { data: profile } = await supabase.from('profiles').select('user_id').eq('slug', RESTAURANT_SLUG).single();
  const userId = profile.user_id;

  const { data: categories } = await supabase.from('categories').select('id, name').eq('user_id', userId);
  const { data: products } = await supabase.from('products').select('name, category_id').eq('user_id', userId);

  console.log('--- CATEGORIAS (DB) ---');
  categories.forEach(c => console.log(`ID: ${c.id} | Name: "${c.name}"`));
  
  console.log('\n--- PRODUTOS (DB) ---');
  products.forEach(p => {
    const cat = categories.find(c => c.id === p.category_id);
    console.log(`[${cat?.name || '???'}] | Name: "${p.name}"`);
  });
}

main().catch(console.error);
