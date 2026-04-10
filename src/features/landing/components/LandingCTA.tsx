import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePwa } from '@/shared/contexts/PwaContext';

interface CTAProps {
  title: string;
  subtitle: string;
}

export function LandingCTA({ title, subtitle }: CTAProps) {
  const { installApp, isInstalled, isInstallable } = usePwa();

  return (
    <section className="py-16 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-[2rem] p-12 sm:p-16 text-center relative overflow-hidden"
        style={{ background: 'hsl(var(--cta-bg))' }}
      >
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'hsl(var(--nav-foreground))' }}>
            {title.includes('DELIVERY') ? (
              <>
                TRANSFORME SEU{' '}
                <span className="font-display italic underline decoration-primary/40 underline-offset-4 text-primary">DELIVERY</span>{' '}
                AGORA
              </>
            ) : title}
          </h2>
          <p className="mt-4 text-sm max-w-lg mx-auto" style={{ color: 'hsl(var(--nav-foreground) / 0.7)' }}>
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-primary"
            >
              CRIAR MINHA CONTA GRÁTIS <ArrowRight className="w-4 h-4" />
            </Link>
            
            {!isInstalled && (
              <button
                onClick={installApp}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto rounded-xl bg-white text-black font-extrabold shadow-2xl shadow-white/10 hover:bg-neutral-100 transition-all border border-white/20 active:scale-95"
              >
                <Download className="w-5 h-5" />
                INSTALAR SISTEMA E ENTRAR
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
