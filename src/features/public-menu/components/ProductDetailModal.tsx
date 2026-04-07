import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Star, Clock, Loader2 } from 'lucide-react';
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
  accentColor?: string;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProductDetailModal({ product, open, onClose, onAdd, accentColor = '#16a34a' }: Props) {
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [selected, setSelected]   = useState<Record<string, string[]>>({});
  const [quantity, setQuantity]   = useState(1);
  const [loading, setLoading]     = useState(true);
  const [isAdding, setIsAdding]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected({});
    setQuantity(1);
    fetchModifiers();
  }, [open, product.id]);

  async function fetchModifiers() {
    setLoading(true);
    const { data: mods } = await (supabase as any)
      .from('product_modifiers').select('*').eq('product_id', product.id).order('sort_order');
    const modList = (mods || []) as any[];
    if (modList.length > 0) {
      const modIds = modList.map((m: any) => m.id);
      const { data: opts } = await (supabase as any)
        .from('modifier_options').select('*').in('modifier_id', modIds).order('sort_order');
      setModifiers(modList.map((m: any) => ({ ...m, options: (opts || []).filter((o: any) => o.modifier_id === m.id) })));
    } else {
      setModifiers([]);
    }
    setLoading(false);
  }

  const toggleOption = (modId: string, optId: string, maxSel: number) => {
    setSelected(prev => {
      const current = prev[modId] || [];
      if (current.includes(optId)) return { ...prev, [modId]: current.filter(id => id !== optId) };
      if (current.length >= maxSel) return { ...prev, [modId]: [...current.slice(0, maxSel - 1), optId] };
      return { ...prev, [modId]: [...current, optId] };
    });
  };

  const getAddons = (): SelectedAddon[] => {
    const addons: SelectedAddon[] = [];
    modifiers.forEach(mod => {
      (selected[mod.id] || []).forEach(optId => {
        const opt = mod.options.find(o => o.id === optId);
        if (opt) addons.push({ optionId: opt.id, name: opt.name, price: opt.price });
      });
    });
    return addons;
  };

  const addonsTotal = getAddons().reduce((sum, a) => sum + a.price, 0);
  const itemTotal   = (product.price + addonsTotal) * quantity;

  const handleAdd = () => {
    for (const mod of modifiers) {
      if (mod.is_required && (!selected[mod.id] || selected[mod.id].length === 0)) {
        toast.error(`Atenção: A opção "${mod.name}" é obrigatória.`);
        return;
      }
    }
    setIsAdding(true);
    setTimeout(() => {
      onAdd({ id: product.id, name: product.name, price: product.price, addons: getAddons() });
      setIsAdding(false);
      onClose();
    }, 400); // feedback visual de "Adicionando..." antes de fechar o modal
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] bg-white dark:bg-[#1a1a1a] rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 bg-gray-200 dark:bg-white/10 rounded-full" />
            </div>

            {/* ── HERO IMAGE ── */}
            <div className="relative w-full h-56 sm:h-64 shrink-0 overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 15%, #f9fafb), #f3f4f6)` }}>
                  🍽️
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Close btn */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Product info over image */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h2 className="text-white font-black text-xl sm:text-2xl leading-tight mb-1">{product.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-xl" style={{ color: accentColor }}>{formatCurrency(product.price)}</span>
                  <div className="flex items-center gap-1 text-white/70">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-white">4.8</span>
                    <span className="text-xs text-white/50">• 35-45 min</span>
                    <Clock className="w-3 h-3 ml-1 text-white/50" />
                  </div>
                </div>
                {product.description && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">{product.description}</p>
                )}
              </div>
            </div>

            {/* ── MODIFIERS (scrollable) ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                </div>
              ) : modifiers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">Sem complementos para este item</p>
              ) : (
                modifiers.map(mod => (
                  <div key={mod.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">{mod.name}</h3>
                      {(() => {
                        const currentSelectedCount = (selected[mod.id] || []).length;
                        const isSatisfied = (!mod.is_required) || (mod.is_required && currentSelectedCount >= 1);
                        
                        let reqText = '';
                        if (mod.is_required) {
                          reqText = `${currentSelectedCount} / ${mod.max_selections} Obrigatório`;
                        } else {
                          reqText = `Opcional • Até ${mod.max_selections}`;
                        }

                        return (
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-colors flex items-center gap-1 ${
                            !mod.is_required
                              ? 'bg-gray-100 dark:bg-white/10 text-gray-500'
                              : isSatisfied
                                ? 'text-white'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                            style={isSatisfied && mod.is_required ? { backgroundColor: accentColor } : undefined}
                          >
                            {isSatisfied && mod.is_required && <Check className="w-3 h-3" />}
                            {reqText}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      {mod.options.map(opt => {
                        const isSel = (selected[mod.id] || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleOption(mod.id, opt.id, mod.max_selections)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm transition-all ${
                              isSel
                                ? 'border-transparent'
                                : 'border-black/[0.08] dark:border-white/[0.08] hover:border-current'
                            }`}
                            style={isSel ? { borderColor: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 8%, transparent)` } : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                style={isSel ? { borderColor: accentColor, backgroundColor: accentColor } : { borderColor: '#d1d5db' }}
                              >
                                {isSel && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="font-medium">{opt.name}</span>
                            </div>
                            <span className="font-bold text-xs" style={{ color: accentColor }}>
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

            {/* ── FOOTER: Qty + Add ── */}
            <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-3 bg-white dark:bg-[#1a1a1a] shrink-0">
              {/* Quantity selector */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-colors"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAdd}
                disabled={!product.is_available || isAdding}
                className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={product.is_available ? { backgroundColor: accentColor, boxShadow: `0 8px 20px -4px ${accentColor}55` } : { backgroundColor: '#9ca3af' }}
              >
                {isAdding ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> Adicionando...</>
                ) : product.is_available ? (
                   <><Plus className="w-4 h-4 stroke-[2.5px]" /> Adicionar — {formatCurrency(itemTotal)}</>
                ) : (
                   'PRODUTO ESGOTADO'
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
