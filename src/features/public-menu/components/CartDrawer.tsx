import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Trash2, X, Send, Loader2, MessageCircle, Tag, ChevronLeft, User, Phone, MapPin, Home, Compass, FileText, CreditCard } from 'lucide-react';
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
  street: string,
  number: string,
  complement: string,
  neighborhood: string,
  referencePoint: string,
  deliveryType: DeliveryType,
  paymentMethod: PaymentMethod,
  notes: string,
  couponDiscount?: number
): string {
  const orderId = generateOrderId();
  const divider = '──────────────────';

  let msg = `*PEDIDO #${orderId}* - *${restaurantName.toUpperCase()}*\n\n`;

  // Itens do Pedido
  items.forEach((item) => {
    const addonSum = (item.addons || []).reduce((s, a) => s + a.price, 0);
    const unitTotal = item.price + addonSum;
    const itemTotal = unitTotal * item.quantity;

    msg += `*${item.quantity}x ${item.name}* (${formatCurrency(item.price)})\n`;
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(a => {
        msg += `  + ${a.name} (${a.price > 0 ? formatCurrency(a.price) : 'Grátis'})\n`;
      });
    }
    msg += `Subtotal: ${formatCurrency(itemTotal)}\n\n`;
  });

  msg += `${divider}\n`;
  msg += `🧾 *Subtotal:* ${formatCurrency(subtotal)}\n`;

  if (deliveryType === 'delivery') {
    msg += `🛵 *Taxa de Entrega:* ${deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}\n`;
  }

  if (couponDiscount && couponDiscount > 0) {
    msg += `📉 *Desconto:* -${formatCurrency(couponDiscount)}\n`;
  }

  msg += `*TOTAL FINAL: ${formatCurrency(totalFinal)}*\n`;
  msg += `${divider}\n\n`;

  // Dados do Cliente
  msg += `👤 *Cliente:* ${customerName}\n`;
  msg += `📱 *WhatsApp:* ${customerPhone}\n\n`;

  // Logística (Entrega ou Retirada)
  if (deliveryType === 'delivery') {
    msg += `📍 *Local de Entrega:*\n`;
    msg += `${street.trim()}, ${number.trim()}\n`;
    msg += `Bairro: ${neighborhood.trim()}\n`;
    if (complement.trim()) msg += `Complemento: ${complement.trim()}\n`;
    if (referencePoint.trim()) msg += `📍 *Referência:* ${referencePoint.trim()}\n`;
  } else {
    msg += `🏪 *Modalidade:* Retirada na Loja\n`;
  }

  msg += `\n💳 *Pagamento:* ${PAYMENT_LABELS[paymentMethod]} ${PAYMENT_EMOJIS[paymentMethod]}\n`;

  if (notes.trim()) {
    msg += `\n📝 *Observações:* ${notes.trim()}\n`;
  }

  return msg;
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
  const [street, setStreet]               = useState('');
  const [number, setNumber]               = useState('');
  const [complement, setComplement]       = useState('');
  const [neighborhood, setNeighborhood]   = useState('');
  const [referencePoint, setReferencePoint] = useState('');
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
    if (deliveryType === 'delivery') {
      if (!street.trim() || !number.trim() || !neighborhood.trim() || !referencePoint.trim()) {
        toast.error('Preencha o endereço completo e o ponto de referência para entrega');
        return;
      }
    }

    const cleanPhone = (restaurantWhatsapp || '').replace(/\D/g, '');
    if (!cleanPhone) { 
      toast.error('O WhatsApp deste restaurante não está configurado.'); 
      return; 
    }

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

    console.log('Payload do Pedido:', {
      restaurant_user_id: restaurantUserId,
      restaurant_id: restaurantUserId,
      customer_name: name,
      customer_phone: phone,
      total: totalValue,
      status: 'pending',
    });

    const { data: order, error } = await supabase.from('orders').insert({
      restaurant_user_id: restaurantUserId,
      restaurant_id: restaurantUserId,
      customer_name: name,
      customer_phone: phone,
      total: totalValue,
      status: 'pending',
    }).select('id').single();

    if (error || !order) { 
      console.error('ERRO DETALHADO SUPABASE ORDERS:', error);
      toast.error(`Erro ao salvar pedido: ${error?.message || 'Erro desconhecido'}`); 
      setLoading(false); 
      return; 
    }

    await supabase.from('order_items').insert(
      items.map(item => ({ 
        order_id: order.id, 
        restaurant_id: restaurantUserId,
        product_id: item.id, 
        product_name: item.name, 
        quantity: item.quantity, 
        unit_price: item.price
      }))
    );

    const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const rawMessage = buildWhatsAppMessage(
      restaurantName || restaurantSlug.replace(/-/g, ' '),
      items, subtotalValue, effectiveFee, totalValue,
      name, phone,
      street, number, complement, neighborhood, referencePoint,
      deliveryType, paymentMethod, obs,
      couponDiscount
    );

    const encodedMessage = encodeURIComponent(rawMessage);
    window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');

    toast.success('✅ Pedido enviado com sucesso!');
    clearCart(); setStep('cart'); setOpen(false);
    setName(''); setPhone(''); setObs('');
    setStreet(''); setNumber(''); setComplement(''); setNeighborhood(''); setReferencePoint('');
    setDeliveryType('delivery'); setPaymentMethod('cash');
    setLoading(false);
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/[0.08] dark:border-white/[0.08] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all";

  return (
    <>
      {/* ── Floating Cart Pill (when nav is not present) ── */}
      <AnimatePresence>
        {count > 0 && !open && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setOpen(true)}
              style={{ backgroundColor: accentColor }}
              className="pointer-events-auto w-full max-w-md flex items-center justify-between p-2 pl-5 rounded-[32px] text-white font-black text-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-md relative overflow-hidden group"
            >
              {/* Animated background pulse */}
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white"
              />
              
              <div className="relative flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl ring-1 ring-white/30">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] uppercase tracking-widest opacity-70">Sua Sacola</span>
                  <span className="text-sm">{count} {count === 1 ? 'item' : 'itens'}</span>
                </div>
              </div>

              <div className="relative bg-white text-gray-900 px-6 py-3.5 rounded-[24px] font-black text-sm flex items-center gap-2 shadow-xl">
                {formatCurrency(subtotalValue)}
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </div>
            </motion.button>
          </motion.div>
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
                  <div className="space-y-8 pb-4">
                    {/* Sessão 1: Identificação */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <User className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Identificação</h3>
                      </div>
                      <div className="grid gap-3">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Seu nome completo *" 
                            className={`${inputCls} pl-11`} 
                            style={{ ['--tw-ring-color' as any]: accentColor }} 
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            placeholder="Seu WhatsApp (DDD) *" 
                            className={`${inputCls} pl-11`} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sessão 2: Entrega */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Como receber</h3>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-white/5 p-1.5 rounded-[22px] flex gap-1.5">
                        {(['delivery', 'pickup'] as DeliveryType[]).map(type => (
                          <button
                            key={type}
                            onClick={() => setDeliveryType(type)}
                            className={`flex-1 py-3 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${deliveryType === type ? 'text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            style={deliveryType === type ? { backgroundColor: accentColor } : undefined}
                          >
                            {type === 'delivery' ? (
                              <><MapPin className="w-3.5 h-3.5" /> Entrega</>
                            ) : (
                              <><Home className="w-3.5 h-3.5" /> Retirada</>
                            )}
                          </button>
                        ))}
                      </div>

                      <AnimatePresence mode="wait">
                        {deliveryType === 'delivery' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }}
                            className="grid gap-3"
                          >
                            <div className="flex gap-3">
                              <div className="relative flex-[2]">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="Rua / Avenida *" className={`${inputCls} pl-11`} />
                              </div>
                              <div className="relative flex-1">
                                <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº *" className={inputCls} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro *" className={`${inputCls} pl-11`} />
                              </div>
                              <div className="relative">
                                <input type="text" value={complement} onChange={e => setComplement(e.target.value)} placeholder="Comp. (Opcional)" className={inputCls} />
                              </div>
                            </div>
                            <div className="relative">
                              <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={referencePoint} 
                                onChange={e => setReferencePoint(e.target.value)} 
                                placeholder="Ponto de Referência *" 
                                className={`${inputCls} pl-11`} 
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Sessão 3: Pagamento */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Pagamento</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setPaymentMethod(key)}
                            className={`p-4 rounded-[24px] text-[13px] font-black border transition-all duration-300 flex flex-col items-center gap-2 ${paymentMethod === key ? 'text-white border-transparent shadow-lg' : 'bg-gray-50 dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08] text-gray-500 hover:border-gray-300'}`}
                            style={paymentMethod === key ? { backgroundColor: accentColor } : undefined}
                          >
                            <span className="text-2xl">{PAYMENT_EMOJIS[key]}</span>
                            <span className="uppercase tracking-tight">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sessão 4: Extras */}
                    <div className="space-y-6 pt-2">
                      <div className="p-5 rounded-[28px] bg-gray-50 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06] space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-[0.2em] px-1">Cupom de Desconto</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="text" 
                                value={couponCode} 
                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); setCouponDiscount(0); }} 
                                placeholder="CUPOM" 
                                disabled={couponApplied} 
                                className={`${inputCls.replace('bg-gray-50 dark:bg-white/5', 'bg-white dark:bg-black/20')} pl-10 font-black uppercase tracking-widest text-xs`} 
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={handleApplyCoupon} 
                              disabled={applyingCoupon || couponApplied || !couponCode.trim()} 
                              className="px-5 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 shrink-0 shadow-sm grow-0" 
                              style={{ backgroundColor: accentColor }}
                            >
                              {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : couponApplied ? '✓' : 'Aplicar'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-gray-400 mb-2 block uppercase tracking-[0.2em] px-1">Observações do Pedido</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea 
                              value={obs} 
                              onChange={e => setObs(e.target.value)} 
                              placeholder="Ex: Sem cebola, talheres descartáveis..." 
                              rows={3} 
                              className={`${inputCls.replace('bg-gray-50 dark:bg-white/5', 'bg-white dark:bg-black/20')} pl-10 pt-3 resize-none text-xs`} 
                            />
                          </div>
                        </div>
                      </div>
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
