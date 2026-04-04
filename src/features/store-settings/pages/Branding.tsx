import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, Type, Eye, Loader2, Paintbrush } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { QRCodeGenerator } from '@/shared/components/common/QRCodeGenerator';

const fontOptions = [
  { value: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins, sans-serif' },
  { value: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, sans-serif' },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, sans-serif' },
  { value: 'lora', label: 'Lora', family: 'Lora, serif' },
];

const presetColors = [
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Esmeralda', hex: '#22c55e' },
  { name: 'Rubi', hex: '#ef4444' },
  { name: 'Safira', hex: '#3b82f6' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
];

export default function Branding() {
  const { impersonatedUserId } = useImpersonateStore();
  const [selectedColor, setSelectedColor] = useState(presetColors[0].hex);
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [fontStyle, setFontStyle] = useState('inter');
  const [themeMode, setThemeMode] = useState('auto');
  const [menuLayout, setMenuLayout] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      let userId = impersonatedUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        userId = user.id;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (profile) {
        setRestaurantName(profile.restaurant_name || '');
        setSlug(profile.slug || '');
        setSelectedColor(profile.primary_color || presetColors[0].hex);
        setFontStyle((profile as any).font_style || 'inter');
        setThemeMode((profile as any).theme_mode || 'auto');
        setMenuLayout((profile as any).menu_layout || 'classic');
        if (profile.logo_url) setLogoPreview(profile.logo_url);
        if ((profile as any).banner_url) setBannerPreview((profile as any).banner_url);
      }
      setLoading(false);
    }
    loadProfile();
  }, [impersonatedUserId]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A logo deve ter no máximo 2MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('O banner deve ter no máximo 3MB');
      return;
    }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      userId = user.id;
    }

    let logoUrl = logoPreview;
    let bannerUrl = bannerPreview;

    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${userId}/logo-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, logoFile);
      if (uploadErr) { toast.error('Erro no upload da logo'); setSaving(false); return; }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      logoUrl = data.publicUrl;
    }

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop();
      const path = `${userId}/banner-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, bannerFile);
      if (uploadErr) { toast.error('Erro no upload do banner'); setSaving(false); return; }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      bannerUrl = data.publicUrl;
    }

    const { error } = await (supabase as any).from('profiles').update({
      restaurant_name: restaurantName.trim(),
      primary_color: selectedColor,
      font_style: fontStyle,
      theme_mode: themeMode,
      menu_layout: menuLayout,
      logo_url: logoUrl || '',
      banner_url: bannerUrl || '',
    }).eq('user_id', userId);

    if (error) { toast.error('Erro ao salvar'); } else { toast.success('Identidade visual salva!'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold font-inter">Identidade Visual</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize a aparência do seu cardápio público</p>
      </div>

      {slug && <QRCodeGenerator slug={slug} restaurantName={restaurantName} />}

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Type className="w-4 h-4" /> Nome do Restaurante
        </div>
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Ex: Bistrô da Vila"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-inter"
        />
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Upload className="w-4 h-4" /> Logo do Perfil
        </div>
        <div className="flex items-center gap-6">
          <label className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30 overflow-hidden shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-2">Enviar Logo</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-primary">Resolução Ideal: 256x256px (1:1)</p>
            <p className="mt-1">PNG ou JPG. Máximo 2MB.</p>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Paintbrush className="w-4 h-4" /> Banner da Capa
        </div>
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30 relative overflow-hidden group">
            {bannerPreview ? (
              <>
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-semibold">Alterar Capa</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Enviar imagem de capa profissional</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </label>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p className="font-semibold text-primary">Resolução Ideal: 1200x400px (3:1)</p>
            <p>Máximo 3MB.</p>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Palette className="w-4 h-4" /> Cor do Tema
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
          {presetColors.map((color) => (
            <button
              key={color.hex}
              onClick={() => setSelectedColor(color.hex)}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                selectedColor === color.hex ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: color.hex }} />
              <span className="text-[10px] font-medium">{color.name}</span>
            </button>
          ))}
          
          {/* Custom Color Selector */}
          <div className="relative">
            <button
              className={`w-full flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                !presetColors.some(c => c.hex === selectedColor) ? 'border-primary bg-primary/10' : 'border-border'
              }`}
              onClick={() => document.getElementById('customColorPicker')?.click()}
            >
              <div 
                className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center bg-muted border border-border"
                style={{ backgroundColor: !presetColors.some(c => c.hex === selectedColor) ? selectedColor : undefined }}
              >
                <Paintbrush className={`w-4 h-4 ${!presetColors.some(c => c.hex === selectedColor) ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-[10px] font-medium">Personalizar</span>
            </button>
            <input
              id="customColorPicker"
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
            />
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Palette className="w-4 h-4" /> Tema Visual
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Claro', icon: '☀️' },
            { value: 'dark', label: 'Escuro', icon: '🌙' },
            { value: 'auto', label: 'Sistema', icon: '💻' }
          ].map((theme) => (
            <button
              key={theme.value}
              onClick={() => setThemeMode(theme.value)}
              className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                themeMode === theme.value ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <span className="text-xl">{theme.icon}</span>
              <span className="text-[10px] font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
          <Eye className="w-4 h-4" /> Estilo da Experiência
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'classic', label: 'Clássico', desc: 'Simples e direto' },
            { value: 'premium', label: 'Premium App', desc: 'Moderno (Estilo App)' }
          ].map((layout) => (
            <button
              key={layout.value}
              onClick={() => setMenuLayout(layout.value)}
              className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-1 ${
                menuLayout === layout.value ? 'border-primary bg-primary/10' : 'border-border'
              }`}
            >
              <span className="text-xs font-bold">{layout.label}</span>
              <span className="text-[10px] text-muted-foreground">{layout.desc}</span>
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary mb-2">
          <Eye className="w-4 h-4" /> Prévia do Cardápio
        </div>
        <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-inner" style={{ fontFamily: fontOptions.find(f => f.value === fontStyle)?.family }}>
          <div className="h-32 w-full bg-muted relative">
            {bannerPreview && <img src={bannerPreview} alt="Banner prev" className="w-full h-full object-cover" />}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <div className="w-20 h-20 rounded-full border-4 border-background bg-white shadow-xl overflow-hidden ring-1 ring-black/5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo prev" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">Logo</div>
                )}
              </div>
            </div>
          </div>
          <div className="pt-10 pb-6 text-center">
            <h2 className="text-xl font-extrabold" style={{ color: selectedColor }}>{restaurantName || 'Menu Digital'}</h2>
            <div className="mt-3 flex justify-center gap-1.5">
              <div className="h-1.5 w-12 bg-muted rounded-full" />
              <div className="h-1.5 w-8 bg-muted rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </motion.section>

      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-95 transition-all flex items-center justify-center gap-3 shadow-lg glow-primary"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publicar Alterações'}
        </button>
      </div>
    </div>
  );
}


