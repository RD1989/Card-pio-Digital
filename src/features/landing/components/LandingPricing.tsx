import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface PricingProps {
  basicFeatures: string[];
  proFeatures: string[];
}

export function LandingPricing({ basicFeatures, proFeatures }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = {
    diy: {
      name: 'Faça Você Mesmo',
      desc: 'Licença do sistema para você mesmo configurar',
      priceSemestral: '129',
      priceAnnual: '229',
      whatsappText: encodeURIComponent('Olá! Quero a Licença Plan Faça Você Mesmo e montar meu próprio cardápio digital.'),
    },
    dfy: {
      name: 'Nós Configuramos (VIP)',
      desc: 'Licença + Setup Completo Feito Por Nossa Equipe',
      priceSemestral: '197',
      priceAnnual: '297',
      whatsappText: encodeURIComponent('Olá! Quero a Licença VIP com Setup Completo. Quero que vocês montem meu cardápio digital hoje mesmo!'),
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-muted/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Liberte-se das taxas com uma{' '}
            <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">Licença Única</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Sem mensalidades ou taxas por pedido. Pague o aluguel do software e venda 100% livre.</p>
        </motion.div>

        {/* Toggle Semestral / Anual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <div className="bg-card border border-border p-1.5 rounded-full inline-flex font-semibold text-sm relative shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 px-6 py-2.5 rounded-full transition-colors duration-300 ${!isAnnual ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Semestral
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 px-6 py-2.5 rounded-full transition-colors duration-300 ${isAnnual ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Anual <span className="absolute -top-3 -right-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-md">+Lucro</span>
            </button>
            {/* Indicador Deslizante */}
            <div 
              className={`absolute top-1.5 left-1.5 bottom-1.5 w-[105px] bg-primary rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isAnnual ? 'translate-x-[102px]' : 'translate-x-0'}`} 
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* Plano DIY */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-3xl p-8 lg:p-10 relative overflow-hidden shadow-lg hover:border-primary/30 transition-colors"
          >
            <h3 className="font-extrabold text-xl">{plans.diy.name}</h3>
            <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plans.diy.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-xl font-bold text-muted-foreground">R$</span>
              <span className="text-5xl font-black tracking-tighter text-foreground">
                {isAnnual ? plans.diy.priceAnnual : plans.diy.priceSemestral}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Uma única vez a cada {isAnnual ? '12 meses' : '6 meses'}</p>
            <div className="mt-8 space-y-3">
              {basicFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="leading-tight opacity-90">{f.trim()}</span>
                </div>
              ))}
            </div>
            <a 
              href={`https://wa.me/22996051620?text=${plans.diy.whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 flex items-center justify-center w-full py-4 rounded-xl border-2 border-primary text-primary font-bold text-sm tracking-wide hover:bg-primary/5 active:scale-95 transition-all"
            >
              ASSINAR AGORA
            </a>
          </motion.div>

          {/* Plano DFY (Premium) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card border-2 border-primary rounded-3xl p-8 lg:p-10 relative overflow-hidden shadow-2xl shadow-primary/10"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-bl-2xl">
              MAIS ESCOLHIDO
            </div>
            <h3 className="font-extrabold text-xl text-primary">{plans.dfy.name}</h3>
            <p className="text-sm text-muted-foreground mt-2 min-h-[40px]">{plans.dfy.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary/70">R$</span>
              <span className="text-5xl font-black tracking-tighter text-primary drop-shadow-sm">
                {isAnnual ? plans.dfy.priceAnnual : plans.dfy.priceSemestral}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-semibold">Inclui licença + Configuração por I.A e Especialistas</p>
            <div className="mt-8 space-y-3 relative z-10">
              <div className="flex items-start gap-3 text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="leading-tight font-bold">Nós criamos o seu cardápio digital do zero</span>
              </div>
              <div className="flex items-start gap-3 text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="leading-tight font-bold">Cadastramos todos os seus produtos</span>
              </div>
              <div className="flex items-start gap-3 text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="leading-tight font-bold">Buscamos as imagens perfeitas para os pratos</span>
              </div>
              <div className="flex items-start gap-3 text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="leading-tight font-bold">Criamos um Banner Exclusivo com sua marca</span>
              </div>
              <div className="flex items-start gap-3 text-sm bg-primary/5 p-2 rounded-lg border border-primary/10">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="leading-tight font-bold">Entregamos o sistema 100% pronto para vender</span>
              </div>
              {proFeatures.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm px-2">
                  <Check className="w-4 h-4 text-primary shrink-0 opacity-80" />
                  <span className="leading-tight opacity-90">{f.trim()}</span>
                </div>
              ))}
            </div>
            <a 
              href={`https://wa.me/22996051620?text=${plans.dfy.whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-8 flex items-center justify-center w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all overflow-hidden glow-primary group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">QUERO O SISTEMA PRONTO →</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
