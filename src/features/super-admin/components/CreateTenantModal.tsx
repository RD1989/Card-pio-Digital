import React, { useState } from 'react';
import { 
  Plus, Loader2, Mail, Lock, Store, Link2, MessageSquare, Sparkles 
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface CreateTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: any) => Promise<void>;
  creating: boolean;
}

export const CreateTenantModal = React.memo(({
  open,
  onOpenChange,
  onCreate,
  creating
}: CreateTenantModalProps) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [plan, setPlan] = useState('basic');

  const handleSubmit = async () => {
    await onCreate({ email, pass, name, slug, whatsapp, plan });
    // Reset local state on success if managed by parent
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-sm border-border max-h-[90vh] overflow-y-auto rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 sm:p-8 bg-muted/40 border-b border-border">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 border border-border/50">
            <Plus className="w-6 h-6 text-foreground" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">Novo Lojista</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground">
            Cadastre uma nova empresa e defina as permissões iniciais.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-4">
            {/* Empresa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome da Empresa</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ex: Pizzaria Di Napoli" 
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Link (Slug)</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)} 
                    placeholder="ex: dinapoli" 
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 hover:border-primary/30 transition-all font-bold lowercase"
                  />
                </div>
              </div>
            </div>

            {/* Acesso */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">E-mail de Acesso</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="admin@exemplo.com" 
                  className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Senha Inicial</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  value={pass} 
                  onChange={e => setPass(e.target.value)} 
                  placeholder="••••••••" 
                  className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium"
                />
              </div>
            </div>

            {/* Configs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">WhatsApp</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    placeholder="21999999999" 
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Plano Inicial</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 font-bold transition-all hover:border-primary/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="basic" className="font-medium">💼 Plano Básico</SelectItem>
                    <SelectItem value="pro" className="font-bold">🚀 Plano Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 p-4 rounded-2xl border border-dashed border-border/50">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="font-medium leading-normal italic">
              Ao criar, um e-mail de boas-vindas não será enviado automaticamente. Use os dados acima para o primeiro acesso.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 sm:px-8 py-6 bg-muted/40 border-t border-border gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-muted-foreground h-11 rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={creating} 
            className="flex-1 h-11 font-black uppercase tracking-widest shadow-xl shadow-primary/20 rounded-2xl"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {creating ? 'Processando Cadastro...' : 'Ativar Lojista'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

CreateTenantModal.displayName = 'CreateTenantModal';
