import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Link as LinkIcon, Plus, Trash2, GripVertical, Check, X, Loader2, ExternalLink, Eye, Smartphone, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';

interface BioLink {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
  sort_order: number;
}

export default function BioLinks() {
  const { impersonatedUserId } = useImpersonateStore();
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  
  // Branding for Preview
  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');
  const [bioLinkText, setBioLinkText] = useState('FAZER PEDIDO NO CARDÁPIO');
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const bioLinkUrl = slug ? `${window.location.origin}/links/${slug}` : '';

  const handleCopyLink = () => {
    if (!bioLinkUrl) return;
    navigator.clipboard.writeText(bioLinkUrl);
    setCopied(true);
    toast.success('Link copiado com sucesso!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchData();
  }, [impersonatedUserId]);

  async function fetchData() {
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
    }

    // Fetch Links
    const { data: linksData } = await (supabase as any)
      .from('bio_links')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    setLinks(linksData || []);

    // Fetch Profile for Preview
    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_name, logo_url, primary_color, slug, bio_link_text')
      .eq('user_id', userId)
      .single();
    if (profile) {
      setRestaurantName(profile.restaurant_name);
      setLogoUrl(profile.logo_url || '');
      setPrimaryColor(profile.primary_color || '#f59e0b');
      setSlug(profile.slug);
      setBioLinkText(profile.bio_link_text || 'FAZER PEDIDO NO CARDÁPIO');
    }
    
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!newTitle || !newUrl) {
      toast.error('Preencha título e URL');
      return;
    }
    
    setSaving(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || '';
    }

    const { data, error } = await (supabase as any).from('bio_links').insert({
      user_id: userId,
      title: newTitle,
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
      sort_order: links.length
    }).select().single();

    if (error) {
      toast.error('Erro ao adicionar link');
    } else {
      setLinks([...links, data]);
      setNewTitle('');
      setNewUrl('');
      setShowAdd(false);
      toast.success('Link adicionado!');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from('bio_links').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir');
    } else {
      setLinks(links.filter(l => l.id !== id));
      toast.success('Link excluído');
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const { error } = await (supabase as any).from('bio_links').update({ is_active: !active }).eq('id', id);
    if (!error) {
      setLinks(links.map(l => l.id === id ? { ...l, is_active: !active } : l));
    }
  };

  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || '';
    }

    const { error } = await supabase
      .from('profiles')
      .update({ bio_link_text: bioLinkText } as any)
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas!');
    }
    setSavingGlobal(false);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold font-inter">Link na Bio (Instagram)</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie sua central de links personalizada para redes sociais.</p>
        </div>

        {/* Global Settings */}
        <div className="glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
            <Smartphone className="w-4 h-4" /> Configuração Geral
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Texto do Botão do Cardápio</label>
            <div className="flex gap-2">
              <input 
                value={bioLinkText} 
                onChange={e => setBioLinkText(e.target.value)}
                placeholder="Ex: ACESSAR NOSSO CARDÁPIO" 
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all text-sm font-bold"
              />
              <button 
                onClick={handleSaveGlobal}
                disabled={savingGlobal}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Este é o botão principal que fica no topo da sua página de links.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group"
        >
          <Plus className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-primary">Adicionar Novo Link</span>
        </button>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Título do Botão</label>
                <input 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: WhatsApp da Loja" 
                  className="w-full px-4 py-2 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">URL / Link</label>
                <input 
                  value={newUrl} 
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="Ex: wa.me/55..." 
                  className="w-full px-4 py-2 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleAdd} 
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar Link
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-muted font-bold hover:bg-muted/80 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        <Reorder.Group axis="y" values={links} onReorder={handleReorder} className="space-y-3">
          {links.map((link) => (
            <Reorder.Item key={link.id} value={link} className="glass p-4 flex items-center gap-4 group cursor-move hover:border-primary/30 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground/30" />
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-sm truncate ${!link.is_active && 'opacity-50 line-through'}`}>{link.title}</h4>
                <p className="text-[10px] text-muted-foreground truncate opacity-60 italic">{link.url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleToggle(link.id, link.is_active)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${link.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-muted text-muted-foreground/50'}`}
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(link.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Item>
          ))}
          {links.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum link personalizado ainda.</p>
            </div>
          )}
        </Reorder.Group>
      </div>

      {/* Mobile Preview */}
      <div className="sticky top-8 block">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
          <Smartphone className="w-4 h-4" /> Prévia Mobile (Instagram/Bio)
        </div>
        <div className="relative mx-auto w-[280px] h-[560px] border-[8px] border-neutral-900 rounded-[3rem] shadow-2xl overflow-hidden bg-background">
          <div className="absolute top-0 w-full h-4 animate-pulse bg-neutral-900/10" />
          
          <div className="h-full overflow-y-auto hide-scrollbar p-6 space-y-6 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
             {/* Profile Header */}
             <div className="pt-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto border-4 border-white shadow-lg overflow-hidden ring-1 ring-black/5">
                  {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary">Logo</div>}
                </div>
                <h3 className="font-extrabold text-lg">{restaurantName || 'Nome da Loja'}</h3>
             </div>

             {/* Links List */}
             <div className="space-y-3 pb-8">
                {/* Fixed Menu Link */}
                <motion.a 
                  whileHover={{ scale: 1.02 }} 
                  className="block w-full py-3.5 px-4 rounded-xl font-bold text-sm text-center shadow-lg filter saturate-[1.2] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor, color: '#fff' }}
                >
                  <Store className="w-4 h-4 opacity-50" /> {bioLinkText || 'Acessar Cardápio'}
                </motion.a>

                {/* Custom Links */}
                {links.filter(l => l.is_active).map((link) => (
                  <motion.a 
                    key={link.id}
                    whileHover={{ scale: 1.02 }} 
                    className="block w-full py-3.5 px-4 rounded-xl border-2 font-semibold text-sm text-center transition-all bg-white hover:bg-neutral-50 shadow-sm"
                    style={{ borderColor: primaryColor + '20' }}
                  >
                    {link.title}
                  </motion.a>
                ))}
             </div>

             <div className="text-[10px] text-muted-foreground opacity-50 font-medium">Link by Cardápio Digital SaaS</div>
          </div>
        </div>
        <div className="mt-6 glass p-4 rounded-2xl border-primary/20 space-y-3">
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Seu Link Personalizado</span>
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border group">
                    <code className="text-[11px] font-mono text-muted-foreground flex-1 truncate px-1">
                        {bioLinkUrl || 'Carregando URL...'}
                    </code>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={handleCopyLink}
                    disabled={!slug}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Link'}
                </button>
                <a 
                    href={bioLinkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted font-bold text-xs hover:bg-muted/80 transition-all text-muted-foreground"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Link
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}

