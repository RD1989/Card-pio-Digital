import { useState, useEffect } from 'react';
import { Save, ShieldCheck, AlertCircle, ExternalLink, CheckCircle2, Zap } from 'lucide-react';
import api from '../services/api';

export const PaymentSettings = () => {
  const [config, setConfig] = useState({
    fibank_client_id: '',
    fibank_client_secret: '',
    fibank_sandbox: 'true',
    fibank_webhook_secret: '',
    fibank_checkout_link_starter: '',
    fibank_checkout_link_pro: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get('/settings').then(response => {
      const d = response.data;
      setConfig({
        fibank_client_id: d.fibank_client_id || '',
        fibank_client_secret: d.fibank_client_secret || '',
        fibank_sandbox: d.fibank_sandbox || 'true',
        fibank_webhook_secret: d.fibank_webhook_secret || '',
        fibank_checkout_link_starter: d.fibank_checkout_link_starter || '',
        fibank_checkout_link_pro: d.fibank_checkout_link_pro || '',
      });
    }).catch(console.error).finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await api.post('/settings', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar as configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white outline-none focus:border-amber-500/70 transition-all font-mono text-sm placeholder:text-zinc-600";
  const labelClass = "block text-sm font-semibold text-zinc-400 mb-2";

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Fí Bank logo fictício */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/20">
          Fí
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Fí Bank — Gateway de Pagamento</h2>
          <p className="text-zinc-500 text-sm">Gerencie as credenciais de cobrança das assinaturas do sistema.</p>
        </div>
      </div>

      {/* Environment Toggle */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Ambiente de Operação</h3>
        <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          {[
            { label: '🧪 Sandbox (Testes)', value: 'true' },
            { label: '🚀 Produção (Live)', value: 'false' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setConfig({ ...config, fibank_sandbox: opt.value })}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                config.fibank_sandbox === opt.value
                  ? opt.value === 'false'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {config.fibank_sandbox === 'false' && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">
              <strong>Modo Produção ativo.</strong> Transações reais serão processadas. Certifique-se de que as credenciais são válidas antes de salvar.
            </p>
          </div>
        )}
      </div>

      {/* API Credentials */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Credenciais da API</h3>
        </div>
        <p className="text-xs text-zinc-500">
          Obtenha suas chaves no{' '}
          <a href="https://app.fibank.com.br/developers" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline inline-flex items-center gap-1">
            Painel de Desenvolvedor da Fí Bank <ExternalLink className="w-3 h-3" />
          </a>
        </p>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Client ID</label>
            <input
              type="text"
              placeholder="fibank_live_cid_xxxxxxxxxxxxxxxx"
              className={inputClass}
              value={config.fibank_client_id}
              onChange={e => setConfig({ ...config, fibank_client_id: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Client Secret</label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••••••••••"
              className={inputClass}
              value={config.fibank_client_secret}
              onChange={e => setConfig({ ...config, fibank_client_secret: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Webhook Secret (para validação de eventos)</label>
            <input
              type="password"
              placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
              className={inputClass}
              value={config.fibank_webhook_secret}
              onChange={e => setConfig({ ...config, fibank_webhook_secret: e.target.value })}
            />
            <p className="text-xs text-zinc-600 mt-2">
              Configure o webhook no painel da Fí Bank para receber notificações de pagamento em:{' '}
              <code className="text-violet-400 bg-zinc-950 px-2 py-0.5 rounded-lg text-xs">
                {window.location.origin}/api/webhooks/fibank
              </code>
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Links por Plano */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Links de Checkout por Plano</h3>
        </div>
        <p className="text-xs text-zinc-500">
          Cole abaixo os links de checkout gerados no painel da Fí Bank. O sistema redirecionará automaticamente o lojista ao clicar em "Fazer Upgrade".
        </p>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                Link de Checkout — Plano Starter (R$ 29,90/mês)
              </span>
            </label>
            <input
              type="url"
              placeholder="https://pay.fibank.com.br/checkout/starter-xxxxx"
              className={inputClass}
              value={config.fibank_checkout_link_starter}
              onChange={e => setConfig({ ...config, fibank_checkout_link_starter: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>
                Link de Checkout — Plano Pro Business (R$ 59,90/mês)
              </span>
            </label>
            <input
              type="url"
              placeholder="https://pay.fibank.com.br/checkout/pro-xxxxx"
              className={inputClass}
              value={config.fibank_checkout_link_pro}
              onChange={e => setConfig({ ...config, fibank_checkout_link_pro: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg transition-all active:scale-95 disabled:opacity-50 ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-5 h-5" /> Salvo com Sucesso!</>
        ) : loading ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
        ) : (
          <><Save className="w-5 h-5" /> Salvar Configurações Fí Bank</>
        )}
      </button>
    </div>
  );
};
