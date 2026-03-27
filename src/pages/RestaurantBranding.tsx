import { useState, useRef } from 'react';
import { Palette, Upload, Image as ImageIcon, Save, Check, Type, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export const RestaurantBranding = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [accentColor, setAccentColor] = useState(user?.restaurant?.accent_color || '#f59e0b');
  const [bio, setBio] = useState(user?.restaurant?.bio || '');
  const [address, setAddress] = useState(user?.restaurant?.address || '');
  const [logoPreview, setLogoPreview] = useState(user?.restaurant?.logo_url || '');
  const [bannerPreview, setBannerPreview] = useState(user?.restaurant?.banner_url || '');
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { name: 'Amber (Padrão)', value: '#f59e0b' },
    { name: 'Esmeralda (Saudável)', value: '#10b981' },
    { name: 'Rosa (Doceria)', value: '#ec4899' },
    { name: 'Vermelho (Pizzaria)', value: '#ef4444' },
    { name: 'Azul (Corporativo)', value: '#3b82f6' },
    { name: 'Violeta (Moderno)', value: '#8b5cf6' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') setLogoPreview(reader.result as string);
        else setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('accent_color', accentColor);
    formData.append('bio', bio);
    formData.append('address', address);
    
    if (logoInputRef.current?.files?.[0]) {
      formData.append('logo', logoInputRef.current.files[0]);
    }
    if (bannerInputRef.current?.files?.[0]) {
      formData.append('banner', bannerInputRef.current.files[0]);
    }

    try {
      const response = await api.post('/restaurant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update local state and store
      if (setUser && user) {
        setUser({ ...user, restaurant: response.data.restaurant });
      }
      
      alert('Identidade visual publicada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar branding:', error);
      alert('Erro ao atualizar identidade visual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-10 pb-20">
      <header>
        <h2 className="text-3xl font-serif text-white mb-2">Identidade Visual</h2>
        <p className="text-zinc-500">Personalize como os clientes veem sua marca.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Logo & Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <label className="text-sm font-medium text-zinc-400 mb-4 block">Logo do Restaurante</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                {logoPreview ? (
                  <img src={logoPreview} className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-700" />
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={logoInputRef}
                  onChange={(e) => handleFileChange(e, 'logo')}
                  accept="image/*"
                />
              </div>
              <button 
                onClick={() => logoInputRef.current?.click()}
                className="text-amber-500 text-sm font-bold hover:underline"
              >
                Alterar Logo
              </button>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
            <label className="text-sm font-medium text-zinc-400 mb-4 block">Banner de Capa (Mobile)</label>
            <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group">
               {bannerPreview ? (
                 <img src={bannerPreview} className="w-full h-full object-cover" />
               ) : (
                 <>
                   <ImageIcon className="w-10 h-10 text-zinc-700" />
                   <p className="text-xs text-zinc-500">Recomendado: 800x400px</p>
                 </>
               )}
               <input 
                  type="file" 
                  className="hidden" 
                  ref={bannerInputRef}
                  onChange={(e) => handleFileChange(e, 'banner')}
                  accept="image/*"
               />
               <button 
                 onClick={() => bannerInputRef.current?.click()}
                 className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 hover:bg-zinc-800 transition-colors"
               >
                 Upload Banner
               </button>
            </div>
          </div>

          {/* Bio & Address */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Bio / Descrição Curta
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua culinária..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-zinc-700 min-h-[100px] resize-none"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Endereço Físico
                </label>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-3 px-4 text-white outline-none focus:border-zinc-700"
                />
             </div>
          </div>
        </div>

        {/* Cores & Preview */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-medium text-white">Esquema de Cores</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    accentColor === color.value 
                      ? 'border-white bg-zinc-850' 
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full shadow-inner" 
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-xs font-medium text-zinc-300">{color.name}</span>
                  {accentColor === color.value && <Check className="w-4 h-4 text-white ml-auto" />}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 mb-4">Preview em tempo real:</p>
              <div className="bg-black rounded-2xl p-4 border border-zinc-800">
                 <button 
                  className="w-full py-3 rounded-xl font-bold text-zinc-950 flex items-center justify-center gap-2 mb-3"
                  style={{ backgroundColor: accentColor }}
                >
                  Confirmar Pedido
                </button>
                <div className="h-1 w-20 rounded-full mx-auto" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6">
            <h4 className="text-amber-500 font-bold text-sm mb-2">Dica de Arquiteto:</h4>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Cores quentes como Vermelho e Amber estimulam o apetite. 
              Use o Rosa para confeitarias e Esmeralda para pratos naturais ou fit.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-white text-zinc-950 font-bold py-4 px-10 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-xl hover:bg-zinc-200 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Publicando...' : 'Publicar Alterações'}
        </button>
      </div>
    </div>
  );
};
