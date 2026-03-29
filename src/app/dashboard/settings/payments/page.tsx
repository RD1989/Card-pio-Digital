"use client";

import { useState, useEffect } from 'react';
import { Save, ShieldCheck, AlertCircle, FileKey, Zap, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PaymentSettingsPage() {
  const [config, setConfig] = useState({
    efipay_client_id: '',
    efipay_pix_key: '',
    efipay_client_secret: '',
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('efipay_client_id, efipay_pix_key')
          .single();
        
        if (data) {
          setConfig({
            efipay_client_id: data.efipay_client_id || '',
            efipay_pix_key: data.efipay_pix_key || '',
            efipay_client_secret: '', // Nunca buscamos o secret por segurança
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    try {
      const updates: any = {
        efipay_client_id: config.efipay_client_id,
        efipay_pix_key: config.efipay_pix_key,
      };

      if (config.efipay_client_secret?.trim() !== '') {
        updates.efipay_client_secret = config.efipay_client_secret;
      }

      // Se houver certificado, fazemos upload para um bucket privado 'certificates'
      if (certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `efipay_certificate.${fileExt}`;
        const filePath = `admin/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('private_assets')
          .upload(filePath, certificateFile, { upsert: true });

        if (uploadError) throw uploadError;
        updates.efipay_certificate_path = filePath;
      }

      const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', 1);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setCertificateFile(null);
    } catch (err: any) {
      alert('Erro ao salvar as configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-zinc-100 outline-none focus:border-amber-500/70 transition-all font-mono text-sm placeholder:text-zinc-600";
  const labelClass = "block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest";

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20">
          <Zap className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-serif italic tracking-tight">EFI Pay (PIX) Gateway</h2>
          <p className="text-zinc-500 text-sm">Configure as chaves da API PIX para o faturamento interno do SaaS.</p>
        </div>
      </div>

      {/* API Credentials */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Credenciais de Produção</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelClass}>Chave PIX Recebedora</label>
            <input
              type="text"
              placeholder="E-mail, CPF, CNPJ ou Aleatória"
              className={inputClass}
              value={config.efipay_pix_key}
              onChange={e => setConfig({ ...config, efipay_pix_key: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Client ID</label>
            <input
              type="text"
              placeholder="Client_Id_..."
              className={inputClass}
              value={config.efipay_client_id}
              onChange={e => setConfig({ ...config, efipay_client_id: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Client Secret</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className={inputClass}
              value={config.efipay_client_secret}
              onChange={e => setConfig({ ...config, efipay_client_secret: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Certificado Digital */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-2">
          <FileKey className="w-5 h-5 text-amber-500" />
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Certificado (.p12)</h3>
        </div>
        
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">
          O certificado EFI Pay é obrigatório para autenticar chamadas de emissão de PIX Dinâmico com segurança.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-center w-full min-h-[140px] bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl hover:border-amber-500/50 transition-all cursor-pointer group px-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                <FileKey className="w-8 h-8 text-zinc-600 group-hover:text-amber-500 transition-colors" />
              </div>
              <span className="text-zinc-400 text-sm font-bold">
                {certificateFile ? (
                  <span className="text-emerald-500 font-black">{certificateFile.name} Selecionado</span>
                ) : (
                  "Clique para anexar o arquivo P12"
                )}
              </span>
              <p className="text-[10px] text-zinc-600 max-w-[200px]">Somente arquivos .p12 gerados na EFI.</p>
            </div>
            <input 
              type="file" 
              accept=".p12,.pem" 
              className="hidden" 
              onChange={e => setCertificateFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        
        <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/10 p-5 rounded-3xl">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-amber-200 text-xs font-bold uppercase tracking-wider">Webhook Endpoint</p>
              <p className="text-zinc-400 text-[11px] font-mono break-all bg-black/40 p-2 rounded-lg border border-white/5">
                https://seusite.vercel.app/api/webhooks/efipay
              </p>
            </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-5 rounded-3xl font-black flex items-center justify-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-2xl ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-white text-zinc-950 hover:bg-zinc-100'
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-6 h-6" /> Configuração Atualizada</>
        ) : loading ? (
          <><div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Processando Segurança...</>
        ) : (
          <><Save className="w-6 h-6" /> Salvar Alterações</>
        )}
      </button>
    </div>
  );
}
