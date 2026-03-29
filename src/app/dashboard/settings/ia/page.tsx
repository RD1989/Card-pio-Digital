"use client";

import { useState, useEffect } from 'react';
import { Cpu, Save, ShieldCheck, CheckCircle2, XCircle, Loader2, Zap, ExternalLink, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  status: 'ok' | 'error';
  message: string;
  label?: string;
  usage?: number;
  limit?: number | null;
  model?: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const AI_MODELS: AIModel[] = [
  {
    id: 'qwen/qwen3.5-9b',
    name: 'Qwen 3.5 9B',
    provider: 'Alibaba',
    description: 'Excelente custo-benefício. Alta fidelidade em JSON e ótimo para cardápios digitais (PDFs).',
    badge: 'Recomendado',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Motor estável e testado. Ótimo para visão computacional e OCR em geral.',
    badge: 'Estável',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'qwen/qwen-2.5-vl-7b-instruct',
    name: 'Qwen 2.5 VL 7B',
    provider: 'Alibaba',
    description: 'Especializado em visão. Excelente para extrair dados de imagens complexas.',
    badge: 'Especialista',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
];

export default function AISettingsPage() {
  const [apiKey, setApiKey]         = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3.5-9b');
  const [loading, setLoading]       = useState(false);
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    // Busca configurações globais da IA (Tabela 'settings' ou similar)
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data) {
        if (data.ai_api_key) setApiKey(data.ai_api_key);
        if (data.ai_model) setSelectedModel(data.ai_model);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('settings')
        .update({
          ai_api_key: apiKey,
          ai_model: selectedModel,
        })
        .eq('id', 1); // Assumindo uma única linha de config global

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert('Erro ao salvar as configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // No Next-Supabase, faremos uma chamada para uma API Route que faz o proxy para o OpenRouter
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: 'Erro ao testar a conexão. Verifique se a API Route /api/ai/test está implementada.',
      });
    } finally {
      setTesting(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none focus:border-amber-500/70 transition-all font-mono text-sm placeholder:text-zinc-600";

  return (
    <div className="max-w-2xl space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-amber-500/10 p-4 rounded-2xl">
          <Cpu className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-serif italic tracking-tight">Inteligência Artificial</h2>
          <p className="text-zinc-500 text-sm">Configure o motor de IA via OpenRouter para todo o SaaS.</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-blue-200 text-sm leading-relaxed">
          <strong>Segurança de Dados:</strong> A chave é armazenada no Postgres e usada apenas em Edge Functions ou API Routes seguras.
        </p>
      </div>

      {/* API Key */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Credenciais OpenRouter</h3>
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold"
          >
            Obter chave <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-tight">API Key</label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Test Connection */}
        <div className="border-t border-zinc-800 pt-5">
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40 text-xs font-black uppercase tracking-widest"
          >
            {testing
              ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              : <Zap className="w-4 h-4 text-amber-500" />
            }
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-2xl border flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
              testResult.status === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {testResult.status === 'ok'
                ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              }
              <div>
                <p className="font-bold">{testResult.message}</p>
                {testResult.status === 'ok' && (
                  <ul className="mt-2 space-y-1 text-xs text-emerald-400 font-mono">
                    {testResult.label && <li>⚡ Model: {testResult.label}</li>}
                    {testResult.usage !== undefined && <li>💰 Usage: ${testResult.usage?.toFixed(4)}</li>}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-amber-500" />
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Motor Padrão</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {AI_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedModel === model.id
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm">{model.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tighter ${model.badgeColor}`}>
                    {model.badge}
                  </span>
                  {selectedModel === model.id && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-xl'
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-5 h-5" /> Configurações Salvas!</>
        ) : loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
        ) : (
          <><Save className="w-5 h-5" /> Salvar Configurações</>
        )}
      </button>
    </div>
  );
}
