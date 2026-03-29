-- 1. Cria a Tabela "settings" que a interface espera
CREATE TABLE IF NOT EXISTS public.settings (
    id integer PRIMARY KEY DEFAULT 1,
    ai_api_key text,
    ai_model text DEFAULT 'qwen/qwen3.5-9b',
    efipay_client_id text,
    efipay_pix_key text,
    efipay_client_secret text,
    efipay_certificate_path text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    CONSTRAINT ensure_single_row CHECK (id = 1)
);

-- 2. Habilita RLS para segurança
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Libera as permissões da Tabela de Configurações
CREATE POLICY "Admin pode ler config" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin pode atualizar config" ON public.settings FOR UPDATE USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'rodrigotechpro@gmail.com'));
CREATE POLICY "Admin pode criar config" ON public.settings FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'rodrigotechpro@gmail.com'));

-- 4. Insere a configuração inicial
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 5. Conserta do Erro de Segurança do Certificado (RLS Violates / Upload)
-- Supabase exige permissões explícitas para inserir arquivos num bucket
CREATE POLICY "Admin UpLoads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'private_assets' AND auth.uid() IN (SELECT id FROM auth.users WHERE email = 'rodrigotechpro@gmail.com'));
CREATE POLICY "Admin Reads" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'private_assets');
CREATE POLICY "Admin Updates" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'private_assets');
