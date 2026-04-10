import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxmjedkhlxfpnnhmmdgi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Preciso da chave ou service role

async function checkSettings() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('global_settings')
    .select('key, value')
    .in('key', ['openrouter_api_key', 'openrouter_model']);
    
  if (error) {
    console.error('Erro ao buscar configurações:', error);
    return;
  }
  
  console.log('Configurações atuais:');
  data.forEach(row => {
    if (row.key === 'openrouter_api_key') {
      console.log(`${row.key}: ${row.value ? '****' + row.value.slice(-4) : 'Não configurada'}`);
    } else {
      console.log(`${row.key}: ${row.value || 'Padrão (vazio)'}`);
    }
  });
}

checkSettings();
