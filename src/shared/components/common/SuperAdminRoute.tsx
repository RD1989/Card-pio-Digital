import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth();
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return <>{children}</>;
}

