"use client";

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Palette,
  Clock,
  Link as LinkIcon,
  Printer,
  BarChart3, 
  Cpu, 
  CreditCard, 
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
  Sun,
  Moon,
  LifeBuoy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SidebarLink = ({ 
  to, 
  icon: Icon, 
  label, 
  collapsed, 
  active,
  theme
}: { 
  to: string; 
  icon: React.ElementType; 
  label: string; 
  collapsed: boolean; 
  active: boolean; 
  theme: string;
}) => (
  <Link
    href={to}
    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
      active 
        ? 'shadow-lg font-bold' 
        : theme === 'light'
          ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-white'
    }`}
    style={active ? { 
      backgroundColor: 'var(--accent)', 
      color: '#0a0a0a',
      boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)'
    } : {}}
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, setUser, setAuth } = useAuthStore() as any;
  const { theme, toggleTheme } = useThemeStore() as any;
  const pathname = usePathname();
  const router = useRouter();
  const isLight = theme === 'light';

  // Sempre sincroniza o restaurante do Supabase ao entrar no painel
  useEffect(() => {
    const syncRestaurant = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (setUser && user) {
        setUser({ ...user, restaurant: restaurantData || null });
      } else if (setAuth) {
        setAuth({
          id: authUser.id,
          email: authUser.email || '',
          name: restaurantData?.name || authUser.email || '',
          restaurant: restaurantData || null,
          is_super_admin: authUser.email === 'rodrigotechpro@gmail.com',
        }, (await supabase.auth.getSession()).data.session?.access_token || '');
      }
    };
    syncRestaurant();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/login';
  };

  const navItems = user?.is_super_admin ? [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Global' },
    { to: '/dashboard/clients', icon: Users, label: 'Gestão de Clientes' },
    { to: '/dashboard/settings/ia', icon: Cpu, label: 'Config. IA' },
    { to: '/dashboard/settings/payments', icon: CreditCard, label: 'Pagamentos' },
  ] : [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Meu Painel' },
    { to: '/dashboard/branding', icon: Palette, label: 'Minha Marca' },
    { to: '/dashboard/products', icon: Store, label: 'Cardápio' },
    { to: '/dashboard/biolink', icon: LinkIcon, label: 'Link na Bio' },
    { to: '/dashboard/delivery', icon: Printer, label: 'Etiquetas' },
    { to: '/dashboard/metrics', icon: BarChart3, label: 'Métricas' },
    { to: '/dashboard/finance', icon: CreditCard, label: 'Financeiro' },
    { to: '/dashboard/hours', icon: Clock, label: 'Horários' },
    { to: '/dashboard/checkout', icon: LifeBuoy, label: 'Planos & Assinatura' },
  ];

  return (
    <div className={`flex min-h-screen overflow-hidden relative transition-colors duration-300 ${
      isLight 
        ? 'theme-light bg-slate-50 text-slate-900' 
        : 'bg-zinc-950 text-zinc-100'
    }`}>
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

      {/* ═══ Sidebar ═══ */}
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        className={`fixed md:relative z-50 min-h-screen h-screen border-r flex flex-col p-4 transition-all duration-300 ${
          isLight 
            ? 'bg-white border-slate-200 shadow-sm' 
            : 'bg-zinc-900 border-zinc-800'
        } ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Original */}
        <div className="flex items-center gap-2 px-2 mb-10 w-full overflow-hidden">
          <img 
            src={'/logo.png'} 
            alt="Menu Pro Logo" 
            className="w-10 h-10 object-contain shrink-0"
          />
          {!collapsed && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black tracking-tighter"
              style={{ color: 'var(--accent)' }}
            >
              Menu Pro
            </motion.h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 mt-4">
          {navItems.map((item) => (
            <div key={item.to} onClick={() => setMobileMenuOpen(false)}>
              <SidebarLink
                {...item}
                collapsed={collapsed}
                active={pathname === item.to}
                theme={theme}
              />
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className={`mt-auto space-y-1.5 border-t pt-4 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
          
          {/* ═══ Theme Toggle Premium ═══ */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
              isLight
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-zinc-400 hover:bg-zinc-800'
            }`}
            title={isLight ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
          >
            <div className="relative w-6 h-6 shrink-0">
              <motion.div
                initial={false}
                animate={{ 
                  rotate: isLight ? 0 : 180,
                  scale: isLight ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Moon className="w-6 h-6 text-indigo-500" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ 
                  rotate: isLight ? -180 : 0,
                  scale: isLight ? 0 : 1
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Sun className="w-6 h-6 text-amber-400" />
              </motion.div>
            </div>
            {!collapsed && (
              <span className="text-sm font-medium">
                {isLight ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            )}
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
              isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {collapsed ? <ChevronRight /> : <><ChevronLeft /> <span>Recolher</span></>}
          </button>

          {/* Suporte WhatsApp */}
          <a
            href="https://wa.me/5522996051620"
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium ${
              isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-400/10'
            }`}
          >
            <LifeBuoy className="w-6 h-6 shrink-0" />
            {!collapsed && <span>Suporte</span>}
          </a>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* ═══ Main Content ═══ */}
      <main className="flex-1 overflow-y-auto h-screen custom-scrollbar w-full">
        {/* Mobile Header Top */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-30 backdrop-blur-md ${
          isLight 
            ? 'bg-white/90 border-slate-200' 
            : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 -ml-2 ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'}`}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-serif font-bold italic" style={{ color: 'var(--accent)' }}>Control Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className={`p-2.5 rounded-xl transition-all ${
                isLight 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            >
              {isLight 
                ? <Moon className="w-5 h-5 text-indigo-500" /> 
                : <Sun className="w-5 h-5 text-amber-400" />
              }
            </button>
            <div className={`w-8 h-8 rounded-full overflow-hidden border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-800 border-zinc-700'
            }`}>
               <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=f59e0b&color=000`} alt="Avatar" />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <header className="hidden md:flex justify-between items-center mb-10">
            <div>
              <h2 className={`text-3xl font-serif italic ${isLight ? 'text-slate-900' : 'text-white'}`}>Painel Gestor</h2>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Olá, {user?.name || 'Admin'}. Bem-vindo ao seu painel.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name || 'Admin'}</p>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{user?.restaurant ? 'Lojista' : 'Super Admin'}</p>
              </div>
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-800 border-zinc-700'
              }`}>
                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=f59e0b&color=000`} alt="Avatar" />
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
}
