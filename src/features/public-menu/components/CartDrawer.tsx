import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Trash2, X, Send, Loader2, MessageCircle, Tag, ChevronLeft } from 'lucide-react';
import { useCartStore, DeliveryType, PaymentMethod, CartItem } from '@/features/public-menu/stores/useCartStore';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function generateOrderId() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${d}${m}${y}-${h}${min}`;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit: 'Cartão de Crédito',
  debit: 'Cartão de Débito',
  cash: 'Dinheiro',
};

const PAYMENT_EMOJIS: Record<PaymentMethod, string> = {
  pix: '⚡',
  credit: '💳',
  debit: '💳',
  cash: '💵',
};

function buildWhatsAppMessage(
  restaurantName: string,
  items: CartItem[],
  subtotal: number,
  deliveryFee: number,
  totalFinal: number,
  customerName: string,
  customerPhone: string,
  address: string,
  deliveryType: DeliveryType,
  paymentMethod: PaymentMethod,
  notes: string,
) {
  const orderId = generateOrderId();
  const sep = "──────────────────";
  
  let msg = `*🛍️ NOVO PEDIDO - ${restaurantName.toUpperCase()}*\n`;
  msg += `*ID:* #${orderId}\n\n`;

  msg += `*🛒 ITENS DO PEDIDO:*\n`;
  items.forEach((item) => {
    const addonSum = (item.addons || []).reduce((s, a) => s + a.price, 0);
    const unitTotal = item.price + addonSum;
    const itemTotal = unitTotal * item.quantity;
    
    msg += `• *${item.quantity}x ${item.name}*\n`;
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(a => { 
        msg += `   └ _+ ${a.name}_ (${formatCurrency(a.price)})\n`; 
      });
    }
    msg += `   *Subtotal:* ${formatCurrency(itemTotal)}\n\n`;
  });

  msg += `${sep}\n`;
  msg += `🧾 *RESUMO FINANCEIRO*\n`;
  msg += `*Subtotal:* ${formatCurrency(subtotal)}\n`;
  
  if (deliveryType === 'delivery') {
    msg += `*Entrega:* ${deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}\n`;
  }
  
  msg += `*TOTAL GERAL: ${formatCurrency(totalFinal)}*\n`;
  msg += `${sep}\n\n`;

  msg += `👤 *DADOS DO CLIENTE*\n`;
  msg += `*Nome:* ${customerName}\n`;
  msg += `*WhatsApp:* ${customerPhone}\n\n`;

  msg += `📍 *ENTREGA / RETIRADA*\n`;
  if (deliveryType === 'delivery') {
    msg += `*Tipo:* 🛵 Entrega\n`;
    msg += `*Endereço:* ${address}\n`;
  } else {
    msg += `*Tipo:* 🏪 Retirada na Loja\n`;
  }

  msg += `\n💳 *PAGAMENTO*\n`;
  msg += `*Forma:* ${PAYMENT_EMOJIS[paymentMethod]} ${PAYMENT_LABELS[paymentMethod]}\n`;

  if (notes) {
    msg += `\n📝 *OBSERVAÇÕES*\n`;
    msg += `_${notes}_`;
  }

  msg += `\n\n_Pedido gerado via Menu Pro_`;
  
  return encodeURIComponent(msg);
}

interface CartDrawerProps {
  accentColor?: string;
}

