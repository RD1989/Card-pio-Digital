/*
-------------------------------------------------------------------------
SCRIPT DE LIMPEZA CIRÚRGICA (CLEANUP) - SUPABASE
-------------------------------------------------------------------------
Este script varre o seu esquema 'public' e APAGA TODAS AS TABELAS
que NÃO pertençam ao novo sistema (Cardápio Digital SaaS / Menu Pro).
Isso é extremamente útil caso você esteja usando um projeto Supabase antigo
e queira eliminar o lixo de sistemas anteriores sem comprometer as tabelas atuais.
*/

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. Loop por todas as tabelas do esquema 'public'
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          -- A lista abaixo representa a 'WhiteList' (Tabelas OFICIAIS deste sistema).
          -- Se uma tabela no banco NÃO estiver nesta lista, ELA SERÁ APAGADA.
          AND tablename NOT IN (
              'super_admins', 
              'global_settings', 
              'invoices', 
              'categories', 
              'products', 
              'orders', 
              'order_items', 
              'bio_links', 
              'profiles',
              'business_hours',
              'menu_views',
              'product_modifiers',
              'modifier_options',
              'coupons'
          )
    ) LOOP
        -- Executa o drop na tabela encontrada que for considerada "lixo"
        -- O 'CASCADE' força apagar também os relacionamentos atrelados a ela.
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;
