-- Migration: Efí Bank Billing System
-- Creates necessary tables and columns for Serverless B2B Billing

-- 1. Create Webhook Tracking Table (Queue for CRON idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id text NOT NULL,
  payload jsonb,
  processed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhooks
CREATE POLICY "Service Role Full Access Webhooks" ON public.webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Create Payments History Table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  charge_id text UNIQUE NOT NULL,
  plano text NOT NULL,
  tipo text NOT NULL,
  valor numeric,
  status text DEFAULT 'pending',
  pix_qr_code text,
  pix_copy_paste text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments via super admin or their own panel
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service Role Full Access Payments" ON public.payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Update Profiles Table
-- Add setup_pendente column for VIP onboarding tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_pendente boolean DEFAULT false;

-- Notify PostgREST cache reload
NOTIFY pgrst, 'reload schema';
