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
  hero_title: 'Seu Cardápio Digital Moderno e Ágil',
  hero_subtitle: 'Experimente grátis por 30 dias. Receba pedidos direto no WhatsApp, gere etiquetas automáticas e aumente suas vendas com loja atrativa.',
  hero_badge: '⚡ A nova era do delivery digital',
  plan_basic_name: 'Plano Básico',
  plan_basic_price: '24,90',
  plan_basic_features: 'Até 100 Produtos cadastrados|Menu Pro Digital completo|Receba via WhatsApp|QR Code Personalizado|Link na Bio Otimizado',
  plan_pro_name: 'Plano Pro',
  plan_pro_price: '39,90',
  plan_pro_features: 'Pedidos ilimitados|Link para extração do cardápio|Gerador de etiquetas térmicas|Métricas profissionais|Suporte prioritário VIP',
  testimonials_json: '',
  faqs_json: '',
  cta_title: 'TRANSFORME SEU DELIVERY AGORA',
  cta_subtitle: 'Junte-se a centenas de lojistas que estão automatizando seus pedidos e fidelizando seus clientes como nunca.',
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
