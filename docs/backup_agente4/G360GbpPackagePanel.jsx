import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Tag,
  FileText,
  ShoppingBag,
  Calendar,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Link2,
  Building2,
  Plus,
  Download,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";

export default function G360GbpPackagePanel({
  dark = false,
  activeBusiness,
  onOpenSiteExpressWithBriefing,
}) {
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "services" | "products" | "posts" | "photos_site"
  const [copiedId, setCopiedId] = useState("");
  const [customDifferential, setCustomDifferential] = useState("");
  const [gbpConnected, setGbpConnected] = useState(false);
  const [syncingField, setSyncingField] = useState("");

  // Add service modal/inline state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState({
    name: activeBusiness?.name || "Encanto Móveis Planejados",
    category: activeBusiness?.category || "Fornecedor de móveis planejados",
    city: activeBusiness?.city || "Anápolis",
    uf: activeBusiness?.uf || "GO",
    differential: "Atendimento personalizado, entrega no prazo e matéria-prima de alta durabilidade",
  });
  const [userPhotos, setUserPhotos] = useState([]);

  const cardClass = dark
    ? "bg-[#303134]/85 backdrop-blur-xl border border-[#3C4043] text-[#E8EAED]"
    : "bg-white/90 backdrop-blur-xl border border-[#DADCE0] text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,0.06),0_2px_6px_rgba(60,64,67,0.04)]";
  const mutedText = dark ? "text-[#9AA0A6]" : "text-[#5F6368]";
  const subtleBg = dark ? "bg-[#202124]" : "bg-[#F8F9FA]";
  const borderCol = dark ? "border-[#3C4043]" : "border-[#DADCE0]";

  const generatePackage = async (bizOverride) => {
    setLoading(true);
    try {
      const target = bizOverride || activeBusiness || {
        name: "Encanto Móveis Planejados",
        category: "Fornecedor de móveis planejados",
        city: "Anápolis",
        uf: "GO",
        phone: "(62) 99113-8004",
      };
      const { data } = await api.post("/g360/gbp-package/generate", {
        business: target,
        customDifferential,
      });
      if (data?.pkg) {
        setPkg(data.pkg);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar o pacote de otimização GBP"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBusiness?.name) {
      setPkg(null);
      setUserPhotos([]);
      setCustomDifferential("");
      generatePackage(activeBusiness);
    }
  }, [activeBusiness?.name, activeBusiness?.place_id]);

  const copyText = (text, id, label = "Conteúdo copiado") => {
    navigator.clipboard.writeText(String(text || ""));
    setCopiedId(id);
    toast.success(label);
    setTimeout(() => setCopiedId(""), 1800);
  };

  const handleSyncToGoogle = (sectionName, textToCopy) => {
    if (textToCopy) {
      navigator.clipboard.writeText(String(textToCopy));
      toast.success(`${sectionName} copiado! Abrindo painel do Google Meu Negócio...`);
    } else {
      toast.info("Abrindo painel oficial do Google Meu Negócio...");
    }
    window.open("https://business.google.com/", "_blank", "noopener,noreferrer");
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !pkg) return;
    const desc =
      newServiceDesc.trim() ||
      `${newServiceName.trim()} em ${pkg.city} com atendimento especializado, materiais selecionados e acabamento profissional pela equipe da ${pkg.businessName}. Solicite orçamento rápido.`;
    const updated = {
      ...pkg,
      services: [
        {
          name: newServiceName.trim(),
          category: pkg.primaryCategory,
          localTerm: `${newServiceName.trim().toLowerCase()} ${pkg.city.toLowerCase()}`,
          description: desc.slice(0, 300),
        },
        ...(pkg.services || []),
      ],
    };
    setPkg(updated);
    setNewServiceName("");
    setNewServiceDesc("");
    toast.success("Serviço SEO adicionado ao pacote");
  };

  const handleDownloadPackageMarkdown = () => {
    if (!pkg) return;
    const md = `# PACOTE DE OTIMIZACAO GBP & BRIEFING DE SITE — ${pkg.businessName.toUpperCase()}
Cidade: ${pkg.city} - ${pkg.uf}
Telefone: ${pkg.phone}
Link WhatsApp Oficial: ${pkg.whatsappUrl}

## 1. CATEGORIAS DO PERFIL
- Categoria Principal: ${pkg.primaryCategory}
- Categorias Adicionais:
${(pkg.additionalCategories || []).map((c) => `  * ${c}`).join("\n")}

## 2. DESCRICAO COM SEO SEMANTICO (750 CARACTERES)
(${pkg.description750.length}/750 caracteres)
${pkg.description750}

## 3. SERVICOS OTIMIZADOS COM PALAVRAS-CHAVE LOCAIS (ATE 300 CARACTERES CADA)
${(pkg.services || [])
  .map(
    (s, i) =>
      `### ${i + 1}. ${s.name} (${s.category})\n- Termo local: ${s.localTerm}\n- Descricao (${s.description.length}/300c): ${s.description}`
  )
  .join("\n\n")}

