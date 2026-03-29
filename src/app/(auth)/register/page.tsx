'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    // 1. Cria o usuário no Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Erro ao criar conta. Tente novamente.');
      setLoading(false);
      return;
    }

    // 2. Cria o restaurante vinculado ao User ID
    const slug = restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error: restaurantError } = await supabase.from('restaurants').insert({
      user_id: authData.user.id,
      name: restaurantName,
      slug: `${slug}-${Date.now()}`,
      plan: 'free',
      is_active: true,
    });

    if (restaurantError) {
      setError('Conta criada! Mas houve um erro ao configurar seu restaurante. Faça login e configure nas configurações.');
    }

    router.push('/dashboard');
  }

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto' }} className="animate-fade-in-up">
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
          Crie sua conta grátis
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
          Configure seu cardápio digital em menos de 2 minutos
        </p>
      </div>

      {/* Card */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="form-label">Nome do seu Restaurante</label>
            <input
              id="register-restaurant"
              type="text"
              className="input-field"
              placeholder="Ex: Pizzaria do Chef"
              value={restaurantName}
              onChange={e => setRestaurantName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">E-mail</label>
            <input
              id="register-email"
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
              id="register-password"
              type="password"
              className="input-field"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button id="register-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? 'Criando sua conta...' : 'Criar Conta Grátis →'}
          </button>

          <p style={{ color: 'var(--color-text-subtle)', fontSize: '12px', textAlign: 'center' }}>
            Ao criar uma conta, você concorda com nossos Termos de Serviço.
          </p>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Já tem uma conta?{' '}
            <Link href="/login" style={{ color: '#a78bfa', fontWeight: '500', textDecoration: 'none' }}>
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
