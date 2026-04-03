
CREATE POLICY "Users can check own super admin status"
ON public.super_admins
FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
