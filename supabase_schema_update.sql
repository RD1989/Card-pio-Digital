/*
SCRIPT DE ATUALIZACAO FINAL - COMPLETE SCHEMA
Este script garante a existencia de TODAS as tabelas e politicas.
MODIFICAÇÃO: Permite leitura da chave IA pelo Frontend (By-pass).
*/

/* 1. Habilitando extensoes */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

/* 2. Tabelas Administrativas */
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

/* 3. Ajuste de RLS para AI Key (Leitura autenticada) */
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read AI keys" ON public.global_settings;
CREATE POLICY "Authenticated users can read AI keys" ON public.global_settings
  FOR SELECT TO authenticated 
  USING (key = 'openrouter_api_key' OR key = 'openrouter_model');

/* 4. Tabelas de Cardapio e Operacao */
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  open_time text,
  close_time text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_user_id uuid NOT NULL,
  slug text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

/* FIM DO SCRIPT DE SCHEMA */
