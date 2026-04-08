import { forwardRef } from 'react';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

interface Props {
  order: Order;
  restaurantName: string;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const OrderPrint = forwardRef<HTMLDivElement, Props>(({ order, restaurantName }, ref) => {
  const subtotal = order.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  return (
    <div ref={ref} className="print-only bg-white text-black font-mono leading-snug">
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm !important; /* Width exata impressora térmica */
            padding: 4mm !important;
            font-size: 13px !important;
            color: #000 !important;
            background: white !important; 
            margin: 0 auto;
          }
          /* Ensure headers look nice printed */
          .print-header-bg {
            background-color: #000 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="text-center border-b-[2px] border-dashed border-black pb-3 mb-3">
        <h1 className="text-[20px] font-black uppercase mb-1 leading-tight">{restaurantName}</h1>
        <p className="font-bold">PEDIDO: #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-[12px]">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
      </div>

      {/* Customer Info */}
      <div className="mb-3 border-b-[2px] border-dashed border-black pb-3">
        <p><span className="font-bold uppercase text-[12px]">Cliente:</span> {order.customer_name || 'N/I'}</p>
        {order.customer_phone && <p><span className="font-bold uppercase text-[12px]">WhatsApp:</span> {order.customer_phone}</p>}
      </div>

      {/* Items Container */}
      <div className="mb-3">
        <div className="flex justify-between font-bold border-b border-black pb-1 mb-2">
          <span className="w-8">Qtd</span>
          <span className="flex-1 px-1">Item</span>
          <span className="w-16 text-right">Total</span>
        </div>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between items-start py-1">
            <span className="w-8 font-bold">{item.quantity}x</span>
            <div className="flex-1 px-1 flex flex-col">
              <span className="font-semibold uppercase text-[12px]">{item.product_name}</span>
              <span className="text-[11px] text-gray-700">{formatCurrency(item.unit_price)} unid</span>
            </div>
            <span className="w-16 text-right font-bold">{formatCurrency(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t-[2px] border-dashed border-black pt-2 mb-3">
        <div className="flex justify-between text-[13px] mb-1">
          <span>Subtotal Itens:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between font-black text-[16px] mt-1 pt-1 border-t border-black">
          <span>VALOR FINAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Logistics and Payment Block (Injected from CartDrawer via notes) */}
      {order.notes && (
        <div className="border-t-[2px] border-dashed border-black pt-3 mt-1 pb-3">
          <p className="font-black uppercase text-center mb-2 print-header-bg py-1">DADOS & LOGÍSTICA</p>
          <div className="whitespace-pre-wrap font-bold pl-1 font-mono leading-tight">
            {order.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[11px] font-bold border-t-[2px] border-dashed border-black pt-4 mt-2 mb-2">
        <p>*** OBRIGADO PELA PREFERÊNCIA! ***</p>
        <p className="mt-1 font-normal">Cardápio Digital</p>
      </div>
    </div>
  );
});

OrderPrint.displayName = 'OrderPrint';
