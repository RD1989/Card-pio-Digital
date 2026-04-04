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
  try {
  const { impersonatedUserId, impersonatedName, clearImpersonation } = useImpersonateStore();
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const { status: planStatus, loading: planLoading } = usePlanStatus();

  // Log técnico imediato no console
  console.log('🖥️ RENDER AdminLayout:', { isSuperAdmin, impersonatedUserId, adminLoading, planLoading });

  if (adminLoading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center px-6">
          <div className="relative">
            <Loader2 className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-black tracking-widest uppercase opacity-70 animate-pulse">
              Iniciando Sessão Segura
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estamos preparando seu ambiente de trabalho. Isso leva apenas alguns instantes.
            </p>
          </div>
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Demorando muito? Clique para recarregar
          </button>

          {/* Dados de diagnóstico em caso de lentidão */}
          <div className="mt-8 p-3 rounded bg-muted/50 border border-border text-[10px] font-mono text-left opacity-30">
            ADMIN: {adminLoading ? 'PENDENTE' : (isSuperAdmin ? 'SUPER' : 'LOJISTA')}<br/>
            PLAN: {planLoading ? 'BUSCANDO' : (planStatus ? 'OK' : 'FALHOU')}<br/>
            MOCK: {impersonatedUserId || 'NENHUM'}
          </div>
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
  const showSuspension = isSuspended && (!isSuperAdmin || !!impersonatedUserId);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        {/* DIAGNOSTIC BADGE - Ficará visível para sabermos o estado do sistema */}
        <div className="fixed top-2 right-2 z-[9999] px-2 py-1 bg-black/80 text-white text-[8px] font-mono rounded border border-white/20 select-none pointer-events-none opacity-50 hover:opacity-100 flex gap-2">
           <span>ADMIN: {isSuperAdmin ? 'YES' : 'NO'}</span>
           <span>IMPERSONATE: {impersonatedUserId ? 'YES' : 'NO'}</span>
           <span>STATUS: {planStatus?.isActive ? 'ACTIVE' : 'SUSPENDED'}</span>
        </div>

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
  } catch (error: any) {
    console.error('😭 FATAL RENDER ERROR:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-950 p-10 text-white">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Erro Crítico de Interface</h1>
          <p className="text-sm opacity-80">Ocorreu um erro síncrono durante a renderização do painel administrativo. Isso geralmente indica um conflito de dados ou estado do sistema.</p>
          <div className="p-4 bg-black/40 rounded font-mono text-xs overflow-auto max-h-40">
            {error?.message || 'Erro desconhecido'}
          </div>
          <Button 
            className="w-full bg-white text-red-950 hover:bg-white/90 font-bold"
            onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          >
            Limpar Tudo e Recomeçar
          </Button>
        </div>
      </div>
    );
  }
}
