import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag, Percent, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Coupons() {
  const { impersonatedUserId } = useImpersonateStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => { fetchCoupons(); }, []);

  async function getUserId() {
    if (impersonatedUserId) return impersonatedUserId;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }

  async function fetchCoupons() {
    setLoading(true);
    const userId = await getUserId();
    if (!userId) { setLoading(false); return; }
    const { data } = await (supabase as any)
      .from('coupons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setCoupons((data || []) as Coupon[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!code.trim() || !discountValue) { toast.error('Preencha código e valor'); return; }
    setSaving(true);
    const userId = await getUserId();
    if (!userId) { setSaving(false); return; }

    const { error } = await (supabase as any).from('coupons').insert({
      user_id: userId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      min_order_value: minOrder ? parseFloat(minOrder) : 0,
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires_at: expiresAt || null,
    });

    if (error) { toast.error('Erro ao criar cupom'); setSaving(false); return; }
    toast.success('Cupom criado!');
    setShowModal(false);
    resetForm();
    fetchCoupons();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const userId = await getUserId();
    if (!userId) return;
    const { error } = await (supabase as any).from('coupons').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Cupom excluído');
    fetchCoupons();
  }

  async function toggleActive(id: string, active: boolean) {
    const userId = await getUserId();
    if (!userId) return;
    await (supabase as any).from('coupons').update({ is_active: active }).eq('id', id);
    fetchCoupons();
  }

  function resetForm() {
    setCode(''); setDiscountType('percentage'); setDiscountValue('');
    setMinOrder(''); setMaxUses(''); setExpiresAt('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie promoções para atrair mais clientes</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-sm p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Tag className="w-10 h-10 opacity-40" />
          <p>Nenhum cupom criado ainda</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {coupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-sm p-5 space-y-3 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-primary">{coupon.code}</span>
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={(v) => toggleActive(coupon.id, v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {coupon.discount_type === 'percentage' ? (
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Percent className="w-4 h-4 text-primary" /> {coupon.discount_value}% OFF
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <DollarSign className="w-4 h-4 text-primary" /> {formatCurrency(coupon.discount_value)} OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {coupon.min_order_value > 0 && <p>Pedido mín: {formatCurrency(coupon.min_order_value)}</p>}
                  {coupon.max_uses && <p>Usos: {coupon.current_uses}/{coupon.max_uses}</p>}
                  {coupon.expires_at && <p>Expira: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)} className="text-destructive hover:text-destructive h-8 text-xs w-full gap-1">
                  <Trash2 className="w-3 h-3" /> Excluir
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md glass-sm border-border">
          <DialogHeader>
            <DialogTitle>Novo Cupom</DialogTitle>
            <DialogDescription className="sr-only">
              Crie um novo cupom de desconto para o seu cardápio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Código</Label>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: PROMO10" className="font-mono uppercase" />
            </div>
            <div>
              <Label>Tipo de Desconto</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${discountType === 'percentage' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:bg-muted'}`}
                >
                  <Percent className="w-4 h-4 inline mr-1" /> Porcentagem
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${discountType === 'fixed' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border hover:bg-muted'}`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" /> Valor Fixo
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}</Label>
                <Input type="number" step="0.01" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="10" />
              </div>
              <div>
                <Label>Pedido Mínimo (R$)</Label>
                <Input type="number" step="0.01" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Máx. Usos</Label>
                <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Ilimitado" />
              </div>
              <div>
                <Label>Expira em</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Cupom'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


