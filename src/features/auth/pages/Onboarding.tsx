import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Palette, Store, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const presetColors = [
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Esmeralda', value: '#22c55e' },
  { name: 'Rubi', value: '#ef4444' },
  { name: 'Safira', value: '#3b82f6' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [restaurantName, setRestaurantName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#f59e0b');

  // Check if onboarding is needed
  useEffect(() => {
    if (!user) return;
    async function check() {
      const { data } = await supabase
        .from('profiles')
        .select('whatsapp, restaurant_name')
        .eq('user_id', user!.id)
        .single();

      if (data?.whatsapp && data.whatsapp.length > 5) {
        // Already onboarded
        navigate('/admin', { replace: true });
        return;
      }
      if (data?.restaurant_name) {
        setRestaurantName(data.restaurant_name);
      }
    }
    check();
  }, [user, navigate]);

  const handleFinish = async () => {
    if (!whatsapp || whatsapp.replace(/\D/g, '').length < 10) {
      toast.error('Informe um número de WhatsApp válido');
      return;
    }
    setLoading(true);
    const slug = restaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { error } = await supabase.from('profiles').update({
      restaurant_name: restaurantName.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      primary_color: primaryColor,
      slug: slug || `loja-${Date.now()}`,
    }).eq('user_id', user!.id);

    setLoading(false);
    if (error) {
      toast.error('Erro ao salvar. Tente novamente.');
      return;
    }
    toast.success('Tudo pronto! Bem-vindo ao Menu Pro 🎉');
    navigate('/admin');
  };

  const steps = [
    {
      icon: Store,
      title: 'Nome do Restaurante',
      desc: 'Como seus clientes conhecem seu negócio?',
      content: (
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Ex: Pizzaria do João"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      ),
      valid: restaurantName.trim().length >= 2,
    },
    {
      icon: Phone,
      title: 'WhatsApp para Pedidos',
      desc: 'Este é o número onde você receberá os pedidos dos clientes.',
      content: (
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="(11) 99999-9999"
          className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      ),
      valid: whatsapp.replace(/\D/g, '').length >= 10,
    },
    {
      icon: Palette,
      title: 'Cor da sua Marca',
      desc: 'Escolha a cor principal do seu cardápio digital.',
      content: (
        <div className="grid grid-cols-3 gap-3">
          {presetColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setPrimaryColor(color.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                primaryColor === color.value
                  ? 'border-primary bg-primary/10 scale-105'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="w-10 h-10 rounded-full shadow-lg" style={{ backgroundColor: color.value }} />
              <span className="text-xs font-medium">{color.name}</span>
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md glass p-10"
        >
          <div className="text-center mb-6">
            <img src={logo} alt="Menu Pro" className="h-24 w-auto mx-auto mb-4" />
            <p className="text-xs text-muted-foreground">Passo {step + 1} de {steps.length}</p>
            <div className="flex gap-1.5 justify-center mt-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i <= step ? 'w-8 bg-primary' : 'w-4 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <current.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{current.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{current.desc}</p>
              </div>

              <div>{current.content}</div>

              <button
                onClick={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    handleFinish();
                  }
                }}
                disabled={!current.valid || loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : step < steps.length - 1 ? (
                  <>Continuar <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Começar a Usar <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

