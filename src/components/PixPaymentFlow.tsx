"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, QrCode, Clock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PixPaymentFlowProps {
  planId: string;
  period: 'monthly' | 'yearly';
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PixPaymentFlow = ({ planId, period, amount, onSuccess, onCancel }: PixPaymentFlowProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{
    txid: string;
    qr_code_base64: string;
    copia_e_cola: string;
  } | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos em segundos
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    // Simulação do backend de geração de PIX (visto que a API Laravel foi depreciada)
    // Em um cenário real, isso chamaria uma Next.js API Route que integraria com a Efi Pay
    async function generatePix() {
      try {
        setLoading(true);
        // Simulando delay de rede
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock de resposta da API (O usuário deve configurar a API real na Vercel)
        setQrCodeData({
          txid: "simulated-txid-" + Math.random().toString(36).substr(2, 9),
          qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==", // Empty pixel placeholder
          copia_e_cola: "00020126580014BR.GOV.BCB.PIX01369796695b-0000-0000-0000-0000000000005204000053039865405" + amount.toFixed(2) + "5802BR5913MENU PRO SAAS6008SAO PAULO62070503***6304"
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Erro ao comunicar com o servidor de pagamentos.');
        setLoading(false);
      }
    }

    generatePix();
  }, [planId, period, amount]);

  useEffect(() => {
    if (loading || error || paymentConfirmed || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, error, paymentConfirmed]);

  useEffect(() => {
    // Implementação de Supabase Realtime para ouvir a confirmação do pagamento
    // Em produção, um Webhook da Efi Pay bateria em uma Edge Function que daria UPDATE no 'restaurants'
    if (!qrCodeData || paymentConfirmed) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
        },
        (payload) => {
          // Se o plano foi atualizado para o que acabamos de pagar
          if (payload.new.plan === planId && payload.new.should_block === false) {
            setPaymentConfirmed(true);
            setTimeout(() => onSuccess(), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qrCodeData, paymentConfirmed, planId, onSuccess]);

  const handleCopy = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData.copia_e_cola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Botão de simulação para o desenvolvedor testar o fluxo sem webhook real
  const simulatePaymentSuccess = async () => {
     try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscamos o ID do restaurante do usuário atual
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .single();

        if (restaurant) {
          await supabase
            .from('restaurants')
            .update({ 
              plan: planId, 
              should_block: false,
              trial_ends_at: null // Assinatura ativa remove o trial
            })
            .eq('id', restaurant.id);
          
          // O Realtime listener acima cuidará de setPaymentConfirmed(true)
        }
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-zinc-500 font-medium">Processando cobrança...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
           <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold dark:text-white text-slate-900">Algo deu errado</h3>
        <p className="text-zinc-500 max-w-sm">{error}</p>
        <button onClick={onCancel} className="mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-bold hover:opacity-80">
          Voltar e tentar de novo
        </button>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 space-y-6 text-center"
      >
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
           <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div>
            <h3 className="text-3xl font-black text-emerald-500 mb-2">Pagamento Aprovado!</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                O banco confirmou o PIX. Seu painel foi desbloqueado com sucesso no Plano {planId.toUpperCase()}.
                Redirecionando...
            </p>
        </div>
        <button onClick={onSuccess} className="mt-4 flex items-center gap-2 px-8 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-800 uppercase tracking-wider text-sm">
          Acessar Meu Painel <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
      
      <div className="flex justify-between items-center mb-8 mt-2">
        <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                Pagamento via PIX
            </h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-1">
                Plano {planId.toUpperCase()} {period === 'yearly' ? 'Anual' : 'Mensal'}
            </p>
        </div>
        <div className="text-right">
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total</span>
            <span className="text-2xl font-black text-amber-500">R$ {amount.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
         {timeLeft > 0 ? (
            <>
                <div className="bg-white p-3 rounded-2xl border-4 border-slate-100 dark:border-zinc-800 shadow-sm mb-6 w-56 h-56 flex items-center justify-center">
                    {qrCodeData?.qr_code_base64 === "empty" ? (
                      <div className="text-zinc-300 italic text-xs text-center px-4">QR Code Simulado</div>
                    ) : (
                      <img 
                        src={qrCodeData?.qr_code_base64.startsWith('data:') ? qrCodeData.qr_code_base64 : `data:image/png;base64,${qrCodeData?.qr_code_base64}`} 
                        alt="QR Code PIX" 
                        className="w-full h-full object-contain"
                      />
                    )}
                </div>
                
                <div className="flex items-center gap-2 text-rose-500 mb-6 font-bold bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
            </>
         ) : (
             <div className="py-12 text-center">
                 <p className="text-rose-500 font-bold mb-2">QR Code Expirado</p>
                 <button onClick={onCancel} className="text-sm underline text-zinc-500">Gerar nova cobrança</button>
             </div>
         )}

         {timeLeft > 0 && (
             <div className="w-full space-y-3">
                 <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all"
                 >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Código Pix copiado!' : 'Copiar "PIX Copia e Cola"'}
                 </button>
                 
                 <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800 w-full mt-4">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                     </span>
                     <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium text-center">Aguardando pagamento no aplicativo do seu banco...</p>
                 </div>

                 {/* Botão de teste facilitado para a migração */}
                 <button 
                  onClick={simulatePaymentSuccess}
                  className="w-full mt-8 py-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors"
                 >
                   Simular Aprovação (Somente Dev)
                 </button>
             </div>
         )}
      </div>

      <button onClick={onCancel} className="absolute top-4 right-4 text-zinc-400 hover:text-rose-500 uppercase text-[10px] font-bold">
         Fechar
      </button>
    </motion.div>
  );
};
