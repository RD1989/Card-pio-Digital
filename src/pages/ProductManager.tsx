import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  EyeOff, 
  Eye, 
  TrendingUp, 
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import type { Product } from '../types';
import { ProductFormModal } from '../components/ProductFormModal';

export const ProductManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
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
      return [...prev, savedProduct];
    });
  };

  const toggleAvailability = async (id: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      await api.patch(`/products/${id}`, { is_available: !product.is_available });
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_available: !p.is_available } : p
      ));
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar disponibilidade. Recarregue a página.');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch {
      alert('Erro ao excluir produto.');
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof p.category === 'object' ? p.category.name : p.category || '')
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

      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-white mb-2">Gerenciar Cardápio</h2>
            <p className="text-zinc-500">Adicione pratos, gerencie estoque e destaques.</p>
          </div>
          <button
            onClick={handleOpenNew}
            className="bg-amber-500 text-zinc-950 font-bold py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        </header>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou categoria..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contagem */}
        {!loading && products.length > 0 && (
          <p className="text-zinc-600 text-sm">
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-500" />
              <p>Carregando seu cardápio...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl"
                >
                  <p className="text-zinc-500 mb-4">
                    {products.length === 0 
                      ? 'Nenhum produto cadastrado ainda.' 
                      : 'Nenhum produto com esse filtro.'
                    }
                  </p>
                  {products.length === 0 && (
                    <button
                      onClick={handleOpenNew}
                      className="bg-amber-500 text-zinc-950 font-bold py-2 px-5 rounded-2xl text-sm hover:bg-amber-400 transition-all"
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
                    className={`group bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all ${!product.is_available ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                      {/* Imagem */}
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                        {(product.image_url || product.image) ? (
                          <img 
                            src={product.image_url || product.image} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700 text-2xl">🍽️</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-white truncate max-w-full">{product.name}</h3>
                          {product.is_upsell && (
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                              <TrendingUp className="w-3 h-3" /> Upsell
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-500 text-sm truncate">{product.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                          <span className="text-amber-500 font-bold">R$ {Number(product.price).toFixed(2)}</span>
                          {product.original_price && (
                            <span className="text-zinc-600 text-xs line-through">R$ {Number(product.original_price).toFixed(2)}</span>
                          )}
                          <span className="text-zinc-600 text-xs px-2 py-1 bg-zinc-950 rounded-lg whitespace-nowrap">
                            {typeof product.category === 'object' ? product.category.name : product.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-800/50 sm:border-0">
                      <button 
                        onClick={() => toggleAvailability(product.id)}
                        className={`p-3 rounded-2xl transition-all ${product.is_available ? 'bg-zinc-950 text-emerald-500 hover:bg-zinc-800' : 'bg-zinc-950 text-zinc-600 hover:bg-zinc-800'}`}
                        title={product.is_available ? 'Clique para desativar' : 'Clique para ativar'}
                      >
                        {product.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-3 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-white hover:bg-zinc-800 transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>

                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-3 bg-zinc-950 text-zinc-500 rounded-2xl hover:text-red-400 hover:bg-red-400/10 transition-all"
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
    </>
  );
};
