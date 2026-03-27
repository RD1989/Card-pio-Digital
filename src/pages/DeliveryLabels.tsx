import { 
  Printer, 
  Tag, 
  User, 
  MapPin, 
  Truck, 
  CheckCircle, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';

export const DeliveryLabels = () => {
  const { user } = useAuthStore();
  
  const mockOrder = {
    id: '#1024',
    customer: 'João Silva',
    phone: '(11) 99999-0000',
    address: 'Rua das Flores, 123 - Apt 42',
    delivery_type: 'Entrega Própria',
    items: [
      { name: 'Smash Burger Pro', qty: 2 },
      { name: 'Batata Frita G', qty: 1 }
    ],
    total: 75.90
  };

  return (
    <div className="max-w-4xl space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif text-white mb-2">Etiquetas de Entrega</h2>
          <p className="text-zinc-500">Gere impressos profissionais para seus pedidos do WhatsApp.</p>
        </div>
        <button className="bg-white text-zinc-950 font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl">
           <Printer className="w-5 h-5" />
           Imprimir Lote
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Preview da Etiqueta */}
        <div className="space-y-6">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Amostra da Etiqueta (Térmica/Papel)</p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[320px] bg-white text-zinc-950 p-6 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-[8px] border-zinc-900"
          >
             <div className="flex flex-col items-center border-b border-zinc-200 pb-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-2">
                   <img src={user?.restaurant?.logo_url || 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=200'} className="w-full h-full object-cover scale-75" />
                </div>
                <h3 className="font-bold text-sm uppercase">{user?.restaurant?.name || 'Burguer House'}</h3>
                <p className="text-[10px] text-zinc-500 italic">Obrigado pela preferência!</p>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono bg-zinc-100 p-2 rounded">
                   <span>PEDIDO {mockOrder.id}</span>
                   <span>{new Date().toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-2 text-xs font-bold">
                      <User className="w-3 h-3" /> {mockOrder.customer}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                      <Smartphone className="w-3 h-3" /> {mockOrder.phone}
                   </div>
                   <div className="flex items-start gap-2 text-[10px] text-zinc-700 leading-snug">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {mockOrder.address}
                   </div>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-3">
                   <h4 className="text-[10px] font-bold uppercase mb-2">Itens:</h4>
                   {mockOrder.items.map((item, idx) => (
                     <p key={idx} className="text-[10px] flex justify-between">
                        <span>{item.qty}x {item.name}</span>
                        <span>... ok</span>
                     </p>
                   ))}
                </div>

                <div className="flex justify-between items-center bg-zinc-900 text-white p-3 rounded-lg mt-4">
                   <span className="text-[10px] uppercase font-bold text-zinc-400">Total</span>
                   <span className="text-sm font-bold">R$ {mockOrder.total.toFixed(2)}</span>
                </div>
             </div>
          </motion.div>
        </div>

        {/* Configurações */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8">
           <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <Tag className="w-6 h-6 text-amber-500" /> Formatos de Impressão
           </h3>

           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border-2 border-amber-500/50">
                 <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-amber-500" />
                    <div>
                       <p className="text-sm font-bold text-white">Impressão Térmica (80mm)</p>
                       <p className="text-[10px] text-zinc-500">Ideal para iFood e pedidos físicos.</p>
                    </div>
                 </div>
                 <CheckCircle className="w-5 h-5 text-amber-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800 opacity-50 grayscale">
                 <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-500" />
                    <div>
                       <p className="text-sm font-bold text-white">Papel A4 (4 por página)</p>
                       <p className="text-[10px] text-zinc-500">Ideal para impressoras domésticas.</p>
                    </div>
                 </div>
                 <div className="w-5 h-5 border border-zinc-800 rounded-full" />
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-4">
                 <h4 className="text-xs text-zinc-500 font-bold uppercase">Informações Extras</h4>
                 <div className="flex gap-2">
                    <input type="checkbox" className="w-4 h-4 accent-amber-500 rounded" checked />
                    <span className="text-xs text-zinc-300">Incluir Pix para Pagamento</span>
                 </div>
                 <div className="flex gap-2">
                    <input type="checkbox" className="w-4 h-4 accent-amber-500 rounded" checked />
                    <span className="text-xs text-zinc-300">Incluir cupom de próxima compra</span>
                 </div>
              </div>
           </div>

           <button className="w-full bg-zinc-800 border border-zinc-700 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
              Ver Guia de Configuração <ExternalLink className="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  );
};
