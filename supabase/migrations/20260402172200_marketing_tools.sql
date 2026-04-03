-- Add banner support to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create bio_links table
CREATE TABLE IF NOT EXISTS public.bio_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own bio links" ON public.bio_links
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active bio links" ON public.bio_links
  FOR SELECT TO public
  USING (is_active = true);

-- Sort order trigger/logic placeholder or index
CREATE INDEX IF NOT EXISTS bio_links_user_id_idx ON public.bio_links(user_id);
