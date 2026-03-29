'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto' }} className="animate-fade-in-up">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'var(--gradient-brand)', marginBottom: '16px',
          fontSize: '28px',
        }}>
          🍽️
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>
          Bem-vindo de volta
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
          Entre na sua conta para gerenciar seu cardápio
        </p>
      </div>

      {/* Card */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="form-label">E-mail</label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="form-label">Senha</label>
            <input
              id="login-password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Entrando...
              </span>
            ) : 'Entrar no Painel'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Não tem uma conta?{' '}
            <Link href="/register" style={{ color: '#a78bfa', fontWeight: '500', textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
