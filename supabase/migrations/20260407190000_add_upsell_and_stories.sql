-- Stories table
CREATE TABLE IF NOT EXISTS public.menu_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_stories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own stories') THEN
        CREATE POLICY "Users manage own stories" ON public.menu_stories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active stories') THEN
        CREATE POLICY "Public can view active stories" ON public.menu_stories FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Product upsells table
CREATE TABLE IF NOT EXISTS public.product_upsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  upsell_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_upsells ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own upsells') THEN
        CREATE POLICY "Users manage own upsells" ON public.product_upsells FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view upsells') THEN
        CREATE POLICY "Public can view upsells" ON public.product_upsells FOR SELECT USING (true);
    END IF;
END $$;

-- Storage bucket for menu stories
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-stories', 'menu-stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view menu stories" ON storage.objects FOR SELECT USING (bucket_id = 'menu-stories');
CREATE POLICY "Authenticated users can upload menu stories" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-stories' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own menu stories" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-stories' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own menu stories" ON storage.objects FOR DELETE USING (bucket_id = 'menu-stories' AND auth.role() = 'authenticated');
