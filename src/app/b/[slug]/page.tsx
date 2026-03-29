"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Globe, 
  MapPin, 
  MessageCircle, 
  ExternalLink, 
  Share2,
  Instagram,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface RestaurantData {
  name?: string;
  description?: string;
  address?: string;
  logo_url?: string;
  whatsapp_number?: string;
  social_links?: {
    maps?: string;
    instagram?: string;
  };
  primary_color?: string;
}

export default function PublicBioLinkPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RestaurantData | null>(null);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const { data: r, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        setData(r);
      } catch (error) {
        console.error('Erro ao buscar bio:', error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchBio();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-serif italic text-amber-500 mb-2">Página não encontrada</h1>
        <p className="text-zinc-500 max-w-xs mx-auto">Verifique o endereço ou entre em contato com o estabelecimento.</p>
        <Link href="/" className="mt-8 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors underline underline-offset-4">
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const primaryColor = data.primary_color || '#f59e0b';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-12 px-6 overflow-hidden relative">
      {/* Background Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        {/* Profile Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-28 h-28 rounded-[2.5rem] border-4 border-zinc-900 bg-zinc-900 overflow-hidden shadow-2xl mb-8 group"
        >
           <img 
            src={data.logo_url || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            alt="Logo"
           />
        </motion.div>

        {/* Info */}
        <div className="text-center mb-10 w-full">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-serif italic text-white mb-2"
          >
            {data.name}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 text-sm italic mb-4 leading-relaxed"
          >
            {data.description || 'O melhor sabor da região! 🚀'}
          </motion.p>
          
          {data.address && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-600 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 py-2 rounded-xl"
              >
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {data.address}
              </motion.p>
          )}
        </div>

        {/* Links */}
        <div className="w-full space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              href={`/${slug}`}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 group"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              🚀 Ver Cardápio Digital
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {data.whatsapp_number && (
            <motion.a 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              href={`https://wa.me/${data.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              WhatsApp Oficial
            </motion.a>
          )}

          {data.social_links?.maps && (
            <motion.a 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              href={data.social_links.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <MapPin className="w-5 h-5 text-red-500" />
              Ver no Mapa (GPS)
            </motion.a>
          )}

          {data.social_links?.instagram && (
            <motion.a 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              href={`https://instagram.com/${data.social_links.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Instagram className="w-5 h-5 text-pink-500" />
              Nossas Redes Sociais
            </motion.a>
          )}
        </div>

        {/* Share */}
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center gap-2 text-zinc-600 hover:text-white transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Compartilhar</span>
        </motion.button>

        <footer className="mt-20">
          <p className="text-[9px] text-zinc-800 font-black tracking-[0.5em] uppercase italic">
            Powered by Menu Pro ⚡ premium
          </p>
        </footer>
      </div>
    </div>
  );
}
