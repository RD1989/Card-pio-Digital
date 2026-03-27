import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Globe, 
  MapPin, 
  MessageCircle, 
  ExternalLink, 
  Share2,
  ChefHat
} from 'lucide-react';
import api from '../services/api';

interface RestaurantData {
  name?: string;
  bio?: string;
  address?: string;
  logo_url?: string;
  whatsapp?: string;
  maps?: string;
  instagram?: string;
}

export const PublicBioLink = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RestaurantData | null>(null);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        // Busca configurações via slug
        const response = await api.get(`/settings?slug=${slug}`);
        setData(response.data);
      } catch (error) {
        console.error('Erro ao buscar bio:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBio();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <ChefHat className="w-16 h-16 text-zinc-800 mb-4" />
        <h1 className="text-2xl font-serif">Restaurante não encontrado</h1>
        <p className="text-zinc-500 mt-2">Verifique o link e tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Profile Image */}
        <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden shadow-2xl mb-6">
           <img 
            src={data.logo_url || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200"} 
            className="w-full h-full object-cover" 
            alt="Logo"
           />
        </div>

        {/* Info */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-2">{data.name || 'Burguer House'}</h1>
          <p className="text-zinc-500 text-sm italic">{data.bio || 'O melhor sabor da região!'}</p>
          {data.address && (
              <p className="text-zinc-600 text-[10px] mt-2 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" /> {data.address}
              </p>
          )}
        </div>

        {/* Links */}
        <div className="w-full space-y-4">
          <a 
            href="/" 
            className="w-full bg-white text-zinc-950 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
          >
            <ChefHat className="w-5 h-5" />
            Ver Cardápio Digital
            <ExternalLink className="w-4 h-4" />
          </a>

          {data.whatsapp && (
            <a 
              href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Falar no WhatsApp
            </a>
          )}

          {data.maps && (
            <a 
              href={data.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <MapPin className="w-5 h-5 text-red-500" />
              Como Chegar
            </a>
          )}

          {data.instagram && (
            <a 
              href={`https://instagram.com/${data.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-zinc-800 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Globe className="w-5 h-5 text-amber-500" />
              Seguir no Instagram
            </a>
          )}
        </div>

        {/* Share */}
        <button className="mt-12 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Compartilhar</span>
        </button>

        <footer className="mt-20">
          <p className="text-[10px] text-zinc-700 font-bold tracking-[0.3em] uppercase">
            Powered by Cardápio Digital Premium
          </p>
        </footer>
      </div>
    </div>
  );
};
