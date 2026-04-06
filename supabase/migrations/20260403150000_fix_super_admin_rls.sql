-- Revise and optimize is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE email = (SELECT email FROM auth.users WHERE id = _user_id)
    OR email = (auth.jwt() ->> 'email')
  );
$$;

-- Reforce and explicitly split policies for Super Admins on categories
DROP POLICY IF EXISTS "Super admins manage all categories" ON public.categories;
CREATE POLICY "Super admins manage all categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Reforce and explicitly split policies for Super Admins on products
DROP POLICY IF EXISTS "Super admins manage all products" ON public.products;
CREATE POLICY "Super admins manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Add missing super admin policies for business_hours
DROP POLICY IF EXISTS "Super admins manage business hours" ON public.business_hours;
CREATE POLICY "Super admins manage business hours"
ON public.business_hours
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Add missing super admin policies for coupons
DROP POLICY IF EXISTS "Super admins manage coupons" ON public.coupons;
CREATE POLICY "Super admins manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Reforce profiles for super admin
DROP POLICY IF EXISTS "Super admins manage all profiles" ON public.profiles;
CREATE POLICY "Super admins manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Reforce orders for super admin
DROP POLICY IF EXISTS "Super admins manage all orders" ON public.orders;
CREATE POLICY "Super admins manage all orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Reforce order items for super admin
DROP POLICY IF EXISTS "Super admins manage all order_items" ON public.order_items;
CREATE POLICY "Super admins manage all order_items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Reforce pix_intents for super admin
DROP POLICY IF EXISTS "Super admins manage all pix_intents" ON public.pix_intents;
CREATE POLICY "Super admins manage all pix_intents"
ON public.pix_intents
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- PERMIT ALL AUTHENTICATED USERS TO READ GLOBAL SETTINGS (NEEDED FOR AI MENU IMPORT)
-- Only super admins can manage (insert/update/delete)
DROP POLICY IF EXISTS "Super admins manage global settings" ON public.global_settings;
DROP POLICY IF EXISTS "Allow authenticated to read settings" ON public.global_settings;
CREATE POLICY "Super admins manage global settings"
ON public.global_settings
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Allow authenticated to read settings"
ON public.global_settings
FOR SELECT
TO authenticated
USING (true);
