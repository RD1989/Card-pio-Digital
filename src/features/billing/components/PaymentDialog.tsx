import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Loader2, QrCode, AlertCircle, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  planId: string;
  planName: string;
  price: string;
}

export function PaymentDialog({ open, onOpenChange, userId, planId, planName, price }: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    qrCodeImage: string;
    qrCodeCopyPaste: string;
    valor: number;
    txid: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayment = async () => {
    if (!userId || !planId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, plano: planId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao gerar cobrança');
      }

      const data = await response.json();
      setPaymentData({
        qrCodeImage: data.qrCodeImage,
        qrCodeCopyPaste: data.qrCodeCopyPaste,
        valor: data.valor,
        txid: data.txid
      });
    } catch (err: any) {
      console.error('Erro no checkout PIX:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !paymentData) {
      fetchPayment();
    }
  }, [open]);

  const handleCopy = () => {
    if (paymentData?.qrCodeCopyPaste) {
      navigator.clipboard.writeText(paymentData.qrCodeCopyPaste);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-pill">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight uppercase">Pagamento via PIX</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Ativação Instantânea • {planName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                </div>
                <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Gerando cobrança...</p>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4 text-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <div className="space-y-1">
                  <p className="font-bold text-red-500 uppercase text-xs tracking-widest">Erro no Gateway</p>
                  <p className="text-sm font-medium opacity-80">{error}</p>
                </div>
                <Button variant="outline" onClick={fetchPayment} className="w-full border-red-500/30 text-red-500 hover:bg-red-500/5 h-11 font-bold">
                  TENTAR NOVAMENTE
                </Button>
              </div>
            ) : paymentData ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* QR Code */}
                <div className="relative group mx-auto w-52 h-52">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full translate-y-4 group-hover:bg-primary/30 transition-all duration-500" />
                  <div className="relative bg-white p-3 rounded-2xl shadow-xl border border-white/20">
                    <img 
                      src={paymentData.qrCodeImage.startsWith('data:') ? paymentData.qrCodeImage : `data:image/png;base64,${paymentData.qrCodeImage}`} 
                      alt="QR Code PIX" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Valor do Investimento</p>
                  <p className="text-4xl font-black text-primary tracking-tighter shadow-primary/10 drop-shadow-sm">R$ {price}</p>
                </div>

                {/* Copia e Cola */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">PIX Copia e Cola</label>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <div className="relative bg-muted/50 border border-border p-4 rounded-xl flex items-center gap-3">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-mono truncate opacity-60">{paymentData.qrCodeCopyPaste}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleCopy}
                        className="shrink-0 h-9 px-4 font-bold gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-all"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'COPIADO' : 'COPIAR'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-center mt-4">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3 justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest line-clamp-1">
                      Acesso liberado automaticamente após o pagamento
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground px-4 leading-relaxed">
                    Escaneie o QR Code ou use o Copia e Cola no app do seu banco. 
                    A confirmação costuma levar menos de 60 segundos.
                  </p>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
