import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PhoneSimulator } from '@/shared/components/common/PhoneSimulator';
import { Button } from '@/shared/components/ui/button';

interface HeroProps {
  badge: string;
  title: string;
  subtitle: string;
  onScrollToFeatures: () => void;
}

export function LandingHero({ badge, title, subtitle, onScrollToFeatures }: HeroProps) {
  return (
    <section className="relative pt-24 pb-16 px-6 lg:pt-28 lg:pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex-1 text-center lg:text-left"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-5">
            {badge}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4rem] font-black tracking-tighter leading-[1.05]">
            {title.includes('Cardápio Digital') ? (
              <>
                Seu <span className="text-gradient">Cardápio Digital</span>{' '}
                Próprio, Simples e <span className="text-gradient">Poderoso</span>
              </>
            ) : (
              <span className="text-gradient">{title}</span>
            )}
          </h1>
          <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all glow-primary"
            >
              CRIAR CONTA GRÁTIS
            </Link>
            <Button
              onClick={onScrollToFeatures}
              variant="outline"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-foreground/25 dark:border-white/30 text-foreground font-semibold text-sm hover:bg-foreground/5 dark:hover:bg-white/10 hover:border-foreground/40 dark:hover:border-white/50 transition-all h-auto"
            >
              VER RECURSOS
            </Button>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">💳 Sem mensalidades · ⚙️ Setup em 2 min · 🎁 7 dias grátis</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          className="flex-1 flex justify-center relative"
        >
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
          <PhoneSimulator />
        </motion.div>
      </div>
    </section>
  );
}
