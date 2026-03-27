import React from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  PaintBucket, 
  Printer, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LandingNavBar } from '../components/landing/LandingNavBar';
import { SmartphoneMockup } from '../components/landing/SmartphoneMockup';
import { DashboardMockup } from '../components/landing/DashboardMockup';

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
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-amber-500/30 transition-colors group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors"></div>
    <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 leading-relaxed">{description}</p>
  </motion.div>
);

const StepNumber = ({ number, title, description }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="flex gap-6"
  >
    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl font-black text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] relative">
      {number}
      {number !== 3 && (
        <div className="absolute top-full left-1/2 -ml-px w-px h-16 bg-gradient-to-b from-amber-500/30 to-transparent md:hidden" />
      )}
    </div>
    <div className="pt-3 pb-8 md:pb-0">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 leading-relaxed max-w-sm">{description}</p>
    </div>
  </motion.div>
);

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 selection:bg-amber-500/30 font-sans overflow-x-hidden">
      <LandingNavBar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px] translate-x-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Esquerda: Texto */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-sm font-medium text-zinc-300 mb-8"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-white">A nova era do delivery digital</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight"
              >
                Seu Cardápio Digital <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  Moderno e Automatizado
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                Receba pedidos direto no WhatsApp, gere etiquetas automáticas, crie seu Link na Bio personalizado e aumente suas vendas sem taxas abusivas.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link 
                  to="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-full text-lg font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                >
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#funcionalidades"
                  className="w-full sm:w-auto flex items-center justify-center h-14 px-8 rounded-full text-lg font-medium text-white border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 transition-all"
                >
                  Ver Funcionalidades
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-sm text-zinc-500 font-medium"
              >
                ✅ Não requer cartão de crédito • 🚀 Configuração em 2 minutos
              </motion.p>
            </div>

            {/* Direita: Mockup do Celular */}
            <div className="hidden lg:block relative perspective-[1200px]">
              <motion.div
                initial={{ rotateY: 15, rotateX: 5, opacity: 0, x: 50 }}
                animate={{ rotateY: -15, rotateX: 5, opacity: 1, x: 0 }}
                transition={{ duration: 1, type: "spring", bounce: 0.4, delay: 0.2 }}
              >
                <SmartphoneMockup />
              </motion.div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Section id="funcionalidades" className="bg-zinc-900/30 border-y border-zinc-800/50 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Tudo que seu negócio <span className="text-amber-500">precisa</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
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
            description="Recebeu um pedido? Imprima a etiqueta térmica padrão iFood com 1 clique (tamanho 40x80) pronta para envio."
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

      {/* How it Works / Dashboard Mockup (Visual Representation) */}
      <Section id="como-funciona" className="relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative perspective-[1000px]">
             {/* Dashboard Realista Substituindo o antigo abstrato */}
             <DashboardMockup />
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
              Gerencie tudo em um <br className="hidden lg:block"/>
              <span className="text-amber-500">Painel Poderoso</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed">
              Foi desenhado para ser tão fácil quanto mandar uma mensagem. Sem tabelas complexas, sem sistemas travados. Crie e publique produtos em segundos.
            </p>

            <div className="flex flex-col gap-8 md:gap-12 relative">
               <div className="absolute top-0 bottom-0 left-8 w-px bg-zinc-800 hidden md:block" />
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

      {/* Pricing Section */}
      <Section id="planos" className="bg-zinc-900/40 border-t border-zinc-800 relative overflow-hidden">
        {/* Glow behind pricing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Planos <span className="text-amber-500">Acessíveis</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Sem taxas por pedido. Sem surpresas no final do mês. Comece de graça.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
          
          {/* Plano Grátis */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col"
          >
            <h3 className="text-2xl font-bold text-white mb-2">Iniciante</h3>
            <p className="text-zinc-400 mb-6">Para quem está testando as águas.</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">R$ 0</span>
              <span className="text-zinc-500">/mês</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Até 15 Produtos',
                'Até 5 Fotos na Galeria',
                'Pedidos via WhatsApp',
                'Cardápio Digital Responsivo',
                'Tema Padrão Escuro'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/register" className="w-full py-4 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-bold text-center hover:bg-zinc-700 transition-colors">
              Começar Grátis
            </Link>
          </motion.div>

          {/* Plano PRO */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border-2 border-amber-500 rounded-3xl p-8 relative shadow-[0_0_40px_rgba(245,158,11,0.1)] flex flex-col scale-100 md:scale-105 z-10"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <span className="bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                Recomendado
              </span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Pro Business</h3>
            <p className="text-amber-500/80 mb-6">Ferramentas para quem quer vender muito.</p>
            <div className="mb-8 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">R$ 59</span>
              <span className="text-zinc-500">/mês</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 border-t border-zinc-800 pt-6">
              {[
                'Produtos ILIMITADOS',
                'Upload de Imagens Ilimitado',
                'Personalização de Cores e Marca',
                'Link na Bio Exclusivo',
                'Geração de Etiquetas Térmicas (iFood/40x80)',
                'Suporte Prioritário',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-zinc-200">
                  <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/register" className="w-full py-4 rounded-xl bg-amber-500 text-zinc-950 font-bold text-center hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2">
              Assine Agora
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

        </div>
      </Section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-500/10"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Pronto para transformar seu negócio?</h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">Junte-se a dezenas de lojistas que estão automatizando seus pedidos e economizando com taxas.</p>
          <Link 
            to="/register"
            className="inline-flex items-center justify-center h-16 px-10 rounded-full text-lg font-bold bg-amber-500 text-zinc-950 hover:bg-white hover:text-zinc-950 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105"
          >
            Criar Minha Conta Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-amber-500" />
              <span className="text-xl font-bold text-white tracking-tight">
                Meu <span className="text-amber-500">Cardápio</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-zinc-500 hover:text-amber-500 transition-colors">Instagram</a>
              <a href="#" className="text-zinc-500 hover:text-amber-500 transition-colors">Termos</a>
              <a href="#" className="text-zinc-500 hover:text-amber-500 transition-colors">Privacidade</a>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} Meu Cardápio SaaS. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
