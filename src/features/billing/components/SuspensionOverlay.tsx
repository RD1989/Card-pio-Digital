import { motion } from 'framer-motion';
import { Check, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface Plan {
  id: 'monthly' | 'basic' | 'pro';
  name: string;
  subtitle: string;
  price: string;
  savings?: string;
  features: string[];
  buttonText: string;
  icon?: any;
  highlight?: boolean;
}

export function SuspensionOverlay() {
  const handleActivatePlan = (planType: 'monthly' | 'basic' | 'pro') => {
    const messages = {
      monthly: "Olá! Quero renovar meu Plano Mensal.",
      basic: "Olá! Quero renovar meu Plano Semestral.",
      pro: "Olá! Quero renovar meu Plano Anual.",
    };
    
    const whatsapp = "22996051620";
    const text = encodeURIComponent(messages[planType]);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const plans: Plan[] = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      subtitle: 'Pagamento Mês a Mês',
      price: 'R$ 1,00',
      savings: 'para teste',
      features: ['Pedidos ILIMITADOS', 'Gestão Completa', 'Suporte via Chat'],
      buttonText: 'Renovar Mensal',
    },
    {
      id: 'basic',
      name: 'Plano Semestral',
      subtitle: '6 Meses de Acesso',
      price: 'R$ 97,00',
      savings: 'economize 35%',
      features: ['Pedidos ILIMITADOS', 'Produtos ILIMITADOS', 'IA (Importação Ilimitada)'],
      buttonText: 'Renovar Semestral',
      highlight: true,
      icon: Sparkles
    },
    {
      id: 'pro',
      name: 'Plano Anual',
      subtitle: 'Acesso Total ILIMITADO',
      price: 'R$ 169,00',
      savings: 'economize 45%',
      features: ['Pedidos ILIMITADOS', 'IA ILIMITADA', 'VIP Support'],
      buttonText: 'Renovar Anual',
      icon: Sparkles
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight">Sua conta está suspensa</h2>
        <p className="text-muted-foreground">Escolha um dos planos abaixo para reativar seu acesso instantaneamente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-sm p-6 flex flex-col border-2 relative overflow-hidden transition-all duration-300 ${
              plan.highlight 
                ? 'border-primary/40 bg-primary/5 shadow-xl scale-105 z-10' 
                : 'border-border hover:border-primary/30'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[9px] font-black px-3 py-1 uppercase tracking-wider">
                Melhor Custo-Benefício
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {plan.icon && <plan.icon className={`w-4 h-4 ${plan.id === 'pro' ? 'text-amber-500 fill-amber-500' : 'text-primary'}`} />}
              </div>
              <p className="text-xs text-muted-foreground font-medium">{plan.subtitle}</p>
              <div className="mt-4">
                <p className={`text-3xl font-black ${plan.highlight ? 'text-primary' : 'text-foreground'}`}>{plan.price}</p>
                {plan.savings && <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{plan.savings}</p>}
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`text-[13px] flex items-center gap-3 ${idx === 0 ? 'font-bold text-primary italic' : 'font-medium opacity-80'}`}>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full h-11 gap-2 font-bold text-sm ${
                plan.highlight 
                  ? 'bg-primary hover:bg-primary/90 text-white' 
                  : plan.id === 'pro' ? 'bg-foreground hover:bg-foreground/90 text-background' : 'variant-outline'
              }`}
              variant={plan.highlight || plan.id === 'pro' ? 'default' : 'outline'}
              onClick={() => handleActivatePlan(plan.id)}
            >
              {plan.id === 'basic' ? <Sparkles className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              {plan.buttonText}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-2 opacity-60">
        <p className="text-xs font-semibold text-muted-foreground">
          Liberação manual via WhatsApp • Pagamento único (sem renovação automática)
        </p>
      </div>
    </div>
  );
}
