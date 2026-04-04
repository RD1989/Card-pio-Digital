-- Update global settings for the new monetization strategy
UPDATE public.global_settings
SET value = CASE 
    WHEN key = 'landing_hero_title' THEN 'Tenha seu Próprio Cardápio Digital: Pague Uma Vez, Use para Sempre'
    WHEN key = 'landing_hero_subtitle' THEN 'Sem mensalidades e sem taxas por pedido. Experimente grátis por 7 dias e automatize seu delivery com um sistema que é realmente seu.'
    WHEN key = 'landing_hero_badge' THEN '🚀 Licença Vitalícia: Sem Mensalidades'
    WHEN key = 'landing_plan_basic_price' THEN 'Vitalício'
    WHEN key = 'landing_plan_basic_features' THEN 'Pedidos ILIMITADOS|Produtos ILIMITADOS|Menu Digital Premium|Integrado com WhatsApp|QR Code Exclusivo|Horário de Funcionamento|Gestão de Entregas|Cobre o custo em 1 dia'
    WHEN key = 'landing_plan_pro_price' THEN 'Vitalício'
    WHEN key = 'landing_plan_pro_features' THEN 'Tudo do Plano Essencial|Importação de Cardápio com IA|Gerador de Descrições Premium|Suporte Prioritário VIP|Acompanhamento em Tempo Real|Sem Taxas Ocultas|Acesso Vitalício Garantido'
    WHEN key = 'landing_cta_title' THEN 'SISTEMA PRÓPRIO SEM MENSALIDADES'
    WHEN key = 'landing_cta_subtitle' THEN 'Chega de pagar taxas para plataformas que não entendem o seu negócio. Junte-se a centenas de lojistas que já têm sua autonomia digital.'
    ELSE value
END
WHERE key IN (
    'landing_hero_title', 'landing_hero_subtitle', 'landing_hero_badge',
    'landing_plan_basic_price', 'landing_plan_basic_features',
    'landing_plan_pro_price', 'landing_plan_pro_features',
    'landing_cta_title', 'landing_cta_subtitle'
);
