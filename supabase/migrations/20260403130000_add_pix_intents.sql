-- 1. Criar tabela de intenção de pagamento Pix
CREATE TABLE IF NOT EXISTS public.pix_intents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  base_amount numeric NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Adicionar coluna de expiração no perfil se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone;

-- 3. Adicionar coluna para armazenar o código Pix gerado
ALTER TABLE public.pix_intents ADD COLUMN IF NOT EXISTS pix_code text;

-- 4. Habilitar RLS para pix_intents
ALTER TABLE public.pix_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pix_intents"
  ON public.pix_intents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super Admins can view all pix_intents"
  ON public.pix_intents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Super Admins can manage all pix_intents"
  ON public.pix_intents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE email = auth.jwt() ->> 'email'));

-- 3. Função para encontrar o próximo centavo disponível para um valor base
CREATE OR REPLACE FUNCTION get_next_pix_amount(_base_amount numeric)
RETURNS numeric AS $$
DECLARE
  _next_amount numeric;
  _increment numeric := 0.00;
BEGIN
  LOOP
    _next_amount := _base_amount + _increment;
    
    -- Verifica se esse valor exato já está em uso por uma intenção pendente
    IF NOT EXISTS (
      SELECT 1 FROM public.pix_intents 
      WHERE amount = _next_amount 
      AND status = 'pending' 
      AND expires_at > now()
    ) THEN
      RETURN _next_amount;
    END IF;
    
    _increment := _increment + 0.01;
    
    -- Limite de segurança (máximo de 1 real de acréscimo)
    IF _increment > 1.00 THEN
      RETURN _base_amount;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
