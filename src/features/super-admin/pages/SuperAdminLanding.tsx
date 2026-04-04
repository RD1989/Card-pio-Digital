import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Eye, Layout, CreditCard, MessageSquare, HelpCircle, Megaphone, FileText, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';

const LANDING_KEYS = [
  'landing_hero_title', 'landing_hero_subtitle', 'landing_hero_badge',
  'landing_plan_basic_name', 'landing_plan_basic_price', 'landing_plan_basic_features',
  'landing_plan_pro_name', 'landing_plan_pro_price', 'landing_plan_pro_features',
  'landing_cta_title', 'landing_cta_subtitle', 'landing_footer_text',
  'landing_video_url', 'landing_video_enabled',
];

export default function SuperAdminLanding() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('global_settings' as any)
        .select('key, value')
        .in('key', LANDING_KEYS);
      const map: Record<string, string> = {};
      (data as any[])?.forEach((r: any) => { map[r.key] = r.value || ''; });
      setValues(map);
      setLoading(false);
    }
    fetch();
  }, []);

  const val = (key: string) => values[`landing_${key}`] || '';
  const set = (key: string, v: string) => setValues(prev => ({ ...prev, [`landing_${key}`]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      for (const fullKey of LANDING_KEYS) {
        const v = values[fullKey] ?? '';
        const { error } = await supabase
          .from('global_settings' as any)
          .upsert({ key: fullKey, value: v } as any, { onConflict: 'key' });
        if (error) throw error;
      }
      toast.success('Landing page atualizada!');
      window.dispatchEvent(new CustomEvent('theme-updated'));
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Deseja realmente restaurar todos os textos originais? Isso apagará suas personalizações.')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('global_settings' as any)
        .delete()
        .in('key', LANDING_KEYS);
      if (error) throw error;
      
      toast.success('Padrões restaurados com sucesso!');
      window.dispatchEvent(new CustomEvent('theme-updated'));
      
      const map: Record<string, string> = {};
      LANDING_KEYS.forEach(k => { map[k] = ''; });
      setValues(map);
    } catch (error: any) {
      toast.error('Erro ao restaurar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customizar Landing Page</h1>
          <p className="text-muted-foreground text-sm mt-1">Edite textos, preços dos planos e conteúdo da página inicial</p>
        </div>
        <a href="/" target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1">
          <Eye className="w-4 h-4" /> Visualizar
        </a>
      </div>

      <Tabs defaultValue="hero">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-3">
            <TabsTrigger value="hero" className="flex-1 whitespace-nowrap">Hero & CTA</TabsTrigger>
            <TabsTrigger value="video" className="flex-1 whitespace-nowrap">Vídeo</TabsTrigger>
            <TabsTrigger value="plans" className="flex-1 whitespace-nowrap">Planos</TabsTrigger>
            <TabsTrigger value="footer" className="flex-1 whitespace-nowrap">Rodapé</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hero" className="space-y-4 mt-4">
          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layout className="w-5 h-5 text-primary" /> Seção Hero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Badge (texto pequeno no topo)</Label>
                <Input value={val('hero_badge')} onChange={e => set('hero_badge', e.target.value)} placeholder="⚡ A nova era do delivery digital" />
              </div>
              <div>
                <Label>Título Principal</Label>
                <Textarea value={val('hero_title')} onChange={e => set('hero_title', e.target.value)} placeholder="Seu Cardápio Digital..." rows={2} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Textarea value={val('hero_subtitle')} onChange={e => set('hero_subtitle', e.target.value)} placeholder="Experimente grátis..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="w-5 h-5 text-primary" /> Seção CTA Final
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título CTA</Label>
                <Input value={val('cta_title')} onChange={e => set('cta_title', e.target.value)} placeholder="TRANSFORME SEU DELIVERY AGORA" />
              </div>
              <div>
                <Label>Subtítulo CTA</Label>
                <Textarea value={val('cta_subtitle')} onChange={e => set('cta_subtitle', e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4 mt-4">
          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-5 h-5 text-primary" /> Seção de Vídeo Decorativo
              </CardTitle>
              <CardDescription>
                Configure um vídeo para ser exibido logo após o Hero. Recomendado: 1920x1080 (HD).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold uppercase tracking-wider opacity-70">Ativar Seção de Vídeo</Label>
                  <p className="text-xs text-muted-foreground">Exibir ou ocultar o player de vídeo na página inicial</p>
                </div>
                <Switch 
                  checked={val('video_enabled') === 'true'} 
                  onCheckedChange={checked => set('video_enabled', checked ? 'true' : 'false')} 
                />
              </div>

              <div className="space-y-2">
                <Label>URL do Vídeo (Youtube Embed)</Label>
                <Input 
                  value={val('video_url')} 
                  onChange={e => set('video_url', e.target.value)} 
                  placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dica: No YouTube, clique em "Compartilhar" &gt; "Incorporar" e copie apenas o link do *src*.
                </p>
              </div>

              {val('video_url') && (
                <div className="aspect-video relative rounded-xl overflow-hidden border-4 border-border/50 bg-black/5 flex items-center justify-center group">
                  <iframe 
                    src={val('video_url')} 
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Preview do Vídeo"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-white rounded-full bg-black/20 backdrop-blur-sm">Prévia Ativa</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4 mt-4">
          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" /> Plano Básico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Plano</Label>
                  <Input value={val('plan_basic_name')} onChange={e => set('plan_basic_name', e.target.value)} />
                </div>
                <div>
                  <Label>Preço (R$)</Label>
                  <Input value={val('plan_basic_price')} onChange={e => set('plan_basic_price', e.target.value)} placeholder="24,90" />
                </div>
              </div>
              <div>
                <Label>Recursos (separe por |)</Label>
                <Textarea value={val('plan_basic_features')} onChange={e => set('plan_basic_features', e.target.value)} placeholder="Até 100 Produtos|Menu Digital|..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" /> Plano Pro
              </CardTitle>
              <CardDescription>Este é o plano destacado com badge "Popular"</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Plano</Label>
                  <Input value={val('plan_pro_name')} onChange={e => set('plan_pro_name', e.target.value)} />
                </div>
                <div>
                  <Label>Preço (R$)</Label>
                  <Input value={val('plan_pro_price')} onChange={e => set('plan_pro_price', e.target.value)} placeholder="39,90" />
                </div>
              </div>
              <div>
                <Label>Recursos (separe por |)</Label>
                <Textarea value={val('plan_pro_features')} onChange={e => set('plan_pro_features', e.target.value)} placeholder="Pedidos ilimitados|Métricas|..." rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4 mt-4">
          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" /> Rodapé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Texto do Rodapé</Label>
              <Input value={val('footer_text')} onChange={e => set('footer_text', e.target.value)} placeholder="© 2026 Menu Pro..." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-8">
        <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1 sm:flex-none order-1 sm:order-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </Button>
        <Button onClick={handleReset} disabled={saving} variant="outline" className="gap-2 flex-1 sm:flex-none border-destructive/30 hover:bg-destructive/10 hover:text-destructive order-2 sm:order-1 lg:ml-auto">
          Restaurar Padrões Originais
        </Button>
      </div>
    </div>
  );
}

