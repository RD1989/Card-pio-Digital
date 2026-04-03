import { Navigate, Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/shared/components/layout/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { X, Eye } from 'lucide-react';

export function AdminLayout() {
  const { impersonatedUserId, impersonatedName, clearImpersonation } = useImpersonateStore();
  const { isSuperAdmin, loading } = useSuperAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isSuperAdmin && !impersonatedUserId) {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Impersonation Banner */}
          {impersonatedName && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <Eye className="w-4 h-4" />
                <span>Visualizando como: <strong>{impersonatedName}</strong></span>
              </div>
              <button
                onClick={clearImpersonation}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <header className="h-14 flex items-center px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="mr-3" />
            <span className="text-gradient font-bold text-lg md:hidden">Menu Pro</span>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
