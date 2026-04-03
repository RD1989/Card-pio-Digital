import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

interface Modifier {
  id: string;
  name: string;
  is_required: boolean;
  max_selections: number;
  options: ModifierOption[];
}

export interface SelectedAddon {
  optionId: string;
  name: string;
  price: number;
}

interface Props {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
  };
  open: boolean;
  onClose: () => void;
  onAdd: (item: { id: string; name: string; price: number; addons: SelectedAddon[] }) => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProductDetailModal({ product, open, onClose, onAdd }: Props) {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSelected({});
    setQuantity(1);
    fetchModifiers();
  }, [open, product.id]);

  async function fetchModifiers() {
    setLoading(true);
    const { data: mods } = await (supabase as any)
      .from('product_modifiers')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order');

    const modList = (mods || []) as any[];
    if (modList.length > 0) {
      const modIds = modList.map((m: any) => m.id);
      const { data: opts } = await (supabase as any)
        .from('modifier_options')
        .select('*')
        .in('modifier_id', modIds)
        .order('sort_order');

      setModifiers(modList.map((m: any) => ({
        ...m,
        options: (opts || []).filter((o: any) => o.modifier_id === m.id),
      })));
    } else {
      setModifiers([]);
    }
    setLoading(false);
  }

  const toggleOption = (modId: string, optId: string, maxSel: number) => {
    setSelected(prev => {
      const current = prev[modId] || [];
      if (current.includes(optId)) {
        return { ...prev, [modId]: current.filter(id => id !== optId) };
      }
      if (current.length >= maxSel) {
        // Replace last if max reached
        return { ...prev, [modId]: [...current.slice(0, maxSel - 1), optId] };
      }
      return { ...prev, [modId]: [...current, optId] };
    });
  };

  const getAddons = (): SelectedAddon[] => {
    const addons: SelectedAddon[] = [];
    modifiers.forEach(mod => {
      const sel = selected[mod.id] || [];
      sel.forEach(optId => {
        const opt = mod.options.find(o => o.id === optId);
        if (opt) addons.push({ optionId: opt.id, name: opt.name, price: opt.price });
      });
    });
    return addons;
  };

  const addonsTotal = getAddons().reduce((sum, a) => sum + a.price, 0);
  const itemTotal = (product.price + addonsTotal) * quantity;

  const handleAdd = () => {
    // Validate required modifiers
    for (const mod of modifiers) {
      if (mod.is_required && (!selected[mod.id] || selected[mod.id].length === 0)) {
        toast.error(`Selecione pelo menos uma opção em "${mod.name}"`);
        return;
      }
    }
    onAdd({ id: product.id, name: product.name, price: product.price, addons: getAddons() });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] bg-card border-t border-border rounded-t-3xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div className="flex gap-4 flex-1">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-lg">{product.name}</h2>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <span className="font-bold text-primary mt-1 block">{formatCurrency(product.price)}</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modifiers */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : modifiers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum complemento disponível</p>
              ) : (
                modifiers.map(mod => (
                  <div key={mod.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{mod.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        mod.is_required ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {mod.is_required ? 'Obrigatório' : 'Opcional'}
                        {mod.max_selections > 1 && ` • Até ${mod.max_selections}`}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {mod.options.map(opt => {
                        const isSelected = (selected[mod.id] || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleOption(mod.id, opt.id, mod.max_selections)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? 'border-primary bg-primary' : 'border-border'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <span>{opt.name}</span>
                            </div>
                            <span className="text-primary font-medium text-xs">
                              {opt.price > 0 ? `+${formatCurrency(opt.price)}` : 'Grátis'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border space-y-3">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={!product.is_available}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  product.is_available 
                    ? 'bg-primary text-primary-foreground hover:opacity-90 glow-primary' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {product.is_available ? `Adicionar ${formatCurrency(itemTotal)}` : 'PRODUTO ESGOTADO'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
