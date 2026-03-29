'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // 1. Cria o usuário no Supabase Auth com Redirecionamento Correto
      const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || 'Erro ao criar conta. Tente novamente.');
      }

      // 2. Cria o restaurante vinculado ao User ID
      const slug = restaurantName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
        
      const finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
      const { error: restaurantError } = await supabase.from('restaurants').insert({
        user_id: authData.user.id,
        name: restaurantName,
        slug: finalSlug,
        whatsapp_number: whatsapp,
        plan: 'free',
        is_active: true,
        accent_color: '#f59e0b'
      });

      if (restaurantError) {
        console.error('Erro ao criar restaurante:', restaurantError);
        setSuccess(true);
        setError('Conta criada! Verifique seu e-mail para ativar seu restaurante.');
        return;
      }

      setGeneratedSlug(finalSlug);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 6000);

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
          <Store className="w-8 h-8 text-amber-500 transition-transform group-hover:scale-110" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif italic gold-gradient-text mb-3"
        >
          Bem-vindo ao Menu Pro
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-500 text-sm font-medium tracking-tight"
        >
          Crie seu cardápio digital premium em minutos.
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
          <form onSubmit={handleRegister} className="space-y-6">
            
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

              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Conta criada com sucesso!
                  </div>
                  
                  {generatedSlug && (
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
                       <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Seu link oficial:</p>
                       <p className="text-amber-500 font-serif italic text-lg select-all">
                          {window.location.origin}/b/{generatedSlug}
                       </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Restaurant Name */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
                Nome do Estabelecimento
              </label>
              <div className="relative group">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="text"
                  placeholder="Ex: Pizzaria do Chef"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700"
                  value={restaurantName}
                  onChange={e => setRestaurantName(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
                E-mail Profissional
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            {/* WhatsApp */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
                WhatsApp do Lojista
              </label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] ml-1">
                Senha de Acesso
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 transition-colors group-focus-within:text-amber-500" />
                <input
                  type="password"
                  placeholder="********"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all focus:border-amber-500/50 text-white placeholder:text-zinc-700"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
              disabled={loading || success}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Começar agora gratuitamente
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer inside card */}
          <div className="mt-10 pt-8 border-t border-zinc-800/50 text-center">
            <p className="text-zinc-500 text-sm italic">
              Já faz parte da elite?{' '}
              <Link href="/login" className="text-amber-500 font-bold hover:underline underline-offset-4 ring-offset-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded px-1 transition-all">
                Fazer login
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
        Ao se cadastrar, você concorda com nossos termos e políticas de privacidade.
      </motion.p>
    </div>
  );
}
