-- Add delivery customization fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS show_delivery_info BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_delivery_label TEXT;

-- Update the Profile interface in the frontend (PublicMenu.tsx) to include these fields
COMMENT ON COLUMN public.profiles.show_delivery_info IS 'Toggle to show or hide the delivery information badge in the menu';
COMMENT ON COLUMN public.profiles.custom_delivery_label IS 'Manual text for delivery information (e.g. "Free Delivery", "Fixed Fee R$ 10")';
