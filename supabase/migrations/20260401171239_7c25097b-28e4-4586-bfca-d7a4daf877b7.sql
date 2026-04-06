
-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coupons" ON public.coupons FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins manage all coupons" ON public.coupons FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Public can read active coupons" ON public.coupons FOR SELECT TO public USING (is_active = true);

-- Product modifiers table
CREATE TABLE public.product_modifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_selections INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own modifiers" ON public.product_modifiers FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super admins manage all modifiers" ON public.product_modifiers FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Public can view modifiers" ON public.product_modifiers FOR SELECT TO public USING (true);

-- Modifier options table
CREATE TABLE public.modifier_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modifier_id UUID NOT NULL REFERENCES public.product_modifiers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Options follow modifier access" ON public.modifier_options FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.product_modifiers pm WHERE pm.id = modifier_id AND pm.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.product_modifiers pm WHERE pm.id = modifier_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Super admins manage all options" ON public.modifier_options FOR ALL TO authenticated USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Public can view options" ON public.modifier_options FOR SELECT TO public USING (true);

-- Menu views tracking table for conversion metrics
CREATE TABLE public.menu_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  slug TEXT NOT NULL
);

ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.menu_views FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Owners see own views" ON public.menu_views FOR SELECT TO public USING (auth.uid() = restaurant_user_id);
CREATE POLICY "Super admins see all views" ON public.menu_views FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
