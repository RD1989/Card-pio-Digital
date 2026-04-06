import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md glass p-10 text-center"
        >
          <img src={logo} alt="Menu Pro" className="h-28 w-auto mx-auto mb-6" />

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-bold">Verifique seu Email</h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            Enviamos um link de confirmação para o seu email.
            <br />
            Clique no link para ativar sua conta e começar a usar o Menu Pro.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 Não encontrou? Verifique sua pasta de <strong>spam</strong> ou <strong>lixo eletrônico</strong>.
            </p>
          </div>

          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
