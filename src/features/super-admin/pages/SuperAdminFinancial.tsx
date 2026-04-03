import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle, XCircle, Download, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  plan: string;
  status: string;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  period_start: string;
  period_end: string;
  pix_txid: string | null;
  restaurant_name?: string;
}

export default function SuperAdminFinancial() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function fetch() {
      const [invoicesRes, profilesRes] = await Promise.all([
        (supabase as any).from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, restaurant_name'),
      ]);
      const profiles = (profilesRes.data || []) as any[];
      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p.restaurant_name]));
      const data = ((invoicesRes.data || []) as any[]).map((inv: any) => ({
        ...inv,
        restaurant_name: profileMap.get(inv.user_id) || 'Desconhecido',
      }));
      setInvoices(data);
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = invoices.filter(i => filterStatus === 'all' || i.status === filterStatus);

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date())).reduce((s, i) => s + Number(i.amount), 0);

  function exportCSV() {
    const headers = ['Lojista', 'Valor', 'Plano', 'Status', 'Vencimento', 'Pago em', 'Criado em'];
    const rows = filtered.map(i => [
      i.restaurant_name || '',
      `R$ ${Number(i.amount).toFixed(2)}`,
      i.plan,
      i.status,
      new Date(i.due_date).toLocaleDateString('pt-BR'),
      i.paid_at ? new Date(i.paid_at).toLocaleDateString('pt-BR') : '',
      new Date(i.created_at).toLocaleDateString('pt-BR'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faturas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} faturas exportadas`);
  }

  const cards = [
    { label: 'Pendentes', value: `R$ ${totalPending.toFixed(2)}`, icon: Clock, color: 'text-amber-500', count: invoices.filter(i => i.status === 'pending').length },
    { label: 'Pagas', value: `R$ ${totalPaid.toFixed(2)}`, icon: CheckCircle, color: 'text-green-500', count: invoices.filter(i => i.status === 'paid').length },
    { label: 'Vencidas', value: `R$ ${totalOverdue.toFixed(2)}`, icon: XCircle, color: 'text-red-500', count: invoices.filter(i => i.status === 'overdue').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground text-sm">{invoices.length} faturas no sistema</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-sm p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.count} faturas</span>
            </div>
            <p className="text-xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paid">Pagas</SelectItem>
            <SelectItem value="overdue">Vencidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-sm overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-left bg-muted/30">
                <th className="p-3 font-medium">Lojista</th>
                <th className="p-3 font-medium">Valor</th>
                <th className="p-3 font-medium">Plano</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Vencimento</th>
                <th className="p-3 font-medium">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                >
                  <td className="p-3 font-medium">{inv.restaurant_name}</td>
                  <td className="p-3">R$ {Number(inv.amount).toFixed(2)}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{inv.plan}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-green-500/10 text-green-600' :
                      inv.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    }`}>{inv.status === 'paid' ? 'Paga' : inv.status === 'pending' ? 'Pendente' : 'Vencida'}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-muted-foreground text-xs">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">Nenhuma fatura encontrada</div>
        )}
      </div>
    </div>
  );
}

