import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ShoppingBag, 
  Store, 
  Settings, 
  Bell, 
  Search, 
  TrendingUp,
  Package,
  QrCode
} from 'lucide-react';

export function DashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto perspective-[1200px] mt-10 lg:mt-0">
      <motion.div 
        initial={{ rotateY: -15, rotateX: 10, scale: 0.9, opacity: 0 }}
        whileInView={{ rotateY: -5, rotateX: 5, scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        viewport={{ once: true, margin: "-100px" }}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-amber-500/10 flex overflow-hidden lg:h-[550px]"
      >
        
        {/* Sidebar */}
        <div className="w-56 bg-zinc-900/50 border-r border-zinc-800 hidden md:flex flex-col">
          <div className="h-16 border-b border-zinc-800 flex items-center px-6 gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
              <Store className="w-3 h-3 text-zinc-950" />
            </div>
            <span className="font-bold text-white tracking-tight">Burger House</span>
          </div>

          <div className="flex-1 py-6 px-4 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 font-medium">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Visão Geral</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">Produtos</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white transition-colors">
              <Package className="w-4 h-4" />
              <span className="text-sm">Categorias</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white transition-colors">
              <QrCode className="w-4 h-4" />
              <span className="text-sm">Link na Bio</span>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-3 py-2 text-zinc-500">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Configurações</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-zinc-950 relative overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-sm z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <div className="pl-10 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-500 w-64">
                Buscar pedidos...
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-zinc-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950"></span>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-zinc-950 text-xs">
                JD
              </div>
            </div>
          </div>

          {/* Content Space */}
          <div className="p-8 flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">Painel de Vendas</h2>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Card 1 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
                <div className="text-zinc-400 text-sm mb-1">Pedidos Hoje</div>
                <div className="text-3xl font-black text-white">45</div>
                <div className="flex items-center gap-1 text-green-500 text-xs mt-2 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +12% vs ontem
                </div>
                <div className="absolute right-0 bottom-0 opacity-10">
                  <ShoppingBag className="w-24 h-24 -mr-4 -mb-4 text-emerald-500" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden hidden sm:block">
                <div className="text-zinc-400 text-sm mb-1">Faturamento Bruto</div>
                <div className="text-3xl font-black text-amber-500">R$ 1.850</div>
                <div className="flex items-center gap-1 text-green-500 text-xs mt-2 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +8% vs ontem
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden hidden md:block">
                <div className="text-zinc-400 text-sm mb-1">Visitas no Cardápio</div>
                <div className="text-3xl font-black text-white">312</div>
                <div className="flex items-center gap-1 text-red-500 text-xs mt-2 font-medium">
                  -2% vs ontem
                </div>
              </div>
            </div>

            {/* Orders Table Mock */}
            <h3 className="text-lg font-bold text-white mb-4">Últimos Pedidos Recebidos</h3>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="font-semibold text-zinc-400 text-xs uppercase tracking-wider p-4">Pedido ID</th>
                    <th className="font-semibold text-zinc-400 text-xs uppercase tracking-wider p-4 hidden sm:table-cell">Cliente</th>
                    <th className="font-semibold text-zinc-400 text-xs uppercase tracking-wider p-4">Valor</th>
                    <th className="font-semibold text-zinc-400 text-xs uppercase tracking-wider p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "#1024", name: "Marcos Silva", val: "R$ 45,90", status: "Novo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                    { id: "#1023", name: "Ana Beatriz", val: "R$ 112,00", status: "Em Preparo", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                    { id: "#1022", name: "Joana Dark", val: "R$ 38,50", status: "Concluído", color: "bg-green-500/10 text-green-500 border-green-500/20" },
                    { id: "#1021", name: "Carlos", val: "R$ 88,90", status: "Concluído", color: "bg-green-500/10 text-green-500 border-green-500/20" }
                  ].map((order, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 text-sm font-medium text-white">{order.id}</td>
                      <td className="p-4 text-sm text-zinc-400 hidden sm:table-cell">{order.name}</td>
                      <td className="p-4 text-sm font-bold text-zinc-300">{order.val}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${order.color}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
          
          {/* Bottom Gradient overlay for fading effect */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none rounded-b-2xl"></div>
        </div>
      </motion.div>
    </div>
  );
}
