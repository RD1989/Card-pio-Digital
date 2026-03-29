import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--color-border)',
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🍽️</span>
          <span style={{ fontWeight: '700', fontSize: '18px', color: 'white' }}>CardápioPro</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" style={{
            padding: '10px 20px', borderRadius: '10px',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)', textDecoration: 'none',
            fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
          }}>
            Entrar
          </Link>
          <Link href="/register" style={{
            padding: '10px 20px', borderRadius: '10px',
            background: 'var(--gradient-brand)',
            color: 'white', textDecoration: 'none',
            fontSize: '14px', fontWeight: '600',
          }}>
            Começar Grátis →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: '100px 48px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Orb decorativo */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa', fontSize: '13px', fontWeight: '500', marginBottom: '24px',
          }}>
            ✨ Cardápio Digital com Inteligência Artificial
          </div>

          <h1 style={{
            fontSize: '64px', fontWeight: '800', lineHeight: '1.1',
            marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px',
          }}>
            Seu cardápio digital{' '}
            <span className="gradient-text">profissional</span>
            {' '}em minutos
          </h1>

          <p style={{
            fontSize: '20px', color: 'var(--color-text-muted)',
            maxWidth: '560px', margin: '0 auto 40px', lineHeight: '1.7',
          }}>
            Crie, gerencie e compartilhe o cardápio do seu restaurante. Com QR Code, Pix integrado e importação por IA.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '16px 32px', borderRadius: '12px',
              background: 'var(--gradient-brand)',
              color: 'white', textDecoration: 'none',
              fontSize: '16px', fontWeight: '700',
              boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            }}>
              Criar meu cardápio grátis
            </Link>
            <Link href="/login" style={{
              padding: '16px 32px', borderRadius: '12px',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)', textDecoration: 'none',
              fontSize: '16px', fontWeight: '600',
              background: 'var(--color-surface)',
            }}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 48px 100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '36px', fontWeight: '700', marginBottom: '48px' }}>
          Tudo que você precisa em um só lugar
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px', maxWidth: '1100px', margin: '0 auto',
        }}>
          {[
            { icon: '🤖', title: 'Importação por IA', desc: 'Envie uma foto ou PDF do seu cardápio e a IA cria tudo automaticamente.' },
            { icon: '💳', title: 'Pix Integrado', desc: 'Receba pagamentos direto no cardápio via QR Code Pix da Efí Bank.' },
            { icon: '📱', title: 'QR Code Exclusivo', desc: 'Compartilhe o link ou imprima o QR Code para suas mesas.' },
            { icon: '🎨', title: 'Personalização Total', desc: 'Cores, logo e identidade visual do seu negócio.' },
            { icon: '📊', title: 'Métricas em Tempo Real', desc: 'Veja pedidos, visualizações e faturamento no painel.' },
            { icon: '🔒', title: 'Multi-Lojista Seguro', desc: 'Cada lojista vê apenas os seus dados. RLS do Supabase.' },
          ].map(feature => (
            <div key={feature.title} className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '32px',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-subtle)', fontSize: '14px',
      }}>
        © 2025 CardápioPro · Feito com ❤️ no Brasil
      </footer>
    </div>
  );
}
