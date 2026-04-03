import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Informe seu email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
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
            <h1 className="text-2xl font-bold">{sent ? 'Email Enviado!' : 'Esqueceu a Senha?'}</h1>
            <p className="text-muted-foreground text-sm mt-2">
              {sent
                ? 'Verifique seu email para redefinir a senha.'
                : 'Informe seu email e enviaremos um link para redefinir.'}
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Verifique também a pasta de <strong>spam</strong>.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                <ArrowLeft className="w-4 h-4" /> Voltar para o Login
              </Link>
            </div>
          ) : (
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enviar Link <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary font-medium hover:underline">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />Voltar para o Login
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
