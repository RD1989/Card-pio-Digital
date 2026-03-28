import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 29,90',
    description: 'Para quem está começando a crescer.',
    features: [
      'Até 30 Produtos',
      'Até 100 Pedidos por Mês',
      'Cores Personalizáveis',
      'Painel de Vendas',
    ]
  },
  {
    id: 'pro',
    name: 'Pro Business',
    price: 'R$ 59,90',
    description: 'O pacote completo para quem quer vender muito.',
    recommended: true,
    features: [
      'Produtos ILIMITADOS',
      'Pedidos ILIMITADOS',
      'Suporte Prioritário VIP',
      'Link na Bio Exclusivo',
      'Geração de Etiquetas Térmicas'
    ]
  }
];

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Desbloqueie o Poder Total", 
  description = "Você atingiu o limite do seu plano atual. Faça o upgrade agora para continuar crescendo." 
}: UpgradeModalProps) {
  
  if (!isOpen) return null;

  const handleUpgrade = (planId: string) => {
    // Integração futura com Stripe / Checkout
    window.open(`https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20fazer%20o%20upgrade%20da%20minha%20conta%20para%20o%20plano%20${planId}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop escuro */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-amber-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Copy */}
          <div className="md:w-1/3 p-8 border-r border-zinc-800/50 bg-zinc-900/20 flex flex-col justify-center overflow-y-auto">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">
              {title}
            </h2>
            <p className="text-zinc-400 leading-relaxed text-sm mb-6">
              {description}
            </p>
            <div className="mt-auto pt-6 text-xs text-zinc-500 font-medium">
              Pagamento seguro. Cancele quando quiser. Sem taxas escondidas.
            </div>
          </div>

          {/* Right Side: Plans */}
          <div className="md:w-2/3 p-8 bg-zinc-950 overflow-y-auto">
            <div className="grid sm:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative p-6 rounded-2xl border flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${
                    plan.recommended ? 'border-amber-500 shadow-amber-500/10 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/30'
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-lg">
                      Recomendado
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-500 text-xs mb-4 min-h-[32px]">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">/mês</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.recommended ? 'text-amber-500' : 'text-zinc-500'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      plan.recommended 
                        ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}
                  >
                    Fazer Upgrade
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
