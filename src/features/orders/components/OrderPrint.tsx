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
  return (
    <div ref={ref} className="print-only w-[80mm] p-2 bg-white text-black font-mono text-[12px] leading-tight">
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          .print-only { display: block; }
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: absolute; left: 0; top: 0; background: white !important; }
        }
      `}</style>
      
      <div className="text-center border-b border-dashed border-black pb-2 mb-2">
        <h1 className="text-[16px] font-bold uppercase">{restaurantName}</h1>
        <p>Pedido: #{order.id.slice(0, 8)}</p>
        <p>{new Date(order.created_at).toLocaleString('pt-BR')}</p>
      </div>

      <div className="mb-2">
        <p><strong>Cliente:</strong> {order.customer_name || 'Consumidor'}</p>
        {order.customer_phone && <p><strong>Tel:</strong> {order.customer_phone}</p>}
      </div>

      <div className="border-y border-dashed border-black py-2 mb-2">
        <div className="flex justify-between font-bold mb-1 border-b border-black/20 pb-1">
          <span className="w-8">Qtd</span>
          <span className="flex-1 px-2">Item</span>
          <span className="w-16 text-right">Total</span>
        </div>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1">
            <span className="w-8">{item.quantity}x</span>
            <span className="flex-1 px-2">{item.product_name}</span>
            <span className="w-16 text-right">{formatCurrency(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="text-right space-y-1 mb-2">
        <div className="flex justify-between font-bold text-[14px]">
          <span>TOTAL:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="border-t border-dashed border-black pt-2 mb-4">
          <p className="font-bold">Observações:</p>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      <div className="text-center text-[10px] pt-4 border-t border-dashed border-black">
        <p>Obrigado pela preferência!</p>
        <p>Cardápio Digital Pro</p>
      </div>
    </div>
  );
});

OrderPrint.displayName = 'OrderPrint';
