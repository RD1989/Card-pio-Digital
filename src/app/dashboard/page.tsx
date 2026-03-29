'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  products: number;
  orders: number;
  views: number;
  revenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, views: 0, revenue: 0 });
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca dados do restaurante
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (restaurant) {
        setRestaurantName(restaurant.name);

        // Busca métricas em paralelo
        const [productsRes, ordersRes, viewsRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact' }).eq('restaurant_id', restaurant.id),
          supabase.from('orders').select('id, total_amount', { count: 'exact' }).eq('restaurant_id', restaurant.id),
          supabase.from('views').select('id', { count: 'exact' }).eq('restaurant_id', restaurant.id),
        ]);

        const revenue = (ordersRes.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

        setStats({
          products: productsRes.count || 0,
          orders: ordersRes.count || 0,
          views: viewsRes.count || 0,
          revenue,
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const METRIC_CARDS = [
    { label: 'Total de Produtos', value: stats.products, icon: '🍽️', color: '#7c3aed' },
    { label: 'Pedidos Recebidos', value: stats.orders, icon: '📦', color: '#db2777' },
    { label: 'Visualizações', value: stats.views, icon: '👁️', color: '#f97316' },
    { label: 'Receita Total', value: `R$ ${stats.revenue.toFixed(2)}`, icon: '💰', color: '#10b981' },
  ];

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }} className="animate-fade-in-up">
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {loading ? '...' : `Olá, ${restaurantName || 'Lojista'}! 👋`}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
          Aqui está um resumo do seu cardápio digital
        </p>
      </div>

      {/* Cards de Métricas */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px', marginBottom: '40px',
      }}>
        {METRIC_CARDS.map((card, i) => (
          <div
            key={card.label}
            className="glass-card animate-fade-in-up"
            style={{ padding: '24px', animationDelay: `${i * 0.1}s` }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                background: `${card.color}22`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px',
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: card.color }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Ações Rápidas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Adicionar Produto', icon: '➕', href: '/dashboard/produtos' },
            { label: 'Ver Cardápio Público', icon: '🔗', href: '#' },
            { label: 'Importar com IA', icon: '🤖', href: '/dashboard/produtos' },
            { label: 'Configurar Pix', icon: '💳', href: '/dashboard/pagamentos' },
          ].map(action => (
            <a
              key={action.label}
              href={action.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px 20px', borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                textDecoration: 'none', color: 'var(--color-text)',
                fontSize: '14px', fontWeight: '500',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(124,58,237,0.4)';
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(124,58,237,0.08)';
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-surface-2)';
              }}
            >
              <span style={{ fontSize: '20px' }}>{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
