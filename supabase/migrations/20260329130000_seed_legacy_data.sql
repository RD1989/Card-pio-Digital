-- MIGRAÇÃO DE DADOS GERADA AUTÔMATICAMENTE: MYSQL -> SUPABASE

BEGIN;

-- Inserção de Usuários na schema auth.users

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
) VALUES (
  'fdf69c00-9b41-4edf-9f9f-ef16cdb11b5f', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'admin@cardapio.com', '$2y$12$n2meAufB8tGFyvlld1ow7O5zcR0Q1bbSvGxkVqPv1blr.ON.8Uqky', now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', '{}', false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
) VALUES (
  '851a62c0-dded-4fc6-a21a-1efcc8ad8d5f', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'loja@cardapio.com', '$2y$12$IF.vocR4CRIT5qZdErMqQuUiEClClJTExPNQTqRmLGR1aToGNcAcu', now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', '{}', false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
) VALUES (
  'cbe4a008-b1f9-4e12-af48-4b6cad65d6dc', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
  'yarzidarka@necub.com', '$2y$12$CEBqx67intdmSmQn/n9n3um83d4DTM9XQtOMpV6jFv.1rXKjPV1yG', now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', '{}', false
) ON CONFLICT (id) DO NOTHING;

-- Inserção de Restaurantes (Vinculados aos Usuários)

INSERT INTO public.restaurants (
  id, user_id, name, slug, whatsapp_number, logo_url, banner_url, accent_color, 
  bio, address, theme_color, plan, is_active
) VALUES (
  '2797fd74-ea13-421d-8648-1c1745782a6d', '851a62c0-dded-4fc6-a21a-1efcc8ad8d5f', 'Sashimi Master Premium', 'sashimi-master', '5511999999999', 
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=200', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200', '#d4af37', 
  'A autêntica culinária japonesa com um toque de modernidade e exclusividade.', 'Alameda Santos, 1200 - Jardins, SP', '#18181b', 'free', true
);

INSERT INTO public.restaurants (
  id, user_id, name, slug, whatsapp_number, logo_url, banner_url, accent_color, 
  bio, address, theme_color, plan, is_active
) VALUES (
  '685cfe17-7f5e-4c91-9fae-60383a59516c', 'cbe4a008-b1f9-4e12-af48-4b6cad65d6dc', 'Pastelandia', 'pastelandia', '22999999999', 
  NULL, NULL, '#f59e0b', 
  NULL, NULL, '#18181b', 'basico', true
);

-- Inserção de Categorias

INSERT INTO public.categories (id, restaurant_id, name, sort_order)
VALUES ('2171c745-af9e-4c15-8ba1-34fcf3a8caed', '2797fd74-ea13-421d-8648-1c1745782a6d', 'Entradas', 1);

INSERT INTO public.categories (id, restaurant_id, name, sort_order)
VALUES ('e6acfedf-f9de-4a22-a045-5e97d55ec596', '2797fd74-ea13-421d-8648-1c1745782a6d', 'Pratos Principais', 2);

INSERT INTO public.categories (id, restaurant_id, name, sort_order)
VALUES ('ba0f1214-c292-4bb9-a035-d67e5216b3a6', '2797fd74-ea13-421d-8648-1c1745782a6d', 'Bebidas', 3);

-- Inserção de Produtos

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('02081254-8310-4b6a-a509-2e48dd685a1d', '2797fd74-ea13-421d-8648-1c1745782a6d', '2171c745-af9e-4c15-8ba1-34fcf3a8caed', 'Sunomono Especial', 'Salada de pepino japonês com kani e gergelim.', 18.9, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('76e308e5-9596-460e-b175-dc28813ffb28', '2797fd74-ea13-421d-8648-1c1745782a6d', '2171c745-af9e-4c15-8ba1-34fcf3a8caed', 'Guioza de Lombo', '6 unidades de pastéis japoneses grelhados.', 32, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('e4c025ba-6fe6-44e1-8b77-5518a071cac8', '2797fd74-ea13-421d-8648-1c1745782a6d', '2171c745-af9e-4c15-8ba1-34fcf3a8caed', 'Harumaki de Queijo', 'Rolinho primavera crocante com queijo derretido.', 15, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('296e577c-d643-45f7-af28-5fa6aeb6c9ae', '2797fd74-ea13-421d-8648-1c1745782a6d', '2171c745-af9e-4c15-8ba1-34fcf3a8caed', 'Edamame com Flor de Sal', 'Grãos de soja verde cozidos no vapor.', 22, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('64f2b609-5d57-48ec-94d7-8c30b25d61a7', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Combo Sashimi 20un', 'Seleção premium de salmão, atum e peixe branco.', 89.9, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, true);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('2c5f1cfa-b06b-454b-9e0e-bb073f1aa8e7', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Uramaki Filadélfia', '8 unidades de enrolado de salmão com cream cheese.', 38, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('a781908b-022e-4383-b4a4-7647cb1e6581', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Temaki Salmão Completo', 'Cone de alga com arroz, salmão e cebolinha.', 35, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('eec2dfd9-94be-4bf7-9fee-608088783f2f', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Nigiri Selection', 'Par de nigiris de salmão maçaricado com azeite de trufas.', 24, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('160eb80b-f007-4157-b5d6-83c3834cf55a', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Hot Roll Crispy', '10 unidades de sushi frito com couve crispy e tarê.', 45, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('1420e010-28a9-4a75-b11f-391508673c56', '2797fd74-ea13-421d-8648-1c1745782a6d', 'e6acfedf-f9de-4a22-a045-5e97d55ec596', 'Carpaccio de Salmão', 'Lâminas finas de salmão com molho ponzu e ovas.', 58, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, true);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('6d3331bd-d1d9-4326-b25f-c1133db32696', '2797fd74-ea13-421d-8648-1c1745782a6d', 'ba0f1214-c292-4bb9-a035-d67e5216b3a6', 'Sake Junmai 750ml', 'Sake premium importado do Japão.', 120, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

INSERT INTO public.products (id, restaurant_id, category_id, name, description, price, image_url, is_available, is_upsell)
VALUES ('7631786e-7178-4ae5-96d3-841f1a32897d', '2797fd74-ea13-421d-8648-1c1745782a6d', 'ba0f1214-c292-4bb9-a035-d67e5216b3a6', 'Suco Pink Lemonade', 'Refrescante limonada com frutas vermelhas.', 14, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800', true, false);

-- Inserção de Pedidos

INSERT INTO public.orders (restaurant_id, total_amount, status, items_count)
VALUES ('2797fd74-ea13-421d-8648-1c1745782a6d', 39, 'pending', 2);

-- Inserção de Configurações Administrativas

INSERT INTO public.system_settings (key, value)
VALUES ('ai_api_key', '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')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.system_settings (key, value)
VALUES ('ai_model', 'qwen/qwen3.5-9b')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
