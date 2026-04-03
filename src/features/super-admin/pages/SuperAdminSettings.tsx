import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Key, CreditCard, Save, Loader2, Eye, EyeOff, Palette, Type, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  type?: 'text' | 'select' | 'color';
  options?: { value: string; label: string }[];
}

const openRouterFields: SettingField[] = [
  { key: 'openrouter_api_key', label: 'API Key do OpenRouter', placeholder: 'sk-or-v1-...', secret: true },
  { key: 'openrouter_model', label: 'Modelo padrão', placeholder: 'google/gemini-2.0-flash-001' },
];

const ownPixFields: SettingField[] = [
  { key: 'own_pix_key', label: 'Sua Chave Pix (Nubank)', placeholder: 'seu@email.com' },
  { key: 'own_pix_name', label: 'Nome do Recebedor (Até 25 chars)', placeholder: 'SEU NOME COMPLETO' },
  { key: 'own_pix_city', label: 'Cidade do Recebedor (Até 15 chars)', placeholder: 'SAO PAULO' },
  { key: 'pix_sync_token', label: 'Token de Sincronização Gmail', placeholder: 'token-secreto-123', secret: true },
];

const themeFields: SettingField[] = [
  { key: 'global_primary_color', label: 'Cor primária (hex)', placeholder: '#f59e0b', type: 'color' },
  { key: 'global_font_heading', label: 'Fonte dos títulos', placeholder: 'Playfair Display', type: 'select', options: [
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Oswald', label: 'Oswald' },
  ]},
  { key: 'global_font_body', label: 'Fonte do corpo', placeholder: 'Inter', type: 'select', options: [
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Nunito', label: 'Nunito' },
  ]},
];

const ALL_FIELDS = [...openRouterFields, ...ownPixFields, ...themeFields];

export default function SuperAdminSettings() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const allKeys = ALL_FIELDS.map(f => f.key);
    const { data } = await supabase
      .from('global_settings' as any)
      .select('key, value')
      .in('key', allKeys);

    const map: Record<string, string> = {};
    (data as any[])?.forEach((r: any) => { map[r.key] = r.value || ''; });
    setValues(map);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    for (const field of ALL_FIELDS) {
      const val = values[field.key] ?? '';
      const { error } = await supabase
        .from('global_settings' as any)
        .upsert({ key: field.key, value: val } as any, { onConflict: 'key' });
      if (error) {
        toast.error(`Erro ao salvar ${field.label}`);
        setSaving(false);
        return;
      }
    }
    toast.success('Configurações salvas com sucesso!');
    window.dispatchEvent(new CustomEvent('theme-updated'));
    setSaving(false);
  }

  const toggleVisibility = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderFields = (fields: SettingField[]) =>
    fields.map(field => (
      <div key={field.key} className="space-y-1.5">
        <Label>{field.label}</Label>
        {field.type === 'select' && field.options ? (
          <Select
            value={values[field.key] || ''}
            onValueChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
          >
            <SelectTrigger><SelectValue placeholder={field.placeholder} /></SelectTrigger>
            <SelectContent>
              {field.options.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'color' ? (
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={values[field.key] || '#f59e0b'}
              onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
              className="w-10 h-10 rounded border border-border cursor-pointer"
            />
            <Input
              value={values[field.key] || ''}
              onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="flex-1"
            />
          </div>
        ) : (
          <div className="relative">
            <Input
              type={field.secret && !visibleSecrets[field.key] ? 'password' : 'text'}
              value={values[field.key] || ''}
              onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
            {field.secret && (
              <button
                type="button"
                onClick={() => toggleVisibility(field.key)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {visibleSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}
      </div>
    ));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações Globais</h1>
        <p className="text-muted-foreground text-sm mt-1">APIs, tema e pagamentos (Pix Próprio)</p>
      </div>

      <Tabs defaultValue="apis">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="apis">IA (OpenRouter)</TabsTrigger>
          <TabsTrigger value="ownpix">Pagamento (Pix)</TabsTrigger>
          <TabsTrigger value="theme">Identidade Visual</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4 mt-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="w-5 h-5 text-primary" /> OpenRouter (IA)
                </CardTitle>
                <CardDescription>API para geração de descrições e extração de cardápios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">{renderFields(openRouterFields)}</CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="ownpix" className="space-y-4 mt-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-sm border-border bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" /> Pix Próprio (Nubank)
                </CardTitle>
                <CardDescription>Chave Pix e Token de sincronização Gmail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">{renderFields(ownPixFields)}</CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4 mt-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-sm border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-primary" /> Estética do Cardápio
                </CardTitle>
                <CardDescription>Cores e fontes globais da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">{renderFields(themeFields)}</CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar Configurações
      </Button>
    </div>
  );
}

