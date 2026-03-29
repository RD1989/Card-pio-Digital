"use client";

import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
    { name: 'Depoimentos', href: '#depoimentos' },
    { name: 'Planos', href: '#planos' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="shrink-0 transition-transform group-hover:scale-110 duration-300 relative w-10 h-10">
              <Image src="/logo.png" alt="Menu Pro Logo" fill className="object-contain" />
            </div>
            <span className={`text-2xl font-black tracking-tighter ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>
              Menu <span className="text-amber-500">Pro</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-amber-500 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-amber-500 transition-colors"
            >
              Entrar
            </Link>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              Criar Conta Grátis
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-amber-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-base font-medium text-slate-600 hover:text-amber-500 py-2"
              >
                {link.name}
              </a>
            ))}
            <hr className="border-slate-100 my-2" />
            <Link 
              href="/login"
              className="text-base font-medium text-slate-600 hover:text-amber-500 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Entrar
            </Link>
            <Link 
              href="/register"
              className="w-full flex items-center justify-center h-12 rounded-full text-base font-bold bg-amber-500 text-slate-900 hover:bg-amber-400 transition-colors mt-2"
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
