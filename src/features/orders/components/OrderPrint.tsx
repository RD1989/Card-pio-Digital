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
  // Separamos o item hack de logística dos produtos reais inseridos pelo CartDrawer
  const regularItems = order.items.filter(i => !i.product_name.includes('📦 LOGÍSTICA:'));
  const logisticaItem = order.items.find(i => i.product_name.includes('📦 LOGÍSTICA:'));

  const Divider = () => <div className="text-center font-bold tracking-widest overflow-hidden whitespace-nowrap my-1">--------------------------------------------------</div>;

  return (
    <div ref={ref} className="print-only bg-white text-black leading-tight text-left" style={{ fontFamily: "'Courier New', Courier, monospace", wordBreak: "break-word" }}>
      <style>{`
        @media screen {
          .print-only { display: none; }
        }
        @media print {
          @page { margin: 0; }
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
            width: 80mm !important; /* Cobre 80mm e adapta reduzindo em 58mm natural */
            max-width: 100%;
            padding: 2mm 3mm !important;
            font-size: 13px !important;
            color: #000 !important;
            background: white !important; 
            margin: 0;
          }
        }
      `}</style>
      
      {/* Header: Nome do Restaurante */}
      <div className="text-center mb-1">
        <h1 className="text-[18px] font-bold uppercase whitespace-pre-wrap">{restaurantName}</h1>
      </div>
      
      <Divider />
      
      {/* Dados Principais do Pedido */}
      <div>
        <p className="font-bold">Pedido: #{order.id.slice(0, 8).toUpperCase()}</p>
        <p>Data: {new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>

      <br/>

      {/* Dados do Cliente */}
      <div>
        <p><span className="font-bold">Cliente:</span> {order.customer_name || 'Não Informado'}</p>
        {order.customer_phone && <p><span className="font-bold">Telefone:</span> {order.customer_phone}</p>}
      </div>

      <Divider />

      {/* Itens do Pedido */}
      <p className="font-bold mb-1">ITENS:</p>
      {regularItems.map((item, i) => (
        <div key={i} className="flex justify-between items-start mb-1">
          <div className="flex-1 pr-2 uppercase">
            <span className="font-bold">{item.quantity}x</span> {item.product_name}
          </div>
          <span className="font-bold whitespace-nowrap text-right">{formatCurrency(item.unit_price * item.quantity)}</span>
        </div>
      ))}

      {/* Observações Nativas (Se houver - da época que era inserido) */}
      {order.notes && (
        <div className="mt-2 text-[12px] uppercase whitespace-pre-wrap">
          <p className="font-bold">OBS:</p>
          <p>{order.notes}</p>
        </div>
      )}

      <Divider />

      {/* Totalizador */}
      <div className="flex justify-between font-bold text-[16px] uppercase">
        <span>TOTAL:</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      {/* Logística, Pagamento & Endereço (Extraído do Hack do Type) */}
      {logisticaItem && (
        <>
          <Divider />
          <div className="whitespace-pre-wrap uppercase text-[12px]">
            {logisticaItem.product_name.replace('📦 LOGÍSTICA:\n', '')}
          </div>
        </>
      )}

      <Divider />

      {/* Footer Profissional */}
      <div className="text-center text-[12px] font-bold mt-2">
        <p>Obrigado pela preferência!</p>
      </div>
    </div>
  );
});

OrderPrint.displayName = 'OrderPrint';