export function CartDrawer({ accentColor = '#16a34a' }: CartDrawerProps) {
  const store = useCartStore();
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart,
    restaurantSlug, restaurantUserId, restaurantName, restaurantWhatsapp, deliveryFee } = store;

  const [open, setOpen]                     = useState(false);
  const [step, setStep]                     = useState<'cart' | 'info'>('cart');
  const [loading, setLoading]               = useState(false);
  const [name, setName]                     = useState('');
  const [phone, setPhone]                   = useState('');
  const [obs, setObs]                       = useState('');
  const [address, setAddress]               = useState('');
  const [deliveryType, setDeliveryType]     = useState<DeliveryType>(store.deliveryType || 'delivery');
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cash');
  const [couponCode, setCouponCode]         = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied]   = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const count          = itemCount();
  const subtotalValue  = subtotal();
  const effectiveFee   = deliveryType === 'delivery' ? deliveryFee : 0;
  const totalValue     = Math.max(0, subtotalValue + effectiveFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await (supabase as any)
      .from('coupons').select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('user_id', restaurantUserId)
      .eq('is_active', true).single();

    if (error || !data) { toast.error('Cupom inválido ou expirado'); setApplyingCoupon(false); return; }
    if (data.max_uses && data.current_uses >= data.max_uses) { toast.error('Cupom atingiu o limite'); setApplyingCoupon(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error('Cupom expirado'); setApplyingCoupon(false); return; }
    if (data.min_order_value > 0 && subtotalValue < data.min_order_value) { toast.error(`Mínimo ${formatCurrency(data.min_order_value)} para usar este cupom`); setApplyingCoupon(false); return; }

    const discount = data.discount_type === 'percentage' ? (subtotalValue * data.discount_value) / 100 : data.discount_value;
    setCouponDiscount(discount); setCouponApplied(true);
    toast.success(`🎉 Cupom aplicado! -${formatCurrency(discount)}`);
    setApplyingCoupon(false);
  };

  const handleCheckout = async () => {
    if (!name.trim())   { toast.error('Informe seu nome'); return; }
    if (!phone.trim())  { toast.error('Informe seu WhatsApp'); return; }
    if (deliveryType === 'delivery' && !address.trim()) { toast.error('Informe seu endereço'); return; }
    setLoading(true);

    try {
      const [profileRes, countRes] = await Promise.all([
        (supabase as any).from('profiles').select('plan, plan_status, trial_ends_at').eq('user_id', restaurantUserId).single(),
        (supabase as any).rpc('count_monthly_orders', { _user_id: restaurantUserId }),
      ]);
      const profile      = profileRes.data;
      const monthlyOrders = countRes.data || 0;
      if (profile) {
        const trialEnd      = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        const isTrialExpired = profile.plan_status === 'trial' && trialEnd && trialEnd <= new Date();
        const isInactive     = profile.plan_status === 'expired' || isTrialExpired;
        if (isInactive) { toast.error('Restaurante temporariamente indisponível.'); setLoading(false); return; }
        if (profile.plan === 'basic' && monthlyOrders >= 100) { toast.error('Limite mensal atingido.'); setLoading(false); return; }
      }
    } catch {}

    const { data: order, error } = await supabase.from('orders').insert({
      restaurant_user_id: restaurantUserId,
      restaurant_id: restaurantUserId,
      customer_name: name,
      customer_phone: phone,
      notes: obs || null,
      total: totalValue,
      status: 'pending',
    }).select('id').single();

    if (error || !order) { toast.error('Erro ao salvar pedido.'); setLoading(false); return; }

    await supabase.from('order_items').insert(
      items.map(item => ({ 
        order_id: order.id, 
        product_id: item.id, 
        product_name: item.name, 
        quantity: item.quantity, 
        unit_price: item.price,
        restaurant_id: restaurantUserId
      }))
    );

    const cleanPhone     = (restaurantWhatsapp || '').replace(/\D/g, '');
    if (!cleanPhone) { toast.error('WhatsApp do restaurante não configurado.'); setLoading(false); return; }
    
    const whatsappPhone  = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const message        = buildWhatsAppMessage(restaurantName || restaurantSlug.replace(/-/g, ' '), items, subtotalValue, effectiveFee, totalValue, name, phone, address, deliveryType, paymentMethod, obs);
    
    // Using location.assign for better mobile compatibility and to avoid popup blockers
    window.location.assign(`https://wa.me/${whatsappPhone}?text=${message}`);

    toast.success('✅ Pedido enviado com sucesso!');
    clearCart(); setStep('cart'); setOpen(false);
    setName(''); setPhone(''); setObs(''); setAddress('');
    setDeliveryType('delivery'); setPaymentMethod('cash');
    setLoading(false);
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/[0.08] dark:border-white/[0.08] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all";

  return (
    <>
      {/* ── Floating Cart Pill (when nav is not present) ── */}
      <AnimatePresence>
        {count > 0 && !open && (
          <motion.button
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            style={{ backgroundColor: accentColor }}
            className="fixed bottom-28 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{count} {count === 1 ? 'item' : 'itens'}</span>
            <span className="opacity-70 text-xs">•</span>
            <span>{formatCurrency(subtotalValue)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setStep('cart'); }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] bg-white dark:bg-[#1a1a1a] rounded-t-[28px] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 dark:bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-black/[0.04] dark:border-white/[0.06]">
                {step === 'info' && (
                  <button onClick={() => setStep('cart')} className="p-2.5 -ml-2 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-90">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="flex-1">
                  <h2 className="pm-font-display text-xl sm:text-2xl font-black italic tracking-tight">{step === 'cart' ? 'Sua Sacola' : 'Finalizar Pedido'}</h2>
                  {step === 'cart' && count > 0 && <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{count} {count === 1 ? 'item' : 'itens'}</p>}
                </div>
                <button
                  onClick={() => { setOpen(false); setStep('cart'); }}
                  className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {step === 'cart' ? (
                  <>
                    {items.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-5xl mb-4">🛒</div>
                        <p className="text-gray-400 font-medium">Seu carrinho está vazio</p>
                        <p className="text-gray-300 text-sm mt-1">Adicione itens do cardápio</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => {
                          const addonSum = (item.addons || []).reduce((s, a) => s + a.price, 0);
                          const addonKeys = (item.addons || []).map(a => a.optionId).sort().join(',');
                          const itemKey = `${item.id}::${addonKeys}`;
                          return (
                            <motion.div key={itemKey} layout className="flex items-center gap-4 p-4 rounded-[24px] bg-white dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-[15px] truncate tracking-tight">{item.name}</h3>
                                {item.addons && item.addons.length > 0 && (
                                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 mt-1 truncate">
                                     {item.addons.map(a => a.name).join(' • ')}
                                  </p>
                                )}
                                <p className="font-black text-sm mt-2" style={{ color: accentColor }}>{formatCurrency(item.price + addonSum)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="w-9 h-9 rounded-[14px] bg-gray-50 dark:bg-white/10 flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-90">
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-black text-base">{item.quantity}</span>
                                <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white shadow-md active:scale-90" style={{ backgroundColor: accentColor }}>
                                  <Plus className="w-4 h-4 stroke-[3px]" />
                                </button>
                                <button onClick={() => removeItem(itemKey)} className="w-9 h-9 rounded-[14px] flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 ml-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Nome */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Seu Nome *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" className={inputCls} style={{ ['--tw-ring-color' as any]: accentColor }} />
                    </div>
                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">WhatsApp *</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
                    </div>
                    {/* Tipo Entrega */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Tipo de Entrega *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['delivery', 'pickup'] as DeliveryType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setDeliveryType(type)}
                            className={`py-3 rounded-2xl text-sm font-bold border transition-all ${deliveryType === type ? 'text-white border-transparent' : 'bg-gray-50 dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08]'}`}
                            style={deliveryType === type ? { backgroundColor: accentColor } : undefined}
                          >
                            {type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Endereço */}
                    {deliveryType === 'delivery' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Endereço *</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número - Bairro" className={inputCls} />
                      </div>
                    )}
                    {/* Pagamento */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Forma de Pagamento *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setPaymentMethod(key)}
                            className={`py-3 rounded-2xl text-sm font-bold border transition-all ${paymentMethod === key ? 'text-white border-transparent' : 'bg-gray-50 dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08]'}`}
                            style={paymentMethod === key ? { backgroundColor: accentColor } : undefined}
                          >
                            {PAYMENT_EMOJIS[key]} {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Cupom */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Cupom de Desconto</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); setCouponDiscount(0); }} placeholder="Ex: PROMO10" disabled={couponApplied} className={`${inputCls} pl-10 font-mono uppercase`} />
                        </div>
                        <button type="button" onClick={handleApplyCoupon} disabled={applyingCoupon || couponApplied || !couponCode.trim()} className="px-4 py-3 rounded-2xl text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shrink-0" style={{ backgroundColor: accentColor }}>
                          {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : couponApplied ? '✓' : 'Aplicar'}
                        </button>
                      </div>
                    </div>
                    {/* Obs */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wide">Observações</label>
                      <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Sem cebola, ponto mal passado..." rows={2} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-5 py-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-3 bg-white dark:bg-[#1a1a1a]">
                  {/* Totals */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(subtotalValue)}</span>
                    </div>
                    {step === 'info' && couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>🏷️ Desconto</span>
                        <span className="font-bold">-{formatCurrency(couponDiscount)}</span>
                      </div>
                    )}
                    {step === 'info' && deliveryType === 'delivery' && effectiveFee > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>🛵 Entrega</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(effectiveFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-base pt-1.5 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <span>Total</span>
                      <span style={{ color: accentColor }}>{formatCurrency(step === 'info' ? totalValue : subtotalValue)}</span>
                    </div>
                  </div>

                  {step === 'cart' ? (
                    <button
                      onClick={() => setStep('info')}
                      className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      style={{ backgroundColor: accentColor, boxShadow: `0 8px 20px -4px ${accentColor}60` }}
                    >
                      Continuar <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full py-4 rounded-2xl bg-[#25d366] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-60 shadow-xl"
                      style={{ boxShadow: '0 8px 20px -4px rgba(37,211,102,0.45)' }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4" /> Enviar via WhatsApp</>}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
