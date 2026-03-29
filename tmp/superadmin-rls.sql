-- script para dar permissão absoluta ao email mestre do SaaS
-- em todas as tabelas (RLS Bypass) usando jwt claim

CREATE POLICY "Super Admins can SELECT all restaurants" ON public.restaurants FOR SELECT USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
CREATE POLICY "Super Admins can ALL restaurants" ON public.restaurants FOR ALL USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
CREATE POLICY "Super Admins can ALL categories" ON public.categories FOR ALL USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
CREATE POLICY "Super Admins can ALL products" ON public.products FOR ALL USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
CREATE POLICY "Super Admins can ALL orders" ON public.orders FOR ALL USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
CREATE POLICY "Super Admins can ALL views" ON public.views FOR ALL USING (auth.jwt() ->> 'email' = 'rodrigotechpro@gmail.com');
