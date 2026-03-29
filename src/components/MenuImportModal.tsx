"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, FileText, Image as ImageIcon, Loader2, Check, Trash2,
  Sparkles, AlertTriangle, ChevronDown, Package, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

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

export function MenuImportModal({ onClose, onImported }: MenuImportModalProps) {
  const { theme, accentColor } = useThemeStore() as any;
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

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024;

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

    if (file.type === 'application/pdf') {
      setError('PDFs não são suportados. Envie uma imagem (JPG ou PNG).');
      return;
    }

    setStep('processing');
    setProgress(0);
    setError('');

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 6, 88));
    }, 600);

    let watchdogFired = false;
    const watchdog = setTimeout(() => {
      watchdogFired = true;
      clearInterval(progressInterval);
      setError('Tempo limite excedido. Servidor muito lento.');
      setStep('error');
    }, 150000);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });

      const base64 = await base64Promise;

      const res = await fetch('/api/ai/menu-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          prompt: 'Extraia produtos do cardápio: nome, descrição e preço. Formato JSON: {"products": [{"name": "P1", "description": "D1", "price": 10.5, "category": "Lanches"}]}'
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to process AI import');
      }

      const data = await res.json();

      if (watchdogFired) return;
      clearTimeout(watchdog);
      clearInterval(progressInterval);
      setProgress(100);

      const extracted: ExtractedProduct[] = (data.products || []).map(
        (p: any, idx: number) => ({
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
        setError('Nenhum produto identificado.');
        return;
      }

      setProducts(extracted);
      setTimeout(() => setStep('review'), 500);
    } catch (err: any) {
      if (watchdogFired) return;
      clearTimeout(watchdog);
      clearInterval(progressInterval);

      setError(err.message || 'Erro ao processar imagem.');
      setStep('error');
    }
  };

  const updateProduct = (id: string, field: keyof ExtractedProduct, value: string | number | boolean) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
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

    const categoryMap = new Map<string, number>();
    for (const cat of categories) {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    }

    for (const product of selected) {
      try {
        let categoryId = categoryMap.get(product.category_name.toLowerCase());
        if (!categoryId) {
          try {
            const { data } = await supabase.from('categories').insert([{ name: product.category_name, sort_order: categories.length }]).select().single();
            if (data) {
              categoryId = data.id;
              categoryMap.set(product.category_name.toLowerCase(), data.id);
            }
          } catch {
            categoryId = categories[0]?.id;
          }
        }

        await supabase.from('products').insert([{
          name: product.name,
          description: product.description || null,
          price: product.price,
          category_id: categoryId,
          is_available: true,
          is_upsell: false,
        }]);

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
  const cardClasses = `rounded-3xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`;
  const inputClasses = `w-full rounded-xl py-2 px-3 text-sm outline-none border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-600'}`;

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
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}18` }}>
                <Wand2 className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Importar Cardápio com IA
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  Envie seu menu em imagem e a IA extrai automaticamente
                </p>
              </div>
            </div>
            {step !== 'processing' && step !== 'importing' && (
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-zinc-500 hover:bg-zinc-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                      isDragging ? 'scale-[1.02]' : file ? isLight ? 'border-slate-300 bg-slate-50' : 'border-zinc-700 bg-zinc-950' : isLight ? 'border-slate-300 bg-slate-50 hover:border-slate-400' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-600'
                    }`}
                    style={isDragging ? { borderColor: accentColor, backgroundColor: `${accentColor}08` } : {}}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {file ? (
                      <div className="flex flex-col items-center gap-4">
                        {filePreview ? (
                          <img src={filePreview} className="max-h-48 rounded-2xl border shadow-lg object-contain" style={{ borderColor: isLight ? '#d1d5db' : '#3f3f46' }} />
                        ) : null}
                        <div>
                          <p className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{file.name}</p>
                          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}> Clique para trocar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <Upload className="w-8 h-8" style={{ color: accentColor }} />
                        <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Arraste foto do cardápio aqui</p>
                        <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>Somente Imagens</p>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: accentColor }} />
                  <h4 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Analisando com IA...</h4>
                  <div className={`mt-4 w-64 h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-zinc-800'}`}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: accentColor }} animate={{ width: `${progress}%` }} />
                  </div>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{products.length} encontrados</h4>
                    <button onClick={toggleAll} className="text-xs font-bold p-2 bg-zinc-800 rounded">Selecionar Todos</button>
                  </div>
                  <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                    {products.map(product => (
                      <div key={product.id} className={`p-4 border rounded-2xl flex gap-3 ${product.selected ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950 opacity-50'}`}>
                        <button onClick={() => toggleSelect(product.id)} className="w-5 h-5 border-2 mt-1 rounded">
                          {product.selected && <Check className="w-4 h-4" color={accentColor} />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <input value={product.name} onChange={e => updateProduct(product.id, 'name', e.target.value)} className={inputClasses} />
                            <input type="number" step="0.01" value={product.price} onChange={e => updateProduct(product.id, 'price', e.target.value)} className={`${inputClasses} w-24 text-right`} />
                          </div>
                          <input value={product.description} onChange={e => updateProduct(product.id, 'description', e.target.value)} className={inputClasses} placeholder="Descrição" />
                          <div className="flex gap-2">
                            <input value={product.category_name} onChange={e => updateProduct(product.id, 'category_name', e.target.value)} className={inputClasses} />
                            <button onClick={() => removeProduct(product.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'importing' && (
                <motion.div key="importing" className="flex flex-col items-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin" color={accentColor} />
                  <p className="mt-4">Importando...</p>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div key="done" className="py-16 text-center">
                  <Check className="w-16 h-16 mx-auto mb-4" color={accentColor} />
                  <h4 className="font-bold text-2xl">{importCount} produtos importados!</h4>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className={`p-6 border-t shrink-0 ${isLight ? 'border-slate-200' : 'border-zinc-800'}`}>
            {step === 'upload' && (
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 p-3 border rounded-xl">Cancelar</button>
                <button onClick={processWithAI} disabled={!file} className="flex-1 p-3 rounded-xl text-black font-bold" style={{ backgroundColor: file ? accentColor : undefined }}>Analisar</button>
              </div>
            )}
            {step === 'review' && (
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="p-3 border rounded-xl px-6">Voltar</button>
                <button onClick={importProducts} className="flex-1 p-3 rounded-xl font-bold text-black" style={{ backgroundColor: accentColor }}>Importar</button>
              </div>
            )}
            {step === 'done' && <button onClick={onClose} className="w-full p-3 rounded-xl font-bold text-black" style={{ backgroundColor: accentColor }}>Fechar</button>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
