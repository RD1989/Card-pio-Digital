import React from 'react';
import { motion } from 'framer-motion';
import { 
  Store, Users, Mail, MessageSquare, ExternalLink, TrendingUp, CreditCard, ShieldCheck, 
  UserX, UserCheck, Trash2, PackagePlus, Loader2, Eye 
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface Tenant {
  id: string;
  user_id: string;
  restaurant_name: string;
  slug: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
  is_active: boolean;
  plan: string;
  plan_status: string;
  trial_ends_at: string | null;
  premium_until: string | null;
  last_login_at: string | null;
  order_limit: number;
}

interface ManageTenantModalProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanChange: (id: string, plan: string) => void;
  onExtendLicense: (id: string, days: number) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string, name: string) => void;
  onSeedDemo: (id: string) => void;
  onImpersonate: (t: any) => void;
  changingStatus: boolean;
  seeding: boolean;
}

export const ManageTenantModal = React.memo(({
  tenant,
  open,
  onOpenChange,
  onPlanChange,
  onExtendLicense,
  onToggleActive,
  onDelete,
  onSeedDemo,
  onImpersonate,
  changingStatus,
  seeding
}: ManageTenantModalProps) => {
  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] gap-0 p-0 overflow-hidden glass-sm border-border max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{tenant.restaurant_name}</DialogTitle>
          <DialogDescription>Gestão detalhada da conta do lojista</DialogDescription>
        </DialogHeader>

        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-muted/40 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 lowercase">
                  {tenant.restaurant_name}
                </h3>
                <div className="flex items-center flex-wrap gap-3 mt-1.5">
                  <span className="text-xs text-muted-foreground font-medium">slug: {tenant.slug}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/50 border border-border/50">
                    <div className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      {tenant.is_active ? 'Conta Ativa' : 'Conta Suspensa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Criado em</p>
              <p className="font-bold text-sm text-foreground">{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Coluna Esquerda */}
          <div className="p-6 sm:p-8 md:border-r border-border space-y-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest opacity-70">
                <Users className="w-3.5 h-3.5" /> Informações de Contato
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center border border-border/50">
                    <Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">E-mail Principal</p>
                    <p className="text-sm font-bold truncate italic opacity-80">{tenant.email || '-'}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${tenant.whatsapp?.replace(/\D/g, '')}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-green-500/20 transition-all hover:bg-green-500/[0.02]"
                >
                  <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center border border-border/50">
                    <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-0.5">WhatsApp / Celular</p>
                    <p className="text-sm font-bold text-foreground">{tenant.whatsapp || '-'}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-green-500 transition-colors" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest opacity-70">
                <TrendingUp className="w-3.5 h-3.5" /> Performance e Uso
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-1">Pedidos / Mês</p>
                  <p className="text-xl font-black text-primary">
                    {tenant.order_limit === 0 ? '∞ Ilimitado' : tenant.order_limit}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mb-1">Último Login</p>
                  <p className="text-sm font-bold text-foreground">
                    {tenant.last_login_at ? new Date(tenant.last_login_at).toLocaleDateString('pt-BR') : 'Sem registro'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="p-6 sm:p-8 space-y-8 bg-muted/10 border-t md:border-t-0 border-border">
            <div className="space-y-5">
              <h3 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest opacity-70">
                <CreditCard className="w-3.5 h-3.5" /> Estatuto da Assinatura
              </h3>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Plano de Serviço</label>
                  <Select value={tenant.plan} onValueChange={(v) => onPlanChange(tenant.user_id, v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-background border-border/50 font-bold transition-all hover:border-primary/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="basic" className="font-medium">💼 Plano Básico (Essencial)</SelectItem>
                      <SelectItem value="pro" className="font-bold">🚀 Plano Pro (IA + Multi-unidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Renovação Manual (Modo Rápido)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="text-[10px] font-black py-5 h-auto rounded-2xl border-border hover:bg-primary/5 hover:border-primary/30 transition-all uppercase" onClick={() => onExtendLicense(tenant.user_id, 180)}>+6 Meses</Button>
                    <Button variant="outline" size="sm" className="text-[10px] font-black py-5 h-auto rounded-2xl border-border hover:bg-primary/5 hover:border-primary/30 transition-all uppercase" onClick={() => onExtendLicense(tenant.user_id, 365)}>+12 Meses</Button>
                  </div>
                  <p className="text-[9px] text-center text-muted-foreground font-medium italic opacity-60">
                    A renovação automática reativa contas suspensas instantaneamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-red-500/60 flex items-center gap-2 tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Segurança e Status Crítico
              </h3>
              <div className="space-y-3">
                <Button
                  variant={tenant.is_active ? 'destructive' : 'default'}
                  className={`w-full gap-2 font-black uppercase text-[10px] h-12 rounded-2xl shadow-lg transition-all ${tenant.is_active ? 'shadow-destructive/20' : 'shadow-primary/20'}`}
                  onClick={() => onToggleActive(tenant.user_id, tenant.is_active)}
                  disabled={changingStatus}
                >
                  {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> :
                    tenant.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  {changingStatus ? 'Processando Autenticação...' : tenant.is_active ? 'Bloquear Acesso' : 'Desbloquear Lojista'}
                </Button>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="ghost"
                    className="w-full gap-2 font-black uppercase text-[9px] h-9 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={() => onDelete(tenant.user_id, tenant.restaurant_name)}
                  >
                    <Trash2 className="w-3.5 h-3.5 opacity-50" /> Excluir Conta Permanentemente
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 font-black uppercase text-[9px] h-9 text-blue-600 border-blue-500/10 hover:bg-blue-500/5 hover:border-blue-500/30 rounded-xl"
                    onClick={() => onSeedDemo(tenant.user_id)}
                    disabled={seeding}
                  >
                    {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                    Re-injetar Dados de Demonstração
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 sm:px-8 py-5 bg-muted/40 border-t border-border flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-muted-foreground w-full sm:w-auto rounded-xl h-12">
            Fechar Painel
          </Button>
          <Button className="gap-2 font-black w-full sm:w-auto rounded-2xl h-12 shadow-xl shadow-primary/20" onClick={() => onImpersonate(tenant)}>
            <Eye className="w-4 h-4" /> Simular Acesso como Lojista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ManageTenantModal.displayName = 'ManageTenantModal';
