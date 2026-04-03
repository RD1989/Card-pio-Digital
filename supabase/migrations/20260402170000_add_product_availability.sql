-- Add availability control for products
ALTER TABLE public.products ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT true;

-- Update RLS policies to respect availability
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view available products" ON public.products 
FOR SELECT USING (is_active = true AND is_available = true);
