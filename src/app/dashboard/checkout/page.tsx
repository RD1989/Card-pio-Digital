"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Zap,
  Shield,
  MessageCircle,
  Crown,
  Star,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { PixPaymentFlow } from '@/components/PixPaymentFlow';
import { useRouter } from 'next/navigation';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  badge: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: PlanFeature[];
  highlighted: boolean;
  icon: React.ElementType;
}

const plans: Plan[] = [
  {
    id: 'basico',
    name: 'Básico',
    badge: 'Essencial',
    price: 24.90,
    yearlyPrice: 249.00,
    description: 'Ideal para quem está começando e quer digitalizar o cardápio com profissionalismo.',
    icon: Star,
    highlighted: false,
    features: [
      { text: 'Assinatura Menu Pro Ilimitada', included: true },
      { text: 'Pedidos via WhatsApp', included: true },
      { text: 'Até 100 pedidos por mês', included: true },
      { text: 'Cores e branding personalizados', included: true },
      { text: 'Link na Bio (bio page)', included: true },
      { text: 'QR Code do cardápio', included: true },
      { text: 'Etiquetas de entrega automáticas', included: false },
      { text: 'Ferramentas de IA', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Recomendado',
    price: 39.90,
    yearlyPrice: 399.00,
    description: 'Para lojistas sérios que querem automatização completa e crescimento acelerado.',
    icon: Crown,
    highlighted: true,
    features: [
      { text: 'Assinatura Menu Pro Ilimitada', included: true },
      { text: 'Pedidos via WhatsApp', included: true },
      { text: 'Pedidos ilimitados', included: true },
      { text: 'Cores e branding personalizados', included: true },
      { text: 'Link na Bio (bio page)', included: true },
      { text: 'QR Code do cardápio', included: true },
      { text: 'Etiquetas de entrega automáticas', included: true },
      { text: 'Ferramentas de IA', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
];

export default function CheckoutPage() {
  const { theme } = useThemeStore() as any;
  const router = useRouter();
  const isLight = theme === 'light';
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const displayPrice = (plan: Plan) =>
    billing === 'yearly' ? plan.yearlyPrice : plan.price;

  const savingsPercent = Math.round(
    ((plans[1].price * 12 - plans[1].yearlyPrice) / (plans[1].price * 12)) * 100
  );

  return (
    <div className="space-y-10 min-h-[600px] pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${
          isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        }`}>
          <Zap className="w-3 h-3" />
          Escolha Seu Plano
        </div>
        <h1 className={`text-4xl font-bold font-serif ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Invista no seu negócio
        </h1>
        <p className={`text-lg max-w-xl mx-auto ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
          Sem taxas abusivas. Sem contratos longos. Acesso liberado no 1º PIX.
        </p>

        {/* Billing Toggle (só mostra se não estiver no flow de pagamento) */}
        {!selectedPlan && (
            <div className={`inline-flex items-center gap-1 p-1 rounded-2xl border mt-4 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
            <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                billing === 'monthly'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-zinc-500 hover:text-white'
                }`}
            >
                Mensal
            </button>
            <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                billing === 'yearly'
                    ? 'bg-amber-500 text-zinc-950 shadow-md'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-zinc-500 hover:text-white'
                }`}
            >
                Anual
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                billing === 'yearly' ? 'bg-zinc-950/20' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                -{savingsPercent}%
                </span>
            </button>
            </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedPlan ? (
             <motion.div 
               key="checkout-flow"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="flex justify-center w-full py-2"
             >
                <PixPaymentFlow 
                  planId={selectedPlan.id} 
                  period={billing} 
                  amount={displayPrice(selectedPlan)} 
                  onSuccess={() => router.push('/dashboard')} 
                  onCancel={() => setSelectedPlan(null)} 
                />
             </motion.div>
        ) : (
             <motion.div 
                key="plans-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
             >
              {plans.map((plan, idx) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative rounded-3xl border p-8 flex flex-col gap-6 transition-all ${
                      plan.highlighted
                        ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
                        : isLight ? 'border-slate-200 bg-white' : 'border-zinc-800 bg-zinc-900'
                    } ${plan.highlighted ? (isLight ? 'bg-white' : 'bg-zinc-900') : ''}`}
                  >
                    {/* Recommended Badge */}
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-amber-500 text-zinc-950 text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${plan.highlighted ? 'bg-amber-500/20' : isLight ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                        <Icon className={`w-6 h-6 ${plan.highlighted ? 'text-amber-500' : isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
                      </div>
                      <div>
                        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{plan.name}</h2>
                        <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>R$</span>
                        <span className={`text-5xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {displayPrice(plan).toFixed(2).replace('.', ',')}
                        </span>
                        <span className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                          /{billing === 'yearly' ? 'ano' : 'mês'}
                        </span>
                      </div>
                      {billing === 'yearly' && (
                        <p className="text-xs text-emerald-400 font-bold mt-1">
                          Equivale a R$ {(displayPrice(plan) / 12).toFixed(2).replace('.', ',')}/mês
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {feat.included ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <XCircle className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-slate-300' : 'text-zinc-700'}`} />
                          )}
                          <span className={`text-sm ${feat.included ? (isLight ? 'text-slate-700' : 'text-zinc-300') : (isLight ? 'text-slate-400' : 'text-zinc-600')}`}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 ${
                        plan.highlighted
                          ? 'bg-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(245,158,11,0.3)]'
                          : isLight
                            ? 'bg-slate-900 text-white hover:bg-slate-700'
                            : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Pagar via PIX
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
        )}
      </AnimatePresence>

      {/* Trust Badges - Só mostra na lista de planos */}
      {!selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`max-w-3xl mx-auto rounded-3xl border p-6 ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
                { icon: Shield, title: 'Transação Segura', desc: 'Processado via Pix oficial.' },
                { icon: Clock, title: 'Cancele quando quiser', desc: 'Sem fidelidade nem multas de cancelamento.' },
                { icon: MessageCircle, title: 'Suporte humanizado', desc: 'Atendimento direto com especialistas.' },
            ].map((item, i) => {
                const Icon = item.icon;
                return (
                <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>{item.desc}</p>
                </div>
                );
            })}
            </div>
          </motion.div>
      )}
    </div>
  );
}
