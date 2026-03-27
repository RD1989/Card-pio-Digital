import { useState } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Palette,
  Link as LinkIcon,
  Printer,
  BarChart3, 
  Cpu, 
  CreditCard, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const SidebarLink = ({ 
  to, 
  icon: Icon, 
  label, 
  collapsed, 
  active 
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string; 
  collapsed: boolean; 
  active: boolean; 
}) => (
  <Link
    to={to}
    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
      active 
        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-none' 
        : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
    }`}
  >
    <Icon className="w-6 h-6 shrink-0" />
    {!collapsed && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="font-medium whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
  </Link>
);

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/branding', icon: Palette, label: 'Minha Marca' },
    { to: '/admin/products', icon: Store, label: 'Cardápio' },
    { to: '/admin/biolink', icon: LinkIcon, label: 'Link na Bio' },
    { to: '/admin/labels', icon: Printer, label: 'Etiquetas' },
    { to: '/admin/metrics', icon: BarChart3, label: 'Métricas' },
    { to: '/admin/settings/ia', icon: Cpu, label: 'Config. IA' },
    { to: '/admin/settings/payments', icon: CreditCard, label: 'Pagamentos' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        className={`fixed md:relative z-50 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-4 px-2 mb-10">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <MenuIcon className="w-6 h-6 text-zinc-950" />
          </div>
          {!collapsed && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-serif font-bold italic text-amber-500 tracking-tighter"
            >
              Control Panel
            </motion.h1>
          )}
        </div>

        <nav className="flex-1 space-y-2 mt-4">
          {navItems.map((item) => (
            <div key={item.to} onClick={() => setMobileMenuOpen(false)}>
              <SidebarLink
                {...item}
                collapsed={collapsed}
                active={location.pathname === item.to}
              />
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-zinc-800 pt-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-zinc-500 hover:bg-zinc-800 transition-all"
          >
            {collapsed ? <ChevronRight /> : <><ChevronLeft /> <span>Recolher</span></>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen custom-scrollbar w-full">
        {/* Mobile Header Top */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-serif font-bold italic text-amber-500">Control Panel</h1>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
             <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=f59e0b&color=000`} alt="Avatar" />
          </div>
        </div>

        <div className="p-4 md:p-8">
          <header className="hidden md:flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-serif italic text-white">Painel Gestor</h2>
              <p className="text-zinc-500 text-sm">Olá, {user?.name}. Aqui está o panorama do seu SaaS.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-white">{user?.name}</p>
                <p className="text-xs text-amber-500 font-bold uppercase tracking-widest">{user?.restaurant ? 'Lojista' : 'Super Admin'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=f59e0b&color=000`} alt="Avatar" />
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
