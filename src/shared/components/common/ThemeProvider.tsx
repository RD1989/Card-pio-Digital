import { useEffect } from 'react';
import { useThemeStore } from '@/shared/stores/global/useThemeStore';
import { supabase } from '@/integrations/supabase/client';
import { hexToHsl } from '@/shared/utils/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useEffect(() => {
    async function loadGlobalTheme() {
      const { data } = await supabase
        .from('global_settings' as any)
        .select('key, value')
        .in('key', ['global_primary_color', 'global_font_heading', 'global_font_body']);

      if (data) {
        const settings: Record<string, string> = {};
        (data as any[]).forEach(item => { settings[item.key] = item.value; });

        if (settings.global_primary_color) {
          const hsl = hexToHsl(settings.global_primary_color);
          document.documentElement.style.setProperty('--primary', hsl);
          document.documentElement.style.setProperty('--accent', hsl);
          document.documentElement.style.setProperty('--ring', hsl);
        }

        if (settings.global_font_heading) {
          document.documentElement.style.setProperty('--font-heading', `"${settings.global_font_heading}", sans-serif`);
        }
      }
    }

    loadGlobalTheme();

    // Ouvir atualizações em tempo real simplificadas (via evento customizado)
    const handleUpdate = () => loadGlobalTheme();
    window.addEventListener('theme-updated', handleUpdate);
    return () => window.removeEventListener('theme-updated', handleUpdate);
  }, []);

  return <>{children}</>;
}


