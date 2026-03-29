"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  PaintBucket, 
  Printer, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
  ChevronDown,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { LandingNavBar } from '@/components/landing/LandingNavBar';
import { SmartphoneMockup } from '@/components/landing/SmartphoneMockup';
import { DashboardMockup } from '@/components/landing/DashboardMockup';

// Componentes Reutilizáveis
const Section = ({ id, className, children }: { id?: string, className?: string, children: React.ReactNode }) => (
  <section id={id} className={`py-20 md:py-32 ${className}`}>
    <div className="container mx-auto px-4 md:px-6">
      {children}
    </div>
  </section>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors"></div>
    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

const StepNumber = ({ number, title, description }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="flex gap-6"
  >
    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl font-black text-amber-500 relative z-10">
      {number}
      {number !== 3 && (
        <div className="absolute top-full left-1/2 -ml-px w-0.5 h-16 bg-gradient-to-b from-slate-200 to-transparent md:hidden" />
      )}
    </div>
    <div className="pt-3 pb-8 md:pb-0">
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed max-w-sm">{description}</p>
    </div>
  </motion.div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all hover:border-amber-500/30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-lg text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 text-slate-600">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-100 selection:bg-amber-500/30 font-sans overflow-x-hidden">
      <LandingNavBar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Subtle background gradients for light theme */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[100px] translate-x-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md text-sm font-bold text-slate-600 mb-8 shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-slate-900">A nova era do delivery digital</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight"
              >
                Seu Cardápio Digital <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
                  Moderno e Ágil
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                Experimente <span className="text-slate-900 font-bold">grátis por 30 dias</span>. Receba pedidos direto no WhatsApp, gere etiquetas automáticas e aumente suas vendas sem taxas abusivas.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link 
                  href="/auth/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-full text-sm font-black uppercase tracking-widest bg-amber-500 text-slate-900 hover:bg-amber-400 hover:scale-105 transition-all shadow-lg hover:shadow-amber-500/30"
                >
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#funcionalidades"
                  className="w-full sm:w-auto flex items-center justify-center h-14 px-8 rounded-full text-sm font-black uppercase tracking-widest text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                >
                  Ver Recursos
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-xs text-slate-500 font-black uppercase tracking-widest"
              >
                ✅ Sem cartão de crédito • 🚀 Setup em 2 min
              </motion.p>
            </div>

            <div className="hidden lg:block relative">
              <motion.div
                initial={{ rotateY: 15, rotateX: 5, opacity: 0, x: 50 }}
                animate={{ rotateY: -15, rotateX: 5, opacity: 1, x: 0 }}
                transition={{ duration: 1, type: "spring", bounce: 0.4, delay: 0.2 }}
                className="drop-shadow-2xl"
              >
                <SmartphoneMockup />
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Section id="funcionalidades" className="bg-slate-50 border-y border-slate-200 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Tudo que seu negócio <span className="text-amber-500">precisa</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Abandone as ferramentas improvisadas. Tenha uma solução profissional desenvolvida para maximizar sua conversão de vendas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <FeatureCard 
            icon={MessageCircle} 
            title="Pedidos via WhatsApp" 
            description="Seus clientes acessam o cardápio, montam o pedido com complementos e você recebe tudo organizado no seu painel e WhatsApp."
            delay={0.1}
          />
          <FeatureCard 
            icon={Printer} 
            title="Gerador de Etiquetas" 
            description="Recebeu um pedido? Imprima a etiqueta térmica padrão automática (tamanho 40x80) pronta para envio, com 1 clique."
            delay={0.2}
          />
          <FeatureCard 
            icon={Globe} 
            title="Link na Bio Inclusivo" 
            description="Uma página minimalista para concentrar seu Cardápio, WhatsApp, Instagram e rotas. Um único link para divulgar em todos os lugares."
            delay={0.3}
          />
          <FeatureCard 
            icon={PaintBucket} 
            title="Sua Própria Marca" 
            description="Não seja apenas mais um no aplicativo. Coloque sua cor, sua logo e ofereça uma experiência premium e exclusiva."
            delay={0.4}
          />
          <FeatureCard 
            icon={TrendingUp} 
            title="Métricas de Conversão" 
            description="Saiba quantos visitantes acessaram seu cardápio, quantos pedidos foram finalizados e veja seu faturamento crescer."
            delay={0.5}
          />
          <FeatureCard 
            icon={Store} 
            title="Gestão Simplificada" 
            description="Adicione produtos, gerencie categorias e ative vitrines promocionais de forma simples, direto pelo celular ou computador."
            delay={0.6}
          />
        </div>
      </Section>

      {/* How it Works */}
      <Section id="como-funciona" className="relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="drop-shadow-2xl bg-white rounded-[2rem] p-2 border border-slate-200 overflow-hidden">
               <DashboardMockup />
            </div>
          </div>
          
          <div className="order-1 lg:order-2">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                O seu Menu Pro <br className="hidden md:block"/>
                <span className="text-amber-500 font-serif italic">que Vende.</span>
            </h1>
            <p className="text-slate-600 text-lg mb-12 leading-relaxed">
              Foi desenhado para ser tão fácil quanto mandar uma mensagem. Sem tabelas complexas, sem sistemas travados. Crie e publique produtos em segundos.
            </p>

            <div className="flex flex-col gap-8 md:gap-12 relative">
               <div className="absolute top-0 bottom-0 left-8 w-px bg-slate-200 hidden md:block" />
               <StepNumber 
                 number="1" 
                 title="Crie sua Conta" 
                 description="Preencha os dados básicos do seu restaurante. Leva menos de 2 minutos."
               />
               <StepNumber 
                 number="2" 
                 title="Personalize & Adicione" 
                 description="Coloque sua logo, defina sua cor tema e cadastre seus produtos pelo celular."
               />
               <StepNumber 
                 number="3" 
                 title="Pronto para Vender" 
                 description="Compartilhe seu link exclusivo e comece a receber pedidos organizados imediatamente."
               />
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing Section — 2 Tiers optimized */}
      <Section id="planos" className="bg-slate-200/60 border-t border-slate-300 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Zap className="w-4 h-4" />
            Sem taxas por pedido
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Planos que <span className="text-amber-500">crescem com você</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Aproveite todos os recursos <span className="text-slate-900 font-bold">grátis por 30 dias</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10 items-stretch">

          {/* Plano Básico */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col hover:border-amber-500/50 hover:shadow-xl transition-all relative group shadow-sm"
          >
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block tracking-tighter">Essencial</span>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Plano Básico</h3>
              <p className="text-slate-500 text-sm">Ideal para pequenos negócios.</p>
            </div>
            
            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-slate-500 text-2xl font-bold mr-1">R$</span>
              <span className="text-6xl font-black text-slate-900">24,90</span>
              <span className="text-zinc-400 text-lg">/mês</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                'Até 100 Pedidos mensais',
                'Menu Pro Responsivo', 'Receba no WhatsApp',
                'Cores & Logo Personalizadas',
                'Link na Bio Integrado',
              ].map((item, i) => (
                <li key={`basic-${i}`} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link 
              href="/auth/register" 
              className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs text-center hover:bg-slate-800 transition-all shadow-md"
            >
              Começar Grátis
            </Link>
          </motion.div>

          {/* Plano Pro — Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border-2 border-amber-500 rounded-[2.5rem] p-10 relative shadow-2xl shadow-amber-500/20 flex flex-col transform md:scale-105 z-20"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-amber-500 text-slate-900 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                🚀 Recomendado
              </span>
            </div>

            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 block">Performance Total</span>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Plano Pro</h3>
              <p className="text-slate-500 text-sm">Para o delivery que não para de crescer.</p>
            </div>

            <div className="mb-10 flex items-baseline gap-1">
              <span className="text-amber-500 text-2xl font-black mr-1">R$</span>
              <span className="text-6xl font-black text-slate-900 tracking-tighter">39,90</span>
              <span className="text-zinc-400 text-lg">/mês</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                'PEDIDOS ILIMITADOS',
                'IA para Extração de Cardápio',
                'Gerador de Etiquetas Térmicas',
                'Métricas Profissionais',
                'Suporte Prioritário VIP',
              ].map((item, i) => (
                <li key={`pro-${i}`} className="flex items-start gap-4 text-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="font-black text-sm uppercase tracking-tighter">{item}</span>
                </li>
              ))}
            </ul>

            <Link 
              href="/auth/register" 
              className="w-full py-5 rounded-2xl bg-amber-500 text-slate-900 font-black uppercase tracking-widest text-xs text-center hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-3"
            >
              Assinar Plano Pro
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center relative z-10"
        >
          <p className="text-slate-500 text-xs font-black uppercase tracking-tighter">
            🔒 Pagamento Seguro · Sem Contrato · Cancele Quando Quiser
          </p>
        </motion.div>
      </Section>

      {/* Testimonials Section */}
      <Section id="depoimentos" className="border-y border-slate-300 bg-slate-100 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Aprovado por quem <span className="text-amber-500">vende todo dia</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Descubra por que centenas de lojistas escolheram a nossa plataforma.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { name: 'Lucas Freitas', shop: 'Burguer Express', text: 'Eu pagava um absurdo de taxa em app de delivery. Mudar pro Meu Cardápio mudou o jogo pro nosso lucro.' },
            { name: 'Mariana Silva', shop: 'Doces da Mari', text: 'A impressão de etiqueta térmica foi o que me ganhou. Poupou metade do meu trabalho nas madrugadas.' },
            { name: 'Roberto Almeida', shop: 'Pizzaria D\'Napoli', text: 'O cliente clica, monta a pizza do jeito dele e cai no meu painel. Funciona perfeito e nunca trava.' }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[2rem] bg-white border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all"
            >
              <div>
                <div className="flex text-amber-500 mb-6 gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-6 font-medium italic">"{item.text}"</p>
              </div>
              <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-amber-500 border border-slate-200 shadow-sm">
                  {item.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{item.shop}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FAQ Section */}
      <Section id="faq" className="bg-slate-50 relative border-b border-slate-200 px-4">
         <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Dúvidas Frequentes
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <FaqItem 
            question="Existe taxa sob cada venda?" 
            answer="Não! Diferente dos aplicativos padrão do mercado, não cobramos NENHUMA taxa sob seus pedidos. Você paga apenas o valor fixo do plano e 100% da receita fica para você." 
          />
          <FaqItem 
            question="Como recebo os pedidos no WhatsApp?" 
            answer="Quando o cliente finaliza o carrinho no seu Menu Pro, nosso sistema formata automaticamente uma mensagem clara contendo Endereço, Nome, Produtos (e Complementos selecionados) e direciona para o seu WhatsApp cadastrado."  
          />
          <FaqItem 
            question="Como funciona o gerador de etiquetas?" 
            answer="No Plano Pro, você terá um botão 'Imprimir Etiqueta' em cada pedido no seu painel. Ele formata o pedido no padrão térmico 80mm pronto para imprimir, poupando tempo ao despachar motoqueiros." 
          />
        </div>
      </Section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-amber-500/[0.03]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic">Transforme seu <span className="text-amber-500">Delivery</span> agora</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Junte-se a centenas de lojistas que estão automatizando seus pedidos e blindando seus lucros contra taxas excessivas.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center h-16 px-12 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-500 text-slate-950 hover:bg-white transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            Criar Minha Conta Grátis 🚀
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-500" />
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">
                Menu <span className="text-amber-500">Pro</span>
              </span>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-slate-400 text-xs font-black uppercase tracking-widest">&copy; {new Date().getFullYear()} Menu Pro SaaS Premium</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
