import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check, Star, Clock, Loader2, ShoppingBag } from 'lucide-react';
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

interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
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
  const [upsells, setUpsells]     = useState<UpsellProduct[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelected({});
    setQuantity(1);
    fetchModifiers();
    fetchUpsells();
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

  async function fetchUpsells() {
    const { data } = await (supabase as any)
      .from('product_upsells')
      .select('upsell_product_id, products:upsell_product_id(id, name, price, image_url)')
      .eq('product_id', product.id);
    
    if (data) {
      setUpsells(data.map((u: any) => u.products));
    } else {
      setUpsells([]);
    }
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
            <div className="relative w-full h-64 sm:h-80 shrink-0 overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
                  🍽️
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              {/* Close btn */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Product info over image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
                   <span className="text-white/60 text-[10px] uppercase font-black tracking-widest">Produto Selecionado</span>
                </div>
                <h2 className="pm-font-display text-white font-black italic text-2xl sm:text-4xl leading-[1.1] mb-2">{product.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="font-black text-2xl" style={{ color: accentColor }}>{formatCurrency(product.price)}</span>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-white">4.9</span>
                    <div className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-[10px] font-medium text-white/70">Destaque</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION SECTION */}
            {product.description && (
              <div className="px-6 pt-5 pb-2">
                 <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
                 <div className="h-px w-full bg-black/[0.04] dark:bg-white/[0.04] mt-5" />
              </div>
            )}

            {/* ── MODIFIERS (scrollable) ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-7">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Carregando opções...</p>
                </div>
              ) : modifiers.length === 0 ? (
                <div className="text-center py-8">
                   <p className="text-muted-foreground text-sm italic">Este item não possui adicionais.</p>
                </div>
              ) : (
                modifiers.map(mod => (
                  <div key={mod.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <h3 className="font-black text-sm tracking-tight">{mod.name}</h3>
                         <p className="text-[10px] text-muted-foreground font-medium">Selecione até {mod.max_selections} opção{mod.max_selections > 1 ? 's' : ''}</p>
                      </div>
                      {(() => {
                        const currentSelectedCount = (selected[mod.id] || []).length;
                        const isSatisfied = (!mod.is_required) || (mod.is_required && currentSelectedCount >= 1);
                        
                        return (
                          <div className={`text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest transition-all ${
                            !mod.is_required
                              ? 'bg-gray-100 dark:bg-white/5 text-muted-foreground/60'
                              : isSatisfied
                                ? 'text-white shadow-lg'
                                : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                            style={isSatisfied && mod.is_required ? { backgroundColor: accentColor, boxShadow: `0 4px 12px -2px ${accentColor}40` } : undefined}
                          >
                            {mod.is_required ? (isSatisfied ? 'Preenchido ✓' : 'Obrigatório') : 'Opcional'}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {mod.options.map(opt => {
                        const isSel = (selected[mod.id] || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleOption(mod.id, opt.id, mod.max_selections)}
                            className={`w-full flex items-center justify-between p-4 rounded-[22px] border transition-all duration-300 ${
                              isSel
                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                : 'bg-white dark:bg-white/5 border-black/[0.04] dark:border-white/[0.08] hover:border-black/10 dark:hover:border-white/20'
                            }`}
                            style={isSel ? { borderColor: `${accentColor}40`, backgroundColor: `${accentColor}08` } : undefined}
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className="w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                                style={isSel ? { borderColor: accentColor, backgroundColor: accentColor } : { borderColor: 'rgba(0,0,0,0.1)' }}
                              >
                                {isSel && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                              </div>
                              <span className={`font-bold text-[13px] ${isSel ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.name}</span>
                            </div>
                            <span className="font-black text-[13px]" style={{ color: accentColor }}>
                              {opt.price > 0 ? `+ ${formatCurrency(opt.price)}` : 'Grátis'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* UP-SELLS SECTION */}
              {upsells.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <h3 className="font-black text-sm tracking-tight uppercase">Aproveite e Adicione</h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                    {upsells.map((up) => (
                      <button
                        key={up.id}
                        onClick={() => {
                          onAdd({ id: up.id, name: up.name, price: up.price, addons: [] });
                          toast.success(`${up.name} adicionado!`);
                        }}
                        className="flex-shrink-0 w-32 bg-gray-50 dark:bg-white/5 rounded-2xl p-2 border border-black/[0.03] dark:border-white/10 hover:border-primary/40 transition-all text-left group"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-muted">
                          {up.image_url ? (
                            <img src={up.image_url} alt={up.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs opacity-20 italic">No img</div>
                          )}
                        </div>
                        <p className="text-[11px] font-bold line-clamp-1 mb-1">{up.name}</p>
                        <p className="text-[12px] font-black text-primary">{formatCurrency(up.price)}</p>
                        <div className="mt-2 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest text-center group-hover:bg-primary group-hover:text-white transition-all">
                          + Adicionar
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── FOOTER: Qty + Add ── */}
            <div className="px-6 py-6 border-t border-black/[0.04] dark:border-white/[0.06] space-y-4 bg-white dark:bg-[#1a1a1a] shrink-0">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-5 bg-gray-50 dark:bg-white/5 p-1.5 rounded-[22px] border border-black/[0.03] dark:border-white/10">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 rounded-[18px] bg-white dark:bg-white/10 shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-black w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 rounded-[18px] text-white shadow-md active:scale-90 transition-transform flex items-center justify-center"
                      style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px -2px ${accentColor}40` }}
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" />
                    </button>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 leading-none mb-1">Total do Item</span>
                    <span className="text-2xl font-black" style={{ color: accentColor }}>{formatCurrency(itemTotal)}</span>
                 </div>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAdd}
                disabled={!product.is_available || isAdding}
                className="w-full py-4.5 rounded-[24px] font-black text-[15px] uppercase tracking-wider flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-2xl overflow-hidden relative group"
                style={product.is_available ? { backgroundColor: accentColor, boxShadow: `0 12px 24px -6px ${accentColor}60` } : { backgroundColor: '#9ca3af' }}
              >
                {isAdding ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                ) : product.is_available ? (
                   <>
                     <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
                     Adicionar à Sacola
                   </>
                ) : (
                   'PRODUTO ESGOTADO'
                )}
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
