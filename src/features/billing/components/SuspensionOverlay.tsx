import { motion } from 'framer-motion';
import { Check, ExternalLink, Sparkles, Rocket, Clock } from 'lucide-react';
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
  const handleActivatePlan = (planType: 'semestral' | 'anual') => {
    const messages = {
      semestral: "Olá! Quero ativar minha Licença Semestral (6 meses).",
      anual: "Olá! Quero ativar minha Licença Anual (12 meses).",
    };
    
    const whatsapp = "22996051620";
    const text = encodeURIComponent(messages[planType]);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  };

  const plans: any[] = [
    {
      id: 'semestral',
      name: 'Licença Semestral',
      subtitle: '6 Meses de Acesso',
      price: 'R$ 139,00',
      savings: 'Pagamento Único',
      features: ['Pedidos ILIMITADOS', 'Gestão Completa', 'QR Code de Mesa', 'Suporte Especializado'],
      buttonText: 'Ativar Semestral',
      icon: Clock
    },
    {
      id: 'anual',
      name: 'Licença Anual',
      subtitle: '12 Meses de Acesso',
      price: 'R$ 197,00',
      savings: 'Melhor Custo-Benefício',
      features: ['Tudo do Semestral', 'Importação com IA', 'Etiquetas Térmicas', 'Suporte Prioritário VIP'],
      buttonText: 'Ativar Anual',
      highlight: true,
      icon: Sparkles
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-3 max-w-2xl">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-pill animate-pulse">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-foreground">Seu teste de 7 dias terminou</h2>
        <p className="text-muted-foreground font-medium text-sm">Escolha sua licença e continue vendendo sem pagar taxas mensais ou por pedido.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
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
            
            <div className="mb-6 text-left">
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

            <ul className="space-y-3 mb-8 flex-1 text-left">
              {plan.features.map((feature, idx) => (
                <li key={idx} className={`text-[13px] flex items-center gap-3 ${idx === 0 ? 'font-bold text-primary italic' : 'font-medium opacity-80'}`}>
                  <Check className="w-4 h-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full h-11 gap-2 font-bold text-sm ${
                plan.highlight 
                  ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10' 
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
          Ativação via WhatsApp • Suporte imediato para renovação de planos
        </p>
      </div>
    </div>
  );
}
