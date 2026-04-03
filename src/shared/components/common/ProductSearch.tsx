import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function ProductSearch({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? 'text-primary' : 'text-muted-foreground'}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Buscar no cardápio..."
        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
