import { useState, useEffect } from 'react';
import { Cpu, Save, ShieldCheck, CheckCircle2, XCircle, Loader2, Zap, ExternalLink } from 'lucide-react';
import api from '../services/api';

const OPENROUTER_MODELS = [
  { value: 'google/gemini-flash-1.5', label: 'Google Gemini 1.5 Flash ⚡ (Recomendado)' },
  { value: 'google/gemini-pro-1.5', label: 'Google Gemini 1.5 Pro (Melhor Qualidade)' },
  { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Anthropic)' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic)' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Meta Llama 3.1 8B (Gratuito)' },
];

interface TestResult {
  status: 'ok' | 'error';
  message: string;
  label?: string;
  usage?: number;
  limit?: number | null;
  model?: string;
}

export const AISettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-flash-1.5');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    api.get('/settings').then(response => {
      if (response.data.ai_api_key) setApiKey(response.data.ai_api_key);
      if (response.data.ai_model) setModel(response.data.ai_model);
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await api.post('/settings', {
        ai_api_key: apiKey,
        ai_model: model
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.get('/ai/test');
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err?.response?.data?.message || 'Erro ao testar a conexão.'
      });
    } finally {
      setTesting(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none focus:border-amber-500/70 transition-all font-mono text-sm placeholder:text-zinc-600";

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-amber-500/10 p-4 rounded-2xl">
          <Cpu className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Inteligência Artificial — OpenRouter</h2>
          <p className="text-zinc-500 text-sm">Configure a IA para importação de cardápios, geração de descrições e sugestões.</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-amber-200 text-sm">
          A chave é armazenada com criptografia no banco de dados e <strong>nunca é exposta ao frontend</strong>. 
          Todas as chamadas passam por um proxy seguro no servidor Laravel.
        </p>
      </div>

      {/* API Key */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Credenciais OpenRouter</h3>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            Obter chave <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">API Key</label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-zinc-600 mt-2">
            Formato esperado: <code className="text-amber-500/80">sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Modelo Padrão</label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className={`${inputClass} px-5 appearance-none cursor-pointer`}
          >
            {OPENROUTER_MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <p className="text-xs text-zinc-600 mt-2">
            Este modelo será usado para Vision (OCR de cardápios) e geração de descrições automáticas.
          </p>
        </div>

        {/* Test Connection */}
        <div className="border-t border-zinc-800 pt-5">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all disabled:opacity-40 text-sm font-medium"
          >
            {testing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Zap className="w-4 h-4 text-amber-500" />
            }
            {testing ? 'Testando conexão...' : 'Testar Conexão com OpenRouter'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 text-sm ${
              testResult.status === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {testResult.status === 'ok'
                ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              }
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.status === 'ok' && (
                  <ul className="mt-2 space-y-1 text-xs text-emerald-400">
                    {testResult.label && <li>📋 Label: <span className="font-mono">{testResult.label}</span></li>}
                    {testResult.usage !== undefined && <li>📊 Créditos usados: <span className="font-mono">${testResult.usage?.toFixed(4)}</span></li>}
                    {testResult.limit && <li>⚡ Limite configurado: <span className="font-mono">${testResult.limit}</span></li>}
                    {testResult.model && <li>🤖 Modelo ativo: <span className="font-mono">{testResult.model}</span></li>}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Uso da IA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Funcionalidades Habilitadas</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            { icon: '📸', label: 'Importação de Cardápio por Foto (Vision/OCR)', tip: 'Tela de Produtos → Importar Menu' },
            { icon: '✍️', label: 'Geração de Descrições de Produtos com IA', tip: 'Modal de Produto → Gerador de Descrição' },
            { icon: '💡', label: 'Sugestões de Preço e Categoria por IA', tip: 'Em desenvolvimento' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/40">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-sm text-white font-medium">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all active:scale-95 disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-5 h-5" /> Configurações Salvas!</>
        ) : loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
        ) : (
          <><Save className="w-5 h-5" /> Salvar Configurações de IA</>
        )}
      </button>
    </div>
  );
};
