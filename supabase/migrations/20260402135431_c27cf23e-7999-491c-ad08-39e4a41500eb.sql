
-- Allow super admins to insert/delete super_admins
CREATE POLICY "Super admins can insert super admins"
  ON public.super_admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete super admins"
  ON public.super_admins FOR DELETE
  TO authenticated
  USING (public.is_super_admin(auth.uid()));
