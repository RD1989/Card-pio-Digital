import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, ChevronRight, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/shared/components/ui/button';

interface Order {
  customer_name: string | null;
  total: number;
  created_at: string;
  status: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export const RecentOrders = React.memo(({ orders }: RecentOrdersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass p-8 flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">Últimos Pedidos</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 rounded-lg" 
          onClick={() => window.location.href = '/admin/orders'}
        >
          Ver todos
        </Button>
      </div>
      
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[320px] pr-2 no-scrollbar">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-30 text-center">
            <ShoppingCart className="w-10 h-10 mb-2" />
            <p className="text-sm font-medium">Nenhum pedido</p>
          </div>
        ) : (
          orders.map((order, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-transparent hover:border-black/[0.05] dark:hover:border-white/[0.05] transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' :
                order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
              }`}>
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{order.customer_name || 'Cliente Online'}</p>
                <p className="text-[11px] text-muted-foreground">{format(new Date(order.created_at), 'HH:mm')} • R$ {Number(order.total).toFixed(2)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-primary italic uppercase tracking-wider">Cozinha Ativa</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>
    </motion.div>
  );
});

RecentOrders.displayName = 'RecentOrders';
