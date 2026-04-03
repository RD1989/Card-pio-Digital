import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Check for recovery session in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      // Supabase will auto-set the session from the hash
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
      setTimeout(() => navigate('/admin'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md glass p-10"
        >
          <div className="text-center mb-8">
            <img src={logo} alt="Menu Pro" className="h-28 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold">{success ? 'Senha Atualizada!' : 'Nova Senha'}</h1>
            <p className="text-muted-foreground text-sm mt-2">
              {success ? 'Redirecionando para o painel...' : 'Crie uma nova senha para sua conta.'}
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Nova senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Salvar Senha <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
