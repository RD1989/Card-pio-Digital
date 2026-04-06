import { LayoutDashboard, BookOpen, BarChart3, Tags, Wallet, Moon, Sun, ChevronLeft, Package, Truck, LogOut, Palette, ShoppingCart, Ticket, Clock, FileUp, QrCode } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/shared/stores/global/useThemeStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { motion } from 'framer-motion';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';

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
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function DashboardSidebar({ collapsed, onCollapse }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggle } = useThemeStore();
  const { signOut } = useAuth();
  const { status } = usePlanStatus();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="hidden md:flex flex-col h-screen border-r border-border bg-card sticky top-0"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && <span className="text-gradient font-bold text-lg">Menu Pro</span>}
        <button onClick={() => onCollapse(!collapsed)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {links.map((item) => {
          const active = location.pathname === item.path;
          const isDisabled = status && !status.isActive && item.path !== '/admin';

          return (
            <Link
              key={item.path}
              to={isDisabled ? '#' : item.path}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-primary/10 text-primary glow-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
                ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex flex-col gap-1">
        <button onClick={toggle} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full">
          {mode === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
          {!collapsed && <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={async () => { await signOut(); navigate('/login'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-all w-full">
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}

