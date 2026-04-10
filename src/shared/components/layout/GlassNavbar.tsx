import { motion } from 'framer-motion';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useThemeStore } from '@/shared/stores/global/useThemeStore';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from '@/assets/logo.png';

const navLinks = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Como Funciona', href: '#how' },
  { label: 'Depoimentos', href: '#testimonials' },
  { label: 'Planos', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function GlassNavbar() {
  const { mode, toggle } = useThemeStore();
  const [open, setOpen] = useState(false);

  const scrollTo = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Menu Pro" className="h-16 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: 'hsl(var(--nav-foreground))' }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <button onClick={toggle} className="p-2 rounded-full hover:bg-card/10 transition-colors">
            {mode === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'hsl(var(--nav-foreground))' }} /> : <Moon className="w-4 h-4" style={{ color: 'hsl(var(--nav-foreground))' }} />}
          </button>
          <Link to="/login" className="text-xs font-medium" style={{ color: 'hsl(var(--nav-foreground))' }}>
            Entrar
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Criar Conta Grátis →
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <button onClick={toggle} className="p-2 rounded-full hover:bg-card/10 transition-colors">
            {mode === 'dark' ? <Sun className="w-4 h-4" style={{ color: 'hsl(var(--nav-foreground))' }} /> : <Moon className="w-4 h-4" style={{ color: 'hsl(var(--nav-foreground))' }} />}
          </button>
          <button onClick={() => setOpen(!open)} className="p-2" style={{ color: 'hsl(var(--nav-foreground))' }}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="lg:hidden glass-nav px-6 pb-4 flex flex-col gap-2"
        >
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="text-sm py-2 text-left opacity-80 hover:opacity-100"
              style={{ color: 'hsl(var(--nav-foreground))' }}
            >
              {link.label}
            </button>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="text-sm py-2" style={{ color: 'hsl(var(--nav-foreground))' }}>Entrar</Link>
          <Link to="/register" onClick={() => setOpen(false)} className="text-sm py-2 text-primary font-bold">Criar Conta Grátis</Link>
        </motion.div>
      )}
    </motion.nav>
  );
}

