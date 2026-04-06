import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, GripVertical, Edit2, Trash2, Wand2, Upload, X, Package, Settings2, Info, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ModifiersManager } from '@/features/products/components/ModifiersManager';

type Category = Tables<'categories'>;
type Product = Tables<'products'>;

export default function Products() {
  const navigate = useNavigate();
  const { impersonatedUserId } = useImpersonateStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productIsUpsell, setProductIsUpsell] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);


  // Category form
  const [categoryName, setCategoryName] = useState('');

  // Modifiers
  const [modifiersProductId, setModifiersProductId] = useState<string | null>(null);
  const [modifiersUserId, setModifiersUserId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    console.log(`[Fetch Debug] Carregando para: ${userId} | Sessão: ${user.id}`);

    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId!).order('sort_order'),
      supabase.from('products').select('*').eq('user_id', userId!).order('sort_order'),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  }

  async function handleSaveCategory() {
    if (!categoryName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    const { error } = await supabase.from('categories').insert({
      name: categoryName.trim(),
      user_id: userId,
      sort_order: categories.length,
    });

    if (error) { toast.error('Erro ao criar categoria'); return; }
    toast.success('Categoria criada!');
    setCategoryName('');
    setShowCategoryModal(false);
    fetchData();
  }

  async function handleDeleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Categoria excluída');
    fetchData();
  }

  async function handleCategoryReorder(newOrder: Category[]) {
    setCategories(newOrder);
    const updates = newOrder.map((cat, i) =>
      supabase.from('categories').update({ sort_order: i }).eq('id', cat.id)
    );
    await Promise.all(updates);
  }

  function openProductModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductDesc(product.description || '');
      setProductPrice(String(product.price));
      setProductCategoryId(product.category_id || '');
      setProductIsUpsell(product.is_upsell);
      setProductImageUrl(product.image_url || '');
    } else {
      setEditingProduct(null);
      setProductName('');
      setProductDesc('');
      setProductPrice('');
      setProductCategoryId('');
      setProductIsUpsell(false);
      setProductImageUrl('');
    }
    setProductImage(null);
    setShowProductModal(true);
  }

  async function handleUploadImage(): Promise<string | null> {
    if (!productImage) return productImageUrl || null;
    let userId = impersonatedUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    const ext = productImage.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, productImage);
    if (error) { toast.error('Erro no upload'); return null; }

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSaveProduct() {
    if (!productName.trim() || !productPrice) { toast.error('Preencha nome e preço'); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    const imageUrl = await handleUploadImage();

    const payload = {
      name: productName.trim(),
      description: productDesc.trim() || null,
      price: parseFloat(productPrice),
      category_id: productCategoryId || null,
      is_upsell: productIsUpsell,
      image_url: imageUrl,
      user_id: userId,
      restaurant_id: userId,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return; }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, sort_order: products.length });
      if (error) { toast.error('Erro ao criar'); setSaving(false); return; }
      toast.success('Produto criado!');
    }

    setSaving(false);
    setShowProductModal(false);
    fetchData();
  }

  async function handleToggleAvailable(id: string, current: boolean) {
    const { error } = await supabase.from('products').update({ is_available: !current }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar disponibilidade'); return; }
    toast.success(current ? 'Produto marcado como esgotado' : 'Produto disponível');
    fetchData();
  }

  async function handleDeleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Produto excluído');
    fetchData();
  }

  async function handleGenerateAI() {
    if (!productName.trim()) { toast.error('Digite o nome do produto primeiro'); return; }
    setGeneratingAI(true);
    try {
      console.log(`[AI Debug] Gerando descrição para: ${productName.trim()}`);
      
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: { productName: productName.trim() },
      });
      
      if (error) {
        console.error('[AI Error] Invoke error:', error);
        let erroMsg = error.message || 'Erro de comunicação de IA';
        try {
          if (error.context) {
            const resp = await error.context.json();
            if (resp && resp.error) erroMsg = resp.error;
          }
        } catch(e) {}
        throw new Error(erroMsg);
      }
      
      if (data?.error) {
        console.error('[AI Error] Data error:', data.error);
        throw new Error(data.error);
      }

      if (data?.description) {
        setProductDesc(data.description);
        toast.success('Descrição gerada com IA!');
      } else {
        throw new Error('A IA não retornou uma descrição válida.');
      }
    } catch (e: any) {
      console.error('[AI Exception]:', e);
      toast.error(e.message || 'Erro ao gerar descrição');
    } finally {
      setGeneratingAI(false);
    }
  }



  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize seu cardápio digital</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button onClick={() => navigate('/admin/menu-import')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <FileText className="w-4 h-4" /> Importar Cardápio (PDF/Imagem)
          </Button>
          <Button onClick={() => openProductModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Categorias</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryModal(true)} className="gap-2">
            <Plus className="w-3 h-3" /> Categoria
          </Button>
        </div>

        {categories.length === 0 ? (
          <div className="glass-sm p-8 text-center text-muted-foreground">
            Nenhuma categoria criada ainda
          </div>
        ) : (
          <Reorder.Group axis="y" values={categories} onReorder={handleCategoryReorder} className="space-y-2">
            {categories.map((cat) => (
              <Reorder.Item key={cat.id} value={cat}>
                <motion.div
                  layout
                  className={`glass-sm px-4 py-3 flex items-center gap-3 cursor-grab active:cursor-grabbing group ${
                    selectedCategory === cat.id ? 'ring-2 ring-primary/50' : ''
                  }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="flex-1 font-medium text-sm">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {products.filter(p => p.category_id === cat.id).length} itens
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Products Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Produtos {selectedCategory && `• ${categories.find(c => c.id === selectedCategory)?.name}`}
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="glass-sm p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Package className="w-10 h-10 opacity-40" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-sm overflow-hidden group hover:scale-[1.02] transition-transform"
                >
                  {product.image_url ? (
                    <div className="h-40 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-40 bg-muted flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                          {!product.is_available && (
                            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                        )}
                      </div>
                      <span className="text-primary font-bold text-sm whitespace-nowrap ml-2">
                        R$ {Number(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.is_upsell && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Upsell
                        </span>
                      )}
                      {!product.is_active && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-border/50">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleAvailable(product.id, product.is_available)} 
                        className={`flex-1 gap-1 h-8 text-[10px] sm:text-xs ${product.is_available ? 'text-muted-foreground' : 'text-red-500 font-bold bg-red-500/10'}`}>
                        {product.is_available ? 'Esgotar' : 'Tornar Disp.'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openProductModal(product)} className="flex-1 gap-1 h-8 text-xs">
                        <Edit2 className="w-3 h-3" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setModifiersProductId(product.id); setModifiersUserId(product.user_id); }} className="flex-1 gap-1 h-8 text-xs text-primary">
                        <Settings2 className="w-3 h-3" /> Adicionais
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-lg glass-sm border-border">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os detalhes do produto abaixo para salvar no seu cardápio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome</Label>
              <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Ex: X-Burguer Especial" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Descrição</Label>
                <button
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                  className="flex items-center gap-1.5 text-xs text-purple-500 hover:text-purple-400 transition-colors disabled:opacity-50"
                >
                  <motion.div animate={generatingAI ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}>
                    <Wand2 className="w-3.5 h-3.5" />
                  </motion.div>
                  {generatingAI ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>
              <Textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} placeholder="Descrição do produto..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={productCategoryId} onValueChange={setProductCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Imagem</Label>
              {(productImageUrl || productImage) && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden mt-1 mb-2">
                  <img
                    src={productImage ? URL.createObjectURL(productImage) : productImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => { setProductImage(null); setProductImageUrl(''); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-1">
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mr-auto">Upload de imagem do produto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setProductImage(f);
                  }} />
                </label>
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>
                    <strong>Tamanho ideal:</strong> 600x600px a 1000x1000px (proporção quadrada). 
                    <br className="hidden sm:block"/>Máximo recomendado: 2MB. Use JPG, PNG ou WEBP.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={productIsUpsell} onCheckedChange={setProductIsUpsell} />
              <Label className="cursor-pointer">É Produto Upsell?</Label>
            </div>
            <Button onClick={handleSaveProduct} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar Produto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-sm glass-sm border-border">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription className="sr-only">
              Crie uma nova categoria para organizar seus produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome</Label>
              <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Ex: Hamburguers" />
            </div>
            <Button onClick={handleSaveCategory} className="w-full">Criar Categoria</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modifiers Manager */}
      {modifiersProductId && (
        <ModifiersManager
          productId={modifiersProductId}
          userId={modifiersUserId}
          open={!!modifiersProductId}
          onOpenChange={(open) => { if (!open) setModifiersProductId(null); }}
        />
      )}
    </div>
  );
}



