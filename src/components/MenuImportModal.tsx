import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, FileText, Image as ImageIcon, Loader2, Check, Trash2,
  Sparkles, AlertTriangle, ChevronDown, Package, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';
import type { Category } from '../types';

interface ExtractedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category_name: string;
  selected: boolean;
}

interface MenuImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'processing' | 'review' | 'importing' | 'done' | 'error';

export const MenuImportModal = ({ onClose, onImported }: MenuImportModalProps) => {
  const { theme, accentColor } = useThemeStore();
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [importCount, setImportCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Buscar categorias existentes
  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (f: File): string | null => {
    if (!acceptedTypes.includes(f.type)) {
      return 'Formato não suportado. Use JPG, PNG ou PDF.';
    }
    if (f.size > maxSize) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
    setError('');

    // Preview para imagens
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const processWithAI = async () => {
    if (!file) return;
    setStep('processing');
    setProgress(0);
    setError('');

    // Simular progresso visual
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8, 90));
    }, 500);

    try {
      const formData = new FormData();
      formData.append('menu_file', file);

      const response = await api.post('/products/import-menu', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout
      });

      clearInterval(progressInterval);
      setProgress(100);

      const extracted: ExtractedProduct[] = (response.data.products || []).map(
        (p: { name: string; description: string; price: number; category?: string }, idx: number) => ({
          id: `imported-${idx}`,
          name: p.name || '',
          description: p.description || '',
          price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
          category_name: p.category || 'Geral',
          selected: true,
        })
      );

      if (extracted.length === 0) {
        setStep('error');
        setError('A IA não conseguiu identificar produtos neste arquivo. Tente com uma imagem mais nítida ou um PDF legível.');
        return;
      }

      setProducts(extracted);
      setTimeout(() => setStep('review'), 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message 
        || 'Erro ao processar o arquivo. Verifique se o backend está configurado com a API de IA.';
      setError(msg);
      setStep('error');
    }
  };

  const updateProduct = (id: string, field: keyof ExtractedProduct, value: string | number | boolean) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleSelect = (id: string) => {
    updateProduct(id, 'selected', !products.find(p => p.id === id)?.selected);
  };

  const toggleAll = () => {
    const allSelected = products.every(p => p.selected);
    setProducts(prev => prev.map(p => ({ ...p, selected: !allSelected })));
  };

  const importProducts = async () => {
    const selected = products.filter(p => p.selected);
    if (selected.length === 0) return;

    setStep('importing');
    setProgress(0);
    let imported = 0;

    // Para cada produto, encontrar ou criar categoria e criar o produto
    const categoryMap = new Map<string, number>();

    // Cache das categorias existentes
    for (const cat of categories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    for (const product of selected) {
      try {
        // Encontrar ou criar categoria
        let categoryId = categoryMap.get(product.category_name.toLowerCase());
        if (!categoryId) {
          try {
            const catRes = await api.post('/categories', { name: product.category_name });
            const newId: number = catRes.data.id;
            categoryId = newId;
            categoryMap.set(product.category_name.toLowerCase(), newId);
          } catch {
            // Se falhar ao criar, usa a primeira categoria disponível
            categoryId = categories[0]?.id || 1;
          }
        }

        await api.post('/products', {
          name: product.name,
          description: product.description || null,
          price: product.price,
          category_id: categoryId,
          is_available: true,
          is_upsell: false,
        });

        imported++;
        setProgress((imported / selected.length) * 100);
      } catch (err) {
        console.error(`Erro ao importar "${product.name}":`, err);
      }
    }

    setImportCount(imported);
    setStep('done');
    onImported();
  };

  const selectedCount = products.filter(p => p.selected).length;

  // ═══ Render helpers ═══
  const cardClasses = `rounded-3xl border ${
    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'
  }`;

  const inputClasses = `w-full rounded-xl py-2 px-3 text-sm outline-none border ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
      : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-600'
  }`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && step !== 'processing' && step !== 'importing' && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`${cardClasses} w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl`}
        >
          {/* ═══ Header ═══ */}
          <div className={`flex items-center justify-between p-6 border-b shrink-0 ${
            isLight ? 'border-slate-200' : 'border-zinc-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}18` }}>
                <Wand2 className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Importar Cardápio com IA
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Envie seu menu em PDF ou imagem e a IA extrai automaticamente
                </p>
              </div>
            </div>
            {step !== 'processing' && step !== 'importing' && (
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* ═══ Content ═══ */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">

              {/* ── Step: Upload ── */}
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'scale-[1.02]'
                        : file
                          ? isLight ? 'border-slate-300 bg-slate-50' : 'border-zinc-700 bg-zinc-950'
                          : isLight ? 'border-slate-300 bg-slate-50 hover:border-slate-400' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                    }`}
                    style={isDragging ? { borderColor: accentColor, backgroundColor: `${accentColor}08` } : {}}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {file ? (
                      <div className="flex flex-col items-center gap-4">
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="max-h-48 rounded-2xl border shadow-lg object-contain"
                            style={{ borderColor: isLight ? '#d1d5db' : '#3f3f46' }}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" 
                            style={{ backgroundColor: `${accentColor}18` }}>
                            <FileText className="w-10 h-10" style={{ color: accentColor }} />
                          </div>
                        )}
                        <div>
                          <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {file.name}
                          </p>
                          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `${accentColor}12` }}>
                          <Upload className="w-8 h-8" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            Arraste seu cardápio aqui
                          </p>
                          <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                            ou clique para selecionar
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                            isLight ? 'bg-slate-100 text-slate-500' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            <ImageIcon className="w-3.5 h-3.5" /> JPG / PNG
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                            isLight ? 'bg-slate-100 text-slate-500' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* How it works */}
                  <div className={`rounded-2xl p-5 border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
                  }`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                      isLight ? 'text-slate-500' : 'text-zinc-500'
                    }`}>
                      Como funciona
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Upload, text: 'Envie foto ou PDF do seu cardápio antigo' },
                        { icon: Sparkles, text: 'A IA lê e extrai produtos, descrições e preços' },
                        { icon: Package, text: 'Revise, ajuste e importe tudo de uma vez' },
                      ].map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                            style={{ backgroundColor: `${accentColor}12` }}>
                            <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                          </div>
                          <p className={`text-[11px] leading-tight ${
                            isLight ? 'text-slate-600' : 'text-zinc-400'
                          }`}>
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step: Processing ── */}
              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-t-transparent mb-6"
                    style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
                  />
                  <h4 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Analisando cardápio...
                  </h4>
                  <p className={`text-sm mb-6 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    A IA está lendo o seu menu e identificando os produtos
                  </p>
                  
                  {/* Progress bar */}
                  <div className={`w-64 h-2 rounded-full overflow-hidden ${
                    isLight ? 'bg-slate-200' : 'bg-zinc-800'
                  }`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accentColor }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className={`text-xs mt-2 font-mono ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
                    {Math.round(progress)}%
                  </p>
                </motion.div>
              )}

              {/* ── Step: Review ── */}
              {step === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                      </h4>
                      <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                        Revise e ajuste antes de importar. Produtos sem foto serão importados sem imagem.
                      </p>
                    </div>
                    <button
                      onClick={toggleAll}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {products.every(p => p.selected) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>

                  {/* Products List */}
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {products.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`rounded-2xl p-4 border transition-all ${
                          product.selected
                            ? isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
                            : isLight ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-zinc-950 border-zinc-800 opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelect(product.id)}
                            className="mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                            style={product.selected ? {
                              backgroundColor: accentColor,
                              borderColor: accentColor
                            } : {
                              borderColor: isLight ? '#d1d5db' : '#52525b'
                            }}
                          >
                            {product.selected && <Check className="w-3 h-3 text-zinc-950" />}
                          </button>

                          <div className="flex-1 space-y-2 min-w-0">
                            {/* Nome + Preço */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={product.name}
                                onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                className={`${inputClasses} flex-1 font-bold`}
                                placeholder="Nome do produto"
                              />
                              <div className="relative w-28 shrink-0">
                                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${
                                  isLight ? 'text-slate-400' : 'text-zinc-600'
                                }`}>R$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.price}
                                  onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                                  className={`${inputClasses} pl-9 text-right`}
                                />
                              </div>
                            </div>

                            {/* Descrição */}
                            <input
                              type="text"
                              value={product.description}
                              onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                              className={inputClasses}
                              placeholder="Descrição (opcional)"
                            />

                            {/* Categoria */}
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <select
                                  value={product.category_name}
                                  onChange={(e) => updateProduct(product.id, 'category_name', e.target.value)}
                                  className={`${inputClasses} appearance-none cursor-pointer pr-8`}
                                >
                                  {/* Categoria inferida pela IA */}
                                  {!categories.some(c => c.name.toLowerCase() === product.category_name.toLowerCase()) && (
                                    <option value={product.category_name}>
                                      ✨ {product.category_name} (nova)
                                    </option>
                                  )}
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                                  isLight ? 'text-slate-400' : 'text-zinc-600'
                                }`} />
                              </div>

                              <button
                                onClick={() => removeProduct(product.id)}
                                className={`p-2 rounded-lg transition-all shrink-0 ${
                                  isLight ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-zinc-600 hover:text-red-400 hover:bg-red-400/10'
                                }`}
                                title="Remover"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Step: Importing ── */}
              {step === 'importing' && (
                <motion.div
                  key="importing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: accentColor }} />
                  <h4 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Importando produtos...
                  </h4>
                  <div className={`w-48 h-2 rounded-full overflow-hidden mt-4 ${
                    isLight ? 'bg-slate-200' : 'bg-zinc-800'
                  }`}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accentColor }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    {Math.round(progress)}% concluído
                  </p>
                </motion.div>
              )}

              {/* ── Step: Done ── */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accentColor}18` }}
                  >
                    <Check className="w-8 h-8" style={{ color: accentColor }} />
                  </motion.div>
                  <h4 className={`text-2xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Importação concluída!
                  </h4>
                  <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    <span className="font-bold" style={{ color: accentColor }}>{importCount}</span> produto{importCount !== 1 ? 's' : ''} importado{importCount !== 1 ? 's' : ''} com sucesso.
                  </p>
                  <p className={`text-xs mt-2 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
                    Agora adicione fotos reais a cada produto!
                  </p>
                </motion.div>
              )}

              {/* ── Step: Error ── */}
              {step === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Ops! Algo deu errado
                  </h4>
                  <p className={`text-sm max-w-md ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══ Footer ═══ */}
          <div className={`p-6 border-t shrink-0 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
            {step === 'upload' && (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-2xl border transition-all ${
                    isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={processWithAI}
                  disabled={!file}
                  className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 text-zinc-950"
                  style={{ backgroundColor: file ? accentColor : undefined }}
                >
                  <Sparkles className="w-5 h-5" />
                  Analisar com IA
                </button>
              </div>
            )}

            {step === 'review' && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('upload'); setProducts([]); }}
                  className={`py-3 px-6 rounded-2xl border transition-all ${
                    isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Voltar
                </button>
                <button
                  onClick={importProducts}
                  disabled={selectedCount === 0}
                  className="flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 text-zinc-950"
                  style={{ backgroundColor: selectedCount > 0 ? accentColor : undefined }}
                >
                  <Package className="w-5 h-5" />
                  Importar {selectedCount} Produto{selectedCount !== 1 ? 's' : ''}
                </button>
              </div>
            )}

            {step === 'done' && (
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl font-bold transition-all active:scale-95 text-zinc-950"
                style={{ backgroundColor: accentColor }}
              >
                Fechar
              </button>
            )}

            {step === 'error' && (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-2xl border transition-all ${
                    isLight ? 'border-slate-200 text-slate-600' : 'border-zinc-800 text-zinc-400'
                  }`}
                >
                  Fechar
                </button>
                <button
                  onClick={() => { setStep('upload'); setError(''); }}
                  className="flex-1 py-3 rounded-2xl font-bold transition-all active:scale-95 text-zinc-950"
                  style={{ backgroundColor: accentColor }}
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
