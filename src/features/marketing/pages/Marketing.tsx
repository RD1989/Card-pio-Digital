import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, Trash2, Eye, EyeOff, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';
import { useImpersonateStore } from '@/shared/stores/global/useImpersonateStore';

interface Story {
  id: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
}

export default function Marketing() {
  const { impersonatedUserId } = useImpersonateStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

    const { data, error } = await (supabase as any)
      .from('menu_stories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar stories');
    } else {
      setStories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [impersonatedUserId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-stories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-stories')
        .getPublicUrl(filePath);

      const { error: insertError } = await (supabase as any)
        .from('menu_stories')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          sort_order: stories.length
        });

      if (insertError) throw insertError;

      toast.success('Story adicionado com sucesso!');
      fetchStories();
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await (supabase as any)
      .from('menu_stories')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setStories(stories.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  const deleteStory = async (id: string, imageUrl: string) => {
    if (!confirm('Deseja realmente excluir este story?')) return;

    try {
      const fileName = imageUrl.split('/').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      const userId = (isSuperAdmin && impersonatedUserId) ? impersonatedUserId : user.id;

      // Delete from storage
      await supabase.storage.from('menu-stories').remove([`${userId}/${fileName}`]);

      // Delete from DB
      const { error } = await (supabase as any).from('menu_stories').delete().eq('id', id);
      if (error) throw error;

      setStories(stories.filter(s => s.id !== id));
      toast.success('Story excluído');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Marketing e Stories</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Gerencie os conteúdos visuais que aparecem no topo do seu cardápio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-8 h-8 text-primary" />}
          </div>
          <h3 className="text-lg font-bold">Novo Story</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
            Formatos recomendados: JPG ou PNG. <br/> Proporção 9:16 ou quadrada.
          </p>
        </motion.div>

        {/* Existing Stories */}
        <AnimatePresence mode="popLayout">
          {stories.map((story) => (
            <motion.div
              key={story.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`glass overflow-hidden group relative aspect-[9/12] flex flex-col ${!story.is_active ? 'opacity-50 grayscale' : ''}`}
            >
              <img src={story.image_url} alt="Story" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border-none"
                    onClick={() => toggleActive(story.id, story.is_active)}
                  >
                    {story.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full w-10 h-10 bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white border-none"
                    onClick={() => deleteStory(story.id, story.image_url)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {!story.is_active && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md">Inativo</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {stories.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
          <ImageIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-bold">Nenhum story cadastrado</p>
          <p className="text-sm">Comece adicionando fotos de promoções ou pratos especiais</p>
        </div>
      )}
    </div>
  );
}
