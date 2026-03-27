import { useState, useEffect } from 'react';
import { CreditCard, Save, Lock, Landmark } from 'lucide-react';
import api from '../services/api';

export const PaymentSettings = () => {
  const [config, setConfig] = useState({
    clientId: '',
    clientSecret: '',
    sandbox: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(response => {
      setConfig({
        clientId: response.data.efi_client_id || '',
        clientSecret: response.data.efi_client_secret || '',
        sandbox: response.data.efi_sandbox !== 'false', // default to true if null
      });
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/settings', {
        efi_client_id: config.clientId,
        efi_client_secret: config.clientSecret,
        efi_sandbox: config.sandbox ? 'true' : 'false'
      });
      alert('Credenciais Efí atualizadas!');
    } catch {
      alert('Erro ao salvar as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-500/10 p-3 rounded-2xl">
          <CreditCard className="w-6 h-6 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-serif text-white">Integração Efí (Gerencianet)</h2>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <Landmark className="w-4 h-4" />
          <span>Configurações globais para recebimento via PIX e Cartão</span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
          <button 
            onClick={() => setConfig({...config, sandbox: true})}
            className={`py-2 rounded-xl transition-all ${config.sandbox ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600'}`}
          >
            Sandbox (Testes)
          </button>
          <button 
            onClick={() => setConfig({...config, sandbox: false})}
            className={`py-2 rounded-xl transition-all ${!config.sandbox ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-600'}`}
          >
            Produção
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Client ID</label>
          <input 
            type="text" 
            placeholder="Obtenha no painel da Efí"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500 transition-all font-mono text-sm"
            value={config.clientId}
            onChange={(e) => setConfig({...config, clientId: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Client Secret</label>
          <input 
            type="password" 
            placeholder="••••••••••••••••"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-emerald-500 transition-all font-mono text-sm"
            value={config.clientSecret}
            onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
          />
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-dashed border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-zinc-600" />
            <div>
              <p className="text-sm text-white font-medium">Certificado .p12</p>
              <p className="text-xs text-zinc-500">Obrigatório para API PIX</p>
            </div>
          </div>
          <button className="text-amber-500 text-sm font-bold hover:underline">Fazer Upload</button>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Credenciais'}
        </button>
      </div>
    </div>
  );
};
