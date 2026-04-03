
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  restaurant_name TEXT NOT NULL DEFAULT '',
  whatsapp TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#f59e0b',
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (needed for public menu)
CREATE POLICY "Public can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Users manage their own profile
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, slug, restaurant_name)
  VALUES (
    NEW.id,
    REPLACE(LOWER(COALESCE(NEW.raw_user_meta_data->>'full_name', 'loja-' || LEFT(NEW.id::text, 8))), ' ', '-'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Loja')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
