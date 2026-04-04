import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useSuperAdmin() {
  const { user, isReady } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;

    if (!user?.id) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function check() {
      try {
        const { data, error } = await supabase.rpc('is_super_admin', {
          _user_id: user.id,
        });

        if (!isMounted) return;

        if (error) {
          console.error("Erro ao verificar status de super admin:", error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(!!data);
        }
      } catch (err) {
        console.error("Falha fatal na verificação de super admin:", err);
        setIsSuperAdmin(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isReady]);

  return { isSuperAdmin, loading };
}

