import { useState, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { GlassNavbar } from '@/shared/components/layout/GlassNavbar';
import { useLandingSettings } from '@/shared/hooks/useLandingSettings';
import { 
  LANDING_FEATURES, 
  LANDING_STEPS, 
  DEFAULT_TESTIMONIALS, 
  DEFAULT_FAQS 
} from '../constants/landingData';

// Components
import { LandingHero } from '../components/LandingHero';
import { PwaInstallBanner } from '@/shared/components/common/PwaInstallBanner';

// Lazy loaded components for sections below the fold
const LandingVideo = lazy(() => import('../components/LandingVideo').then(m => ({ default: m.LandingVideo })));
const LandingFeatures = lazy(() => import('../components/LandingFeatures').then(m => ({ default: m.LandingFeatures })));
const LandingHowItWorks = lazy(() => import('../components/LandingHowItWorks').then(m => ({ default: m.LandingHowItWorks })));
const LandingPricing = lazy(() => import('../components/LandingPricing').then(m => ({ default: m.LandingPricing })));
const LandingTestimonials = lazy(() => import('../components/LandingTestimonials').then(m => ({ default: m.LandingTestimonials })));
const LandingFAQ = lazy(() => import('../components/LandingFAQ').then(m => ({ default: m.LandingFAQ })));
const LandingAuthor = lazy(() => import('../components/LandingAuthor').then(m => ({ default: m.LandingAuthor })));
const LandingCTA = lazy(() => import('../components/LandingCTA').then(m => ({ default: m.LandingCTA })));

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { settings, loading } = useLandingSettings();

  const testimonials = DEFAULT_TESTIMONIALS;
  const faqs = DEFAULT_FAQS;

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
    <div className="min-h-screen bg-background overflow-hidden relative">
      <PwaInstallBanner />
      <GlassNavbar />

      <LandingHero 
        badge={heroBadge}
        title={heroTitle}
        subtitle={heroSubtitle}
        onScrollToFeatures={scrollToFeatures}
      />

      <Suspense fallback={<SectionLoader />}>
        {/* ─── VIDEO SECTION ─── */}
        {videoEnabled && videoUrl && (
          <LandingVideo 
            videoUrl={videoUrl} 
            onScrollToFeatures={scrollToFeatures} 
          />
        )}

        <div ref={featuresRef}>
          <LandingFeatures features={LANDING_FEATURES} />
        </div>
        
        <LandingHowItWorks steps={LANDING_STEPS} />
        
        <LandingPricing 
          basicFeatures={basicFeatures}
          proFeatures={proFeatures}
        />
        
        <LandingTestimonials testimonials={testimonials} />
        
        <LandingFAQ faqs={faqs} />
        
        <LandingAuthor />
        
        <LandingCTA 
          title={ctaTitle}
          subtitle={ctaSubtitle}
        />
      </Suspense>

      <footer className="border-t border-border py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="text-primary font-bold text-sm">Menu Pro</span>
          <span>{footerText}</span>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <motion.a
        href="https://wa.me/22996051620?text=Ol%C3%A1%21%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20sistema."
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl shadow-[#25D366]/20 hover:scale-110 hover:shadow-[#25D366]/40 transition-all duration-300 group"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute right-[110%] top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-xl">
          Tirar dúvidas
        </span>
      </motion.a>
    </div>
  );
}

// Fallback loader for sections
function SectionLoader() {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest">Carregando seção...</span>
    </div>
  );
}


