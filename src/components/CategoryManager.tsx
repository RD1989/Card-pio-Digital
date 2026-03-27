import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, X, Loader2 } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import api from '../services/api';
import type { Category } from '../types';

interface Props {
  onCategoriesChange?: () => void;
}

export const CategoryManager = ({ onCategoriesChange }: Props) => {
  const { theme, accentColor } = useThemeStore();
  const isLight = theme === 'light';
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.post('/categories', { name: newName.trim() });
      setNewName('');
      await fetchCategories();
      onCategoriesChange?.();
    } catch {
      alert('Erro ao criar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api.put(`/categories/${id}`, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      await fetchCategories();
      onCategoriesChange?.();
    } catch {
      alert('Erro ao atualizar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta categoria? Produtos associados serão removidos.')) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
      onCategoriesChange?.();
    } catch {
      alert('Erro ao excluir categoria.');
    }
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm py-4 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando categorias...
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-6 space-y-4 border ${
      isLight ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'
    }`}>
      <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Categorias</h3>

      {/* Lista de categorias */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {editingId === cat.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`flex-1 rounded-xl px-3 py-1.5 text-sm outline-none border ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900' 
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                  style={{ borderColor: editName ? undefined : accentColor }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                  autoFocus
                />
                <button onClick={() => handleUpdate(cat.id)} disabled={saving} className="text-emerald-400 hover:text-emerald-300">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className={`${isLight ? 'text-slate-400 hover:text-slate-900' : 'text-zinc-500 hover:text-white'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>{cat.name}</span>
                  {cat.products_count !== undefined && (
                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>{cat.products_count} produtos</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => startEditing(cat)} 
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: isLight ? '#94a3b8' : '#71717a' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                    onMouseLeave={(e) => e.currentTarget.style.color = isLight ? '#94a3b8' : '#71717a'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-400 hover:text-red-500' : 'text-zinc-500 hover:text-red-500'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <p className={`text-sm text-center py-4 ${isLight ? 'text-slate-400' : 'text-zinc-600'}`}>
            Nenhuma categoria criada. Crie uma abaixo para começar a adicionar produtos.
          </p>
        )}
      </div>

      {/* Nova categoria */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria..."
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all border ${
            isLight 
              ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-300' 
              : 'bg-zinc-950 border-zinc-800 text-white focus:border-zinc-600'
          }`}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={saving || !newName.trim()}
          className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 text-zinc-950"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4" />
          Criar
        </button>
      </div>
    </div>
  );
};
