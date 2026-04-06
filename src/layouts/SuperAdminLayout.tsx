import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, Settings, Users, LogOut, LayoutDashboard, Layout,
  DollarSign, ShieldCheck, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Painel', end: true },
  { to: '/super-admin/tenants', icon: Users, label: 'Lojistas', end: false },
  { to: '/super-admin/financial', icon: DollarSign, label: 'Financeiro', end: false },
  { to: '/super-admin/settings', icon: Settings, label: 'Configurações', end: false },
  { to: '/super-admin/landing', icon: Layout, label: 'Landing Page', end: false },
  { to: '/super-admin/system', icon: ShieldCheck, label: 'Sistema', end: false },
];

function SidebarLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <nav className="flex-1 p-3 space-y-1">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive
                ? 'bg-primary/15 text-primary font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <link.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
              <span className="flex-1">{link.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background">

      {/* ───────────── Sidebar Desktop ───────────── */}
      <aside className="w-64 border-r border-border bg-card/80 backdrop-blur-sm flex-col shrink-0 hidden md:flex">
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-bold text-sm">Super Admin</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Painel Global</p>
          </div>
        </div>

        <SidebarLinks />

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* ───────────── Mobile Drawer ───────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 flex flex-col md:hidden shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">Super Admin</span>
                    <p className="text-[10px] text-muted-foreground -mt-0.5">Painel Global</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SidebarLinks onLinkClick={() => setMobileOpen(false)} />

              {/* Drawer Footer */}
              <div className="p-3 border-t border-border">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Sistema
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ───────────── Main Content ───────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Mobile */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          {/* Hamburger — visível apenas em mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors -ml-1"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo / Título no header mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm text-primary">Super Admin</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Badge indicador */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Modo Admin
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto pb-6">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ───────────── Bottom Nav Mobile ───────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-30 px-1 py-1 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-14">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="flex-1"
            >
              {({ isActive }) => (
                <div className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                    <link.icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="super-admin-bottom-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </div>
                  <span className="text-[9px] font-semibold tracking-tight leading-none max-w-[52px] text-center truncate">
                    {link.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
