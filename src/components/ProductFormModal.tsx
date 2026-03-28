import { useState, useEffect } from 'react';
import { X, Save, Loader2, DollarSign, Tag, AlignLeft, Image as ImageIcon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';
import type { Product, Category } from '../types';
import { UpgradeModal } from './UpgradeModal';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  image_url: '',
  category_id: '',
  is_available: true,
  is_upsell: false,
};

export const ProductFormModal = ({ product, onClose, onSaved }: ProductFormModalProps) => {
  const { theme, accentColor } = useThemeStore();
  const isLight = theme === 'light';
  const [form, setForm] = useState({ ...emptyForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Preencher formulário quando editando
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        original_price: product.original_price ? String(product.original_price) : '',
        image_url: product.image_url || product.image || '',
        category_id: typeof product.category === 'object' ? String(product.category.id) : '',
        is_available: product.is_available,
        is_upsell: product.is_upsell ?? false,
      });
    }
  }, [product]);

  // Buscar categorias do lojista
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
        if (!product && response.data.length > 0) {
          setForm(f => ({ ...f, category_id: String(response.data[0].id) }));
        }
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(f => ({ ...f, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) { alert('Selecione uma categoria.'); return; }
    setLoading(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      image_url: form.image_url || null,
      category_id: parseInt(form.category_id),
      is_available: form.is_available,
      is_upsell: form.is_upsell,
    };

    try {
      let response;
      if (product?.id) {
        response = await api.patch(`/products/${product.id}`, payload);
      } else {
        response = await api.post('/products', payload);
      }
      onSaved(response.data);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err);
      const errorData = err?.response?.data;
      if (err?.response?.status === 403 && errorData?.error === 'PLAN_LIMIT_EXCEEDED') {
         setIsUpgradeModalOpen(true);
      } else {
         const message = errorData?.message || 'Erro ao salvar produto.';
         alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `w-full rounded-2xl py-3 pr-4 outline-none transition-colors border ${
    isLight 
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
      : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-600'
  }`;

  return (
    <>
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`rounded-3xl w-full max-w-lg shadow-2xl my-4 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isLight ? 'border-slate-200' : 'border-zinc-800'
          }`}>
            <h3 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                isLight 
                  ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' 
                  : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Nome */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Nome do Produto *
              </label>
              <div className="relative">
                <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Hambúrguer Artesanal"
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Descrição
              </label>
              <div className="relative">
                <AlignLeft className={`absolute left-4 top-4 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Ingredientes e diferenciais..."
                  rows={3}
                  className={`${inputClasses} pl-11 resize-none`}
                />
              </div>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Preço *
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0,00"
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Preço Original
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                  <input
                    type="number"
                    name="original_price"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={handleChange}
                    placeholder="Riscado"
                    className={`${inputClasses} pl-11`}
                  />
                </div>
              </div>
            </div>

            {/* URL da Imagem */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                URL da Imagem
              </label>
              <div className="relative">
                <ImageIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`} />
                <input
                  type="url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={`${inputClasses} pl-11`}
                />
              </div>
              {form.image_url && (
                <img 
                  src={form.image_url} 
                  alt="Preview" 
                  className={`w-full h-28 object-cover rounded-2xl mt-2 border ${
                    isLight ? 'border-slate-200' : 'border-zinc-800'
                  }`} 
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}>
                Categoria *
              </label>
              {loadingCats ? (
                <div className={`flex items-center gap-2 text-sm py-3 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando categorias...
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm py-2" style={{ color: accentColor }}>
                  ⚠️ Crie uma categoria antes de adicionar produtos.
                </p>
              ) : (
                <select
                  name="category_id"
                  required
                  value={form.category_id}
                  onChange={handleChange}
                  className={`${inputClasses} px-4 appearance-none cursor-pointer`}
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${form.is_available ? 'bg-emerald-500' : isLight ? 'bg-slate-300' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_available ? 'left-7' : 'left-1'}`} />
                </div>
                <span className={`text-sm ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>Disponível</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_upsell: !f.is_upsell }))}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ backgroundColor: form.is_upsell ? accentColor : isLight ? '#cbd5e1' : '#3f3f46' }}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_upsell ? 'left-7' : 'left-1'}`} />
                </div>
                <span className={`text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-zinc-300'}`}>
                  <Star className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  Upsell
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-2xl border transition-all ${
                  isLight 
                    ? 'border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300' 
                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingCats || categories.length === 0}
                className="flex-1 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-zinc-950"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
    <UpgradeModal 
      isOpen={isUpgradeModalOpen} 
      onClose={() => setIsUpgradeModalOpen(false)} 
    />
    </>
  );
};
