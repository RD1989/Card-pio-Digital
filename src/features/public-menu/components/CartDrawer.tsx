import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, Trash2, X, Send, Loader2, MessageCircle, Tag } from 'lucide-react';
import { useCartStore, DeliveryType, PaymentMethod, CartItem, CartAddon } from '@/features/public-menu/stores/useCartStore';
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
  let msg = `*PEDIDO ${orderId} - ${restaurantName.toUpperCase()}*\n\n`;

  items.forEach((item) => {
    const addonSum = (item.addons || []).reduce((s, a) => s + a.price, 0);
    const unitTotal = item.price + addonSum;
    const itemTotal = unitTotal * item.quantity;
    msg += `${item.quantity}x ${item.name} (${formatCurrency(item.price)})\n`;
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(a => {
        msg += `   + ${a.name} (${formatCurrency(a.price)})\n`;
      });
    }
    msg += `Subtotal: ${formatCurrency(itemTotal)}\n\n`;
  });

  msg += `──────────────────\n`;
  msg += `🧾 *Subtotal:* ${formatCurrency(subtotal)}\n`;
  if (deliveryType === 'delivery' && deliveryFee > 0) {
    msg += `🛵 *Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n`;
  }
  msg += `*TOTAL FINAL: ${formatCurrency(totalFinal)}*\n`;
  msg += `──────────────────\n\n`;

  msg += `👤 *Cliente:* ${customerName}\n`;
  msg += `📱 *WhatsApp:* ${customerPhone}\n`;

  if (deliveryType === 'delivery' && address) {
    msg += `📍 ${address}\n`;
  } else {
    msg += `📍 *RETIRADA NA LOJA*\n`;
  }

  msg += `💳 *Pagamento:* ${PAYMENT_LABELS[paymentMethod]}\n`;

  if (notes) {
    msg += `\n📝 *Obs:* ${notes}`;
  }

  return encodeURIComponent(msg);
}

