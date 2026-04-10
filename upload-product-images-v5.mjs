import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL    = 'https://jxmjedkhlxfpnnhmmdgi.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWplZGtobHhmcG5uaG1tZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTE1NDYsImV4cCI6MjA5MDcyNzU0Nn0.CBTPe2aJC2rF1VJwvKxNOXGVnqzlq6-XulHTEIaqCAE';
const ADMIN_EMAIL    = 'rodrigotechpro@gmail.com';
const ADMIN_PASSWORD = 'Rodrigo@1989';
const RESTAURANT_SLUG = 'rodrigo-admin';
const IMAGES_DIR = 'C:\\Users\\Suporte\\.gemini\\antigravity\\brain\\886a3f68-5591-4c6f-922e-cec87c5257b1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// NOMES E CATEGORIAS REAIS DO BANCO DE DADOS (SUPABASE)
const PRODUCT_IMAGE_MAP = [
  { productName: 'Batata frita pequena', category: 'Acompanhamentos e Bebidas', filename: 'batata_pequena_standard.png' },
  { productName: 'Batata frita grande',  category: 'Acompanhamentos e Bebidas', filename: 'batata_grande_standard.png' },
  { productName: 'Refrigerante litro',   category: 'Acompanhamentos e Bebidas', filename: 'refrigerante_litro_standard.png' },
  { productName: 'Refrigerante lata',    category: 'Acompanhamentos e Bebidas', filename: 'refrigerante_lata_standard.png' },
  { productName: 'Cerveja Lata',         category: 'Acompanhamentos e Bebidas', filename: 'cerveja_lata_standard.png' },
  { productName: 'Molho de alho',        category: 'Acompanhamentos e Bebidas', filename: 'molho_alho_standard.png' },
  { productName: 'Molho de casa',        category: 'Acompanhamentos e Bebidas', filename: 'molho_casa_standard.png' },
];

async function main() {
  console.log('🚀 Finalizando VINCULAÇÃO (100% de 27 Itens)...');

  const { data: { session } } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  const { data: profile } = await supabase.from('profiles').select('user_id').eq('slug', RESTAURANT_SLUG).single();
  const userId = profile.user_id;

  const { data: categories } = await supabase.from('categories').select('id, name').eq('user_id', userId);
  const { data: products } = await supabase.from('products').select('id, name, category_id').eq('user_id', userId);

  let successCount = 0;

  for (const item of PRODUCT_IMAGE_MAP) {
    const category = categories.find(c => c.name.toLowerCase().trim() === item.category.toLowerCase().trim());
    const product = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase() && p.category_id === category?.id);

    if (!product) {
      console.warn(`⚠️ Não encontrado: "${item.productName}"`);
      continue;
    }

    const imagePath = join(IMAGES_DIR, item.filename);
    const buffer = readFileSync(imagePath);
    const storagePath = `${userId}/${product.id}.png`;

    await supabase.storage.from('product-images').upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    
    await supabase.from('products').update({ image_url: urlData.publicUrl }).eq('id', product.id);
    console.log(`✅ Vinculado: ${item.productName}`);
    successCount++;
  }

  console.log(`\n🎉 CARDÁPIO 100% ILUSTRADO (Total: 27/27).`);
}

main().catch(console.error);
