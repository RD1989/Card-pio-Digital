import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PaymentDialog } from './PaymentDialog';

export function SuspensionOverlay() {
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null);

  const plans = {
    diy: {
      id: 'diy',
      name: 'Faça Você Mesmo',
      desc: 'Licença do sistema para você mesmo configurar',
      priceSemestral: '129',
      priceAnnual: '229',
      features: [
        'Pedidos ILIMITADOS',
        'Produtos ILIMITADOS',
        'Integrado com WhatsApp',
        'QR Code de Mesa Exclusivo'
      ],
    },
    dfy: {
      id: 'dfy',
      name: 'Nós Configuramos (VIP)',
      desc: 'Licença + Setup Completo Feito Por Nossa Equipe',
      priceSemestral: '197',
      priceAnnual: '297',
      features: [
        'Nós criamos o seu cardápio do zero',
        'Cadastramos todos os produtos',
        'Buscamos imagens premium',
        'Criamos um Banner Exclusivo',
        'Suporte VIP no WhatsApp'
      ],
    }
  };

  const handleOpenPayment = (id: 'diy' | 'dfy') => {
    const plan = plans[id];
    const planId = isAnnual ? `${id}_anual` : `${id}_semestral`;
    const price = isAnnual ? plan.priceAnnual : plan.priceSemestral;
    
    setSelectedPlan({
      id: planId,
      name: `${plan.name} (${isAnnual ? 'Anual' : 'Semestral'})`,
      price
    });
    setPaymentModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 w-full h-full min-h-screen relative bg-muted/40 animate-in fade-in zoom-in duration-500 overflow-y-auto">
      {/* Background Blurs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center space-y-3 max-w-2xl relative z-10 mx-auto mt-10">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-pill animate-pulse">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-foreground">Sua licença expirou</h2>
        <p className="text-muted-foreground font-medium text-sm">Escolha sua licença de renovação e retome suas vendas 100% livre de taxas predatórias.</p>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10 mt-8 mb-16">
        {/* Toggle Semestral / Anual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          {/* Plano DIY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-lg hover:border-primary/30 transition-colors"
          >
            <h3 className="font-extrabold text-xl">{plans.diy.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{plans.diy.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-xl font-bold text-muted-foreground">R$</span>
              <span className="text-4xl font-black tracking-tighter text-foreground">
                {isAnnual ? plans.diy.priceAnnual : plans.diy.priceSemestral}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-semibold">Uma única vez a cada {isAnnual ? '12 meses' : '6 meses'}</p>
            <div className="mt-6 space-y-3">
              {plans.diy.features.map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-[13px]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="leading-tight opacity-90 font-medium">{f}</span>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleOpenPayment('diy')}
              variant="outline"
              className="mt-8 w-full h-12 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-all"
            >
              ATIVAR LICENÇA
            </Button>
          </motion.div>

          {/* Plano DFY (Premium) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border-2 border-primary rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl scale-[1.02] z-10 bg-primary/5"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
            <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
              Diferencial
            </div>
            <h3 className="font-extrabold text-xl text-primary">{plans.dfy.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{plans.dfy.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary/70">R$</span>
              <span className="text-4xl font-black tracking-tighter text-primary drop-shadow-sm">
                {isAnnual ? plans.dfy.priceAnnual : plans.dfy.priceSemestral}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-semibold">Renove sua licença + Refizemos tudo se precisar</p>
            <div className="mt-6 space-y-2 relative z-10">
              {plans.dfy.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px] bg-background/50 p-2 rounded border border-border/50">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="leading-tight font-semibold opacity-90">{f}</span>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => handleOpenPayment('dfy')}
              className="mt-6 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all glow-primary gap-2"
            >
              <Sparkles className="w-4 h-4" /> ATIVAR RENOVAÇÃO VIP
            </Button>
          </motion.div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-[11px] font-semibold text-muted-foreground">
            A ativação é concluída imediatamente após o pagamento PIX.
          </p>
        </div>
      </div>

      {user && selectedPlan && (
        <PaymentDialog 
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          userId={user.id}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          price={selectedPlan.price}
        />
      )}
    </div>
  );
}

