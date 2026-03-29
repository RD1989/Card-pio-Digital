import dns from 'dns';
dns.setDefaultResultOrder('ipv6first');

import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:Menu@Pro1989@db.upgdrlotzruvbneodrqj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL.');

    // 1. Criar o bucket private_assets
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('private_assets', 'private_assets', false) 
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Bucket "private_assets" garantido.');

    // 2. Tentar criar políticas para que uploads via client funcionem
    // OBS: Se a policy já existir, vai dar erro de duplicado, então pegamos o erro e ignoramos
    const policies = [
      `CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'private_assets');`,
      `CREATE POLICY "Allow authenticated read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'private_assets');`,
      `CREATE POLICY "Allow authenticated update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'private_assets');`
    ];

    for (const p of policies) {
      try {
        await client.query(p);
        console.log('Policy aplicada com sucesso.');
      } catch (err) {
        if (err.code !== '42710') { // 42710 = duplicate_object
          console.warn('Isso não impedirá o bucket de funcionar: ', err.message);
        }
      }
    }

    console.log('Setup finalizado!');
  } catch (err) {
    console.error('Erro geral: ', err);
  } finally {
    await client.end();
  }
}

run();
