import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Save, Loader2, CheckCircle2, AlertTriangle, Cpu } from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROVIDERS = [
  { id: "gemini", name: "Google Gemini Nativo (Gratuito)", desc: "Usa a integração nativa do servidor via Gemini Flash para geração rápida em streaming SSE." },
  { id: "openrouter", name: "OpenRouter Free Tier", desc: "Modelos gratuitos de código aberto e experimentais com fallback automático." },
  { id: "emergent", name: "Motor Universal Studio Pro", desc: "Combinação automática de modelos otimizados para copywriting de negócios locais." },
];

export default function AiSettingsPanel() {
  const [s, setS] = useState(null);
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-3.8-flash");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/settings/ai")
      .then(({ data }) => {
        setS(data);
        setProvider(data.provider || "gemini");
        setModel(data.model || "gemini-3.8-flash");
      })
      .catch((e) => toast.error(fmtErr(e)));
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/settings/ai", { provider, model });
      toast.success("Configurações de IA salvas");
      const { data } = await api.get("/settings/ai");
      setS(data);
    } catch (e) {
      toast.error(fmtErr(e));
    } finally {
      setBusy(false);
    }
  };

  if (!s)
    return (
      <div className="auth-loading" style={{ minHeight: "50vh" }}>
        <div className="auth-spinner" />
      </div>
    );

  const models = s.models?.[provider] || s.models?.gemini || ["gemini-3.8-flash"];

  return (
    <div className="max-w-[760px] w-full mx-auto px-5 py-10" data-testid="ai-settings-panel">
      <h1 className="text-[30px] font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
        <Sparkles size={26} className="text-amber-500" /> Configurações de IA
      </h1>
      <p className="text-[13.5px] text-slate-500 mt-1.5 mb-8">
        Escolha o provedor e o modelo que melhoram as bios e textos persuasivos dos seus sites via streaming em tempo real.
      </p>

      <div className="panel p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              data-testid={`ai-provider-${p.id}`}
              onClick={() => {
                setProvider(p.id);
                const avail = s.models?.[p.id] || ["gemini-3.8-flash"];
                setModel(avail[0]);
              }}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                provider === p.id ? "border-slate-900 bg-slate-50" : "border-[#E4E4E7] hover:border-slate-300"
              }`}
            >
              <b className="block text-[13.5px] text-slate-900 flex items-center gap-1.5">
                {p.name}
                {provider === p.id && <CheckCircle2 size={14} className="text-emerald-600 flex-none" />}
              </b>
              <span className="block text-[11.5px] text-slate-500 mt-1 leading-snug">{p.desc}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="field-label flex items-center gap-1.5">
            <Cpu size={13} /> Modelo ativo de Copywriting
          </label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger data-testid="ai-model-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((mo) => (
                <SelectItem key={mo} value={mo}>
                  {mo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            As chamadas de IA são processadas de forma segura no servidor via Server-Sent Events (SSE).
          </p>
        </div>

        <button data-testid="ai-save-button" onClick={save} disabled={busy} className="btn-primary-dark">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar configurações
        </button>
      </div>

      <div className="panel p-6 mt-5">
        <b className="flex items-center gap-2 text-[13.5px] text-slate-900 mb-2">Busca do Google Places</b>
        {s.google_places_active ? (
          <p className="flex items-center gap-2 text-[13px] text-emerald-700 font-semibold">
            <CheckCircle2 size={15} /> Chave configurada no servidor — busca em tempo real ativa no Google Places (New).
          </p>
        ) : (
          <p className="flex items-start gap-2 text-[13px] text-amber-700 font-medium leading-relaxed">
            <AlertTriangle size={15} className="flex-none mt-0.5" /> Modo Demonstração Ativo: O Studio está usando a base local enriquecida com 6 empresas completas (Farmácia Anápolis - DrogaLu, Clínica Dr. Samuel, Pamonharia do Simprão, etc.) pronta para uso imediato.
          </p>
        )}
      </div>
    </div>
  );
}
