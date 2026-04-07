import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  index: number;
}

const MetricCard = React.memo(({ label, value, icon: Icon, index }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="glass p-6 group hover:translate-y-[-4px] transition-all duration-300 cursor-pointer relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon className="w-16 h-16" />
    </div>
    
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm text-muted-foreground font-semibold">{label}</span>
    </div>
    <p className="text-3xl font-black tracking-tighter">{value}</p>
  </motion.div>
));

interface MetricCardsProps {
  cards: CardProps[];
}

export const MetricCards = React.memo(({ cards }: MetricCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((stat, i) => (
        <MetricCard key={stat.label} {...stat} index={i} />
      ))}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
MetricCards.displayName = 'MetricCards';
