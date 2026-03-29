"use client";

import { motion } from 'framer-motion';

interface Props {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryNav = ({ categories, activeCategory, onSelect }: Props) => {
  return (
    <div className="py-4">
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6 pb-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="relative whitespace-nowrap px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-colors"
              style={{ color: isActive ? 'var(--accent-text)' : '#71717a' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 rounded-2xl -z-10 shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--accent)',
                    boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 25%, transparent)'
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
