
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'pending',
  pix_txid TEXT,
  pix_qrcode TEXT,
  pix_copy_paste TEXT,
  pix_location TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '3 days'),
  paid_at TIMESTAMP WITH TIME ZONE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices" ON public.invoices
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins manage all invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Service role manages invoices" ON public.invoices
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
