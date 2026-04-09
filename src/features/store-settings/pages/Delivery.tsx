import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Info, Save, Eye, EyeOff, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function Delivery() {
  const { impersonatedUserId } = useImpersonateStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    delivery_fee: '0',
    show_delivery_info: true,
    custom_delivery_label: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('delivery_fee, show_delivery_info, custom_delivery_label')
      .eq('user_id', userId)
      .single();

    if (error) {
      toast.error('Erro ao carregar configurações');
    } else if (data) {
      setSettings({
        delivery_fee: String(data.delivery_fee || 0),
        show_delivery_info: data.show_delivery_info ?? true,
        custom_delivery_label: data.custom_delivery_label || ''
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        delivery_fee: parseFloat(settings.delivery_fee) || 0,
        show_delivery_info: settings.show_delivery_info,
        custom_delivery_label: settings.custom_delivery_label
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao salvar:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success('Configurações de entrega atualizadas!');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Truck className="w-6 h-6" />
          </div>
          Entrega e Taxas
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Configure como o frete e as taxas de entrega são exibidos no seu cardápio.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden group">
          <CardHeader className="bg-muted/30 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Valores de Entrega</CardTitle>
                <CardDescription>Defina o valor base cobrado por entrega.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid gap-4 max-w-sm">
              <Label htmlFor="delivery_fee" className="text-sm font-bold uppercase tracking-wider opacity-70">Taxa de Entrega Padrão</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  value={settings.delivery_fee}
                  onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })}
                  className="pl-12 h-14 bg-muted/20 border-none rounded-2xl font-black text-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic">Dica: Deixe 0.00 para exibir como "Frete Grátis".</p>
            </div>

            <div className="pt-6 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-bold flex items-center gap-2">
                    {settings.show_delivery_info ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
                    Exibir Informação de Frete no Cardápio
                  </Label>
                  <p className="text-sm text-muted-foreground">Quando desativado, o badge de frete não aparecerá no topo do cardápio.</p>
                </div>
                <Switch
                  checked={settings.show_delivery_info}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_delivery_info: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/30 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Rótulo Personalizado</CardTitle>
                <CardDescription>Sobrescreva o texto automático de frete.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-wider opacity-70">Texto Exibido no Cardápio</Label>
              <Input
                placeholder="Ex: Frete Grátis acima de R$ 100 ou Consulte seu CEP"
                value={settings.custom_delivery_label}
                onChange={(e) => setSettings({ ...settings, custom_delivery_label: e.target.value })}
                className="h-14 bg-muted/20 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary/20"
              />
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Se preenchido, este texto **substituirá** o valor numérico ou o "Frete Grátis" no cabeçalho do seu cardápio público. Use para avisos especiais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end pt-4 pb-20">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
