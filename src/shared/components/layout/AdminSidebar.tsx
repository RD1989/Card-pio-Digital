import logo from '@/assets/logo.png';
import { LayoutDashboard, BookOpen, BarChart3, Tags, Wallet, Package, Truck, Palette, LogOut, Moon, Sun, Sparkles, Shield, Tag, Clock, Link, ShoppingCart } from 'lucide-react';
import { NavLink } from '@/shared/components/layout/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/shared/stores/global/useThemeStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/shared/components/ui/sidebar';

const menuGroups = [
  {
    label: "Operação e Vendas",
    links: [
      { title: 'Início / Dashboard', url: '/admin', icon: LayoutDashboard },
      { title: 'Gerenciar Pedidos', url: '/admin/orders', icon: ShoppingCart },
    ]
  },
  {
    label: "Gestão do Cardápio",
    links: [
      { title: 'Produtos e Preços', url: '/admin/products', icon: Package },
      { title: 'Organizar / Importar', url: '/admin/menu-import', icon: Sparkles },
      { title: 'Estilo do Cardápio', url: '/admin/branding', icon: Palette },
    ]
  },
  {
    label: "Configurações da Loja",
    links: [
      { title: 'Horários de Abrir', url: '/admin/hours', icon: Clock },
      { title: 'Entrega e Taxas', url: '/admin/delivery', icon: Truck },
      { title: 'Cupons de Desconto', url: '/admin/coupons', icon: Tag },
      { title: 'Bio e Redes Sociais', url: '/admin/links', icon: Link },
    ]
  }
];

const moreLinks = [
  { title: 'Dashboard', url: '/admin/analytics', icon: BarChart3 },
];

export function AdminSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggle } = useThemeStore();
  const { signOut } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const { impersonatedUserId } = useImpersonateStore();
  
  const { status: planStatus } = usePlanStatus();
  const isSuspended = planStatus && !planStatus.isActive;

  const renderLinks = (links: { title: string; url: string; icon: any }[]) =>
    links.map((item) => {
      const isDisabled = isSuspended && item.url !== '/admin' && (!isSuperAdmin || !!impersonatedUserId);
      
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton 
            asChild 
            disabled={isDisabled}
            onClick={() => !isDisabled && isMobile && setOpenMobile(false)}
            className={`h-11 rounded-xl transition-all duration-200 ${isDisabled ? "opacity-30 grayscale cursor-not-allowed pointer-events-none" : ""}`}
          >
            <NavLink
              to={isDisabled ? "#" : item.url}
              end={item.url === '/admin'}
              className="px-3 hover:bg-sidebar-accent/30 group"
              activeClassName="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            >
              <item.icon className="mr-3 h-4.5 w-4.5 shrink-0 group-hover:scale-110 transition-transform" />
              {!collapsed && <span className="text-sm tracking-tight">{item.title}</span>}
              {!collapsed && isDisabled && <Shield className="ml-auto w-3 h-3 opacity-40" />}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <img src={logo} alt="Menu Pro" className={collapsed ? 'h-10 w-auto mx-auto' : 'h-12 w-auto'} />
      </div>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30 px-6 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2 space-y-1">{renderLinks(group.links)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] font-black opacity-30 px-6 mb-2">Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">{renderLinks(moreLinks)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <SidebarMenu className="space-y-1">
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-11 rounded-xl">
                <NavLink
                  to="/super-admin"
                  className="hover:bg-primary/5 text-primary"
                  activeClassName="bg-primary/10 font-bold"
                >
                  <Shield className="mr-3 h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="text-sm">Super Admin</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <div className="h-px bg-sidebar-border my-2 mx-2 opacity-50" />

          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggle} className="h-11 rounded-xl hover:bg-sidebar-accent/50 transition-all">
              <div className="flex items-center w-full">
                {mode === 'dark' ? <Sun className="mr-3 h-4.5 w-4.5 text-amber-500" /> : <Moon className="mr-3 h-4.5 w-4.5 text-blue-600" />}
                {!collapsed && <span className="text-sm font-medium">{mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="h-11 rounded-xl text-destructive hover:bg-destructive/10 transition-all font-semibold"
            >
              <LogOut className="mr-3 h-4.5 w-4.5" />
              {!collapsed && <span className="text-sm">Sair da Conta</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
