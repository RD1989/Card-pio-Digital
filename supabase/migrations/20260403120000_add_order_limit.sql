-- Adicionar a coluna order_limit na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS order_limit INTEGER DEFAULT 200;

-- Atualizar o valor para o plano 'pro' para ser ilimitado (0)
UPDATE public.profiles SET order_limit = 0 WHERE plan = 'pro';

-- Atualizar o valor para o plano 'active' ou 'basic' para o padrão (200)
-- (Já é o padrão na criação, mas garantimos aqui)
UPDATE public.profiles SET order_limit = 200 WHERE plan != 'pro';
