import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMenuAnalytics() {
  const recordView = useCallback(async (restaurantUserId: string, slug: string) => {
    if (!restaurantUserId || !slug) return;

    // Chave única para esta página na sessão atual
    const sessionKey = `viewed_${slug}_${restaurantUserId}`;
    
    // Evitar contagem duplicada na mesma sessão de navegador
    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('menu_views')
        .insert([
          { 
            restaurant_user_id: restaurantUserId, 
            slug: slug 
          }
        ]);

      if (!error) {
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        console.error('Erro ao registrar visualização:', error);
      }
    } catch (err) {
      console.error('Erro inesperado ao registrar visualização:', err);
    }
  }, []);

  return { recordView };
}
