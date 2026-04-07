import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Layout, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickLinks = React.memo(() => {
  const links = [
    { 
      title: 'Configurações Globais', 
      desc: 'API OpenRouter, Pix', 
      icon: Settings, 
      href: '/super-admin/settings', 
      color: 'text-violet-500', 
      bg: 'bg-violet-500/10' 
    },
    { 
      title: 'Customizar Landing', 
      desc: 'Planos, textos, CTA', 
      icon: Layout, 
      href: '/super-admin/landing', 
      color: 'text-sky-500', 
      bg: 'bg-sky-500/10' 
    },
    { 
      title: 'Gerenciar Lojistas', 
      desc: 'Acessar, impersonar, suporte', 
      icon: Store, 
      href: '/super-admin/tenants', 
      color: 'text-primary', 
      bg: 'bg-primary/10' 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {links.map((link, i) => (
        <motion.div
          key={link.href}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.1 }}
        >
          <Link
            to={link.href}
            className="flex items-center gap-4 sm:flex-col sm:items-start glass-sm p-4 sm:p-5 hover:translate-y-[-4px] transition-all group rounded-2xl border-white/40"
          >
            <div className={`w-10 h-10 rounded-2xl ${link.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
              <link.icon className={`w-5 h-5 ${link.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">{link.title}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{link.desc}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
});

QuickLinks.displayName = 'QuickLinks';
