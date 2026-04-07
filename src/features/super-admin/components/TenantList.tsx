import React from 'react';
import { motion } from 'framer-motion';
import { Store, Eye, Settings, PackagePlus, Loader2, ChevronRight } from 'lucide-react';
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
}

interface TenantListProps {
  tenants: Tenant[];
  onImpersonate: (t: any) => void;
  onPlanChange: (id: string, plan: string) => void;
  onExtendLicense: (id: string, days: number) => void;
  onLimitChange: (id: string, limit: number) => void;
  onManage: (t: any) => void;
  onSeedDemo: (id: string) => void;
  seeding: boolean;
  getLicenseInfo: (t: any) => any;
  LICENSE_STATUS: any;
}

export const TenantList = React.memo(({
  tenants,
  onImpersonate,
  onPlanChange,
  onExtendLicense,
  onLimitChange,
  onManage,
  onSeedDemo,
  seeding,
  getLicenseInfo,
  LICENSE_STATUS
}: TenantListProps) => {
  return (
    <>
      {/* ─── DESKTOP TABLE ─── */}
      <div className="hidden md:block glass-sm overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                <th className="p-3 font-semibold">Lojista</th>
                <th className="p-3 font-semibold">Contato</th>
                <th className="p-3 font-semibold">Plano/Limite</th>
                <th className="p-3 font-semibold">Licença</th>
                <th className="p-3 font-semibold">Ativação Rápida</th>
                <th className="p-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => {
                const info = getLicenseInfo(t);
                const config = LICENSE_STATUS[info.status];
                return (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                          <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate max-w-[160px] lowercase">{t.restaurant_name}</p>
                          <p className="text-[10px] text-muted-foreground">/menu/{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col text-xs gap-0.5">
                        <span className="text-muted-foreground truncate max-w-[140px] italic">{t.email || '-'}</span>
                        <a href={`https://wa.me/${t.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="text-primary hover:underline font-bold text-[11px]">
                          {t.whatsapp || '-'}
                        </a>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1.5">
                        <Select value={t.plan} onValueChange={(v) => onPlanChange(t.user_id, v)}>
                          <SelectTrigger className="w-24 h-7 text-xs font-bold ring-0 border-none shadow-none bg-muted/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.color}`}>
                          {config.label}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">{info.date}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => onExtendLicense(t.user_id, 180)}>+180d</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] font-bold hover:bg-primary hover:text-white transition-colors" onClick={() => onExtendLicense(t.user_id, 365)}>+1 ano</Button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-[11px] font-black text-blue-600 border-blue-500/20 hover:bg-blue-500/10"
                          onClick={() => onSeedDemo(t.user_id)}>
                          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackagePlus className="w-3.5 h-3.5" />}
                          Demo
                        </Button>
                        <Button variant="default" size="sm" className="gap-1.5 h-8 text-[11px] font-black shadow-lg shadow-primary/20"
                          onClick={() => onManage(t)}>
                          <Settings className="w-3.5 h-3.5" /> Gerenciar
                        </Button>
                        <Button variant="outline" size="icon" title="Acessar dashboard" className="w-8 h-8 rounded-xl border-border/50" onClick={() => onImpersonate(t)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {tenants.length === 0 && (
            <div className="text-center text-muted-foreground py-16 text-sm font-medium">Nenhum lojista encontrado</div>
          )}
        </div>
      </div>

      {/* ─── MOBILE CARDS ─── */}
      <div className="md:hidden space-y-4 pb-10">
        {tenants.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm glass-sm rounded-xl font-medium">
            Nenhum lojista encontrado
          </div>
        )}
        {tenants.map((t, i) => {
          const info = getLicenseInfo(t);
          const config = LICENSE_STATUS[info.status];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="glass-sm rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            >
              <div className="p-5 flex items-center gap-4 border-b border-border/50 bg-muted/10">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate text-base lowercase">{t.restaurant_name}</p>
                  <p className="text-[11px] text-muted-foreground">/menu/{t.slug}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </div>
              </div>

              <div className="p-5 grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <p className="text-muted-foreground font-black uppercase tracking-wider text-[9px] mb-1">Plano</p>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black uppercase text-[10px]">{t.plan}</span>
                </div>
                <div>
                  <p className="text-muted-foreground font-black uppercase tracking-wider text-[9px] mb-1">Licença</p>
                  <p className="font-bold text-foreground">{info.date}</p>
                </div>
              </div>

              <div className="px-5 pb-5 flex flex-col gap-2">
                <Button variant="default" className="w-full gap-2 h-11 text-xs font-black shadow-lg shadow-primary/20"
                  onClick={() => onManage(t)}>
                  <Settings className="w-4 h-4" /> Gerenciar Assinatura
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2 h-10 text-[10px] font-black border-border/50" onClick={() => onImpersonate(t)}>
                    <Eye className="w-4 h-4 text-primary" /> Acessar Painel
                  </Button>
                  <Button variant="outline" className="gap-2 h-10 text-[10px] font-black text-blue-600 border-blue-500/20" onClick={() => onSeedDemo(t.user_id)}>
                    <PackagePlus className="w-4 h-4" /> Demo
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
});

TenantList.displayName = 'TenantList';
