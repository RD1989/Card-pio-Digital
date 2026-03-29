'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  LogIn, 
  AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore() as any;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        console.error('❌ ERRO DURANTE O LOGIN:', signInError);
        
        if (signInError.message.includes('Email not confirmed')) {
          setError('Sua conta precisa de confirmação de e-mail. Verifique sua caixa de entrada.');
        } else {
          setError('E-mail ou senha incorretos. Tente novamente.');
        }
        return;
      }

      console.log('✅ LOGIN BEM-SUCEDIDO:', data.user?.email);
      
      // Busca o restaurante vinculado ao usuário
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', data.user!.id)
        .single();

      // Salva os dados no store para o painel usar
      setAuth({
        id: data.user!.id,
        email: data.user!.email || '',
        name: restaurantData?.name || data.user!.email || '',
        restaurant: restaurantData || null,
        is_super_admin: data.user!.email === 'rodrigotechpro@gmail.com',
      }, data.session?.access_token || '');

      // Sincroniza cookies com o servidor antes de redirecionar
      router.refresh();
      
      // Redirecionamento forçado para garantir limpeza de cache/estado
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-center mb-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-6 group"
        >
          <Building2 className="w-8 h-8 text-amber-500 transition-transform group-hover:scale-110" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif italic gold-gradient-text mb-3"
        >
          Bem-vindo de volta
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-sm font-medium tracking-tight"
        >
          Acesse sua conta para gerenciar seu estabelecimento.
        </motion.p>
      </div>

      {/* Main Card */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-card shadow-2xl rounded-[2.5rem] overflow-hidden border border-zinc-800/50"
      >
        <div className="p-8 md:p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
                E-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700 font-medium"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                  Senha
                </label>
                <Link href="#" className="text-[9px] font-black uppercase text-amber-500/60 hover:text-amber-500 transition-colors tracking-widest">
                   Esqueceu a senha?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="password"
                  placeholder="********"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700 font-medium"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full accent-btn py-5 rounded-2xl shadow-xl shadow-amber-500/10 font-black uppercase text-xs tracking-[0.1em] flex items-center justify-center gap-3 transition-all disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer inside card */}
          <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-zinc-500 text-sm italic">
              Ainda não é um parceiro?{' '}
              <Link href="/register" className="text-amber-500 font-bold hover:underline underline-offset-4 ring-offset-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded px-1 transition-all">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center text-zinc-700 text-[10px] font-medium uppercase tracking-widest max-w-xs mx-auto"
      >
        Acesso restrito a usuários autorizados Menu Pro ⚡ premium.
      </motion.p>
    </div>
  );
}
