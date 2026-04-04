-- Add premium branding options to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS menu_layout TEXT DEFAULT 'classic';

-- Update RLS if needed (already broad enough)
COMMENT ON COLUMN public.profiles.theme_mode IS 'light, dark, auto';
COMMENT ON COLUMN public.profiles.menu_layout IS 'classic, premium';
