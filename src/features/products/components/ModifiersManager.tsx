import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Settings2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface Modifier {
  id: string;
  product_id: string;
  name: string;
  is_required: boolean;
  max_selections: number;
  sort_order: number;
  options: ModifierOption[];
}

interface ModifierOption {
  id: string;
  modifier_id: string;
  name: string;
  price: number;
  sort_order: number;
}

interface Props {
  productId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModifiersManager({ productId, userId, open, onOpenChange }: Props) {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New modifier form
  const [modName, setModName] = useState('');
  const [modRequired, setModRequired] = useState(false);
  const [modMax, setModMax] = useState('1');

  // New option form
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [optName, setOptName] = useState('');
  const [optPrice, setOptPrice] = useState('');

  useEffect(() => {
    if (open) fetchModifiers();
  }, [open, productId]);

  async function fetchModifiers() {
    setLoading(true);
    const { data: mods } = await (supabase as any)
      .from('product_modifiers')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    const modList = (mods || []) as any[];

    // Fetch options for all modifiers
    if (modList.length > 0) {
      const modIds = modList.map((m: any) => m.id);
      const { data: opts } = await (supabase as any)
        .from('modifier_options')
        .select('*')
        .in('modifier_id', modIds)
        .order('sort_order');

      const options = (opts || []) as ModifierOption[];
      const result: Modifier[] = modList.map((m: any) => ({
        ...m,
        options: options.filter(o => o.modifier_id === m.id),
      }));
      setModifiers(result);
    } else {
      setModifiers([]);
    }
    setLoading(false);
  }

  async function handleAddModifier() {
    if (!modName.trim()) { toast.error('Nome do grupo obrigatório'); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('product_modifiers').insert({
      product_id: productId,
      user_id: userId,
      name: modName.trim(),
      is_required: modRequired,
      max_selections: parseInt(modMax) || 1,
      sort_order: modifiers.length,
    });
    if (error) { toast.error('Erro ao criar grupo'); setSaving(false); return; }
    toast.success('Grupo criado!');
    setModName(''); setModRequired(false); setModMax('1');
    fetchModifiers();
    setSaving(false);
  }

  async function handleDeleteModifier(id: string) {
    await (supabase as any).from('product_modifiers').delete().eq('id', id);
    toast.success('Grupo excluído');
    fetchModifiers();
  }

  async function handleAddOption(modifierId: string) {
    if (!optName.trim()) { toast.error('Nome da opção obrigatório'); return; }
    const mod = modifiers.find(m => m.id === modifierId);
    const { error } = await (supabase as any).from('modifier_options').insert({
      modifier_id: modifierId,
      name: optName.trim(),
      price: parseFloat(optPrice) || 0,
      sort_order: mod?.options.length || 0,
    });
    if (error) { toast.error('Erro ao criar opção'); return; }
    toast.success('Opção adicionada!');
    setOptName(''); setOptPrice(''); setAddingTo(null);
    fetchModifiers();
  }

  async function handleDeleteOption(id: string) {
    await (supabase as any).from('modifier_options').delete().eq('id', id);
    toast.success('Opção removida');
    fetchModifiers();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-sm border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" /> Opções e Complementos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure os grupos de adicionais e variações para este item do seu cardápio.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            <AnimatePresence>
              {modifiers.map((mod) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{mod.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {mod.is_required ? 'Obrigatório' : 'Opcional'} • Máx: {mod.max_selections}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteModifier(mod.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pl-3 border-l-2 border-primary/20">
                    {mod.options.map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between text-sm py-1">
                        <span>{opt.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium text-xs">
                            {opt.price > 0 ? `+R$ ${opt.price.toFixed(2)}` : 'Grátis'}
                          </span>
                          <button
                            onClick={() => handleDeleteOption(opt.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {addingTo === mod.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={optName}
                        onChange={e => setOptName(e.target.value)}
                        placeholder="Ex: Bacon"
                        className="flex-1 h-9 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={optPrice}
                        onChange={e => setOptPrice(e.target.value)}
                        placeholder="R$"
                        className="w-20 h-9 text-sm"
                      />
                      <Button size="sm" onClick={() => handleAddOption(mod.id)} className="h-9">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingTo(mod.id); setOptName(''); setOptPrice(''); }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar opção
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Novo Grupo de Complementos</h4>
              <Input
                value={modName}
                onChange={e => setModName(e.target.value)}
                placeholder="Ex: Adicionais, Molhos, Tamanho..."
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={modRequired} onCheckedChange={setModRequired} />
                  <Label className="text-xs">Obrigatório</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Máx. seleções:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={modMax}
                    onChange={e => setModMax(e.target.value)}
                    className="w-16 h-8 text-sm"
                  />
                </div>
              </div>
              <Button onClick={handleAddModifier} disabled={saving} size="sm" className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Criar Grupo</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

