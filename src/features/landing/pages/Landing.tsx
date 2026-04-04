import { motion } from 'framer-motion';
import authorPhoto from '@/assets/author-rodrigo.png';
import { GlassNavbar } from '@/shared/components/layout/GlassNavbar';
import { PhoneSimulator } from '@/shared/components/common/PhoneSimulator';
import {
  ArrowRight, MessageCircle, Tag, Link2, Award, LineChart, LayoutGrid,
  Check, ChevronDown, Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { ChefHat, Play } from 'lucide-react';
import phoneDashboard from '@/assets/phone-dashboard.png';
import { useLandingSettings } from '@/shared/hooks/useLandingSettings';

const features = [
  { icon: MessageCircle, title: 'Pedidos via WhatsApp', desc: 'Receba o cardápio e pedidos direto no WhatsApp. Sem bots complexos, só vendas reais.' },
  { icon: Tag, title: 'Gerador de Etiquetas', desc: 'Etiquetas com QR Code automáticas, imprima e cole nas mesas em 1 clique.' },
  { icon: Link2, title: 'Link na Bio Exclusivo', desc: 'Uma página otimizada para WhatsApp, Instagram e Redes com seu cardápio QR Code.' },
  { icon: Award, title: 'Sua Própria Marca', desc: 'Logo, cores e domínio exclusivos. Seu app com a cara do seu negócio.' },
  { icon: LineChart, title: 'Métricas de Conversão', desc: 'Saiba quanto vendeu, quantos acessaram e quais os produtos mais pedidos.' },
  { icon: LayoutGrid, title: 'Gestão Simplificada', desc: 'Adicione produtos, categorias e promoções de forma simples e direta.' },
];

const steps = [
  { num: '1', title: 'Crie sua Conta', desc: 'Preencha os dados básicos do seu restaurante. Leva menos de 2 minutos.' },
  { num: '2', title: 'Personalize e Adicione', desc: 'Coloque seu logo, defina suas cores e cadastre seus produtos pelo celular.' },
  { num: '3', title: 'Pronto para Vender', desc: 'Compartilhe o link do seu cardápio e comece a receber pedidos imediatamente.' },
];

const defaultTestimonials = [
  { name: 'Lucas Freitas', role: 'Hamburgueria Cowpizza', quote: 'Troquei meu app obsoleto de delivery. Mudei pro Menu Pro Cardápio, melhor a pagar pro meus clientes.' },
  { name: 'Marlene Silva', role: 'Cozinha da Marlene', quote: 'A impressão de etiquetas é fantástica. Economizo horas na montagem e minha divulgação é incrível.' },
  { name: 'Roberto Almeida', role: 'Pizzaria di Napoli', quote: 'O cliente clica, monta e pede pelo celular. Funciona perfeitamente e é meu melhor investimento.' },
];

const defaultFaqs = [
  { q: 'Existe taxa em cada venda?', a: 'Não! O Menu Pro não cobra taxa por venda. Você paga apenas o plano mensal escolhido.' },
  { q: 'Como recebo os pedidos no WhatsApp?', a: 'Ao criar seu cardápio, você configura seu número de WhatsApp. Os clientes enviam o pedido diretamente para você.' },
  { q: 'Como funciona o gerador de etiquetas?', a: 'Basta acessar o painel, escolher o layout e imprimir. As etiquetas já vêm com QR Code do seu cardápio.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const formatYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('embed/')) return url;
  
  let videoId = '';
  if (url.includes('v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('shorts/')[1]?.split('?')[0];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { settings, loading } = useLandingSettings();

  const testimonials = defaultTestimonials;
  const faqs = defaultFaqs;

  // Parse dynamic values with fallbacks and safe checks
  const getSafeString = (val: any, fallback: string) => (typeof val === 'string' && val.trim().length > 0) ? val : fallback;

  const heroTitle = getSafeString(settings.hero_title, 'Tenha seu Próprio Cardápio Digital: Seu Sistema, Suas Regras');
  const heroSubtitle = getSafeString(settings.hero_subtitle, 'Esqueça as taxas por pedido e mensalidades abusivas. Comece a usar seu sistema próprio hoje mesmo, gratuitamente por 10 dias.');
  const heroBadge = getSafeString(settings.hero_badge, '🚀 Sua Própria Plataforma de Delivery');
  const basicName = getSafeString(settings.plan_basic_name, 'Sistema Completo');
  const basicPrice = getSafeString(settings.plan_basic_price, '10 Dias Grátis');
  const basicFeatures = getSafeString(settings.plan_basic_features, 'Pedidos ILIMITADOS|Produtos ILIMITADOS|Menu Digital Premium|Integrado com WhatsApp|QR Code Exclusivo|Horário de Funcionamento|Gestão de Entregas|Sua Autonomia Digital').split('|');
  const proName = getSafeString(settings.plan_pro_name, 'Recursos Avançados');
  const proPrice = getSafeString(settings.plan_pro_price, 'Incluso no Teste');
  const proFeatures = getSafeString(settings.plan_pro_features, 'Inteligência Artificial para Descrições|Importação de Cardápio com IA|Suporte Prioritário VIP|Acompanhamento em Tempo Real|Sem Taxas Ocultas|Tecnologia de Ponta').split('|');
  const ctaTitle = getSafeString(settings.cta_title, 'SISTEMA PRÓPRIO SEM MENSALIDADES');
  const ctaSubtitle = getSafeString(settings.cta_subtitle, 'Chega de pagar taxas para plataformas que não entendem o seu negócio. Junte-se a centenas de lojistas que já têm sua autonomia digital.');
  const footerText = getSafeString(settings.footer_text, '© 2026 Menu Pro. Todos os direitos reservados.');
  const videoUrl = settings.video_url;
  const videoEnabled = settings.video_enabled === 'true';

  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <GlassNavbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-16 px-6 lg:pt-28 lg:pb-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex-1 text-center lg:text-left"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-5">
              {heroBadge}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-tight sm:leading-[1.08]">
              {heroTitle.includes('Profissional') ? (
                <>
                  Seu Cardápio Digital{' '}
                  <span className="font-display italic text-gradient">Profissional,</span>{' '}
                  Simples e <span className="font-display italic text-gradient">Poderoso</span>
                </>
              ) : (
                <>{heroTitle}</>
              )}
            </h1>
            <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-md mx-auto lg:mx-0 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-primary"
              >
                CRIAR CONTA GRÁTIS
              </Link>
              <Button
                onClick={scrollToFeatures}
                variant="outline"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold text-sm hover:bg-muted transition-all h-auto"
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

      {/* ─── VIDEO SECTION ─── */}
      {videoEnabled && videoUrl && (
        <section className="py-12 px-6 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative aspect-video rounded-[2.5rem] overflow-hidden border-[8px] border-card shadow-2xl bg-card group"
            >
              {/* Overlay decorativo */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
              
              <iframe
                src={formatYoutubeEmbedUrl(videoUrl || '')}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Vídeo de Apresentação"
              />

              {/* Botão de Scroll flutuante */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <Button 
                  onClick={scrollToFeatures}
                  className="rounded-full bg-white/90 backdrop-blur-md text-primary font-bold px-8 py-6 shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-none"
                >
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                  DESCUBRA O MENU PRO
                </Button>
              </div>
            </motion.div>
            
            {/* Legendagem/Callout abaixo do vídeo */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">Assista agora</span>
              </div>
              <p className="text-sm text-muted-foreground font-medium max-w-sm">
                Veja como o Menu Pro transforma seu atendimento em uma máquina de vendas automática.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURES ─── */}
      <section id="features" ref={featuresRef} className="py-20 px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Ferramentas que fazem seu delivery{' '}
              <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">decolar</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm max-w-lg mx-auto">
              Abandone as ferramentas improvisadas. Tenha uma solução profissional desenvolvida para maximizar sua conversão de vendas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border border-border rounded-2xl p-7 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex-1 flex justify-center relative"
          >
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <img
              src={phoneDashboard}
              alt="Dashboard do Menu Pro no celular"
              width={300}
              height={600}
              loading="lazy"
              className="relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Comece a vender{' '}
                <span className="font-display italic text-gradient">em 3 passos.</span>
              </h2>
              <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
                Simples como mandar uma mensagem. Cadastre seus produtos, personalize e comece a receber pedidos — tudo em minutos.
              </p>
            </motion.div>

            <div className="mt-10 space-y-7">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex gap-5"
                >
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8"
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-primary"
              >
                CRIAR CONTA GRÁTIS <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
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
              <Link to="/register" className="mt-7 block w-full text-center py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all">
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
                className="mt-7 block w-full text-center py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-primary"
              >
                ASSINAR PLANO PRO →
              </a>
            </motion.div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-5">💳 Pagamento via Pix · Sem compromisso · Cancele quando quiser</p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Quem usa,{' '}
              <span className="font-display italic text-gradient underline decoration-primary/30 underline-offset-4">recomenda</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Descubra por que centenas de lojistas escolheram nossa plataforma.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-card border border-border rounded-2xl p-7"
              >
                <Quote className="w-7 h-7 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-6 bg-muted/40">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Dúvidas{' '}
              <span className="font-display italic text-gradient">Frequentes</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTOR ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center bg-card border border-border rounded-3xl p-8 sm:p-12"
          >
            <img
              src={authorPhoto}
              alt="Rodrigo Gomes — Desenvolvedor do Menu Pro"
              loading="lazy"
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl object-cover border-2 border-primary/20 shadow-lg mb-8 grayscale hover:grayscale-0 transition-all duration-700"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Quem criou o Menu Pro</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight">
              Rodrigo Gomes
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mt-4 max-w-2xl">
              Eu vi de perto a dor de centenas de donos de delivery: <strong className="text-foreground">taxas abusivas de grandes plataformas</strong> que consumiam até 30% do faturamento. Muitos desistiam de ter qualquer ferramenta digital — e perdiam vendas todos os dias por não estarem online.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3 max-w-2xl">
              Foi aí que nasceu o <span className="text-primary font-semibold">Menu Pro</span>. Desenvolvi um sistema completo, profissional e acessível para que <strong className="text-foreground">qualquer empreendedor</strong> consiga ter seu cardápio digital, receber pedidos via WhatsApp e crescer — <strong className="text-foreground">sem pagar fortunas</strong> para plataformas que não entendem a realidade do pequeno negócio.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mt-3 max-w-2xl">
              Minha missão é simples: <span className="text-primary font-semibold">democratizar a tecnologia para o food service</span>. Se você vende comida, merece uma ferramenta que trabalhe por você — não contra o seu bolso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-[2rem] p-12 sm:p-16 text-center relative overflow-hidden"
          style={{ background: 'hsl(var(--cta-bg))' }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'hsl(var(--nav-foreground))' }}>
              {ctaTitle.includes('DELIVERY') ? (
                <>
                  TRANSFORME SEU{' '}
                  <span className="font-display italic underline decoration-primary/40 underline-offset-4 text-primary">DELIVERY</span>{' '}
                  AGORA
                </>
              ) : ctaTitle}
            </h2>
            <p className="mt-4 text-sm max-w-lg mx-auto" style={{ color: 'hsl(var(--nav-foreground) / 0.7)' }}>
              {ctaSubtitle}
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all glow-primary"
            >
              CRIAR MINHA CONTA GRÁTIS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="text-primary font-bold text-sm">Menu Pro</span>
          <span>{footerText}</span>
        </div>
      </footer>

      {/* ─── WHATSAPP FLOATING BUTTON ─── */}
      <motion.a
        href="https://wa.me/22996051620?text=Ol%C3%A1%21%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20sistema."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/20 hover:scale-110 hover:shadow-[#25D366]/40 transition-all duration-300 group"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        {/* Tooltip on hover */}
        <span className="absolute right-[110%] top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl">
          Tirar dúvidas
        </span>
      </motion.a>
    </div>
  );
}


