import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingNavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Funcionalidades', href: '#funcionalidades' },
    { name: 'Como Funciona', href: '#como-funciona' },
    { name: 'Planos', href: '#planos' },
  ];

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 py-3 shadow-lg' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
              <Store className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Meu <span className="text-amber-500">Cardápio</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link 
              to="/register"
              className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              Criar Conta Grátis
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-zinc-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-b border-zinc-800 shadow-xl p-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-zinc-400 hover:text-white py-2"
              >
                {link.name}
              </a>
            ))}
            <hr className="border-zinc-800 my-2" />
            <Link 
              to="/login"
              className="text-base font-medium text-zinc-300 hover:text-white py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Entrar
            </Link>
            <Link 
              to="/register"
              className="w-full flex items-center justify-center h-12 rounded-full text-base font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Criar Conta Grátis
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