export function CartDrawer() {
  const store = useCartStore();
  const { items, subtotal, total, itemCount, updateQuantity, removeItem, clearCart, restaurantSlug, restaurantUserId, restaurantName, restaurantWhatsapp } = store;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'info'>('cart');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [obs, setObs] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [deliveryFee, setDeliveryFee] = useState(4);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const count = itemCount();
  const subtotalValue = subtotal();
  const effectiveFee = deliveryType === 'delivery' ? deliveryFee : 0;
  const totalValue = Math.max(0, subtotalValue + effectiveFee - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await (supabase as any)
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('user_id', restaurantUserId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast.error('Cupom inválido ou expirado');
      setApplyingCoupon(false);
      return;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast.error('Este cupom atingiu o limite de usos');
      setApplyingCoupon(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error('Este cupom expirou');
      setApplyingCoupon(false);
      return;
    }

    if (data.min_order_value > 0 && subtotalValue < data.min_order_value) {
      toast.error(`Pedido mínimo de ${formatCurrency(data.min_order_value)} para usar este cupom`);
      setApplyingCoupon(false);
      return;
    }

    const discount = data.discount_type === 'percentage'
      ? (subtotalValue * data.discount_value) / 100
      : data.discount_value;

    setCouponDiscount(discount);
    setCouponApplied(true);
    toast.success(`Cupom aplicado! -${formatCurrency(discount)}`);
    setApplyingCoupon(false);
  };

  const handleCheckout = async () => {
    if (!name.trim()) { toast.error('Informe seu nome'); return; }
    if (!phone.trim()) { toast.error('Informe seu WhatsApp'); return; }
    if (deliveryType === 'delivery' && !address.trim()) { toast.error('Informe seu endereço'); return; }

    setLoading(true);

    // Check if restaurant has reached order limit
    try {
      const [profileRes, countRes] = await Promise.all([
        (supabase as any).from('profiles').select('plan, plan_status, trial_ends_at').eq('user_id', restaurantUserId).single(),
        (supabase as any).rpc('count_monthly_orders', { _user_id: restaurantUserId }),
      ]);
      const profile = profileRes.data;
      const monthlyOrders = countRes.data || 0;

      if (profile) {
        const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        const isTrialExpired = profile.plan_status === 'trial' && trialEnd && trialEnd <= new Date();
        const isInactive = profile.plan_status === 'expired' || isTrialExpired;

        if (isInactive) {
          toast.error('Este restaurante está temporariamente indisponível para novos pedidos.');
          setLoading(false);
          return;
        }

        if (profile.plan === 'basic' && monthlyOrders >= 100) {
          toast.error('Este restaurante atingiu o limite mensal de pedidos. Tente novamente no próximo mês.');
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Non-blocking: if check fails, allow order
    }

    const { data: order, error } = await supabase.from('orders').insert({
      restaurant_user_id: restaurantUserId,
      customer_name: name,
      customer_phone: phone,
      notes: obs || null,
      total: totalValue,
      status: 'pending',
    }).select('id').single();

    if (error || !order) {
      toast.error('Erro ao salvar pedido. Tente novamente.');
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      toast.error('Erro ao salvar itens do pedido.');
      setLoading(false);
      return;
    }

    // Send to RESTAURANT's WhatsApp, not customer's
    const cleanRestaurantPhone = restaurantWhatsapp.replace(/\D/g, '');
    const whatsappPhone = cleanRestaurantPhone.startsWith('55') ? cleanRestaurantPhone : `55${cleanRestaurantPhone}`;
    const message = buildWhatsAppMessage(
      restaurantName || restaurantSlug.replace(/-/g, ' '),
      items, subtotalValue, effectiveFee, totalValue,
      name, phone, address, deliveryType, paymentMethod, obs,
    );
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');

    toast.success('Pedido enviado com sucesso!');
    clearCart();
    setStep('cart');
    setOpen(false);
    setName(''); setPhone(''); setObs(''); setAddress('');
    setDeliveryType('delivery'); setPaymentMethod('cash');
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <>
      {count > 0 && !open && (
        <motion.button
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-xl hover:opacity-90 transition-all glow-primary"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{count} {count === 1 ? 'item' : 'itens'}</span>
          <span className="text-xs opacity-80">•</span>
          <span>{formatCurrency(subtotalValue)}</span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-card border-t border-border rounded-t-3xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-bold text-lg">
                  {step === 'cart' ? 'Seu Pedido' : 'Finalizar Pedido'}
                </h2>
                <button onClick={() => { setOpen(false); setStep('cart'); }} className="p-2 rounded-xl hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {step === 'cart' ? (
                  <>
                    {items.length === 0 ? (
                      <p className="text-center text-muted-foreground py-10">Seu carrinho está vazio</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => {
                          const addonSum = (item.addons || []).reduce((s, a) => s + a.price, 0);
                          const addonKeys = (item.addons || []).map(a => a.optionId).sort().join(',');
                          const itemKey = `${item.id}::${addonKeys}`;
                          return (
                          <motion.div key={itemKey} layout className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  + {item.addons.map(a => a.name).join(', ')}
                                </p>
                              )}
                              <p className="text-primary font-bold text-sm mt-0.5">{formatCurrency(item.price + addonSum)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted-foreground/10 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeItem(itemKey)} className="w-8 h-8 rounded-xl flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1">
                                <Trash2 className="w-3.5 h-3.5" />
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
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Seu Nome *</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" className={inputClass} />
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">WhatsApp *</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
                    </div>

                    {/* Tipo de Entrega */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Entrega *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('delivery')}
                          className={`py-3 rounded-xl text-sm font-semibold border transition-all ${deliveryType === 'delivery' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:bg-muted'}`}
                        >
                          🛵 Entrega
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('pickup')}
                          className={`py-3 rounded-xl text-sm font-semibold border transition-all ${deliveryType === 'pickup' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:bg-muted'}`}
                        >
                          🏪 Retirada
                        </button>
                      </div>
                    </div>

                    {/* Endereço (só para entrega) */}
                    {deliveryType === 'delivery' && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Endereço *</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número - Bairro, Complemento" className={inputClass} />
                      </div>
                    )}

                    {/* Forma de Pagamento */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Forma de Pagamento *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPaymentMethod(key)}
                            className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${paymentMethod === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:bg-muted'}`}
                          >
                            {key === 'pix' && '⚡ '}{key === 'credit' && '💳 '}{key === 'debit' && '💳 '}{key === 'cash' && '💵 '}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cupom */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cupom de Desconto</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); setCouponDiscount(0); }}
                            placeholder="Ex: PROMO10"
                            disabled={couponApplied}
                            className={`${inputClass} pl-10 font-mono uppercase ${couponApplied ? 'bg-primary/5 border-primary/30' : ''}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={applyingCoupon || couponApplied || !couponCode.trim()}
                          className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                        >
                          {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : couponApplied ? '✓' : 'Aplicar'}
                        </button>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Observações</label>
                      <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: Sem cebola, ponto mal passado..." rows={2} className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="px-6 py-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotalValue)}</span>
                  </div>
                  {step === 'info' && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>🏷️ Cupom</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  {step === 'info' && deliveryType === 'delivery' && effectiveFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">🛵 Taxa de Entrega</span>
                      <span>{formatCurrency(effectiveFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-border/50">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(step === 'info' ? totalValue : subtotalValue)}</span>
                  </div>

                  {step === 'cart' ? (
                    <button onClick={() => setStep('info')} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary">
                      Continuar <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-[hsl(142,70%,40%)] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageCircle className="w-4 h-4" /> Enviar Pedido via WhatsApp</>}
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

