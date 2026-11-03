import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Save, ShieldCheck, Lock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { db, auth, doc, getDoc, setDoc, handleFirestoreError, OperationType } from "@/firebase";

export default function ApiKeysSettings({ dark = false }) {
  const [keys, setKeys] = useState({
    geminiApiKey: "",
    mapsApiKey: "",
    outscraperApiKey: "",
    nvidiaApiKey: "",
    openrouterApiKey: "",
    groqApiKey: "",
    serperApiKey: "",
  });

  const [showKey, setShowKey] = useState({
    geminiApiKey: false,
    mapsApiKey: false,
    outscraperApiKey: false,
    nvidiaApiKey: false,
    openrouterApiKey: false,
    groqApiKey: false,
    serperApiKey: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const path = `api_keys/${user.uid}`;
        try {
          const docRef = doc(db, "api_keys", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setKeys({
              geminiApiKey: data.geminiApiKey || "",
              mapsApiKey: data.mapsApiKey || "",
              outscraperApiKey: data.outscraperApiKey || "",
              nvidiaApiKey: data.nvidiaApiKey || "",
              openrouterApiKey: data.openrouterApiKey || "",
              groqApiKey: data.groqApiKey || "",
              serperApiKey: data.serperApiKey || "",
            });
          }
        } catch (e) {
          try {
            handleFirestoreError(e, OperationType.GET, path);
          } catch {}
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (field, value) => {
    setKeys((prev) => ({ ...prev, [field]: String(value || "").slice(0, 256) }));
  };

  const toggleVisibility = (field) => {
    setShowKey((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Você precisa estar autenticado com o Google para salvar suas chaves de API com segurança.");
      return;
    }

    setSaving(true);
    const path = `api_keys/${currentUser.uid}`;
    try {
      const docRef = doc(db, "api_keys", currentUser.uid);
      const payload = {
        userId: String(currentUser.uid).slice(0, 128),
        geminiApiKey: String(keys.geminiApiKey || "").slice(0, 256),
        mapsApiKey: String(keys.mapsApiKey || "").slice(0, 256),
        outscraperApiKey: String(keys.outscraperApiKey || "").slice(0, 256),
        nvidiaApiKey: String(keys.nvidiaApiKey || "").slice(0, 256),
        openrouterApiKey: String(keys.openrouterApiKey || "").slice(0, 256),
        groqApiKey: String(keys.groqApiKey || "").slice(0, 256),
        serperApiKey: String(keys.serperApiKey || "").slice(0, 256),
        updatedAt: new Date().toISOString().slice(0, 60),
      };
      await setDoc(docRef, payload, { merge: true });
      toast.success("Chaves de API salvas com segurança no Firestore do seu usuário!");
    } catch (e) {
      toast.error("Erro ao salvar chaves no Firestore. Verifique as regras de segurança.");
      try {
        handleFirestoreError(e, OperationType.WRITE, path);
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = (val) => {
    const isConfigured = Boolean(val && String(val).trim().length > 5);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isConfigured
            ? "bg-[#34A853]/15 text-[#34A853] border border-[#34A853]/30"
            : "bg-[#5F6368]/15 text-[#5F6368] border border-[#5F6368]/30"
        }`}
      >
        {isConfigured ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {isConfigured ? "Conectado / Ativo" : "Não Configurado"}
      </span>
    );
  };

  const cardClass = dark
    ? "bg-[#303134]/85 backdrop-blur-xl border border-[#3C4043] text-[#E8EAED]"
    : "bg-white/90 backdrop-blur-xl border border-[#DADCE0] text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,0.06),0_2px_6px_rgba(60,64,67,0.04)]";
  const mutedText = dark ? "text-[#9AA0A6]" : "text-[#5F6368]";
  const inputClass = dark
    ? "w-full bg-[#202124] border border-[#3C4043] text-[#E8EAED] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#1A73E8]"
    : "w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#1A73E8]";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-[14px] font-medium text-[#1A73E8] animate-pulse">Carregando chaves seguras do Firestore...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <section className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#1A73E8] flex items-center gap-1.5">
              <Lock size={15} /> Gerenciamento Seguro de Credenciais
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight mt-1">
              Chaves de API Externas (Firestore Cloud)
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Insira e armazene suas chaves privadas em campos protegidos, vinculadas exclusivamente à sua conta autenticada no Firestore.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20">
            <ShieldCheck size={16} />
            <span>{currentUser ? `Autenticado: ${currentUser.email}` : "Modo Visitante (Requer Login)"}</span>
          </div>
        </div>
      </section>

      {/* ESCUDO CUSTO ZERO ALERT */}
      <section className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/30 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[13.5px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <ShieldCheck size={18} />
            <span>Escudo Custo Zero (R$ 0,00) Ativo — Proteção contra cobranças no &ldquo;My Project 11343&rdquo;</span>
          </div>
          {keys.mapsApiKey && (
            <button
              type="button"
              onClick={() => {
                handleChange("mapsApiKey", "");
                toast.success("Chave paga do Google Maps removida do formulário! Clique em Salvar Chaves para confirmar.");
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11.5px] font-extrabold cursor-pointer shrink-0"
            >
              Remover Chave Google Maps Paga
            </button>
          )}
        </div>
        <p className={`text-[12.5px] leading-relaxed ${mutedText}`}>
          Bloqueamos automaticamente todas as chamadas pagas do Google Cloud (<strong>Places API Enterprise $35/1k</strong>, <strong>Place Photos $7/1k</strong> e <strong>Gemini Search Grounding $35/1k</strong>). O sistema agora opera com <strong>custo R$ 0,00</strong> usando <strong>Outscraper Free Tier</strong> (com fotos diretas gratuitas), <strong>Cache de 7 dias</strong>, <strong>Gemini 3.1 Flash-Lite Free Tier</strong>, <strong>Groq LPU</strong>, <strong>OpenRouter Free</strong> e <strong>NVIDIA NIM</strong>.
        </p>
      </section>

      {/* FORM */}
      <form onSubmit={handleSave} className={`rounded-2xl p-6 sm:p-8 space-y-6 ${cardClass}`}>
        {!currentUser && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-[13px]">
              <span className="font-semibold">Atenção:</span> Você não está logado com o Google. Para que suas chaves fiquem salvas na sua nuvem pessoal do Firestore, faça login na barra superior da plataforma.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Maps API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> Google Maps API Key (Opcional — Bloqueada no Modo R$ 0,00)
              </label>
              {renderStatusBadge(keys.mapsApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.mapsApiKey ? "text" : "password"}
                value={keys.mapsApiKey}
                onChange={(e) => handleChange("mapsApiKey", e.target.value)}
                placeholder="Deixe em branco para usar apenas Outscraper + Cache Gratuito (R$ 0,00)"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("mapsApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.mapsApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Escudo R$ 0,00 ativo: mesmo se preenchida, o sistema bloqueia chamadas pagas à Places API e usa Outscraper Free + Cache.
            </p>
          </div>

          {/* Outscraper API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> Outscraper API Key
              </label>
              {renderStatusBadge(keys.outscraperApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.outscraperApiKey ? "text" : "password"}
                value={keys.outscraperApiKey}
                onChange={(e) => handleChange("outscraperApiKey", e.target.value)}
                placeholder="The_Outscraper_API_Key..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("outscraperApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.outscraperApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>Verificação exata de perfil Google Meu Negócio.</p>
          </div>

          {/* NVIDIA API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> NVIDIA NIM API Key
              </label>
              {renderStatusBadge(keys.nvidiaApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.nvidiaApiKey ? "text" : "password"}
                value={keys.nvidiaApiKey}
                onChange={(e) => handleChange("nvidiaApiKey", e.target.value)}
                placeholder="nvapi-..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("nvidiaApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.nvidiaApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>Llama 3.3 70B e DeepSeek R1 via NVIDIA Build.</p>
          </div>

          {/* OpenRouter API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> OpenRouter API Key
              </label>
              {renderStatusBadge(keys.openrouterApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.openrouterApiKey ? "text" : "password"}
                value={keys.openrouterApiKey}
                onChange={(e) => handleChange("openrouterApiKey", e.target.value)}
                placeholder="sk-or-v1-..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("openrouterApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.openrouterApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>Modelos 100% gratuitos OpenRouter (:free).</p>
          </div>

          {/* Groq API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> Groq Cloud API Key
              </label>
              {renderStatusBadge(keys.groqApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.groqApiKey ? "text" : "password"}
                value={keys.groqApiKey}
                onChange={(e) => handleChange("groqApiKey", e.target.value)}
                placeholder="gsk_..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("groqApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.groqApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>Inferência LPU ultrarrápida Llama 3.3.</p>
          </div>

          {/* Serper API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> Serper.dev API Key
              </label>
              {renderStatusBadge(keys.serperApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.serperApiKey ? "text" : "password"}
                value={keys.serperApiKey}
                onChange={(e) => handleChange("serperApiKey", e.target.value)}
                placeholder="serper_key_..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("serperApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.serperApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>2.500 buscas gratuitas no Google Search.</p>
          </div>

          {/* Gemini API Key (Bonus) */}
          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold flex items-center gap-1.5">
                <KeyRound size={14} className="text-[#1A73E8]" /> Google Gemini API Key (Opcional)
              </label>
              {renderStatusBadge(keys.geminiApiKey)}
            </div>
            <div className="relative">
              <input
                type={showKey.geminiApiKey ? "text" : "password"}
                value={keys.geminiApiKey}
                onChange={(e) => handleChange("geminiApiKey", e.target.value)}
                placeholder="AIzaSy..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => toggleVisibility("geminiApiKey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8]"
              >
                {showKey.geminiApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className={`text-[11px] ${mutedText}`}>Usado para geração de textos, SEO e briefs do G360.</p>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-inherit flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || !currentUser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold text-[14px] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{saving ? "Salvando no Firestore..." : "Salvar Chaves Seguras"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
