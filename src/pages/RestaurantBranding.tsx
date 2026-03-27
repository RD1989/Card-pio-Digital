import { useState, useRef } from 'react';
import { 
  Palette, Upload, Image as ImageIcon, Save, Check, Type, MapPin,
  Sun, Moon, Monitor, Sparkles, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { ColorWheelPicker } from '../components/ColorWheelPicker';
import api from '../services/api';

export const RestaurantBranding = () => {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  
  const [accentColor, setAccentColor] = useState(user?.restaurant?.accent_color || '#f59e0b');
  const [bio, setBio] = useState(user?.restaurant?.bio || '');
  const [address, setAddress] = useState(user?.restaurant?.address || '');
  const [customColor, setCustomColor] = useState(accentColor);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === 'light';
 
  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:8000${url}`;
  };
 
  const [logoPreview, setLogoPreview] = useState(getImageUrl(user?.restaurant?.logo_url));
  const [bannerPreview, setBannerPreview] = useState(getImageUrl(user?.restaurant?.banner_url));

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
    // Aplica imediatamente o preview
    document.documentElement.style.setProperty('--accent', color);
  };

  // ... handleColorChange j faz o trabalho

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
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar branding:', error);
      alert('Erro ao atualizar identidade visual.');
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
                  <img src={logoPreview} className="w-full h-full object-cover" />
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
                 <img src={bannerPreview} className="w-full h-full object-cover" />
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

          {/* ═══ Bio & Address ═══ */}
          <div className={`rounded-3xl p-6 space-y-4 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}>
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
            
            {/* Color Grid */}
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

            {/* Custom Color Picker — Color Wheel */}
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
                          document.documentElement.style.setProperty('--accent', color);
                        }}
                        size={220}
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg shadow-inner ring-1 ring-black/10 shrink-0"
                            style={{ backgroundColor: customColor }}
                          />
                          <input
                            type="text"
                            value={customColor.toUpperCase()}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                                setCustomColor(v);
                                if (v.length === 7) {
                                  setAccentColor(v);
                                  document.documentElement.style.setProperty('--accent', v);
                                }
                              }
                            }}
                            className={`flex-1 rounded-lg px-3 py-2 text-xs font-mono border outline-none ${
                              isLight
                                ? 'bg-white border-slate-200 text-slate-900 focus:border-slate-400'
                                : 'bg-zinc-900 border-zinc-700 text-white focus:border-zinc-500'
                            }`}
                          />
                        </div>
                        <button
                          onClick={() => handleColorChange(customColor)}
                          className="text-xs font-bold px-4 py-2 rounded-lg transition-all text-zinc-950"
                          style={{ backgroundColor: customColor }}
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live Preview */}
            <div className={`pt-6 border-t ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
              <p className={`text-sm mb-4 ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Preview em tempo real:
              </p>
              <div className={`rounded-2xl p-5 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black border-zinc-800'
              }`}>
                 <button 
                  className="w-full py-3.5 rounded-xl font-bold text-zinc-950 flex items-center justify-center gap-2 mb-3 transition-all shadow-lg"
                  style={{ 
                    backgroundColor: accentColor,
                    boxShadow: `0 4px 20px ${accentColor}40`
                  }}
                >
                  Confirmar Pedido
                </button>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-1 w-12 rounded-full" style={{ backgroundColor: accentColor }} />
                  <div className="h-1 w-6 rounded-full opacity-30" style={{ backgroundColor: accentColor }} />
                  <div className="h-1 w-3 rounded-full opacity-10" style={{ backgroundColor: accentColor }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="rounded-3xl p-6 border" style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 5%, transparent)',
            borderColor: 'color-mix(in srgb, var(--accent) 12%, transparent)'
          }}>
            <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--accent)' }}>💡 Dica de Arquiteto:</h4>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
              Cores quentes como Vermelho e Amarelo estimulam o apetite. 
              Use o Rosa para confeitarias e Esmeralda para pratos naturais ou fit.
              A cor escolhida será aplicada no seu cardápio público e painel.
            </p>
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
};
