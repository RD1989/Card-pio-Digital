import { useState } from 'react';
import { Cpu, Save, ShieldCheck } from 'lucide-react';

export const AISettings = () => {
  const [apiKey, setApiKey] = useState('sk-or-v1-....................');
  const [model, setModel] = useState('google/gemini-flash-1.5');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulação de save
    setTimeout(() => {
      setLoading(false);
      alert('Configurações de IA enviadas com sucesso!');
    }, 1000);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-amber-500/10 p-3 rounded-2xl">
          <Cpu className="w-6 h-6 text-amber-500" />
        </div>
        <h2 className="text-2xl font-serif text-white">Configurações de Inteligência Artificial</h2>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-500 text-sm">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <p>As chaves são armazenadas com criptografia AES-256 no banco de dados e nunca são expostas no frontend após o salvamento.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">OpenRouter API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-amber-500 transition-all font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Modelo Padrão (Vision/OCR)</label>
          <select 
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-amber-500 transition-all appearance-none"
          >
            <option value="google/gemini-flash-1.5">Google Gemini 1.5 Flash (Recomendado)</option>
            <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
            <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 px-8 rounded-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};
