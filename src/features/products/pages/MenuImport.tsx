import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, Sparkles, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface ExtractedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  selected: boolean;
}

export default function MenuImport() {
  const { impersonatedUserId } = useImpersonateStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(f.type)) {
      toast.error('Envie um arquivo PDF, PNG ou JPEG');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setFile(f);
    setProducts([]);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);

    try {
      // 1. Get OpenRouter config from global_settings
      const { data: settings, error: configError } = await supabase
        .from('global_settings')
        .select('key, value')
        .in('key', ['openrouter_api_key', 'openrouter_model']);

      if (configError) throw new Error('Erro ao carregar configurações de IA: ' + configError.message);

      const settingsMap: Record<string, string> = {};
      settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

      const apiKey = settingsMap['openrouter_api_key'];
      const model = settingsMap['openrouter_model'] || 'google/gemini-2.0-flash-001';

      if (!apiKey) {
        throw new Error('Chave da API OpenRouter não configurada. Configure no Painel Admin.');
      }

      // 2. Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // 3. Prompt logic
      const systemPrompt = `Você é um assistente especializado em extrair informações de cardápios de restaurantes (imagens e PDFs).
Retorne APENAS um JSON válido:
{
  "products": [
    {
      "name": "Nome",
      "description": "Descrição",
      "price": 12.90,
      "category": "Categoria"
    }
  ]
}`;

      const userMessage = {
        role: "user",
        content: [
          { type: "text", text: "Extraia todos os produtos deste cardápio:" },
          {
            type: "image_url",
            image_url: { url: `data:${file.type};base64,${base64}` }
          }
        ]
      };

      // 4. Call OpenRouter Directly (Bypass Edge Function 401/403)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Menu Pro AI Import",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: systemPrompt }, userMessage],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API de IA (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      
      const parsed = JSON.parse(content);
      
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products.map((p: any) => ({
          name: p.name || '',
          description: p.description || '',
          price: Number(p.price) || 0,
          category: p.category || 'Sem categoria',
          selected: true,
        })));
        toast.success(`${parsed.products.length} produtos encontrados!`);
      } else {
        toast.error('Nenhum produto encontrado no cardápio');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar o cardápio.');
    } finally {
      setExtracting(false);
    }
  }

  async function handleImport() {
    const selected = products.filter(p => p.selected);
    if (selected.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    setImporting(true);
    try {
      // 1. Obter o usuário da sessão real e verificar se é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        setImporting(false); 
        return; 
      }

      // Verificação RPC para decidir qual ID usar com base no privilégio
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      
      // Decisão Final do ID (Sessão REAL vs Personificação)
      let userId = user.id;
      if (isSuperAdmin && impersonatedUserId) {
        console.log(`[Admin Import] Usando ID personificado: ${impersonatedUserId}`);
        userId = impersonatedUserId;
      } else {
        console.log(`[Lojista Import] Usando ID da Sessão: ${user.id}`);
      }

      console.log(`[Import Debug] Gravando para: ${userId} | Sessão: ${user.id}`);

      // 1. Get or create categories
      const categoryNames = [...new Set(selected.map(p => p.category))];
      console.log('Categorias a processar:', categoryNames);

      const { data: existingCats, error: fetchCatsError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId);

      if (fetchCatsError) {
        console.error('Erro ao buscar categorias existentes:', fetchCatsError);
        throw new Error(`Erro ao buscar categorias: ${fetchCatsError.message}`);
      }

      const categoryMap: Record<string, string> = {};
      for (const cat of existingCats || []) {
        categoryMap[cat.name.trim().toLowerCase()] = cat.id;
      }

      // Create missing categories
      for (const catName of categoryNames) {
        const normalizedName = catName.trim().toLowerCase();
        if (!categoryMap[normalizedName]) {
          console.log(`Criando nova categoria: ${catName}`);
          const { data: newCat, error: createCatError } = await supabase
            .from('categories')
            .insert({ 
              name: catName.trim(), 
              user_id: userId, 
              sort_order: Object.keys(categoryMap).length 
            })
            .select('id')
            .single();
          
          if (createCatError) {
            console.error(`Erro ao criar categoria ${catName}:`, createCatError);
            // Continuamos mesmo se falhar uma categoria, o produto ficará sem categoria
          } else if (newCat) {
            categoryMap[normalizedName] = newCat.id;
            console.log(`Categoria ${catName} criada com ID: ${newCat.id}`);
          }
        }
      }

      // 2. Prepare and Insert products
      const inserts = selected.map((p, i) => {
        const catId = categoryMap[p.category.trim().toLowerCase()] || null;
        return {
          name: p.name.substring(0, 100), // Limite de tamanho comum
          description: p.description ? p.description.substring(0, 500) : null,
          price: Number(p.price) || 0,
          category_id: catId,
          user_id: userId,
          restaurant_id: userId,
          sort_order: i,
          is_active: true,
          is_available: true
        };
      });

      console.log('Inserindo produtos:', inserts);

      const { error: insertError } = await supabase.from('products').insert(inserts);
      
      if (insertError) {
        console.error('Erro detalhado na inserção de produtos:', insertError);
        throw new Error(`Erro ao salvar produtos: ${insertError.message}`);
      }

      toast.success(`${selected.length} produtos importados com sucesso!`, {
        description: 'Seu cardápio foi atualizado.',
        duration: 5000
      });
      
      setProducts([]);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error('Falha crítica na importação:', err);
      toast.error('Erro na importação', {
        description: err.message || 'Verifique o console para mais detalhes.'
      });
    } finally {
      setImporting(false);
    }
  }

  function toggleProduct(index: number) {
    setProducts(prev =>
      prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p)
    );
  }

  const selectedCount = products.filter(p => p.selected).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Importar Cardápio com IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Envie uma foto ou PDF do seu cardápio e a IA extrairá os produtos automaticamente
        </p>
      </div>

      {/* Upload area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Upload do Cardápio
            </CardTitle>
            <CardDescription>Formatos aceitos: PDF, PNG, JPEG (máx. 10MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-muted/20">
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
              ) : file ? (
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="w-8 h-8" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique ou arraste seu cardápio aqui</span>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <Button
              onClick={handleExtract}
              disabled={!file || extracting}
              className="w-full gap-2"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extraindo produtos com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extrair Produtos com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Extracted products */}
      {products.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg">Produtos Encontrados ({products.length})</CardTitle>
              <CardDescription>Selecione os produtos que deseja importar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((product, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleProduct(i)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    product.selected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      product.selected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {product.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <span className="text-primary font-bold text-sm whitespace-nowrap">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <span className="inline-block text-[10px] bg-muted px-2 py-0.5 rounded-full mt-2">
                        {product.category}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                className="w-full gap-2 mt-4"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Importar {selectedCount} Produto{selectedCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

