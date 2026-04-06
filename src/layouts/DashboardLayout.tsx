import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/shared/components/layout/DashboardSidebar';
import { MobileSidebar } from '@/shared/components/layout/MobileSidebar';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <DashboardSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 border-b border-border bg-card md:hidden sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-gradient font-bold text-lg ml-3">Menu Pro</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
