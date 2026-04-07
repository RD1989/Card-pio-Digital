import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface LandingVideoProps {
  videoUrl: string;
  onScrollToFeatures: () => void;
}

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

export function LandingVideo({ videoUrl, onScrollToFeatures }: LandingVideoProps) {
  return (
    <section className="py-12 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative aspect-video rounded-[2.5rem] overflow-hidden border-[8px] border-card shadow-2xl bg-card group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10" />
          <iframe
            src={formatYoutubeEmbedUrl(videoUrl)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Vídeo de Apresentação"
            loading="lazy"
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <Button 
              onClick={onScrollToFeatures}
              className="rounded-full bg-white/90 backdrop-blur-md text-primary font-bold px-8 py-6 shadow-xl hover:bg-white hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-none"
            >
              <ChevronDown className="w-5 h-5 animate-bounce" />
              DESCUBRA O MENU PRO
            </Button>
          </div>
        </motion.div>
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
  );
}
