"use client";

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  EyeOff, 
  Eye, 
  TrendingUp, 
  Edit2,
  Trash2,
  Loader2,
  Wand2,
  Check,
  Globe,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { ProductFormModal } from '@/components/ProductFormModal';
import { CategoryManager } from '@/components/CategoryManager';
import { MenuImportModal } from '@/components/MenuImportModal';

export default function ProductManager() {
  const { theme, accentColor } = useThemeStore() as any;
  const isLight = theme === 'light';
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const { user, setUser } = useAuthStore() as any;
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  
  // Link & Slug Management
  const [copied, setCopied] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [newSlug, setNewSlug] = useState(user?.restaurant?.slug || '');
  const [updatingSlug, setUpdatingSlug] = useState(false);

  // Link for the public menu
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const menuLink = `${origin}/${user?.restaurant?.slug || 'seu-cardapio'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(menuLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSlug = async () => {
    if (!newSlug || newSlug === user?.restaurant?.slug) return;
    
    setUpdatingSlug(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ slug: newSlug })
        .eq('id', user?.restaurant?.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (setUser && user) {
        setUser({ ...user, restaurant: data });
      }
      setSlugModalOpen(false);
      alert('Link do cardápio atualizado com sucesso!');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao atualizar link.');
    } finally {
      setUpdatingSlug(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const restaurantId = user?.restaurant?.id;
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      // Filtra apenas produtos do restaurante do lojista logado
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaved = (savedProduct: Product) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id);
      if (exists) {
        return prev.map(p => p.id === savedProduct.id ? savedProduct : p);
      }
      return [savedProduct, ...prev];
    });
    fetchProducts(); // Refresh to get category relation if needed
  };

  const toggleAvailability = async (id: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', id);
        
      if (error) throw error;
      
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_available: !p.is_available } : p
      ));
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar disponibilidade.');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch {
      alert('Erro ao excluir produto.');
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof p.category === 'object' ? (p.category as any).name : '')
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {importOpen && (
        <MenuImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            fetchProducts();
            setImportOpen(false);
          }}
        />
      )}

      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-3xl font-serif mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Gerenciar Cardápio
            </h2>
            <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>
              Adicione pratos, gerencie estoque e destaques.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setImportOpen(true)}
              className={`font-bold py-3 px-5 rounded-2xl flex items-center gap-2 transition-all active:scale-95 border ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              Importar Menu
            </button>
            <button
              onClick={handleOpenNew}
              className="font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg text-zinc-950"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 4px 20px ${accentColor}30`
              }}
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>
          </div>
        </header>
  
        {/* Gestão de Link Direto */}
        <section className={`rounded-3xl p-5 border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
              <TrendingUp className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`}>
                Seu Link de Vendas
              </p>
              <p className={`font-mono text-sm font-bold truncate ${isLight ? 'text-slate-700' : 'text-zinc-300'}`}>
                {menuLink.replace('http://', '').replace('https://', '')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setSlugModalOpen(true)}
              className={`flex-1 md:flex-initial text-xs font-bold px-4 py-2.5 rounded-xl border transition-all ${
                isLight ? 'border-slate-200 hover:bg-slate-50 text-slate-600' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              Customizar Link
            </button>
            <button
              onClick={copyToClipboard}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md text-zinc-950"
              style={{ backgroundColor: accentColor }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copiado!
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" /> Copiar Link
                </>
              )}
            </button>
          </div>
        </section>

        {/* Gerenciador de Categorias */}
        <CategoryManager onCategoriesChange={fetchProducts} />

        {/* Busca */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-slate-400' : 'text-zinc-500'}`} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..."
            className={`w-full rounded-2xl py-3 pl-12 pr-4 outline-none border ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-900 focus:border-slate-300' 
                : 'bg-zinc-900 border-zinc-800 text-white focus:border-zinc-700'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contagem */}
        {!loading && products.length > 0 && (
          <p className={`text-sm ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: accentColor }} />
              <p className={isLight ? 'text-slate-500' : 'text-zinc-500'}>Carregando seu cardápio...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-20 border border-dashed rounded-3xl ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <p className={`mb-4 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    {products.length === 0 
                      ? 'Nenhum produto cadastrado ainda.' 
                      : 'Nenhum produto com esse filtro.'
                    }
                  </p>
                  {products.length === 0 && (
                    <button
                      onClick={handleOpenNew}
                      className="font-bold py-2 px-5 rounded-2xl text-sm text-zinc-950 transition-all"
                      style={{ backgroundColor: accentColor }}
                    >
                      + Adicionar primeiro produto
                    </button>
                  )}
                </motion.div>
              ) : (
                filtered.map((product) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className={`group rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all border ${
                      !product.is_available ? 'opacity-60 grayscale' : ''
                    } ${
                      isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto overflow-hidden">
                      {/* Imagem */}
                      <div className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border ${
                        isLight ? 'border-slate-200 bg-slate-50' : 'border-zinc-800 bg-zinc-950'
                      }`}>
                        {(product.image_url || (product as any).image) ? (
                          <img 
                            src={product.image_url || (product as any).image} 
                            className="w-full h-full object-cover" 
                            alt={product.name}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-2xl ${
                            isLight ? 'text-slate-300' : 'text-zinc-700'
                          }`}>🍽️</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`font-bold truncate max-w-full ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {product.name}
                          </h3>
                          {product.is_upsell && (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0"
                              style={{ 
                                backgroundColor: `${accentColor}18`,
                                color: accentColor
                              }}
                            >
                              <TrendingUp className="w-3 h-3" /> Upsell
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                          {product.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                          <span className="font-bold" style={{ color: accentColor }}>
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                          {product.original_price && (
                            <span className={`text-xs line-through ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
                              R$ {Number(product.original_price).toFixed(2)}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap ${
                            isLight ? 'text-slate-500 bg-slate-100' : 'text-zinc-600 bg-zinc-950'
                          }`}>
                            {typeof product.category === 'object' ? (product.category as any).name : 'Sem categoria'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className={`flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 ${
                      isLight ? 'border-slate-200/50' : 'border-zinc-800/50'
                    }`}>
                      <button 
                        onClick={() => toggleAvailability(product.id)}
                        className={`p-3 rounded-2xl transition-all ${
                          product.is_available 
                            ? isLight ? 'bg-slate-100 text-emerald-500 hover:bg-slate-200' : 'bg-zinc-950 text-emerald-500 hover:bg-zinc-800'
                            : isLight ? 'bg-slate-100 text-slate-400 hover:bg-slate-200' : 'bg-zinc-950 text-zinc-600 hover:bg-zinc-800'
                        }`}
                        title={product.is_available ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {product.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => handleEditProduct(product)}
                        className={`p-3 rounded-2xl transition-all ${
                          isLight 
                            ? 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200' 
                            : 'bg-zinc-950 text-zinc-500 hover:text-white hover:bg-zinc-800'
                        }`}
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className={`p-3 rounded-2xl transition-all ${
                          isLight 
                            ? 'bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50' 
                            : 'bg-zinc-950 text-zinc-500 hover:text-red-400 hover:bg-red-400/10'
                        }`}
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de Customização de Slug */}
      <AnimatePresence>
        {slugModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-3xl p-8 border shadow-2xl ${
                isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
                  <Globe className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Customizar URL
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Escolha o nome que aparece no final do seu link
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Seu link ficará assim:
                  </label>
                  <div className={`p-4 rounded-2xl border font-mono text-sm break-all ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}>
                    {origin.replace('http://', '').replace('https://', '')}/<span style={{ color: accentColor }}>{newSlug || 'seu-cardapio' }</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Novo apelido (Slug)
                  </label>
                  <input 
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="ex: minha-loja-top"
                    className={`w-full rounded-2xl py-3 px-4 outline-none border transition-all ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
                        : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700'
                    }`}
                  />
                </div>

                <div className={`p-4 rounded-2xl border flex gap-3 ${
                  isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                  <Settings className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="text-[10px] leading-relaxed text-amber-500 font-medium">
                    <span className="font-bold">Aviso:</span> Ao mudar este link, qualquer QR Code impresso ou link antigo compartilhado deixará de funcionar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSlugModalOpen(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                    isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateSlug}
                  disabled={updatingSlug || !newSlug || newSlug === user?.restaurant?.slug}
                  className="flex-1 py-4 rounded-2xl font-bold text-zinc-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {updatingSlug ? 'Salvando...' : 'Salvar Novo Link'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
