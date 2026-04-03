import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

interface Props {
  slug: string;
  restaurantName: string;
}

function generateQRSvg(data: string, size: number = 256): string {
  // Use a simple QR code via external API rendered as image
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&format=svg&margin=8`;
}

export function QRCodeGenerator({ slug, restaurantName }: Props) {
  const menuUrl = `${window.location.origin}/menu/${slug}`;
  const [copied, setCopied] = useState(false);
  const qrUrl = generateQRSvg(menuUrl, 300);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(menuUrl)}&format=png&margin=16`;
    link.download = `qrcode-${slug}.png`;
    link.click();
    toast.success('QR Code baixado!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-sm p-6 space-y-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
        <QrCode className="w-4 h-4" /> QR Code do Cardápio
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
        </div>

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            Imprima este QR Code e coloque nas mesas do seu restaurante. Seus clientes escaneiam e acessam o cardápio digital.
          </p>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
            <span className="text-xs text-muted-foreground truncate flex-1">{menuUrl}</span>
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          <div className="flex gap-2 justify-center sm:justify-start">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Baixar PNG
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

