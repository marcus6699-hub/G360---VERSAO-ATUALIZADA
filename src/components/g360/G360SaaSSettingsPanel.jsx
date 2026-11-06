import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  Server,
  DollarSign,
  QrCode,
  Target,
  Check,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  KeyRound,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtErr } from "@/lib/api";
import ApiKeysSettings from "./ApiKeysSettings";
import GoogleWorkspacePanel from "./GoogleWorkspacePanel";

function AdminSettings({ dark = false, storageKey }) {
  const [activeAdminTab, setActiveAdminTab] = useState("finance"); // "finance" | "ai-engines" | "access"
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [financeGoals, setFinanceGoals] = useState({
    monthlyRevenueGoal: 15000,
    monthlyLeadsGoal: 30,
    averageTicketTarget: 997,
  });
  const [pixConfig, setPixConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved
        ? JSON.parse(saved)
        : {
            pixKeyType: "CPF / CNPJ",
            pixKey: "",
            beneficiaryName: "",
            bankName: "",
          };
    } catch {
      return {
        pixKeyType: "CPF / CNPJ",
        pixKey: "",
        beneficiaryName: "",
        bankName: "",
      };
    }
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    plan: "g360_full", // "g360_full" | "site_express_only"
    role: "user",
  });
  const [deploySettings, setDeploySettings] = useState({
    vercelToken: "",
    netlifyToken: "",
    agencyName: "G360 Google Business Intelligence",
    agencyPhone: "",
    agencyDocument: "",
  });
  const [aiStatus, setAiStatus] = useState({
    provider: "gemini",
    model: "gemini-3.8-flash",
    has_own_key: false,
    google_places_active: false,
  });

  const [engines, setEngines] = useState({});
  const [testingEngines, setTestingEngines] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Zero-Cost Shield & 6/6 AI Health Check state (relocated from top header into Admin Tab 2)
  const [shieldInfo, setShieldInfo] = useState({
    zeroCostShieldActive: true,
    billingStatus: "R$ 0,00 (Escudo Custo Zero Ativo)",
  });
  const [togglingShield, setTogglingShield] = useState(false);
  const [aiHealthReport, setAiHealthReport] = useState(null);
  const [testingAiHealth, setTestingAiHealth] = useState(false);

  const loadAll = async () => {
    try {
      const [uRes, crmRes, aiRes, engRes, shRes] = await Promise.all([
        api.get("/g360/users"),
        api.get("/g360/crm"),
        api.get("/settings/ai"),
        api.get("/g360/engine-status"),
        api.get("/g360/zero-cost-shield").catch(() => ({ data: null })),
      ]);
      setUsers(uRes.data?.users || []);
      setLeads(crmRes.data?.leads || []);
      if (crmRes.data?.financeGoals) {
        setFinanceGoals((prev) => ({ ...prev, ...crmRes.data.financeGoals }));
      }
      if (crmRes.data?.deploySettings) {
        setDeploySettings((prev) => ({ ...prev, ...crmRes.data.deploySettings }));
      }
      if (aiRes.data) setAiStatus(aiRes.data);
      if (engRes.data?.engines) setEngines(engRes.data.engines);
      if (shRes?.data) setShieldInfo(shRes.data);
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao carregar configurações"));
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleShield = async (nextActive) => {
    setTogglingShield(true);
    try {
      const { data } = await api.post("/g360/zero-cost-shield", { active: nextActive });
      setShieldInfo((prev) => ({ ...prev, ...data }));
      toast.success(
        nextActive
          ? "Escudo Custo Zero (R$ 0,00) ATIVADO! Google Places pago bloqueado."
          : "Escudo Custo Zero desativado temporariamente."
      );
    } catch (e) {
      toast.error(fmtErr(e, "Não foi possível alterar o Escudo Custo Zero"));
    } finally {
      setTogglingShield(false);
    }
  };

  const handleRunAiHealthCheck = async () => {
    setTestingAiHealth(true);
    try {
      const { data } = await api.post("/g360/ai-health-check");
      setAiHealthReport(data);
      toast.success(`Diagnóstico das IAs concluído: ${data?.summary || "6 de 6 Online"}`);
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao testar conexão das IAs"));
    } finally {
      setTestingAiHealth(false);
    }
  };

  const handleSavePixConfig = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(pixConfig));
      toast.success("Configurações de Chave Pix e Recebimento salvas com sucesso!");
    } catch {
      toast.error("Não foi possível salvar a chave Pix.");
    }
  };

  const handleRunEngineTest = async () => {
    setTestingEngines(true);
    try {
      const { data } = await api.post("/g360/test-engines", {
        sampleQuery: "Encanto Móveis Planejados",
      });
      setTestResult(data);
      toast.success("Diagnóstico em tempo real concluído com sucesso!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao testar motores"));
    } finally {
      setTestingEngines(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error("Preencha nome, e-mail e senha para liberar o login.");
      return;
    }
    try {
      const { data } = await api.post("/g360/users", newUser);
      if (data?.user) {
        setUsers((prev) => [...prev, data.user]);
        setNewUser({ name: "", email: "", password: "", plan: "g360_full", role: "user" });
        toast.success(`Login criado para ${data.user.email}`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao criar usuário"));
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/g360/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Acesso revogado.");
    } catch (e) {
      toast.error(fmtErr(e, "Não foi possível remover este usuário"));
    }
  };

  const handleSaveDeploySettings = async (e) => {
    e.preventDefault();
    try {
      await api.put("/g360/settings", { deploySettings, financeGoals });
      toast.success("Dados da agência e metas financeiras salvos no servidor!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao salvar configurações"));
    }
  };

  // Financial Metrics
  const closedLeads = leads.filter((l) => l.stage === "fechado" || l.stage === "otimizacao");
  const totalRevenue = closedLeads.reduce((acc, l) => acc + Number(l.dealValue || 0), 0);
  const pipelineValue = leads
    .filter((l) => l.stage === "prospeccao" || l.stage === "proposta")
    .reduce((acc, l) => acc + Number(l.dealValue || 0), 0);
  const avgTicket = closedLeads.length > 0 ? Math.round(totalRevenue / closedLeads.length) : 997;
  const conversionRate = leads.length > 0 ? Math.round((closedLeads.length / leads.length) * 100) : 0;
  const remainingGoal = Math.max(0, financeGoals.monthlyRevenueGoal - totalRevenue);
  const clientsNeededToHitGoal = Math.ceil(remainingGoal / Math.max(1, avgTicket));

  const cardClass = dark
    ? "bg-[#14121E] border border-white/[0.08] text-[#EDE9FE] shadow-[0_4px_24px_rgba(0,0,0,0.4)] rounded-2xl"
    : "bg-white border border-slate-200/80 text-[#1A1033] shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl";
  const mutedText = dark ? "text-[#9D98B3]" : "text-[#64748B]";
  const subtleBg = dark ? "bg-white/[0.04]" : "bg-slate-50";
  const borderCol = dark ? "border-white/[0.08]" : "border-slate-200/80";

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER + INTERNAL TABS */}
      <section className={`rounded-3xl p-5 sm:p-7 space-y-5 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
              Central Administrativa G360
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight mt-1 text-slate-900 dark:text-slate-100">
              Administração, Financeiro, Motores de IA e Acessos
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Gerencie suas metas comerciais, receba via Pix, monitore o Escudo Custo Zero (R$ 0,00) e libere logins de clientes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full shrink-0">
            <ShieldCheck size={16} />
            <span>{shieldInfo.zeroCostShieldActive ? "Escudo R$ 0,00 Ativo" : "Modo API Direta"}</span>
          </div>
        </div>

        {/* 3 CLEAN INTERNAL ADMIN TABS */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl border ${borderCol} ${subtleBg}`} data-testid="admin-internal-tabs">
          <button
            type="button"
            onClick={() => setActiveAdminTab("finance")}
            data-testid="admin-tab-finance"
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === "finance"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                : `${mutedText} hover:opacity-85`
            }`}
          >
            <DollarSign size={16} />
            <span>1. Financeiro, Metas & Pix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab("ai-engines")}
            data-testid="admin-tab-ai-engines"
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === "ai-engines"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                : `${mutedText} hover:opacity-85`
            }`}
          >
            <KeyRound size={16} />
            <span>2. Motores de IA, Escudo R$ 0,00 & Chaves</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab("access")}
            data-testid="admin-tab-access"
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === "access"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                : `${mutedText} hover:opacity-85`
            }`}
          >
            <Users size={16} />
            <span>3. Controle de Acessos & Google Workspace</span>
          </button>
        </div>
      </section>

      {/* TAB 1: FINANCEIRO E METAS + CHAVE PIX + NOME DA AGÊNCIA */}
      {activeAdminTab === "finance" && (
        <section className="space-y-6" data-testid="admin-finance-section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 ${cardClass}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Faturamento Realizado
              </div>
              <div className="text-[28px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                R$ {totalRevenue.toLocaleString("pt-BR")}
              </div>
              <div className={`text-[12px] mt-1 ${mutedText}`}>
                Meta mensal: R$ {financeGoals.monthlyRevenueGoal.toLocaleString("pt-BR")}
              </div>
            </div>

            <div className={`rounded-2xl p-5 ${cardClass}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Em Negociação no Funil
              </div>
              <div className="text-[28px] font-mono font-extrabold text-[#7C3AED] tabular-nums mt-1">
                R$ {pipelineValue.toLocaleString("pt-BR")}
              </div>
              <div className={`text-[12px] mt-1 ${mutedText}`}>
                Propostas e contratos ativos
              </div>
            </div>

            <div className={`rounded-2xl p-5 ${cardClass}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Ticket Médio por Cliente
              </div>
              <div className="text-[28px] font-mono font-extrabold tabular-nums mt-1 text-slate-900 dark:text-slate-100">
                R$ {avgTicket.toLocaleString("pt-BR")}
              </div>
              <div className={`text-[12px] mt-1 ${mutedText}`}>
                Pacote GBP + Site Express + Placa
              </div>
            </div>

            <div className={`rounded-2xl p-5 ${cardClass}`}>
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Taxa de Conversão do Funil
              </div>
              <div className="text-[28px] font-mono font-extrabold text-[#F59E0B] tabular-nums mt-1">
                {conversionRate}%
              </div>
              <div className={`text-[12px] mt-1 ${mutedText}`}>
                {closedLeads.length} de {leads.length} empresas abordadas
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Metas Mensais + Marca da Agência */}
            <div className={`lg:col-span-7 rounded-3xl p-6 space-y-5 flex flex-col justify-between ${cardClass}`}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
                      <Target size={14} /> Planejamento Comercial e Metas da Agência
                    </div>
                    <h2 className="text-[18px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                      Calculadora de Fechamentos Mensais
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-semibold ${mutedText}`}>Meta Mensal (R$):</span>
                    <input
                      type="number"
                      value={financeGoals.monthlyRevenueGoal}
                      onChange={(e) =>
                        setFinanceGoals((g) => ({
                          ...g,
                          monthlyRevenueGoal: Number(e.target.value || 0),
                        }))
                      }
                      className={`w-32 px-3.5 py-1.5 rounded-full border font-mono font-bold text-[13px] tabular-nums outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
                  <div className={`p-4 rounded-2xl border ${borderCol} ${subtleBg}`}>
                    <div className={mutedText}>Falta para atingir a meta:</div>
                    <div className="text-[20px] font-mono font-bold text-[#7C3AED] tabular-nums mt-1">
                      R$ {remainingGoal.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${borderCol} ${subtleBg}`}>
                    <div className={mutedText}>Fechamentos necessários:</div>
                    <div className="text-[20px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                      {clientsNeededToHitGoal} clientes
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${borderCol} ${subtleBg}`}>
                    <div className={mutedText}>Pré-Análises por semana:</div>
                    <div className="text-[20px] font-mono font-bold tabular-nums mt-1 text-slate-900 dark:text-slate-100">
                      {Math.max(4, clientsNeededToHitGoal * 2)} fichas
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveDeploySettings} className="space-y-3 pt-4 border-t border-inherit text-[13px]">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                    Nome da Sua Agência (Exibido nos Relatórios PDF, Propostas e Contratos)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={deploySettings.agencyName}
                      onChange={(e) => setDeploySettings((s) => ({ ...s, agencyName: e.target.value }))}
                      className={`flex-1 px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white font-bold text-xs cursor-pointer shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all shrink-0"
                    >
                      Salvar Marca e Metas
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Configuração de Chave Pix e Recebimento */}
            <form
              onSubmit={handleSavePixConfig}
              className={`lg:col-span-5 rounded-3xl p-6 space-y-4 flex flex-col justify-between ${cardClass}`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-inherit">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
                      <QrCode size={14} /> Recebimento Pix da Agência
                    </div>
                    <h3 className="text-[17px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                      Chave Pix para Propostas e Contratos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pixConfig.pixKey);
                      toast.success("Chave Pix copiada!");
                    }}
                    className="px-3 py-1 rounded-full bg-[#EDE9FE] dark:bg-[#7C3AED]/20 text-[#7C3AED] font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-[#7C3AED] hover:text-white transition-all"
                  >
                    <Copy size={12} /> Copiar Pix
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-[12.5px]">
                  <div>
                    <label className={`block text-[10.5px] font-bold uppercase mb-1 ${mutedText}`}>
                      Tipo de Chave
                    </label>
                    <select
                      value={pixConfig.pixKeyType}
                      onChange={(e) => setPixConfig((p) => ({ ...p, pixKeyType: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border font-semibold outline-none transition-all focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
                    >
                      <option value="CPF / CNPJ">CPF / CNPJ</option>
                      <option value="Celular">Celular / WhatsApp</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Chave Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10.5px] font-bold uppercase mb-1 ${mutedText}`}>
                      Chave Pix
                    </label>
                    <input
                      type="text"
                      value={pixConfig.pixKey}
                      onChange={(e) => setPixConfig((p) => ({ ...p, pixKey: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10.5px] font-bold uppercase mb-1 ${mutedText}`}>
                      Titular / Favorecido
                    </label>
                    <input
                      type="text"
                      value={pixConfig.beneficiaryName}
                      onChange={(e) => setPixConfig((p) => ({ ...p, beneficiaryName: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10.5px] font-bold uppercase mb-1 ${mutedText}`}>
                      Instituição / Banco
                    </label>
                    <input
                      type="text"
                      value={pixConfig.bankName}
                      onChange={(e) => setPixConfig((p) => ({ ...p, bankName: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all"
              >
                <Check size={15} /> Salvar Dados Financeiros e Chave Pix
              </button>
            </form>
          </div>
        </section>
      )}

      {/* TAB 2: MOTORES DE IA, ESCUDO CUSTO ZERO (R$ 0,00) & CHAVES DE API */}
      {activeAdminTab === "ai-engines" && (
        <section className="space-y-6" data-testid="admin-ai-engines-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT: ESCUDO CUSTO ZERO (R$ 0,00) + DIAGNÓSTICO 6 DE 6 IAs */}
            <div className={`lg:col-span-6 rounded-3xl p-6 space-y-5 flex flex-col justify-between ${cardClass}`}>
              <div className="space-y-4">
                <div className="pb-3 border-b border-inherit flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-1">
                      <ShieldCheck size={14} /> Proteção de Faturamento Google Cloud
                    </div>
                    <h2 className="text-[18px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                      Escudo Custo Zero (R$ 0,00) & Diagnóstico das IAs
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiHealthCheck}
                    disabled={testingAiHealth}
                    data-testid="admin-run-ai-health-btn"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all"
                  >
                    <RefreshCw size={13} className={testingAiHealth ? "animate-spin" : ""} />
                    <span>{testingAiHealth ? "Testando 6 Motores..." : "Testar Conexão das IAs"}</span>
                  </button>
                </div>

                {/* Escudo Custo Zero Card */}
                <div className={`p-4 rounded-2xl border ${shieldInfo.zeroCostShieldActive ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"} space-y-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-extrabold flex items-center gap-2">
                        {shieldInfo.zeroCostShieldActive ? (
                          <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                        )}
                        <span>
                          {shieldInfo.zeroCostShieldActive
                            ? "Escudo Custo Zero ATIVO — R$ 0,00 no Google Cloud"
                            : "Escudo Custo Zero Desativado"}
                        </span>
                      </div>
                      <p className={`text-[12px] mt-1 ${mutedText}`}>
                        Bloqueia qualquer chamada paga à API Google Places (`places.googleapis.com`) e utiliza Serper.dev + Outscraper Free Tier com cache persistente de 30 dias.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={togglingShield}
                      onClick={() => handleToggleShield(!shieldInfo.zeroCostShieldActive)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold cursor-pointer shrink-0 transition-all ${
                        shieldInfo.zeroCostShieldActive
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {shieldInfo.zeroCostShieldActive ? "Protegido (R$ 0,00)" : "Ativar Escudo"}
                    </button>
                  </div>
                </div>

                {/* Resultado do Diagnóstico de Conexão das 6 IAs */}
                {aiHealthReport?.results && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between text-[12px] font-bold">
                      <span>Resultado do Ping em Tempo Real:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        Provedores Online: {aiHealthReport.summary}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {aiHealthReport.results.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-[12px] ${
                            item.ok
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-rose-500/30 bg-rose-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-bold">
                            <span className="flex items-center gap-1.5 truncate">
                              {item.ok ? (
                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              ) : (
                                <XCircle size={14} className="text-rose-500 shrink-0" />
                              )}
                              <span className="truncate">{item.name}</span>
                            </span>
                            <span className={`text-[10.5px] font-mono ${mutedText}`}>{item.latencyMs}ms</span>
                          </div>
                          <div className={`text-[11px] mt-1 font-mono truncate ${mutedText}`}>
                            Modelo: {item.model}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: STATUS DAS INTEGRAÇÕES NO SERVIDOR */}
            <div className={`lg:col-span-6 rounded-3xl p-6 space-y-5 flex flex-col justify-between ${cardClass}`}>
              <div className="space-y-4">
                <div className="pb-3 border-b border-inherit flex items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-1">
                      <Activity size={14} /> Status das Integrações no Servidor
                    </div>
                    <h2 className="text-[18px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                      Motores Serper, Outscraper, Gemini, Groq e OpenRouter
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunEngineTest}
                    disabled={testingEngines}
                    data-testid="test-engines-btn"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white text-xs font-bold cursor-pointer shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all"
                  >
                    {testingEngines ? "Testando..." : "Testar Busca Real"}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(engines).map(([key, item]) => (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${borderCol} ${subtleBg}`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.label}</div>
                        <div className={`text-[11px] mt-0.5 ${mutedText}`}>{item.mode}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          item.active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.active ? "Verificado" : "Configurável"}
                      </span>
                    </div>
                  ))}
                </div>

                {testResult && (
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1.5 text-xs">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Teste Real Executado — Fonte: {testResult.resolvedSource} | IA: {testResult.aiProviderUsed}
                    </div>
                    <div>
                      <strong>Empresa Localizada:</strong> {testResult.sampleBusiness?.name} ({testResult.sampleBusiness?.city} - {testResult.sampleBusiness?.uf}) · Nota {testResult.sampleBusiness?.rating} ({testResult.sampleBusiness?.rating_count} avaliações)
                    </div>
                    <div className={mutedText}>{testResult.aiSampleOutput}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <ApiKeysSettings dark={dark} />
          </div>
        </section>
      )}

      {/* TAB 3: CONTROLE DE ACESSOS & GOOGLE WORKSPACE */}
      {activeAdminTab === "access" && (
        <section className="space-y-6" data-testid="admin-access-section">
          <div className={`rounded-3xl p-5 sm:p-7 space-y-5 ${cardClass}`}>
            <div className="pb-3 border-b border-inherit">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
                Controle de Assinantes e Acessos
              </div>
              <h2 className="text-[18px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                Liberar Login para Cliente (G360 Completo ou Só Site Express)
              </h2>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  Nome do Usuário / Agência
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                  placeholder="Ex: João Consultor GBP"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  E-mail de Login
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                  placeholder="cliente@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  Senha de Acesso
                </label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                  placeholder="Senha inicial"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  Produto Liberado no Login
                </label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser((u) => ({ ...u, plan: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold outline-none transition-all focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
                >
                  <option value="g360_full">G360 Completo (Auditoria + Pacote GBP + CRM + Site Express)</option>
                  <option value="site_express_only">Apenas Site Express (Produto Separado)</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto py-2.5 px-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all"
                >
                  <Plus size={15} /> Criar Login de Cliente
                </button>
              </div>
            </form>

            <div className="space-y-2.5 pt-3 border-t border-inherit">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Usuários Cadastrados ({users.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-[13px] ${borderCol} ${subtleBg}`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <span>{u.name}</span>
                        <span className="text-[11px] font-bold text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-2 py-0.5 rounded-full">
                          {u.plan === "site_express_only" ? "Apenas Site Express" : "G360 Completo"}
                        </span>
                      </div>
                      <div className={`text-[12px] mt-0.5 ${mutedText}`}>{u.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id)}
                      className={`p-2 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${mutedText}`}
                      title="Revogar acesso"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backup e Download do Código Fonte Completo (.ZIP) */}
          <div className={`rounded-3xl p-5 sm:p-7 space-y-4 border ${borderCol} ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-inherit">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
                  Exportação de Código & GitHub
                </div>
                <h2 className="text-[18px] font-bold mt-1 text-slate-900 dark:text-slate-100">
                  Baixar Código-Fonte Completo (.ZIP)
                </h2>
              </div>
              <a
                href="/api/g360/download-project-zip"
                download="G360-VERSAO-ATUALIZADA.zip"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-[13px] hover:opacity-95 shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Baixar Projeto (.ZIP)</span>
              </a>
            </div>

            <p className={`text-[12.5px] leading-relaxed ${mutedText}`}>
              Baixe todo o projeto atualizado em um único arquivo compactado <strong>G360-VERSAO-ATUALIZADA.zip</strong> pronto para extrair no seu computador, abrir no VS Code ou sincronizar com o seu repositório no GitHub.
            </p>
          </div>

          <GoogleWorkspacePanel dark={dark} />
        </section>
      )}
    </div>
  );
}

export default function G360SaaSSettingsPanel(props) {
  const { user } = useAuth();
  if (user?.role !== "admin")
    return (
      <p role="alert" className="p-6">
        Administração restrita a administradores.
      </p>
    );
  const uid = user.id || user.uid;
  return <AdminSettings key={uid} {...props} storageKey={`g360_pix_config:${uid}`} />;
}
