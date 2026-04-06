-- Permitir que usuários autenticados atualizem suas próprias intenções de Pix (apenas o status)
CREATE POLICY "Users can update their own pix_intents"
  ON public.pix_intents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
