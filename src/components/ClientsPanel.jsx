import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Pencil,
  ExternalLink,
  Download,
  Copy,
  Trash2,
  Plus,
  Globe,
  CalendarDays,
  MessageCircle,
  FileText,
  Calculator,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api, fmtErr } from "@/lib/api";
import { downloadHtml, absUrl } from "@/lib/sitegen/generateSiteHtml";
import { buildWhatsappScripts, generateContractHtml } from "@/lib/sitegen/zycronCatalog";
import ClickStats from "@/components/ClickStats";

const CRM_STAGES = [
  { id: "site_gerado", label: "Site Gerado", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "enviado_zap", label: "Enviado no Zap", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "respondeu", label: "Respondeu", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "preco_passado", label: "Preço Passado", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "fechado", label: "Fechado (Pago)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export default function ClientsPanel({ projects, onChanged, onEdit, onNew, onOpenSalesHub }) {
  const [busy, setBusy] = useState("");
  const [stats, setStats] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api
      .get("/projects/stats")
      .then((r) => setStats(r.data.stats || {}))
      .catch(() => {});
  }, [projects]);

  const toggleStatus = async (p, active) => {
    const status = active ? "active" : "suspended";
    try {
      await api.put(`/projects/${p.id}`, { status });
      toast.success(active ? `${p.name} está no ar` : `${p.name} suspenso — visitantes verão a tela de bloqueio`);
      onChanged();
    } catch (e) {
      toast.error(fmtErr(e));
    }
  };

  const changeCrmStage = async (p, crmStage) => {
    try {
      const nextData = { ...(p.data || {}), crmStage };
      await api.put(`/projects/${p.id}`, { data: nextData, name: p.name, status: p.status });
      toast.success("Etapa do funil atualizada");
      onChanged();
    } catch (e) {
      toast.error(fmtErr(e));
    }
  };

  const sendPitchOnWhatsapp = (p) => {
    const biz = p.data?.business || { name: p.name, city: "sua região", category: "Comércio" };
    const siteUrl = `${window.location.origin}/site/${p.slug}`;
    const scripts = buildWhatsappScripts(biz, siteUrl, 900, 150);
    const msg = scripts[0].reply;
    navigator.clipboard.writeText(msg).catch(() => {});
    const waDigits = String(biz.whatsapp || biz.phone || "").replace(/\D/g, "");
    const url = waDigits
      ? `https://wa.me/${waDigits.startsWith("55") ? waDigits : "55" + waDigits}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Abordagem copiada e aberta no WhatsApp!");
  };

  const downloadClientContract = (p) => {
    const biz = p.data?.business || {};
    const html = generateContractHtml({
      providerName: "Agência Site Express Pro",
      clientName: p.name,
      clientCity: biz.city || "Brasil",
      clientPhone: biz.phone || biz.whatsapp || "",
      sitePrice: 900,
      monthlyFee: 150,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${p.slug}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Contrato de ${p.name} baixado!`);
  };

  const duplicate = async (p) => {
    setBusy(p.id);
    try {
      await api.post(`/projects/${p.id}/duplicate`);
      toast.success("Projeto duplicado");
      onChanged();
    } catch (e) {
      toast.error(fmtErr(e));
    } finally {
      setBusy("");
    }
  };

  const remove = async (p) => {
    try {
      await api.delete(`/projects/${p.id}`);
      toast.success("Projeto excluído");
      setConfirmDelete(null);
      onChanged();
    } catch (e) {
      toast.error(fmtErr(e));
    }
  };

  return (
    <div className="max-w-[1200px] w-full mx-auto px-5 py-10" data-testid="clients-panel">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight text-slate-900">Meus Clientes & Funil CRM</h1>
          <p className="text-[13.5px] text-slate-500 mt-1">
            {projects.length} site{projects.length === 1 ? "" : "s"} gerado{projects.length === 1 ? "" : "s"} · controle de publicação, abordagem no WhatsApp e contratos
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {onOpenSalesHub && (
            <button
              type="button"
              onClick={onOpenSalesHub}
              className="px-4 py-2.5 rounded-xl border border-[#E4E4E7] bg-white hover:bg-slate-50 text-[13px] font-bold text-slate-700 inline-flex items-center gap-2 transition-colors"
            >
              <Calculator size={15} className="text-amber-600" /> Calculadora & Scripts
            </button>
          )}
          <button data-testid="clients-new-button" onClick={onNew} className="btn-primary-dark">
            <Plus size={16} /> Novo site
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="panel p-14 text-center">
          <Globe size={34} className="mx-auto text-slate-300 mb-4" strokeWidth={1.5} />
          <b className="block text-slate-900 text-lg">Nenhum site por aqui ainda</b>
          <p className="text-slate-500 text-sm mt-1.5 mb-6">Busque uma empresa no Google e gere o primeiro site oficial em minutos.</p>
          <button onClick={onNew} className="btn-primary-dark mx-auto">
            <Plus size={15} /> Criar primeiro site
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => {
            const cover = absUrl(p.data?.business?.photos?.[0]);
            const stageId = p.data?.crmStage || "site_gerado";
            const stageObj = CRM_STAGES.find((s) => s.id === stageId) || CRM_STAGES[0];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="panel overflow-hidden flex flex-col justify-between"
                data-testid={`client-card-${i}`}
              >
                <div>
                  <div className="relative h-36 bg-slate-100">
                    {cover && <img src={cover} alt={p.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        p.status === "active" ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900"
                      }`}
                    >
                      {p.status === "active" ? "Ativo no ar" : "Suspenso"}
                    </span>
                    <select
                      aria-label="Etapa do funil"
                      value={stageId}
                      onChange={(e) => changeCrmStage(p, e.target.value)}
                      className={`absolute top-3 right-3 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full border cursor-pointer outline-none ${stageObj.cls}`}
                    >
                      {CRM_STAGES.map((st) => (
                        <option key={st.id} value={st.id} className="bg-white text-slate-900">
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="p-5 pb-3">
                    <b className="block text-[15.5px] text-slate-900 tracking-tight truncate">{p.name}</b>
                    <span className="block text-[12px] text-slate-400 font-medium truncate mt-0.5">{p.slug}.seudominio.com.br</span>
                    <span className="flex items-center gap-1.5 text-[11.5px] text-slate-400 mt-2">
                      <CalendarDays size={12} /> Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <div className="mt-3">
                      <ClickStats stats={stats[p.id]} items={p.data?.business?.items} index={i} />
                    </div>

                    {/* Zycron Quick Actions: Abordar no Zap + Contrato */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        data-testid={`client-whatsapp-pitch-${i}`}
                        onClick={() => sendPitchOnWhatsapp(p)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11.5px] font-bold transition-colors"
                      >
                        <MessageCircle size={13} /> Abordar no Zap
                      </button>
                      <button
                        type="button"
                        data-testid={`client-contract-${i}`}
                        onClick={() => downloadClientContract(p)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-bold transition-colors"
                      >
                        <FileText size={13} /> Gerar Contrato
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-[11.5px] font-bold text-slate-600 cursor-pointer">
                      <Switch data-testid={`killswitch-toggle-client-${i}`} checked={p.status === "active"} onCheckedChange={(v) => toggleStatus(p, v)} />
                      {p.status === "active" ? "No ar" : "Fora do ar"}
                    </label>
                    <div className="flex gap-1">
                      <button
                        data-testid={`client-edit-${i}`}
                        onClick={() => onEdit(p)}
                        title="Editar"
                        className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <a
                        data-testid={`client-open-${i}`}
                        href={`/site/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir site"
                        className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        data-testid={`client-export-${i}`}
                        onClick={() => {
                          downloadHtml(p.data, `${p.slug}.html`, p.slug);
                          toast.success("HTML baixado");
                        }}
                        title="Baixar HTML"
                        className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        data-testid={`client-duplicate-${i}`}
                        onClick={() => duplicate(p)}
                        disabled={busy === p.id}
                        title="Duplicar"
                        className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                      {confirmDelete === p.id ? (
                        <button
                          data-testid={`client-confirm-delete-${i}`}
                          onClick={() => remove(p)}
                          className="px-2 h-8 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors"
                        >
                          Confirmar
                        </button>
                      ) : (
                        <button
                          data-testid={`client-delete-${i}`}
                          onClick={() => setConfirmDelete(p.id)}
                          title="Excluir"
                          className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
