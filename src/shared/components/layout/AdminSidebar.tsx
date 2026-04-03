import logo from '@/assets/logo.png';
import { LayoutDashboard, BookOpen, BarChart3, Tags, Wallet, Package, Truck, Palette, LogOut, Moon, Sun, Sparkles, Shield, Tag, Clock, Link, ShoppingCart } from 'lucide-react';
import { NavLink } from '@/shared/components/layout/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/shared/stores/global/useThemeStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSuperAdmin } from '@/features/super-admin/hooks/useSuperAdmin';
import { usePlanStatus } from '@/features/billing/hooks/usePlanStatus';

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

const mainLinks = [
  { title: 'Meu Painel', url: '/admin', icon: LayoutDashboard },
  { title: 'Pedidos', url: '/admin/orders', icon: ShoppingCart },
  { title: 'Produtos', url: '/admin/products', icon: Package },
  { title: 'Importar Cardápio', url: '/admin/menu-import', icon: Sparkles },
  { title: 'Cupons', url: '/admin/coupons', icon: Tag },
  { title: 'Entregas', url: '/admin/delivery', icon: Truck },
  { title: 'Horários', url: '/admin/hours', icon: Clock },
  { title: 'Identidade', url: '/admin/branding', icon: Palette },
  { title: 'Link na Bio', url: '/admin/links', icon: Link },
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
  
  const { status: planStatus } = usePlanStatus();
  const isSuspended = planStatus && !planStatus.isActive;

  const renderLinks = (links: typeof mainLinks) =>
    links.map((item) => {
      const isDisabled = isSuspended && item.url !== '/admin';
      
      return (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton 
            asChild 
            disabled={isDisabled}
            onClick={() => !isDisabled && isMobile && setOpenMobile(false)}
            className={isDisabled ? "opacity-50 grayscale cursor-not-allowed pointer-events-none" : ""}
          >
            <NavLink
              to={isDisabled ? "#" : item.url}
              end={item.url === '/admin'}
              className="hover:bg-sidebar-accent/50"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="mr-2 h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.title} {isDisabled && "🔒"}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar collapsible="icon">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <img src={logo} alt="Menu Pro" className={collapsed ? 'h-14 w-auto mx-auto' : 'h-16 w-auto'} />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderLinks(mainLinks)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderLinks(moreLinks)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isSuperAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/super-admin"
                  className="hover:bg-sidebar-accent/50 text-primary"
                  activeClassName="bg-primary/10 font-medium"
                >
                  <Shield className="mr-2 h-4 w-4 shrink-0" />
                  {!collapsed && <span>Super Admin</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggle} className="hover:bg-sidebar-accent/50">
              {mode === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {!collapsed && <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
