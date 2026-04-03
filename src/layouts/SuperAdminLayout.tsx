import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Settings, Users, LogOut, LayoutDashboard, Layout, DollarSign, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const links = [
  { to: '/super-admin', icon: LayoutDashboard, label: 'Painel', end: true },
  { to: '/super-admin/tenants', icon: Users, label: 'Lojistas', end: false },
  { to: '/super-admin/financial', icon: DollarSign, label: 'Financeiro', end: false },
  { to: '/super-admin/settings', icon: Settings, label: 'Configurações', end: false },
  { to: '/super-admin/landing', icon: Layout, label: 'Landing Page', end: false },
  { to: '/super-admin/system', icon: ShieldCheck, label: 'Sistema', end: false },
];

export function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/80 backdrop-blur-sm flex flex-col shrink-0 hidden md:flex">
        <div className="h-14 flex items-center gap-3 px-4 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Super Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`
              }
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 px-1 py-1">
        <div className="flex justify-around items-center h-14">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="flex-1"
            >
              {({ isActive }) => (
                <div className={`flex flex-col items-center gap-1 px-1 py-1 rounded-xl transition-all ${
                  isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                }`}>
                  <link.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[9px] font-medium tracking-tight leading-none truncate max-w-[50px]">{link.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}

