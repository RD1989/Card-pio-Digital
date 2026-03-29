"use client";

import { useState, useEffect } from 'react';
import { 
  Printer, 
  User, 
  MapPin, 
  Smartphone,
  Zap,
  Layout,
  Clock,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  total_amount: number;
  customer_name: string | null;
  created_at: string;
}

interface LabelData {
  orderId: string;
  customer: string;
  phone: string;
  address: string;
  items: string[];
  total: number;
  date: string;
}

export default function DeliveryLabelsPage() {
  const { user } = useAuthStore() as any;
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');
  const [includePix, setIncludePix] = useState(true);
  const [includeCoupon, setIncludeCoupon] = useState(true);

  const [labelData, setLabelData] = useState<LabelData>({
    orderId: '#----',
    customer: '',
    phone: '',
    address: '',
    items: [''],
    total: 0,
    date: new Date().toLocaleDateString('pt-BR')
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLabelData({
      ...labelData,
      orderId: `#${order.id.slice(0, 8)}`,
      total: order.total_amount,
      customer: order.customer_name || '',
      date: new Date(order.created_at).toLocaleDateString('pt-BR')
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const addItemField = () => {
    setLabelData({ ...labelData, items: [...labelData.items, ''] });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...labelData.items];
    newItems[index] = value;
    setLabelData({ ...labelData, items: newItems });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Estilos de Impressão Nativa via Next.js 15 */}
      <style>{`
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="mb-8">
        <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Etiquetas de Entrega
        </h2>
        <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
          Transforme pedidos do sistema em impressos profissionais rápidos.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Painel Esquerdo: Lista de Pedidos (4 colunas) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className={`rounded-3xl p-6 border h-fit ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
          }`}>
            <h3 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Clock className="w-4 h-4 text-zinc-500" /> Pedidos
            </h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingOrders ? (
                <div className="py-10 text-center flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs text-zinc-500">Buscando...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-xs italic">
                  Nenhum pedido encontrado.
                </div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-95 ${
                      selectedOrder?.id === order.id
                        ? isLight ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-zinc-950 border-white'
                        : isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[10px] font-bold">#{order.id.slice(0, 8)}</span>
                      <span className="text-[10px] opacity-60">
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-black text-sm truncate">{order.customer_name || 'Pedido Rápido'}</p>
                    <div className="flex justify-between items-end mt-2">
                       <span className="text-[10px] uppercase font-bold opacity-60">Checkout</span>
                       <span className={`font-black tracking-tighter ${selectedOrder?.id === order.id ? '' : 'text-emerald-500'}`}>
                         R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                       </span>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <button
               onClick={() => {
                 setSelectedOrder(null);
                 setLabelData({...labelData, orderId: '#'+Math.floor(Math.random()*9000+1000)});
               }}
               className={`w-full mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-dashed transition-all ${
                 isLight ? 'border-slate-300 text-slate-500 hover:bg-slate-100' : 'border-zinc-800 text-zinc-500 hover:bg-zinc-950'
               }`}
            >
              Etiqueta Manual
            </button>
          </div>
        </aside>

        {/* Painel Central/Direito: Editor e Preview (8 colunas) */}
        <main className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Editor de Dados */}
            <div className={`rounded-3xl p-6 border h-fit space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                Dados da Entrega
              </h3>
              
              <div className="space-y-3">
                <input 
                  type="text"
                  placeholder="Nome do Cliente"
                  className={`w-full p-4 rounded-2xl border text-sm outline-none transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 focus:border-slate-400' : 'bg-zinc-950 border-zinc-800 focus:border-zinc-600'
                  }`}
                  value={labelData.customer}
                  onChange={(e) => setLabelData({...labelData, customer: e.target.value})}
                />
                <input 
                  type="text"
                  placeholder="WhatsApp / Celular"
                  className={`w-full p-4 rounded-2xl border text-sm outline-none transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 focus:border-slate-400' : 'bg-zinc-950 border-zinc-800 focus:border-zinc-600'
                  }`}
                  value={labelData.phone}
                  onChange={(e) => setLabelData({...labelData, phone: e.target.value})}
                />
                <textarea 
                  placeholder="Endereço Completo"
                  rows={2}
                  className={`w-full p-4 rounded-2xl border text-sm outline-none resize-none transition-all ${
                    isLight ? 'bg-slate-50 border-slate-200 focus:border-slate-400' : 'bg-zinc-950 border-zinc-800 focus:border-zinc-600'
                  }`}
                  value={labelData.address}
                  onChange={(e) => setLabelData({...labelData, address: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Resumo do Pedido</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {labelData.items.map((item, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      placeholder={`Item ${idx + 1}`}
                      className={`w-full p-3 rounded-xl border text-[10px] font-bold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-100' : 'bg-zinc-950 border-zinc-900'
                      }`}
                      value={item}
                      onChange={(e) => updateItem(idx, e.target.value)}
                    />
                  ))}
                  <button 
                    onClick={addItemField}
                    className="text-[10px] font-black uppercase text-zinc-500 hover:text-amber-500 transition-colors tracking-widest mt-1"
                  >
                    + Novo Item
                  </button>
                </div>
              </div>
            </div>

            {/* Preview & Print Config */}
            <div className="space-y-6">
              {/* Etiqueta Preview */}
              <div id="printable-area" className={`p-6 rounded-2xl border-t-[8px] shadow-2xl bg-white text-zinc-950 animate-in fade-in duration-500 ${
                printFormat === 'thermal' ? 'max-w-[300px] mx-auto' : 'w-full'
              }`}
               style={{ borderTopColor: accentColor }}
              >
                  <div className="flex flex-col items-center border-b border-zinc-100 pb-4 mb-4">
                    <img 
                      src={user?.restaurant?.logo_url || '/placeholder.png'} 
                      className="h-12 w-fit object-contain mb-2" 
                      alt="Logo"
                    />
                    <h4 className="text-[10px] font-black uppercase tracking-widest">{user?.restaurant?.name || 'Seu Restaurante'}</h4>
                    <p className="text-[8px] text-zinc-400 italic">Preparamos com carinho 🍔</p>
                  </div>

                  <div className="space-y-4 font-sans">
                    <div className="flex justify-between items-center text-[10px] font-mono bg-zinc-100 p-2 rounded-lg">
                      <span className="font-black italic">PEDIDO {labelData.orderId}</span>
                      <span className="opacity-60">{labelData.date}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase">
                        <User className="w-3.5 h-3.5 text-zinc-400" /> {labelData.customer || '--- CLIENTE ---'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                        <Smartphone className="w-3.5 h-3.5" /> {labelData.phone || '--- CONTATO ---'}
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-zinc-700 leading-snug bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 font-medium">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" /> 
                        {labelData.address || '--- ENDEREÇO DE ENTREGA ---'}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-zinc-200 pt-3">
                      {labelData.items.filter(i => i.trim()).length > 0 && (
                        <div className="space-y-1.5">
                          {labelData.items.filter(i => i.trim()).map((item, idx) => (
                            <p key={idx} className="text-[10px] flex justify-between font-bold text-zinc-600">
                              <span className="">• {item}</span>
                              <span className="text-zinc-200">_____</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {includePix && (
                      <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-3">
                         <div className="w-10 h-10 bg-white border border-emerald-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                            <Zap className="w-6 h-6 text-emerald-500" />
                         </div>
                         <div className="leading-tight">
                            <p className="text-[9px] font-black text-emerald-800 uppercase tracking-tighter">Pague via PIX</p>
                            <p className="text-[8px] text-emerald-600 font-mono">Chave: {user?.restaurant?.whatsapp_number || 'Verificar App'}</p>
                         </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-zinc-950 text-white px-4 py-3 rounded-xl shadow-lg">
                      <span className="text-[10px] uppercase font-black text-zinc-500">Valor à Cobrar</span>
                      <span className="text-base font-black italic">R$ {Number(labelData.total).toFixed(2).replace('.', ',')}</span>
                    </div>

                    {includeCoupon && (
                      <div className="text-center pt-4 border-t border-zinc-100">
                         <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest mb-2">Use no próximo pedido!</p>
                         <div className="border-2 border-dashed border-zinc-200 py-1.5 px-4 inline-block rounded-xl">
                            <span className="text-[11px] font-black italic text-zinc-900 tracking-wider">OFF10NOW</span>
                         </div>
                      </div>
                    )}
                  </div>
              </div>

              {/* Controles de Impressão */}
              <div className={`p-6 rounded-3xl border space-y-4 no-print ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
              }`}>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPrintFormat('thermal')}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                      printFormat === 'thermal' 
                        ? isLight ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' : 'bg-white text-zinc-950 border-white'
                        : isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Térmica 80mm</span>
                  </button>
                  <button 
                    onClick={() => setPrintFormat('a4')}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                      printFormat === 'a4' 
                        ? isLight ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' : 'bg-white text-zinc-950 border-white'
                        : isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-800 bg-zinc-950 text-zinc-600'
                    }`}
                  >
                    <Layout className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Folha A4</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 py-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${includePix ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includePix ? 'left-5' : 'left-1'}`} />
                         <input 
                            type="checkbox" 
                            hidden
                            checked={includePix} 
                            onChange={(e) => setIncludePix(e.target.checked)}
                          />
                      </div>
                      <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">Incluir Bloco PIX</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${includeCoupon ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeCoupon ? 'left-5' : 'left-1'}`} />
                         <input 
                            type="checkbox" 
                            hidden
                            checked={includeCoupon} 
                            onChange={(e) => setIncludeCoupon(e.target.checked)}
                          />
                      </div>
                      <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">Gerar Cupom Off</span>
                   </label>
                </div>

                <button 
                  onClick={handlePrint}
                  className="w-full py-5 rounded-2xl font-black italic uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                  style={{ backgroundColor: accentColor, color: '#000' }}
                >
                  <Printer className="w-6 h-6" /> Imprimir Agora
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
