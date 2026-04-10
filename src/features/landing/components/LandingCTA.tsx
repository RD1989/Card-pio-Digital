import { motion } from 'framer-motion';
import { Download, Smartphone } from 'lucide-react';
import { usePwa } from '@/shared/contexts/PwaContext';

interface CTAProps {
  title: string;
  subtitle: string;
}

export function LandingCTA({ title, subtitle }: CTAProps) {
  const { installApp, isInstalled } = usePwa();

  return (
    <section className="py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-[3rem] p-12 sm:p-20 text-center landing-cta-card group"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/30 transition-all duration-1000" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/25 transition-all duration-1000" />

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.1]" style={{ color: 'hsl(var(--nav-foreground))' }}>
            {title.includes('DELIVERY') ? (
              <>
                VALORIZE SEU{' '}
                <span className="text-gradient drop-shadow-sm">DELIVERY</span>{' '}
                HOJE
              </>
            ) : title}
          </h2>
          <p className="mt-6 text-sm sm:text-base max-w-xl mx-auto opacity-70 leading-relaxed" style={{ color: 'hsl(var(--nav-foreground))' }}>
            {subtitle}
          </p>
          
          <div className="mt-12 flex flex-col items-center justify-center">
            {!isInstalled ? (
              <button
                onClick={installApp}
                className="landing-cta-install-btn inline-flex items-center justify-center gap-4 px-12 py-6 w-full sm:w-auto rounded-2xl text-lg shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95"
              >
                <Download className="w-7 h-7 animate-bounce" />
                Instalar sistema
              </button>
            ) : (
              <a
                href="/login"
                className="landing-cta-install-btn inline-flex items-center justify-center gap-4 px-12 py-6 w-full sm:w-auto rounded-2xl text-lg shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95"
              >
                <Smartphone className="w-7 h-7" />
                Entrar no Sistema
              </a>
            )}
            
            <p className="mt-6 text-[10px] uppercase tracking-[0.3em] font-bold opacity-40" style={{ color: 'hsl(var(--nav-foreground))' }}>
              ⚙️ SETUP EM 2 MINUTOS · 🎁 TESTE GRÁTIS
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
