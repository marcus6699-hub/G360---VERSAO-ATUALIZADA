import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Save, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { db, auth, doc, getDoc, setDoc, handleFirestoreError, OperationType } from "@/firebase";

interface ApiKeysState {
  mapsApiKey: string;
  outscraperApiKey: string;
  nvidiaApiKey: string;
  openrouterApiKey: string;
  groqApiKey: string;
  serperApiKey: string;
  [key: string]: string;
}

export default function ApiKeysSettings({ dark = false }: { dark?: boolean }) {
  const [keys, setKeys] = useState<ApiKeysState>({
    mapsApiKey: "",
    outscraperApiKey: "",
    nvidiaApiKey: "",
    openrouterApiKey: "",
    groqApiKey: "",
    serperApiKey: "",
  });

  const [showKey, setShowKey] = useState<Record<string, boolean>>({
    mapsApiKey: false,
    outscraperApiKey: false,
    nvidiaApiKey: false,
    openrouterApiKey: false,
    groqApiKey: false,
    serperApiKey: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const handleChange = (field: string, value: string) => {
    setKeys((prev) => ({ ...prev, [field]: String(value || "").slice(0, 256) }));
  };

  const toggleVisibility = (field: string) => {
    setShowKey((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async (e: React.FormEvent) => {
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

  const renderStatusDot = (val: string) => {
    const isConfigured = Boolean(val && val.trim().length > 5);
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-medium">
        <span
          className={`w-2.5 h-2.5 rounded-full inline-block ${
            isConfigured ? "bg-[#34A853] shadow-[0_0_8px_rgba(52,168,83,0.6)]" : "bg-[#5F6368]/40"
          }`}
        />
        <span className={isConfigured ? "text-[#34A853] font-bold" : "text-[#5F6368]"}>
          {isConfigured ? "Configurada" : "Não configurada"}
        </span>
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

  const fields = [
    { id: "mapsApiKey", label: "Google Maps API Key", placeholder: "AIzaSy..." },
    { id: "outscraperApiKey", label: "Outscraper API Key", placeholder: "The_Outscraper_API_Key..." },
    { id: "nvidiaApiKey", label: "NVIDIA NIM API Key", placeholder: "nvapi-..." },
    { id: "openrouterApiKey", label: "OpenRouter API Key", placeholder: "sk-or-v1-..." },
    { id: "groqApiKey", label: "Groq Cloud API Key", placeholder: "gsk_..." },
    { id: "serperApiKey", label: "Serper.dev API Key", placeholder: "serper_key_..." },
  ];

  return (
    <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <section className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#1A73E8] flex items-center gap-1.5">
              <Lock size={15} /> Gerenciamento de Credenciais por Usuário
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight mt-1">
              ApiKeysSettings — Chaves de API
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Configure e persista suas chaves de API de forma segura na nuvem do Firestore utilizando sua autenticação do Google.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20">
            <ShieldCheck size={16} />
            <span>{currentUser ? `UID: ${currentUser.uid.slice(0, 8)}...` : "Não autenticado"}</span>
          </div>
        </div>
      </section>

      {/* FORM */}
      <form onSubmit={handleSave} className={`rounded-2xl p-6 sm:p-8 space-y-6 ${cardClass}`}>
        {!currentUser && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-[13px]">
              <span className="font-semibold">Atenção:</span> Faça login com o Google para salvar suas chaves vinculadas ao seu UID no Firestore.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-semibold flex items-center gap-1.5">
                  <KeyRound size={14} className="text-[#1A73E8]" /> {f.label}
                </label>
                {renderStatusDot(keys[f.id])}
              </div>
              <div className="relative">
                <input
                  type={showKey[f.id] ? "text" : "password"}
                  value={keys[f.id]}
                  onChange={(e) => handleChange(f.id, e.target.value)}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(f.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#1A73E8] cursor-pointer"
                >
                  {showKey[f.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-inherit flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving || !currentUser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold text-[14px] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={16} />
            <span>{saving ? "Salvando no Firestore..." : "Salvar Chaves no Firestore"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