## 4. CATALOGO DE PRODUTOS GBP
${(pkg.products || [])
  .map((p, i) => `### Produto ${i + 1}: ${p.name} [${p.category}]\n- Preco/CTA: ${p.priceLabel}\n- Descricao: ${p.description}`)
  .join("\n\n")}

## 5. CRONOGRAMA DE 10 PUBLICACOES AGENDADAS (ATE 1500 CARACTERES)
${(pkg.posts || [])
  .map(
    (pt) =>
      `### Post #${pt.number} — ${pt.title} (${pt.objective})\n- Data sugerida: ${pt.scheduledDate} as ${pt.scheduledTime}\n- Botao CTA: ${pt.ctaType} (${pt.ctaPhone})\n- Direcao de Foto: ${pt.imageDirection}\n- Texto (${pt.charCount}/1500c):\n${pt.text}`
  )
  .join("\n\n")}

## 6. NOMES SEO PARA ARQUIVOS DE FOTOGRAFIA
${(pkg.photoSeoNames || []).map((f) => `- ${f}`).join("\n")}
`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pacote-gbp-${pkg.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documento completo do Pacote GBP baixado!");
  };

  if (!pkg) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#1A73E8]" />
        <p className={`mt-3 text-[14px] ${mutedText}`}>Preparando pacote de otimização GBP...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER: Active Profile + Google Business Profile API Sync & Export */}
      <section className={`rounded-2xl p-5 sm:p-6 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-inherit">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1A73E8] text-white flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                <span>Central de Otimizacao @pacote-gbp</span>
                <span>·</span>
                <span>Padrao Google Meu Negocio</span>
              </div>
              <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight mt-0.5">
                {pkg.businessName} — {pkg.city}/{pkg.uf}
              </h1>
              <p className={`text-[13px] mt-0.5 ${mutedText}`}>
                Gere, edite, copie em 1 clique ou sincronize categorias, descricao 750c, servicos locais de 300c, produtos e as 10 publicacoes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setGbpConnected((v) => !v);
                toast.success(
                  !gbpConnected
                    ? "Conta Google Business Profile conectada em modo Proprietário/Gerente!"
                    : "Modo de edição local ativado."
                );
              }}
              className={`px-4 py-2.5 rounded-xl border text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                gbpConnected
                  ? "bg-[#34A853] border-[#34A853] text-white"
                  : `${borderCol} ${subtleBg} hover:border-[#1A73E8]`
              }`}
              data-testid="connect-gbp-oauth-btn"
            >
              <ShieldCheck size={16} className={gbpConnected ? "text-white" : "text-[#1A73E8]"} />
              <span>{gbpConnected ? "Google Meu Negocio Conectado" : "Conectar Conta Google (Gestor)"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPackageMarkdown}
              className={`px-4 py-2.5 rounded-xl border text-[13px] font-semibold flex items-center gap-2 cursor-pointer ${borderCol} ${subtleBg} hover:border-[#1A73E8]`}
            >
              <Download size={15} className="text-[#1A73E8]" />
              <span>Baixar Pacote Completo</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSiteExpressWithBriefing && onOpenSiteExpressWithBriefing(activeBusiness, pkg)}
              className="px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[13px] font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
              data-testid="transfer-to-site-express-btn"
            >
              <Layers size={15} />
              <span>Abrir no Site Express com Briefing Pronto</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs for the 5 GBP Optimization Steps */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          {[
            { id: "info", label: "01. Categorias, Descricao 750c e WhatsApp", icon: FileText },
            { id: "services", label: `02. Servicos SEO (${pkg.services?.length || 0})`, icon: Tag },
            { id: "products", label: `03. Produtos (${pkg.products?.length || 0})`, icon: ShoppingBag },
            { id: "posts", label: `04. Publicacoes Agendadas (${pkg.posts?.length || 10})`, icon: Calendar },
            { id: "photos_site", label: "05. Fotos SEO e Briefing do Site", icon: ImageIcon },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#1A73E8] border-[#1A73E8] text-white shadow-sm"
                    : `${borderCol} ${subtleBg} ${mutedText} hover:text-inherit hover:border-[#1A73E8]`
                }`}
                data-testid={`gbp-pkg-tab-${t.id}`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: CATEGORIAS, DESCRIÇÃO 750 CARACTERES & WHATSAPP */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Categories & WhatsApp Link */}
          <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                  Taxonomia Oficial Google
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Categorias Empresariais</h2>
              </div>
              <button
                type="button"
                onClick={() => handleSyncToGoogle("Categorias Empresariais")}
                className="px-3 py-1.5 rounded-lg bg-[#1A73E8]/10 text-[#1A73E8] text-[12px] font-semibold hover:bg-[#1A73E8] hover:text-white transition-colors cursor-pointer"
              >
                {syncingField === "Categorias Empresariais" ? "Aplicando..." : "Aplicar na Ficha"}
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} flex items-center justify-between gap-2`}>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#1A73E8]">Categoria Principal</div>
                  <div className="font-bold text-[15px] mt-0.5">{pkg.primaryCategory}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(pkg.primaryCategory, "cat-main", "Categoria principal copiada")}
                  className={`p-2 rounded-lg border ${borderCol} hover:border-[#1A73E8] cursor-pointer`}
                >
                  {copiedId === "cat-main" ? <Check size={15} className="text-[#34A853]" /> : <Copy size={15} />}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[12px] font-semibold ${mutedText}`}>
                    Categorias Adicionais Recomendadas ({pkg.additionalCategories?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText((pkg.additionalCategories || []).join(", "), "cat-all", "Todas as categorias copiadas")
                    }
                    className="text-[12px] font-semibold text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    Copiar todas
                  </button>
                </div>
                <div className="space-y-2">
                  {(pkg.additionalCategories || []).map((cat, idx) => (
                    <div
                      key={idx}
                      className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-[13px] ${borderCol} ${subtleBg}`}
                    >
                      <span className="font-medium">{cat}</span>
                      <button
                        type="button"
                        onClick={() => copyText(cat, `cat-${idx}`, `Categoria "${cat}" copiada`)}
                        className="text-[#1A73E8] hover:opacity-80 cursor-pointer"
                      >
                        {copiedId === `cat-${idx}` ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Official WhatsApp Chat URL */}
            <div className="pt-4 border-t border-inherit space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                Campo Chat / WhatsApp do Google Meu Negocio
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${borderCol} ${subtleBg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 size={16} className="text-[#1A73E8] shrink-0" />
                  <span className="font-mono text-[13px] truncate">{pkg.whatsappUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(pkg.whatsappUrl, "wa-url", "Link de WhatsApp copiado")}
                  className="px-3 py-1.5 rounded-lg bg-[#1A73E8] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  {copiedId === "wa-url" ? "Copiado" : "Copiar Link"}
                </button>
              </div>
            </div>
          </div>

          {/* 750-Character Semantic SEO Description */}
          <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                  SEO Semantico Local · Limite Oficial 750 Caracteres
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Descricao da Empresa no Google</h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[12px] font-bold tabular-nums px-2.5 py-1 rounded-lg border ${borderCol} ${
                    pkg.description750.length > 750 ? "text-[#EA4335]" : "text-[#34A853]"
                  }`}
                >
                  {pkg.description750.length} / 750 caracteres
                </span>
                <button
                  type="button"
                  onClick={() => copyText(pkg.description750, "desc-750", "Descrição de 750 caracteres copiada!")}
                  className="px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === "desc-750" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === "desc-750" ? "Copiado!" : "Copiar Descricao"}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={7}
              maxLength={750}
              value={pkg.description750}
              onChange={(e) =>
                setPkg((prev) => ({
                  ...prev,
                  description750: e.target.value,
                  descriptionCharCount: e.target.value.length,
                }))
              }
              className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed outline-none focus:border-[#1A73E8] ${borderCol} ${subtleBg}`}
              data-testid="gbp-description-750-textarea"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <input
                type="text"
                value={customDifferential}
                onChange={(e) => setCustomDifferential(e.target.value)}
                placeholder="Adicionar diferencial específico (ex: entrega em 20 min, projeto 3D grátis)..."
                className={`flex-1 px-3.5 py-2 rounded-xl border text-[13px] outline-none ${borderCol} ${subtleBg}`}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => generatePackage(activeBusiness)}
                  className={`px-4 py-2 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol} ${subtleBg} hover:border-[#1A73E8]`}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Reescrever com IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncToGoogle("Descrição de 750 caracteres")}
                  className="px-4 py-2 rounded-xl bg-[#34A853] hover:opacity-90 text-white text-[12px] font-semibold cursor-pointer"
                >
                  Publicar no Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVIÇOS OTIMIZADOS COM PALAVRAS-CHAVE LOCAIS (ATÉ 20 SERVIÇOS · 300 CARACTERES) */}
      {activeTab === "services" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                Estrategia de Palavras-Chave em Servicos · Limite 300 Caracteres por Servico
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                Servicos Otimizados para o Google Meu Negocio ({pkg.services?.length || 0})
              </h2>
              <p className={`text-[13px] ${mutedText}`}>
                Exatamente como voce faz na pratica: cada servico e cadastrado com a palavra-chave local + descricao persuasiva de ate 300 caracteres.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSyncToGoogle("Catálogo de Serviços SEO")}
              className="px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[13px] font-semibold shrink-0 cursor-pointer"
            >
              Sincronizar Todos os Servicos na Ficha
            </button>
          </div>

          {/* Add new custom service inline */}
          <form onSubmit={handleAddService} className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 ${borderCol} ${subtleBg}`}>
            <div className="md:col-span-4">
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nome do Serviço / Palavra-Chave (ex: Cozinha Sob Medida em Anápolis)"
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] outline-none ${borderCol} ${dark ? "bg-[#303134]" : "bg-white"}`}
              />
            </div>
            <div className="md:col-span-6">
              <input
                type="text"
                maxLength={300}
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Descrição de até 300 caracteres (deixe em branco para gerar automaticamente)..."
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] outline-none ${borderCol} ${dark ? "bg-[#303134]" : "bg-white"}`}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-full py-2 px-3 rounded-lg bg-[#1A73E8] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(pkg.services || []).map((svc, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${borderCol} ${subtleBg}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#1A73E8]">
                        SERVICO #{String(idx + 1).padStart(2, "0")} · {svc.category}
                      </span>
                      <h3 className="font-bold text-[15px] mt-0.5">{svc.name}</h3>
                    </div>
                    <span className={`font-mono text-[11px] tabular-nums ${mutedText}`}>
                      {svc.description.length}/300c
                    </span>
                  </div>
                  <p className={`text-[13px] leading-relaxed ${mutedText}`}>{svc.description}</p>
                </div>

                <div className={`pt-3 border-t ${borderCol} flex items-center justify-between gap-2`}>
                  <button
                    type="button"
                    onClick={() => copyText(svc.name, `svc-name-${idx}`, `Título "${svc.name}" copiado`)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol} ${
                      dark ? "bg-[#303134]" : "bg-white"
                    }`}
                  >
                    {copiedId === `svc-name-${idx}` ? <Check size={13} className="text-[#34A853]" /> : <Copy size={13} />}
                    <span>Copiar Titulo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => copyText(svc.description, `svc-desc-${idx}`, "Descrição de 300c copiada")}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === `svc-desc-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                    <span>Copiar Descricao (300c)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: CATÁLOGO DE PRODUTOS GBP */}
      {activeTab === "products" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                Vitrine de Produtos no Perfil da Empresa · Ate 1.000 Caracteres
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                Categorias e Produtos Estruturados ({pkg.products?.length || 0})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleSyncToGoogle("Catálogo de Produtos GBP")}
              className="px-4 py-2.5 rounded-xl bg-[#1A73E8] text-white text-[13px] font-semibold cursor-pointer"
            >
              Publicar Produtos na Ficha
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(pkg.products || []).map((prod, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${borderCol} ${subtleBg}`}
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8]">
                    Categoria: {prod.category}
                  </div>
                  <h3 className="text-[16px] font-bold">{prod.name}</h3>
                  <div className="text-[12px] font-semibold text-[#34A853]">{prod.priceLabel}</div>
                  <p className={`text-[13px] leading-relaxed ${mutedText}`}>{prod.description}</p>
                </div>

                <div className={`pt-3 border-t ${borderCol} flex items-center justify-between gap-2`}>
                  <span className="font-mono text-[11px] font-bold text-[#34A853] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    {prod.description?.length || 1000} / 1.000 carac.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(prod.name, `prod-n-${idx}`, "Título do produto copiado")}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol} hover:bg-slate-50 dark:hover:bg-slate-800`}
                    >
                      <Copy size={12} /> Copiar Título
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(prod.description, `prod-d-${idx}`, "Descrição do produto copiada")}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy size={12} /> Copiar Texto
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: 10 PUBLICAÇÕES AGENDADAS (ATÉ 1.500 CARACTERES + BOTÃO LIGAR AGORA) */}
      {activeTab === "posts" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                Cronograma de Atualizacoes GBP · 10 Publicacoes Completas (Ate 1.500 Caracteres)
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                10 Publicacoes Prontas com Agendamento e Botao de Ligacao
              </h2>
              <p className={`text-[13px] ${mutedText}`}>
                Textos densos com SEO local, direcao da fotografia e botao "Ligar agora" configurado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSyncToGoogle("Cronograma de 10 Publicações")}
              className="px-4 py-2.5 rounded-xl bg-[#34A853] text-white text-[13px] font-semibold cursor-pointer"
            >
              Agendar Todas as 10 Publicacoes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(pkg.posts || []).map((post) => (
              <div
                key={post.number}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-3 ${borderCol} ${subtleBg}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-[#1A73E8]">
                      PUBLICACAO #{String(post.number).padStart(2, "0")} · {post.objective}
                    </span>
                    <span className="text-[11px] font-mono font-semibold tabular-nums text-[#34A853]">
                      Agendar: {post.scheduledDate}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold">{post.title}</h3>

                  <div
                    className={`p-3 rounded-xl border text-[12.5px] leading-relaxed max-h-[150px] overflow-y-auto whitespace-pre-line ${borderCol} ${
                      dark ? "bg-[#303134]" : "bg-white"
                    }`}
                  >
                    {post.text}
                  </div>

                  <div className={`text-[11.5px] space-y-1 ${mutedText}`}>
                    <div>
                      <strong className={dark ? "text-[#E8EAED]" : "text-[#202124]"}>Direcao da Foto: </strong>
                      {post.imageDirection}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#1A73E8]">
                        <PhoneCall size={12} /> Botao CTA: {post.ctaType} ({post.ctaPhone})
                      </span>
                      <span className="font-mono tabular-nums">{post.charCount} / 1500 caracteres</span>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 border-t ${borderCol} flex items-center justify-between gap-2`}>
                  <button
                    type="button"
                    onClick={() => copyText(post.text, `post-${post.number}`, `Texto da Publicação #${post.number} copiado!`)}
                    className="px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === `post-${post.number}` ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === `post-${post.number}` ? "Texto Copiado" : "Copiar Texto do Post"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSyncToGoogle(`Publicação #${post.number}`)}
                    className={`px-3 py-2 rounded-xl border text-[12px] font-semibold cursor-pointer ${borderCol}`}
                  >
                    Agendar no Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 5: NOMES SEO DE FOTOS & TRANSFERÊNCIA PROGRESSIVA PARA O SITE EXPRESS */}
      {activeTab === "photos_site" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Media Manager & SEO Renaming */}
          <div className={`lg:col-span-6 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#1A73E8]">
                  Gestão de Mídia & SEO de Imagens (Proporção 4:3 e 1:1)
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Fotos da Empresa com Nomes Otimizados</h2>
              </div>
              <button
                type="button"
                onClick={() => copyText((pkg.photoSeoNames || []).join("\n"), "seo-photos", "Lista de nomes SEO copiada")}
                className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-semibold cursor-pointer"
              >
                Copiar Lista
              </button>
            </div>

            {/* Interactive Upload Box */}
            <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-2">
              <Upload size={22} className="mx-auto text-blue-600" />
              <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                Selecione fotos da fachada, produtos ou equipe
              </div>
              <p className="text-[11.5px] text-slate-500">
                Gere metadados e nomes SEO automáticos para envio direto ao Perfil do Google
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                <span>Adicionar Foto Local</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = () => {
                      const tag = "Fachada Comercial";
                      const cleanSlug = (pkg.businessName || "empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      const seoName = `${cleanSlug}-fachada-${(pkg.city || "cidade").toLowerCase()}-${userPhotos.length + 1}.jpg`;
                      setUserPhotos((prev) => [...prev, { url: r.result, tag, seoName }]);
                      toast.success("Foto adicionada com nomenclatura SEO");
                    };
                    r.readAsDataURL(file);
                  }}
                />
              </label>
            </div>

            {/* User photos gallery if uploaded */}
            {userPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {userPhotos.map((p, i) => (
                  <div key={i} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                    <img src={p.url} alt={p.seoName} className="w-full h-24 object-cover rounded-lg" />
                    <div className="text-[11px] font-mono truncate text-blue-600">{p.seoName}</div>
                    <div className="text-[10px] text-slate-400">Tag: {p.tag}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SEO Filenames List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(pkg.photoSeoNames || []).map((fname, idx) => (
                <div
                  key={idx}
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-[12px] font-mono ${borderCol} ${subtleBg}`}
                >
                  <span className="truncate">{fname}</span>
                  <button
                    type="button"
                    onClick={() => copyText(fname, `fn-${idx}`, `Nome "${fname}" copiado`)}
                    className="text-[#1A73E8] shrink-0 cursor-pointer"
                  >
                    {copiedId === `fn-${idx}` ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Progressive Site Briefing (BRIEFING_SITE_DO_GBP.md) */}
          <div className={`lg:col-span-6 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="border-b pb-3 border-inherit">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#34A853]">
                Transferencia Automatica @pacote-gbp para @pacote-site
              </div>
              <h2 className="text-[17px] font-bold mt-0.5">Briefing Progressivo do Site Express</h2>
              <p className={`text-[12.5px] mt-0.5 ${mutedText}`}>
                Todos os dados confirmados na otimizacao do Google Meu Negocio ja estao estruturados para gerar o site sem retrabalho.
              </p>
            </div>

            {pkg.siteBriefing && (
              <div className={`p-4 rounded-xl border space-y-3 text-[13px] ${borderCol} ${subtleBg}`}>
                <div>
                  <span className={`font-semibold ${mutedText}`}>Modelo de Pagina Recomendado: </span>
                  <div className="font-bold text-[#1A73E8] mt-0.5">{pkg.siteBriefing.recommendedSiteModel}</div>
                </div>
                <div>
                  <span className={`font-semibold ${mutedText}`}>Headline Principal (Hero): </span>
                  <div className="font-semibold mt-0.5">{pkg.siteBriefing.heroHeadline}</div>
                </div>
                <div>
                  <span className={`font-semibold ${mutedText}`}>Subtitulo Persuasivo: </span>
                  <div className={`mt-0.5 ${mutedText}`}>{pkg.siteBriefing.heroSubheadline}</div>
                </div>
                <div>
                  <span className={`font-semibold ${mutedText}`}>Palavras-Chave Locais Integradas: </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(pkg.siteBriefing.localKeywords || []).slice(0, 6).map((kw, i) => (
                      <span key={i} className={`text-[11.5px] px-2.5 py-1 rounded-md border ${borderCol}`}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onOpenSiteExpressWithBriefing && onOpenSiteExpressWithBriefing(activeBusiness, pkg)}
              className="w-full py-3.5 px-5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Layers size={17} />
              <span>Construir Site Express Agora com estes Dados</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
