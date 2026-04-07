import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentTenant {
  restaurant_name: string;
  slug: string;
  created_at: string;
  is_active: boolean;
  plan: string;
}

interface RecentTenantsProps {
  tenants: RecentTenant[];
}

export const RecentTenants = React.memo(({ tenants }: RecentTenantsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-sm rounded-xl overflow-hidden"
    >
      <div className="p-4 sm:p-5 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Lojistas Recentes
        </h2>
        <Link to="/super-admin/tenants" className="text-xs text-primary hover:underline font-medium">
          Ver todos →
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-foreground">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left bg-muted/20">
              <th className="px-5 py-3 font-medium">Restaurante</th>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Cadastro</th>
              <th className="px-5 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((u, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-5 py-3 font-medium">{u.restaurant_name}</td>
                <td className="px-5 py-3 text-muted-foreground text-xs font-mono">/menu/{u.slug}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold tracking-wider">
                    {u.plan || 'free'}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link to="/super-admin/tenants" className="text-xs text-primary hover:underline font-bold">
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden divide-y divide-border/50">
        {tenants.map((u, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{u.restaurant_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${u.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {u.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold capitalize">
                  {u.plan || 'free'}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium tracking-tight">
              {new Date(u.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

RecentTenants.displayName = 'RecentTenants';
