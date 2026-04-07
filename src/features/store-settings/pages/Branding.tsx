import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload, Type, Eye, Loader2, Paintbrush, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { QRCodeGenerator } from '@/shared/components/common/QRCodeGenerator';
import { Label } from '@/shared/components/ui/label';

// ... (fontOptions and presetColors remain the same)

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
  const [whatsapp, setWhatsapp] = useState('');
  const [slug, setSlug] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerBannerPreview, setHeaderBannerPreview] = useState<string | null>(null);
  const [headerBannerFile, setHeaderBannerFile] = useState<File | null>(null);
  const [banners, setBanners] = useState<{ id: string, url: string, file: File | null }[]>([]);
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
        setWhatsapp(profile.whatsapp || '');
        setSlug(profile.slug || '');
        setSelectedColor(profile.primary_color || presetColors[0].hex);
        setFontStyle((profile as any).font_style || 'inter');
        setThemeMode((profile as any).theme_mode || 'auto');
        setMenuLayout((profile as any).menu_layout || 'classic');
        if (profile.logo_url) setLogoPreview(profile.logo_url);
        
        // 1. CARREGAR BANNER DA CAPA (HEADER)
        if (profile.banner_url) setHeaderBannerPreview(profile.banner_url);
        
        // 2. CARREGAR CARROSSEL DE BANNERS (SLIDE)
        const bannerUrls = (profile as any).banner_urls as string[] || [];
        const existingBanners: { id: string, url: string, file: File | null }[] = [];
        bannerUrls.forEach((url, index) => {
          existingBanners.push({ id: `existing-${index}`, url, file: null });
        });
        setBanners(existingBanners);
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

  const handleHeaderBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('O banner da capa deve ter no máximo 3MB');
      return;
    }
    setHeaderBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setHeaderBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (banners.length + files.length > 5) {
      toast.error('O carrossel suporta no máximo 5 banners');
      return;
    }

    Array.from(files).forEach(file => {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`O arquivo ${file.name} excede 3MB`);
        return;
      }
      const reader = new FileReader();
      const id = `new-${Math.random().toString(36).substr(2, 9)}`;
      reader.onload = () => {
        setBanners(prev => [...prev, { id, url: reader.result as string, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
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
    let finalHeaderUrl = headerBannerPreview;
    const finalSliderUrls: string[] = [];

    // 1. Upload Logo
    if (logoFile) {
      const ext = logoFile.name.split('.').pop();
      const path = `${userId}/logo-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, logoFile);
      if (!uploadErr) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        logoUrl = data.publicUrl;
      }
    }

    // 2. Upload Header Banner
    if (headerBannerFile) {
      const ext = headerBannerFile.name.split('.').pop();
      const path = `${userId}/header-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, headerBannerFile);
      if (!uploadErr) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path);
        finalHeaderUrl = data.publicUrl;
      }
    }

    // 3. Upload Slider Banners
    for (const banner of banners) {
      if (banner.file) {
        const ext = banner.file.name.split('.').pop();
        const path = `${userId}/banner-${Date.now()}-${banner.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, banner.file);
        if (!uploadErr) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(path);
          finalSliderUrls.push(data.publicUrl);
        }
      } else {
        finalSliderUrls.push(banner.url);
      }
    }

    const { error } = await (supabase as any).from('profiles').update({
      restaurant_name: restaurantName.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      slug: slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''),
      primary_color: selectedColor,
      font_style: fontStyle,
      theme_mode: themeMode,
      menu_layout: menuLayout,
      logo_url: logoUrl || '',
      banner_url: finalHeaderUrl || '', // Banner do Cabeçalho
      banner_urls: finalSliderUrls, // Banners do Slide
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-inter text-foreground">Identidade Visual</h1>
          <p className="text-muted-foreground text-sm mt-1">Personalize a aparência do seu cardápio público</p>
        </div>
        {slug && <QRCodeGenerator slug={slug} restaurantName={restaurantName} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-8 items-start">
        <div className="space-y-6">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-sm p-6 space-y-6">
            <div className="space-y-4">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase opacity-70">Número do WhatsApp (Pedidos)</Label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase opacity-70">Link do Cardápio (Slug)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">menu/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Upload className="w-4 h-4" /> Logo do Perfil
            </div>
            <div className="flex items-center gap-6">
              <label className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/30 overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-2 font-bold">Enviar Logo</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-primary">Resolução Ideal: 1:1 (Quadrada)</p>
                <p className="mt-1">Aparecerá no centro do cabeçalho flutuante.</p>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Upload className="w-4 h-4" /> Banner da Capa (Fundo do Cabeçalho)
            </div>
            <div className="relative group aspect-[16/9] rounded-[24px] overflow-hidden border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/20">
              {headerBannerPreview ? (
                <>
                  <img src={headerBannerPreview} alt="Header" className="w-full h-full object-cover opacity-80" />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-xs font-black uppercase text-white tracking-widest bg-primary/80 px-4 py-2 rounded-full">Trocar Capa</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleHeaderBannerUpload} />
                  </label>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                     <Plus className="w-5 h-5 text-primary" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adicionar Banner de Capa</span>
                   <input type="file" accept="image/*" className="hidden" onChange={handleHeaderBannerUpload} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
              Essa imagem servirá de fundo para o cabeçalho. Proporção recomendada: 16:9 (1280x720px).
            </p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <Paintbrush className="w-4 h-4" /> Carrossel de Banners (Destaques)
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded-md">
                {banners.length} / 5
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="relative group aspect-[3/2] rounded-xl overflow-hidden border border-border bg-muted/30">
                  <img src={banner.url} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeBanner(banner.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {banners.length < 5 && (
                <label className="flex flex-col items-center justify-center aspect-[3/2] rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/20 group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Novo Slide</span>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleBannerUpload} />
                </label>
              )}
            </div>
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-xs font-black text-primary uppercase tracking-widest">Resolução Ideal: 3:2 (1024x683px)</p>
                <p className="text-[10px] text-muted-foreground mt-1">Esses banners aparecerão no slide logo abaixo do cabeçalho.</p>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Palette className="w-4 h-4" /> Cor e Tema do Cardápio
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetColors.map((color) => (
                <button key={color.hex} onClick={() => setSelectedColor(color.hex)} className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${selectedColor === color.hex ? 'border-primary bg-primary/10' : 'border-border'}`}>
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color.hex }} />
                  <span className="text-[10px] font-bold uppercase">{color.name}</span>
                </button>
              ))}
            </div>
          </motion.section>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-95 transition-all flex items-center justify-center gap-3 shadow-lg glow-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="hidden lg:block sticky top-24">
          <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden scale-90 origin-top">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-20" />
            <div className={`h-full w-full bg-background overflow-y-auto pb-16 custom-scrollbar ${themeMode === 'dark' ? 'dark' : ''}`}>
              <div className="relative h-32 w-full bg-slate-200 overflow-hidden">
                {headerBannerPreview ? (
                  <img src={headerBannerPreview} alt="Header" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-slate-400" />
                )}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 bg-card rounded-[20px] p-4 shadow-xl border border-black/5 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white -mt-10 mb-2 border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black uppercase text-primary">Logo</span>}
                  </div>
                  <div className="w-20 h-2.5 bg-foreground/10 rounded-full mb-1" />
                  <div className="w-12 h-2 bg-foreground/5 rounded-full" />
                </div>
              </div>
              <div className="mt-16 px-4">
                 <div className="aspect-[3/2] w-full rounded-2xl bg-muted overflow-hidden relative shadow-md">
                    {banners.length > 0 ? (
                      <img src={banners[0].url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                         <div className="w-8 h-8 rounded-lg bg-foreground/20 mb-2" />
                         <span className="text-[8px] font-black uppercase tracking-widest">Slides</span>
                      </div>
                    )}
                 </div>
              </div>
              <div className="mt-6 px-4 space-y-3">
                 <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-md bg-primary/20" />
                    <div className="w-20 h-3 bg-foreground/10 rounded-full" />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-muted rounded-xl" />
                    <div className="h-20 bg-muted rounded-xl" />
                 </div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-2">
            Prévia Estrutural
          </p>
        </div>
      </div>
    </div>
  );
}
