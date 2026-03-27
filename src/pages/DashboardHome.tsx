import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Smartphone, 
  TrendingUp, 
  CreditCard 
} from 'lucide-react';
import { motion } from 'framer-motion';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 700 },
  { name: 'Mar', value: 600 },
  { name: 'Abr', value: 800 },
  { name: 'Mai', value: 1100 },
  { name: 'Jun', value: 1560 },
];

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
}

const StatCard = ({ icon: Icon, label, value, trend }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="bg-amber-500/10 p-3 rounded-2xl">
        <Icon className="w-6 h-6 text-amber-500" />
      </div>
      {trend && (
        <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-sm mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-white">{value}</h3>
  </motion.div>
);

export const DashboardHome = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Lojistas" value="124" trend="+12%" />
        <StatCard icon={Smartphone} label="Scan de QR Codes" value="4.8k" trend="+25%" />
        <StatCard icon={CreditCard} label="Receita Mensal" value="R$ 15.420" trend="+8%" />
        <StatCard icon={TrendingUp} label="Novos Assinantes" value="18" trend="+5%" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
        <h3 className="text-xl font-serif text-white mb-8">Crescimento de Assinaturas</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px' }}
                itemStyle={{ color: '#white' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#f59e0b" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
