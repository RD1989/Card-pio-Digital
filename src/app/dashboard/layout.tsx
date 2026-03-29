'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Visão Geral', icon: '📊' },
  { href: '/dashboard/produtos', label: 'Cardápio', icon: '🍽️' },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: '📦' },
  { href: '/dashboard/aparencia', label: 'Aparência', icon: '🎨' },
  { href: '/dashboard/pagamentos', label: 'Pagamentos', icon: '💳' },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px', minWidth: '240px',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '8px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🍽️</span>
            <span style={{ fontWeight: '700', fontSize: '17px' }} className="gradient-text">
              CardápioPro
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontSize: '14px', fontWeight: active ? '600' : '400',
                  color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
                  background: active ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                  border: active ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          id="dashboard-logout"
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--color-text-muted)', fontSize: '14px', cursor: 'pointer',
            width: '100%', transition: 'all 0.2s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5'; }}
          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
        >
          <span>🚪</span> Sair da conta
        </button>
      </aside>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
