"use client";

import { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const DAYS = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHoursData {
  [key: string]: DayHours;
}

const DEFAULT_HOURS: BusinessHoursData = {
  '0': { open: '08:00', close: '22:00', closed: false },
  '1': { open: '08:00', close: '22:00', closed: false },
  '2': { open: '08:00', close: '22:00', closed: false },
  '3': { open: '08:00', close: '22:00', closed: false },
  '4': { open: '08:00', close: '22:00', closed: false },
  '5': { open: '08:00', close: '22:00', closed: false },
  '6': { open: '08:00', close: '22:00', closed: false },
};

export default function BusinessHoursPage() {
  const { theme, accentColor } = useThemeStore() as any;
  const { user, setUser } = useAuthStore() as any;
  const isLight = theme === 'light';

  const [hours, setHours] = useState<BusinessHoursData>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user?.restaurant?.business_hours) {
      setHours(user.restaurant.business_hours as BusinessHoursData);
    }
    setLoading(false);
  }, [user]);

  const handleToggleDay = (dayIndex: string) => {
    setHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], closed: !prev[dayIndex].closed }
    }));
  };

  const handleTimeChange = (dayIndex: string, field: 'open' | 'close', value: string) => {
    setHours(prev => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [field]: value }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('restaurants')
        .update({ business_hours: hours })
        .eq('id', user?.restaurant?.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (setUser && user) {
        setUser({
          ...user,
          restaurant: data
        });
      }

      setMessage({ type: 'success', text: 'Horários atualizados com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar os horários.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <header>
        <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Horário de Funcionamento
        </h2>
        <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
          Configure os períodos em que seu cardápio estará aberto para receber pedidos.
        </p>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{message.text}</span>
        </motion.div>
      )}

      <div className={`rounded-3xl border overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-zinc-800'}`}>
          {DAYS.map((dayName, index) => {
            const dayIdx = index.toString();
            const config = hours[dayIdx] || DEFAULT_HOURS[dayIdx];
            
            return (
              <div key={dayIdx} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
                config.closed ? (isLight ? 'bg-slate-50 opacity-60' : 'bg-black/20 opacity-40') : ''
              }`}>
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    config.closed ? 'bg-zinc-800 text-zinc-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {config.closed ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{dayName}</p>
                    <p className="text-xs text-zinc-500">{config.closed ? 'Fechado o dia todo' : 'Aberto para pedidos'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {!config.closed && (
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold text-zinc-500">Abre</span>
                       <input 
                        type="time"
                        value={config.open}
                        onChange={(e) => handleTimeChange(dayIdx, 'open', e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm outline-none ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border border-zinc-800 text-white'
                        }`}
                       />
                       <span className={`mx-1 ${isLight ? 'text-slate-300' : 'text-zinc-700'}`}>–</span>
                       <span className="text-[10px] uppercase font-bold text-zinc-500">Fecha</span>
                       <input 
                        type="time"
                        value={config.close}
                        onChange={(e) => handleTimeChange(dayIdx, 'close', e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm outline-none ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-zinc-950 border border-zinc-800 text-white'
                        }`}
                       />
                    </div>
                  )}

                  <button
                    onClick={() => handleToggleDay(dayIdx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      config.closed 
                        ? (isLight ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white')
                        : (isLight ? 'bg-slate-100 text-slate-600 hover:bg-red-500 hover:text-white' : 'bg-zinc-950 text-zinc-400 hover:bg-red-600 hover:text-white border border-zinc-800')
                    }`}
                  >
                    {config.closed ? 'MARCAR COMO ABERTO' : 'MARCAR COMO FECHADO'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold tracking-tight transition-all active:scale-95 shadow-xl hover:shadow-2xl disabled:opacity-50"
          style={{ backgroundColor: accentColor, color: '#0a0a0a' }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          SALVAR ALTERAÇÕES
        </button>
      </div>
    </div>
  );
}
