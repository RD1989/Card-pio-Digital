import { LayoutDashboard, BarChart3, X, Package, Truck, Palette, ShoppingCart, Ticket, Clock, FileUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { label: 'Meu Painel', icon: LayoutDashboard, path: '/admin' },
  { label: 'Pedidos', icon: ShoppingCart, path: '/admin/orders' },
  { label: 'Produtos', icon: Package, path: '/admin/products' },
  { label: 'Cupons', icon: Ticket, path: '/admin/coupons' },
  { label: 'Entregas', icon: Truck, path: '/admin/delivery' },
  { label: 'Horários', icon: Clock, path: '/admin/hours' },
  { label: 'Identidade', icon: Palette, path: '/admin/branding' },
  { label: 'Import IA', icon: FileUp, path: '/admin/menu-import' },
  { label: 'Métricas', icon: BarChart3, path: '/admin/analytics' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: Props) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border md:hidden flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <span className="text-gradient font-bold text-lg">Menu Pro</span>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
              {links.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-primary/10 text-primary glow-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
