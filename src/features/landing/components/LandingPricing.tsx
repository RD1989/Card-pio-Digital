import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PricingProps {
  basicFeatures: string[];
  proFeatures: string[];
}

export function LandingPricing({ basicFeatures, proFeatures }: PricingProps) {
  return (
    <section id="pricing" className="py-20 px-6 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Tudo o que seu{' '}
            <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">sistema próprio</span> oferece
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Tecnologia de ponta para o seu delivery crescer sem amarras. Teste tudo por 10 dias.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* Basic */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-4 py-1 rounded-bl-xl">
              10 dias de teste grátis
            </div>
            <h3 className="font-bold text-lg">Essenciais do Sistema</h3>
            <p className="text-xs text-muted-foreground mt-1">A base sólida para sua operação digital</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold uppercase tracking-tighter text-primary">SISTEMA PRÓPRIO</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Livre-se das mensalidades para sempre</p>
            <div className="mt-6 space-y-2.5">
              {basicFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{f.trim()}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="mt-7 block w-full text-center py-3.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-primary-foreground shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all">
              COMEÇAR GRÁTIS
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card border-2 border-primary rounded-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 flex">
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 text-center">Tecnologia IA</span>
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest font-black">Diferencial</span>
            </div>
            <h3 className="font-bold text-lg">Inteligência & Escala</h3>
            <p className="text-xs text-muted-foreground mt-1">Ferramentas avançadas para quem quer liderar o mercado</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold uppercase tracking-tighter">SEM TAXAS</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">A solução definitiva para o seu delivery</p>
            <div className="mt-6 space-y-2.5">
              {proFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>{f.trim()}</span>
                </div>
              ))}
            </div>
            <a 
              href={`https://wa.me/22996051620?text=${encodeURIComponent("Olá! Quero assinar o plano Pro e ter meu próprio sistema de delivery.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 block w-full text-center py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all glow-primary"
            >
              ASSINAR PLANO PRO →
            </a>
          </motion.div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-5">🎉 Conheça o nosso sistema sem compromisso, usufrua de todos os recursos gratuitamente por 10 dias.</p>
      </div>
    </section>
  );
}
