
-- Super admins can manage all products
CREATE POLICY "Super admins manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can manage all categories
CREATE POLICY "Super admins manage all categories"
ON public.categories
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can view all orders
CREATE POLICY "Super admins view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins can update all orders
CREATE POLICY "Super admins update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins can view all order items
CREATE POLICY "Super admins view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins can manage all profiles
CREATE POLICY "Super admins manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));
