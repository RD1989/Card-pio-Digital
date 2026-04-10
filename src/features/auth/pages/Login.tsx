import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GlassNavbar } from '@/shared/components/layout/GlassNavbar';
import logo from '@/assets/logo.png';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { PwaInstallBanner } from '@/shared/components/common/PwaInstallBanner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos'
        : error.message === 'Email not confirmed'
        ? 'Confirme seu email antes de entrar'
        : error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', {
          _user_id: user.id,
        });

        if (isSuperAdmin) {
          toast.success('Login realizado com sucesso!');
          navigate('/super-admin');
          return;
        }

        // Check if onboarding is needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('whatsapp')
          .eq('user_id', user.id)
          .single();

        if (!profile?.whatsapp || profile.whatsapp.length < 5) {
          navigate('/onboarding');
          return;
        }
      }
      toast.success('Login realizado com sucesso!');
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PwaInstallBanner />
      <GlassNavbar />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="min-h-screen flex items-center justify-center px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md glass p-10"
        >
          <div className="text-center mb-8">
            <img src={logo} alt="Menu Pro" className="h-28 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
            <p className="text-muted-foreground text-sm mt-2">Entre na sua conta Menu Pro</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm text-muted-foreground mt-6">
            <p>
              Não tem conta?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Criar conta
              </Link>
            </p>
            <Link to="/forgot-password" className="text-primary font-medium hover:underline">
              Esqueci a senha
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

