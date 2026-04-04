import { Navigate, Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/shared/components/layout/AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/shared/components/ui/sidebar';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { X, Eye, Loader2 } from 'lucide-react';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { SuspensionOverlay } from '@/features/billing/components/SuspensionOverlay';
import { PlanBanner } from '@/features/billing/components/PlanBanner';
import { Button } from '@/shared/components/ui/button';

export function AdminLayout() {
  const { impersonatedUserId, impersonatedName, clearImpersonation } = useImpersonateStore();
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const { status: planStatus, loading: planLoading } = usePlanStatus();

  // Log técnico imediato no console para acompanhamento
  console.log('🖥️ RENDER AdminLayout:', { isSuperAdmin, impersonatedUserId, adminLoading, planLoading });

  if (adminLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-black tracking-widest uppercase opacity-70 animate-pulse">
                Iniciando Sessão Segura
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Estamos preparando seu ambiente de trabalho. Isso leva apenas alguns instantes.
              </p>
            </div>
            
            {/* Dados de diagnóstico visíveis para o usuário em caso de travamento */}
            <div className="p-3 rounded bg-muted/50 border border-border text-[10px] font-mono text-left opacity-30 mx-auto w-fit">
              ADMIN: {adminLoading ? '...' : (isSuperAdmin ? 'SI' : 'NO')}<br/>
              IMPERSONATE: {impersonatedUserId ? 'SI' : 'NO'}
            </div>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Clique para recarregar a página
          </button>
        </div>
      </div>
    );
  }

  // REDIRECIONAMENTO DE SEGURANÇA
  // Se for super-admin mas não estiver simulando e cair no /admin, vai para /super-admin
  if (isSuperAdmin && !impersonatedUserId && window.location.pathname === '/admin') {
    return <Navigate to="/super-admin" replace />;
  }

  const isSuspended = planStatus && !planStatus.isActive;
  // O bloqueio é mostrado se a conta estiver suspensa, 
  // EXCETO para o Super Admin em sua própria sessão.
  const showSuspension = isSuspended && (!isSuperAdmin || !!impersonatedUserId);

  // Aqui usamos um try/catch APENAS para a parte de renderização do JSX, 
  // que é o local seguro para capturar erros de sub-componentes.
  try {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background relative">
          {/* BADGE DE DIAGNÓSTICO (Opcional, mas útil por enquanto) */}
          <div className="fixed top-2 right-2 z-[9999] px-2 py-1 bg-black/80 text-white text-[8px] font-mono rounded border border-white/20 opacity-30 select-none pointer-events-none">
             ADMIN: {isSuperAdmin ? 'YES' : 'NO'} | IMPERSONATE: {impersonatedUserId ? 'YES' : 'NO'}
          </div>

          <AdminSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Impersonation Banner */}
            {impersonatedName && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between z-40">
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Eye className="w-4 h-4" />
                  <span>Visualizando como: <strong>{impersonatedName}</strong></span>
                </div>
                <button
                  onClick={clearImpersonation}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1 rounded transition-colors"
                  title="Sair da simulação"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <header className="h-14 flex items-center px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
              <SidebarTrigger className="mr-3" />
              <span className="text-gradient font-bold text-lg md:hidden">Menu Pro</span>
              <div className="flex-1" />
              {planStatus && <PlanBanner status={planStatus} />}
            </header>
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              {showSuspension ? (
                <SuspensionOverlay />
              ) : (
                <Outlet />
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  } catch (renderError) {
    console.error('😭 Render Failure in AdminLayout:', renderError);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-950 p-10 text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Erro de Interface</h1>
          <p className="text-sm opacity-80">Falha ao desenhar os componentes do painel administrativo.</p>
          <Button 
            className="w-full bg-white text-red-950 hover:bg-white/90 font-bold"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          >
            Limpar Cache e Recarregar
          </Button>
        </div>
      </div>
    );
  }
}
