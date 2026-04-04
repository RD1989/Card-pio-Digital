import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_badge: string;
  plan_basic_name: string;
  plan_basic_price: string;
  plan_basic_features: string;
  plan_pro_name: string;
  plan_pro_price: string;
  plan_pro_features: string;
  testimonials_json: string;
  faqs_json: string;
  cta_title: string;
  cta_subtitle: string;
  footer_text: string;
  video_url: string;
  video_enabled: string;
}

const DEFAULTS: LandingSettings = {
  hero_title: 'Tenha seu Próprio Cardápio Digital: Pague Uma Vez, Use para Sempre',
  hero_subtitle: 'Sem mensalidades e sem taxas por pedido. Experimente grátis por 7 dias e automatize seu delivery com um sistema que é realmente seu.',
  hero_badge: '🚀 Licença Vitalícia: Sem Mensalidades',
  plan_basic_name: 'Plano Essencial',
  plan_basic_price: 'Vitalício',
  plan_basic_features: 'Pedidos ILIMITADOS|Produtos ILIMITADOS|Link na Bio Exclusivo|QR Code Personalizado|Gestão via WhatsApp|Sem Mensalidades',
  plan_pro_name: 'Plano Premium',
  plan_pro_price: 'Vitalício',
  plan_pro_features: 'Tudo do Essencial|IA para criar descrições|Importação de Cardápio com IA|Multi-categorias|Suporte Prioritário|Acesso Vitalício',
  testimonials_json: '',
  faqs_json: '',
  cta_title: 'SISTEMA PRÓPRIO SEM MENSALIDADES',
  cta_subtitle: 'Chega de pagar taxas para plataformas que não entendem o seu negócio. Junte-se a centenas de lojistas que já têm sua autonomia digital.',
  footer_text: '© 2026 Menu Pro. Todos os direitos reservados.',
  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
  video_enabled: 'true',
};

const KEYS = Object.keys(DEFAULTS) as (keyof LandingSettings)[];

export function useLandingSettings() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const prefixedKeys = KEYS.map(k => `landing_${k}`);
      const { data } = await supabase
        .from('global_settings' as any)
        .select('key, value')
        .in('key', prefixedKeys);

      if (data) {
        console.log('Landing settings fetched:', data.length);
        const merged = { ...DEFAULTS };
        (data as any[]).forEach((row: any) => {
          const rawKey = row.key.replace('landing_', '');
          if (rawKey in DEFAULTS) {
            const key = rawKey as keyof LandingSettings;
            const value = row.value !== null && row.value !== undefined ? String(row.value).trim() : '';
            if (value) {
              merged[key] = value;
            }
          }
        });
        setSettings(merged);
      } else {
        console.warn('No landing settings found in database, using DEFAULTS');
      }
      setLoading(false);
    }
    
    fetch().catch(err => {
      console.error('Failed to fetch landing settings:', err);
      setLoading(false);
    });

    const handleUpdate = () => fetch();
    window.addEventListener('theme-updated', handleUpdate);
    return () => window.removeEventListener('theme-updated', handleUpdate);
  }, []);

  return { 
    settings: settings || DEFAULTS, 
    loading: loading && !settings, 
    DEFAULTS 
  };
}
