-- Adiciona coluna de texto personalizado para o botão principal da Bio
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_link_text TEXT DEFAULT 'FAZER PEDIDO NO CARDÁPIO';

-- Comentário para expor na UI se necessário
COMMENT ON COLUMN public.profiles.bio_link_text IS 'Texto personalizado para o botão principal que leva ao cardápio na página de links da bio.';
