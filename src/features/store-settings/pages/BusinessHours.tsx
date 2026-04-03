import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface DaySchedule {
  day: number;
  open: string;
  close: string;
  enabled: boolean;
}

const defaultSchedule: DaySchedule[] = DAYS.map((_, i) => ({
  day: i,
  open: i === 0 ? '' : '08:00',
  close: i === 0 ? '' : '22:00',
  enabled: i !== 0,
}));

export default function BusinessHours() {
  const { impersonatedUserId } = useImpersonateStore();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      let userId = impersonatedUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        userId = user.id;
      }
      const { data } = await (supabase as any)
        .from('business_hours')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week');

      if (data && data.length > 0) {
        setSchedule(DAYS.map((_, i) => {
          const found = data.find((d: any) => d.day_of_week === i);
          return found
            ? { day: i, open: found.open_time || '', close: found.close_time || '', enabled: found.is_open }
            : { day: i, open: '', close: '', enabled: false };
        }));
      }
      setLoading(false);
    }
    load();
  }, [impersonatedUserId]);

  const updateDay = (dayIdx: number, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => prev.map(s => s.day === dayIdx ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      userId = user.id;
    }

    // Delete existing and re-insert
    await (supabase as any).from('business_hours').delete().eq('user_id', userId);

    const rows = schedule.map(s => ({
      user_id: userId,
      day_of_week: s.day,
      open_time: s.enabled ? s.open : null,
      close_time: s.enabled ? s.close : null,
      is_open: s.enabled,
    }));

    const { error } = await (supabase as any).from('business_hours').insert(rows);
    if (error) { toast.error('Erro ao salvar horários'); } else { toast.success('Horários salvos!'); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Horário de Funcionamento</h1>
        <p className="text-muted-foreground text-sm mt-1">Defina quando seu restaurante está aberto</p>
      </div>

      <div className="space-y-3">
        {schedule.map((s) => (
          <motion.div
            key={s.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: s.day * 0.05 }}
            className="glass-sm p-4 flex items-center gap-4"
          >
            <Switch checked={s.enabled} onCheckedChange={(v) => updateDay(s.day, 'enabled', v)} />
            <span className={`w-24 font-medium text-sm ${!s.enabled ? 'text-muted-foreground' : ''}`}>
              {DAYS[s.day]}
            </span>
            {s.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={s.open}
                  onChange={(e) => updateDay(s.day, 'open', e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-muted-foreground text-sm">até</span>
                <input
                  type="time"
                  value={s.close}
                  onChange={(e) => updateDay(s.day, 'close', e.target.value)}
                  className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">Fechado</span>
            )}
          </motion.div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Clock className="w-4 h-4" />
        {saving ? 'Salvando...' : 'Salvar Horários'}
      </Button>
    </div>
  );
}


