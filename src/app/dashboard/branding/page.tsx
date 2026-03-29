"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Palette, Upload, Image as ImageIcon, Save, Check, Type, MapPin,
  Sun, Moon, Monitor, Sparkles, ChevronDown, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ColorWheelPicker } from '@/components/ColorWheelPicker';
import { supabase } from '@/lib/supabase';

export default function BrandingPage() {
  const { user, setUser } = useAuthStore() as any;
  const { theme, setTheme } = useThemeStore() as any;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  
  const [accentColor, setAccentColor] = useState(user?.restaurant?.accent_color || '#f59e0b');
  const [slug, setSlug] = useState(user?.restaurant?.slug || '');
  const [bio, setBio] = useState(user?.restaurant?.bio || '');
  const [address, setAddress] = useState(user?.restaurant?.address || '');
  const [customColor, setCustomColor] = useState(accentColor);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';
  
  const [logoPreview, setLogoPreview] = useState(user?.restaurant?.logo_url || '');
  const [bannerPreview, setBannerPreview] = useState(user?.restaurant?.banner_url || '');

  useEffect(() => {
    if (user?.restaurant) {
      setAccentColor(user.restaurant.accent_color || '#f59e0b');
      setSlug(user.restaurant.slug || '');
      setBio(user.restaurant.bio || '');
      setAddress(user.restaurant.address || '');
      setCustomColor(user.restaurant.accent_color || '#f59e0b');
      setLogoPreview(user.restaurant.logo_url || '');
      setBannerPreview(user.restaurant.banner_url || '');
    }
  }, [user]);

  const colors = [
    { name: 'Amarelo (Padrão)', value: '#f59e0b', emoji: '🌟' },
    { name: 'Esmeralda', value: '#10b981', emoji: '🌿' },
    { name: 'Rosa', value: '#ec4899', emoji: '🌸' },
    { name: 'Vermelho', value: '#ef4444', emoji: '🔥' },
    { name: 'Azul', value: '#3b82f6', emoji: '💎' },
    { name: 'Violeta', value: '#8b5cf6', emoji: '🔮' },
    { name: 'Laranja', value: '#f97316', emoji: '🍊' },
    { name: 'Cyan', value: '#06b6d4', emoji: '🧊' },
  ];

  const themeOptions = [
    { value: 'dark' as const, label: 'Escuro', icon: Moon, description: 'Elegante e moderno' },
    { value: 'light' as const, label: 'Claro', icon: Sun, description: 'Limpo e profissional' },
  ];

  const handleColorChange = (color: string) => {
    setAccentColor(color);
    setCustomColor(color);
    document.documentElement.style.setProperty('--accent', color);
  };

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

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public_assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('public_assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalLogoUrl = logoPreview;
      let finalBannerUrl = bannerPreview;

      if (logoInputRef.current?.files?.[0]) {
        finalLogoUrl = await uploadFile(logoInputRef.current.files[0], 'branding');
      }
      if (bannerInputRef.current?.files?.[0]) {
        finalBannerUrl = await uploadFile(bannerInputRef.current.files[0], 'branding');
      }

      const updates = {
        accent_color: accentColor,
        slug: slug,
        bio: bio,
        address: address,
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
      };

      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', user?.restaurant?.id)
        .select()
        .single();

      if (error) throw error;
      
      if (setUser && user) {
        setUser({ ...user, restaurant: data });
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Erro ao salvar branding:', error);
      alert(error.message || 'Erro ao atualizar identidade visual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-10 pb-20">
      <header>
        <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Identidade Visual
        </h2>
        <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
          Personalize como os clientes veem sua marca.
        </p>
      </header>

      {/* ═══ SEÇÃO 1: Tema do Painel ═══ */}
      <section className={`rounded-3xl p-6 border ${
        isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
            <Monitor className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Aparência do Painel
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              Escolha entre o modo escuro ou claro para seu painel administrativo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme(opt.value)}
                className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-current shadow-lg'
                    : isLight
                      ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}
                style={isActive ? { 
                  borderColor: 'var(--accent)',
                  backgroundColor: 'color-mix(in srgb, var(--accent) 8%, transparent)'
                } : {}}
              >
                <div 
                  className={`p-3 rounded-xl transition-all ${
                    isActive ? '' : isLight ? 'bg-slate-100' : 'bg-zinc-800'
                  }`}
                  style={isActive ? { backgroundColor: 'var(--accent)' } : {}}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-zinc-950' : isLight ? 'text-slate-500' : 'text-zinc-400'}`} />
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${
                    isActive 
                      ? '' 
                      : isLight ? 'text-slate-700' : 'text-zinc-300'
                  }`}
                  style={isActive ? { color: 'var(--accent)' } : {}}
                  >
                    {opt.label}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                    {opt.description}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <Check className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* ═══ Logo & Banner ═══ */}
          <div className={`rounded-3xl p-6 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <label className={`text-sm font-medium mb-4 block ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Logo do Restaurante
            </label>
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 border rounded-2xl flex items-center justify-center overflow-hidden relative group ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
              }`}>
                {logoPreview ? (
                  <img src={logoPreview} className="w-full h-full object-cover" alt="Preview Logo" />
                ) : (
                  <Upload className={`w-8 h-8 ${isLight ? 'text-slate-300' : 'text-zinc-700'}`} />
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
                className="text-sm font-bold hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                Alterar Logo
              </button>
            </div>
          </div>

          <div className={`rounded-3xl p-6 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <label className={`text-sm font-medium mb-4 block ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
              Banner de Capa (Mobile)
            </label>
            <div className={`aspect-video border rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
               {bannerPreview ? (
                 <img src={bannerPreview} className="w-full h-full object-cover" alt="Preview Banner" />
               ) : (
                 <>
                   <ImageIcon className={`w-10 h-10 ${isLight ? 'text-slate-300' : 'text-zinc-700'}`} />
                   <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>Recomendado: 800x400px</p>
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
                 className={`absolute bottom-4 right-4 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                   isLight 
                     ? 'bg-white/80 text-slate-700 border-slate-300 hover:bg-white' 
                     : 'bg-zinc-900/80 text-white border-zinc-700 hover:bg-zinc-800'
                 }`}
               >
                 Upload Banner
               </button>
            </div>
          </div>

          {/* ═══ Bio, Address & Slug ═══ */}
          <div className={`rounded-3xl p-6 space-y-4 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
             <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  <Globe className="w-4 h-4" /> URL Personalizada (Final do Link)
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono py-3 px-3 rounded-l-2xl border-y border-l shrink-0 ${
                    isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    /menu/
                  </span>
                  <input 
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="nome-do-seu-restaurante"
                    className={`flex-1 rounded-r-2xl py-3 px-4 outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                  />
                </div>
             </div>
             <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  <Type className="w-4 h-4" /> Bio / Descrição Curta
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua culinária..."
                  className={`w-full rounded-2xl py-3 px-4 outline-none min-h-[100px] resize-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                      : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                  }`}
                />
             </div>
             <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  <MapPin className="w-4 h-4" /> Endereço Físico
                </label>
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade"
                  className={`w-full rounded-2xl py-3 px-4 outline-none border ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                      : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                  }`}
                />
             </div>
          </div>
        </div>

        {/* ═══ Cores & Preview ═══ */}
        <div className="space-y-6">
          <div className={`rounded-3xl p-6 space-y-6 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Cor Principal
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Define a identidade visual do seu cardápio e painel
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {colors.map((color) => (
                <motion.button
                  key={color.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleColorChange(color.value)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 ${
                    accentColor === color.value 
                      ? 'shadow-md' 
                      : isLight
                        ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                  style={accentColor === color.value ? {
                    borderColor: color.value,
                    backgroundColor: `${color.value}10`
                  } : {}}
                >
                  <div className="relative">
                    <div 
                      className="w-7 h-7 rounded-full shadow-inner ring-2 ring-white/20" 
                      style={{ backgroundColor: color.value }}
                    />
                    <AnimatePresence>
                      {accentColor === color.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={`text-xs font-medium ${
                    isLight ? 'text-slate-600' : 'text-zinc-300'
                  }`}>
                    {color.emoji} {color.name}
                  </span>
                </motion.button>
              ))}
            </div>

            <div className={`rounded-2xl border overflow-hidden ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <button
                onClick={() => setShowWheel(!showWheel)}
                className={`w-full flex items-center gap-4 p-4 transition-all ${
                  isLight ? 'hover:bg-slate-100' : 'hover:bg-zinc-900'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-inner ring-2 ring-white/20 shrink-0"
                  style={{ backgroundColor: customColor }}
                />
                <div className="flex-1 text-left">
                  <p className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Cor Personalizada
                  </p>
                  <p className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                    {customColor.toUpperCase()}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: showWheel ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className={`w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showWheel && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className={`px-4 pb-5 pt-2 flex flex-col items-center gap-4 border-t ${
                      isLight ? 'border-slate-200' : 'border-zinc-800'
                    }`}>
                      <ColorWheelPicker
                        value={customColor}
                        onChange={(color) => {
                          setCustomColor(color);
                          setAccentColor(color);
                        }}
                        size={220}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Save Button ═══ */}
      <div className="flex justify-end pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={loading}
          className={`font-bold py-4 px-10 rounded-2xl flex items-center gap-2 transition-all shadow-xl disabled:opacity-50 ${
            saved 
              ? 'bg-emerald-500 text-white' 
              : isLight 
                ? 'bg-slate-900 text-white hover:bg-slate-800' 
                : 'bg-white text-zinc-950 hover:bg-zinc-200'
          }`}
          style={!saved && !isLight ? { backgroundColor: accentColor } : {}}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Salvo com Sucesso!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {loading ? 'Publicando...' : 'Publicar Alterações'}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
