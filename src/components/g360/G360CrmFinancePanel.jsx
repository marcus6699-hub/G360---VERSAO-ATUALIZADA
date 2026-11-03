import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  FileText,
  FileSignature,
  Plus,
  Phone,
  BadgeCheck,
  ArrowRight,
  Trash2,
  Printer,
  Copy,
  Check,
  Sparkles,
  Layers,
  X,
  Upload,
  Link2,
  Send,
  Download,
  QrCode,
  Globe,
  Edit3,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Bell,
  ExternalLink,
  CheckCircle2,
  Power,
  PowerOff,
  RefreshCw,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const CRM_STAGES = [
  { id: "prospeccao", label: "01. Em Negociação", accent: "#7C3AED" },
  { id: "proposta", label: "02. Contrato Gerado", accent: "#F59E0B" },
  { id: "otimizacao", label: "03. Em Otimização GBP / Site", accent: "#8B5CF6" },
  { id: "fechado", label: "04. Concluído / Ativo", accent: "#16A34A" },
];

const INITIAL_THREE_PACKAGES = [
  {
    id: "pkg_site_placa",
    badge: "PACOTE 01 · MAIS VENDIDO",
    name: "Site Profissional + Placa de Avaliação Google (NFC + QR Code)",
    variant: "Site Express + Display Acrílico NFC/QR Code",
    variants: [
      "Site Express + Display Acrílico NFC/QR Code",
      "Site Institucional + 2 Placas NFC/QR Code",
      "Landing Page + Card NFC + Placa de Balcão",
    ],
    price: 997,
    billing: "Pagamento Único",
    description:
      "Criação de Site Profissional de alta conversão integrado ao WhatsApp e Google Maps + Placa física de Avaliação Google com aproximação NFC e QR Code dinâmico para multiplicar avaliações 5 estrelas.",
  },
  {
    id: "pkg_only_site",
    badge: "PACOTE 02 · PRESENÇA WEB",
    name: "Somente Site Profissional",
    variant: "Landing Page de Alta Conversão",
    variants: [
      "Landing Page de Alta Conversão",
      "Site Institucional Completo (Multi-Seções)",
      "Loja Virtual / Catálogo com Pedido no WhatsApp",
    ],
    price: 697,
    billing: "Pagamento Único",
    description:
      "Desenvolvimento de site profissional responsivo (Mobile First), otimizado para SEO Local com Schema.org LocalBusiness, galeria comercial, botão flutuante de WhatsApp e carregamento ultra-rápido.",
  },
  {
    id: "pkg_gbp_seo",
    badge: "PACOTE 03 · RANKING GOOGLE MAPS",
    name: "Pacote de Otimização GBP (Google Meu Negócio)",
    variant: "Pagamento Único (Setup Completo 360º)",
    variants: [
      "Pagamento Único (Setup Completo 360º)",
      "Plano Anual (Setup + 12 Meses de Gestão e Geogrid)",
      "Plano Semestral (Setup + 6 Meses de Postagens e Respostas)",
    ],
    price: 697,
    billing: "Setup Único ou Anual",
    description:
      "Blindagem e verificação da ficha, engenharia de categorias primária e secundárias, descrição SEO de 750 caracteres, cadastro de 15+ serviços semânticos, produtos, cronograma de postagens e respostas com IA.",
  },
];

const DEFAULT_CUSTOM_CONTRACT_TEMPLATE = `CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DIGITAIS E POSICIONAMENTO GOOGLE

CONTRATANTE: {{CLIENTE_NOME}}, inscrita no CNPJ/CPF sob o nº {{CLIENTE_CNPJ}}, localizada em {{CLIENTE_ENDERECO}}, neste ato representada por {{RESPONSAVEL}}.

CONTRATADA (PRESTADOR): {{PRESTADOR_NOME}}, inscrito(a) no CPF sob o nº {{PRESTADOR_CPF}} e RG nº {{PRESTADOR_RG}}, residente e domiciliado(a) em {{PRESTADOR_ENDERECO}}.

CLÁUSULA 1ª — DO OBJETO E ESCOPO DOS SERVIÇOS:
O presente instrumento tem como objeto a execução dos pacotes selecionados na Proposta Comercial G360:
{{ESCOPO_SERVICOS}}

CLÁUSULA 2ª — DO INVESTIMENTO E FORMA DE PAGAMENTO:
Pelos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor total de R$ {{VALOR}}, nas seguintes condições: {{CONDICOES}}.

CLÁUSULA 3ª — DAS OBRIGAÇÕES E PRAZOS:
A CONTRATANTE compromete-se a liberar acesso de Gerente/Proprietário no Google Perfil da Empresa e enviar logotipo e informações básicas. A CONTRATADA iniciará a execução imediatamente após a assinatura pelas partes.

CLÁUSULA 4ª — DA VIGÊNCIA E ASSINATURA:
Este contrato entra em vigor na data de {{DATA}} pelo período de {{VIGENCIA}} meses, sendo firmado pelas partes mediante assinatura física ou eletrônica externa nos termos da MP 2.200-2/2001 e Lei 14.063/2020.`;

// Remount scoped state when the validated backend identity changes.
export default function G360CrmFinancePanel(props) {
  const { user } = useAuth();
  const uid = user?.id || "default-g360";
  return <ScopedG360CrmFinancePanel {...props} key={uid} ownerUid={uid} />;
}

function ScopedG360CrmFinancePanel({
  ownerUid,
  dark = false,
  initialSubView = "kanban", // "kanban" | "proposal" | "contract"
  onOpenGbpPackage,
  onOpenSiteExpress,
  onBack,
}) {
  // Never read or auto-assign old unscoped records; their owner is unknown.
  // Namespacing prevents accidental cross-account reuse, not malicious local access.
  const ownerStorage = {
    getItem: (name) => localStorage.getItem(`g360:${encodeURIComponent(ownerUid)}:${name}`),
    setItem: (name, value) => localStorage.setItem(`g360:${encodeURIComponent(ownerUid)}:${name}`, value),
  };
  const [subView, setSubView] = useState(
    initialSubView === "finance" ? "kanban" : initialSubView
  );
  const [leads, setLeads] = useState([]);

  // Track which Stage 1 leads have "Proposta Enviada" badge active & which workflows were completed
  const [proposalSentMap, setProposalSentMap] = useState(() => {
    try {
      return JSON.parse(ownerStorage.getItem("g360_crm_proposal_sent") || "{}");
    } catch {
      return {};
    }
  });
  const [workflowCompletionMap, setWorkflowCompletionMap] = useState(() => {
    try {
      return JSON.parse(ownerStorage.getItem("g360_crm_workflow_done") || "{}");
    } catch {
      return {};
    }
  });

  // New Lead Modal
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    cnpj: "",
    city: "Anápolis - GO",
    category: "Comércio Local",
    dealValue: 997,
    stage: "prospeccao",
    notes: "",
  });

  // 3-Package Proposal Generator state
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [packages, setPackages] = useState(() => {
    try {
      const saved = ownerStorage.getItem("g360_three_packages");
      return saved ? JSON.parse(saved) : INITIAL_THREE_PACKAGES;
    } catch {
      return INITIAL_THREE_PACKAGES;
    }
  });
  const [selectedPackageIds, setSelectedPackageIds] = useState(["pkg_site_placa"]);
  const [copiedProposal, setCopiedProposal] = useState(false);

  // Contract Generator state
  const [contractForm, setContractForm] = useState(() => {
    try {
      const saved = ownerStorage.getItem("g360_contract_provider");
      const p = saved ? JSON.parse(saved) : null;
      return {
        clientName: "Encanto Móveis Planejados",
        representativeName: "João da Silva",
        cnpjCpf: "34.512.890/0001-42",
        clientPhone: "(62) 99113-8004",
        address: "Av. João Florentino, Qd 02, LT 20 - Parque Res. das Flores, Anápolis - GO",
        providerName: p?.name || "Consultor / Prestador de Serviços",
        providerCpfCnpj: p?.cpf || "000.000.000-00",
        providerRg: p?.rg || "0000000",
        providerAddress:
          p?.address ||
          "Endereço Comercial / Profissional",
        startDate: new Date().toISOString().slice(0, 10),
        durationMonths: "12",
        paymentTerms: "50% na assinatura via Pix e 50% na entrega da otimização e site",
        externalSignatureUrl: "",
      };
    } catch {
      return {
        clientName: "Encanto Móveis Planejados",
        representativeName: "João da Silva",
        cnpjCpf: "34.512.890/0001-42",
        clientPhone: "(62) 99113-8004",
        address: "Av. João Florentino, Qd 02, LT 20 - Parque Res. das Flores, Anápolis - GO",
        providerName: "Consultor / Prestador de Serviços",
        providerCpfCnpj: "000.000.000-00",
        providerRg: "0000000",
        providerAddress:
          "Endereço Comercial / Profissional",
        startDate: new Date().toISOString().slice(0, 10),
        durationMonths: "12",
        paymentTerms: "50% na assinatura via Pix e 50% na entrega da otimização e site",
        externalSignatureUrl: "",
      };
    }
  });

  const [useCustomTemplate, setUseCustomTemplate] = useState(false);
  const [customContractTemplate, setCustomContractTemplate] = useState(() => {
    try {
      return (
        ownerStorage.getItem("g360_custom_contract_template") ||
        DEFAULT_CUSTOM_CONTRACT_TEMPLATE
      );
    } catch {
      return DEFAULT_CUSTOM_CONTRACT_TEMPLATE;
    }
  });
  const fileInputRef = useRef(null);

  const [lookingUpCnpj, setLookingUpCnpj] = useState(false);
  const [showProviderEdit, setShowProviderEdit] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [savingContract, setSavingContract] = useState(false);
  const [contractsList, setContractsList] = useState([]);
  const [sitesList, setSitesList] = useState([]);
  const [folderFilter, setFolderFilter] = useState("all"); // "all" | "10d" | "15d" | "30d" | "expired"
  const [customDueDates, setCustomDueDates] = useState(() => {
    try {
      return JSON.parse(ownerStorage.getItem("g360_client_due_dates") || "{}");
    } catch {
      return {};
    }
  });

  const savePackagesToStorage = (nextPackages) => {
    setPackages(nextPackages);
    try {
      ownerStorage.setItem("g360_three_packages", JSON.stringify(nextPackages));
    } catch {}
  };

  const handleUpdatePackage = (pkgId, field, value) => {
    const next = packages.map((p) => (p.id === pkgId ? { ...p, [field]: value } : p));
    savePackagesToStorage(next);
  };

  const toggleProposalSentBadge = (leadId) => {
    setProposalSentMap((prev) => {
      const next = { ...prev, [leadId]: !prev[leadId] };
      try {
        ownerStorage.setItem("g360_crm_proposal_sent", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleUpdateProvider = (field, value) => {
    setContractForm((f) => {
      const updated = { ...f, [field]: value };
      try {
        ownerStorage.setItem(
          "g360_contract_provider",
          JSON.stringify({
            name: updated.providerName,
            cpf: updated.providerCpfCnpj,
            rg: updated.providerRg,
            address: updated.providerAddress,
          })
        );
      } catch {}
      return updated;
    });
  };

  useEffect(() => {
    if (initialSubView && initialSubView !== "finance") {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const loadCrm = async () => {
    try {
      const [crmRes, contractsRes, projectsRes] = await Promise.all([
        api.get("/g360/crm"),
        api.get("/g360/contracts").catch(() => ({ data: { contracts: [] } })),
        api.get("/projects").catch(() => ({ data: [] })),
      ]);
      const list = crmRes.data?.leads || [];
      setLeads(list);
      if (list[0] && !selectedLeadId) {
        setSelectedLeadId(list[0].id);
      }
      const cList = contractsRes.data?.contracts || [];
      setContractsList(cList);
      if (cList[0] && !activeContract) {
        setActiveContract(cList[0]);
      }
      const pList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.projects || [];
      setSitesList(pList);
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao carregar o CRM"));
    }
  };

  useEffect(() => {
    loadCrm();
  }, []);

  const handleUpdateDueDate = async (leadId, newDateStr) => {
    setCustomDueDates((prev) => {
      const next = { ...prev, [leadId]: newDateStr };
      try {
        ownerStorage.setItem("g360_client_due_dates", JSON.stringify(next));
      } catch {}
      return next;
    });

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, contractDueDate: newDateStr } : l))
    );

    try {
      await api.put(`/g360/crm/leads/${leadId}`, { contractDueDate: newDateStr });
    } catch {}

    toast.success("Data de vencimento/renovação atualizada na Pasta do Cliente!");
  };

  const handleToggleSiteStatus = async (client, targetStatus) => {
    if (!client.matchedSite) {
      toast.error("Este cliente ainda não possui um site gerado para ativar ou desativar.");
      return;
    }

    const slug = client.matchedSite.slug;
    const projectId = client.matchedSite.id;
    const isSuspending = targetStatus === "suspended";

    try {
      await api.post("/g360/crm/site-status", {
        slug,
        projectId,
        status: targetStatus,
        suspendedReason: isSuspending ? "manual" : undefined,
      });

      setSitesList((prev) =>
        prev.map((s) =>
          s.id === projectId || s.slug === slug
            ? { ...s, status: targetStatus, suspendedReason: isSuspending ? "manual" : undefined }
            : s
        )
      );

      if (isSuspending) {
        toast.success(`Site de "${client.businessName}" foi colocado Fora do Ar (suspenso).`);
      } else {
        toast.success(`Site de "${client.businessName}" agora está No Ar (ativo)!`);
      }
    } catch (err) {
      toast.error(fmtErr(err, "Erro ao alterar status do site"));
    }
  };

  const handleReactivateWithRenewal = async (client, addDays = 30) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + addDays * 86400000);
    const newDueDateStr = futureDate.toISOString().slice(0, 10);

    // 1. Advance due date in state and server
    await handleUpdateDueDate(client.id, newDueDateStr);

    // 2. If client has a site, set it to active
    if (client.matchedSite) {
      await handleToggleSiteStatus(client, "active");
    }

    toast.success(`Contrato renovado (+${addDays} dias) e site de "${client.businessName}" reativado No Ar!`);
  };

  const handleDownloadSignedContractCopy = (contractObj) => {
    const c = contractObj || activeContract;
    if (!c) {
      toast.error("Gere ou selecione um contrato primeiro.");
      return;
    }
    const sig = c.signature || null;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Contrato Digital Assinado — ${escapeHtml(c.clientName || "Cliente")}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; color: #1E293B; padding: 36px; line-height: 1.65; }
  .box { max-width: 820px; margin: 0 auto; border: 1px solid #CBD5E1; padding: 42px; border-radius: 12px; }
  pre { white-space: pre-wrap; font-family: Georgia, serif; font-size: 14px; }
  .cert { margin-top: 32px; padding: 20px; border: 2px solid #16A34A; background: #F0FDF4; border-radius: 12px; font-family: -apple-system, sans-serif; font-size: 12.5px; }
  .hash { margin-top: 12px; padding: 10px; background: #0F172A; color: #F8FAFC; font-family: monospace; font-size: 11px; border-radius: 8px; word-break: break-all; }
</style>
</head>
<body>
  <div class="box">
    <h2 style="text-align:center;margin-top:0;font-family:sans-serif;">CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS G360</h2>
    <pre>${escapeHtml(c.contractText || renderedCustomContractText)}</pre>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:40px;text-align:center;font-family:sans-serif;font-size:13px;">
      <div style="border-top:1px solid #334155;padding-top:12px;">
        ${sig?.signatureDataUrl ? `<img src="${sig.signatureDataUrl}" style="max-height:70px;display:block;margin:0 auto 8px;" />` : ""}
        <strong>${escapeHtml(sig?.signerName || c.representativeName || c.clientName)}</strong><br/>
        CPF/CNPJ: ${escapeHtml(sig?.signerDocument || c.cnpjCpf || "")}<br/>
        (Contratante)
      </div>
      <div style="border-top:1px solid #334155;padding-top:12px;">
        <strong>${escapeHtml(c.providerName || contractForm.providerName)}</strong><br/>
        CPF: ${escapeHtml(c.providerCpfCnpj || contractForm.providerCpfCnpj)}<br/>
        (Contratada / Prestador)
      </div>
    </div>
    <div class="cert">
      <strong style="color:#15803D;font-size:14px;">${sig ? "✅ CERTIFICADO DE ASSINATURA ELETRÔNICA COM VALIDADE JURÍDICA" : "⏳ AGUARDANDO ASSINATURA DO CONTRATANTE"}</strong><br/>
      ${
        sig
          ? `Assinado por <strong>${escapeHtml(sig.signerName)}</strong> (${escapeHtml(sig.signerDocument)}) em <strong>${new Date(sig.signedAt).toLocaleString("pt-BR")}</strong> · IP: <strong>${escapeHtml(sig.clientIp)}</strong><br/>Base Legal: ${escapeHtml(sig.legalBasis || "MP 2.200-2/2001 e Art. 784 §4º CPC")}<div class="hash">SHA-256: ${escapeHtml(sig.sha256Hash)}</div>`
          : `Link oficial para assinatura: ${window.location.origin}/contrato/${c.id}`
      }
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato-${sig ? "Assinado" : "Digital"}-${String(c.clientName || "cliente").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cópia completa do contrato baixada! Use Imprimir -> Salvar como PDF.");
  };

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) || leads[0] || null,
    [leads, selectedLeadId]
  );

  useEffect(() => {
    if (selectedLead) {
      setContractForm((prev) => ({
        ...prev,
        clientName: selectedLead.businessName || prev.clientName,
        representativeName: selectedLead.contactName || prev.representativeName,
        cnpjCpf: selectedLead.cnpj || prev.cnpjCpf || "00.000.000/0001-00",
        clientPhone: selectedLead.phone || prev.clientPhone || "",
        address: selectedLead.address || selectedLead.city || prev.address,
      }));
    }
  }, [selectedLead?.id]);

  const handleMoveStage = async (lead, nextStage, silent = false) => {
    if (!lead?.id) return;
    try {
      const { data } = await api.put(`/g360/crm/leads/${lead.id}`, { stage: nextStage });
      if (data?.lead) {
        setLeads((prev) => prev.map((item) => (item.id === lead.id ? data.lead : item)));
        if (!silent) {
          toast.success(
            `Movido automaticamente para ${
              CRM_STAGES.find((s) => s.id === nextStage)?.label || nextStage
            }`
          );
        }
      }
    } catch (e) {
      if (!silent) toast.error(fmtErr(e, "Erro ao mover card"));
    }
  };

  // Mark GBP or Site Express executed & auto-progress CRM stage
  const handleLaunchWorkflowFromCrm = async (lead, workflowType) => {
    if (!lead) return;
    const prevStatus = workflowCompletionMap[lead.id] || { gbp: false, site: false };
    const updatedStatus = {
      ...prevStatus,
      [workflowType]: true,
    };
    const nextMap = { ...workflowCompletionMap, [lead.id]: updatedStatus };
    setWorkflowCompletionMap(nextMap);
    try {
      ownerStorage.setItem("g360_crm_workflow_done", JSON.stringify(nextMap));
    } catch {}

    // If both GBP Package AND Site Express are done -> Stage 4 (Concluído / Ativo), otherwise Stage 3 (Em Otimização)
    const targetStage =
      updatedStatus.gbp && updatedStatus.site ? "fechado" : "otimizacao";
    await handleMoveStage(lead, targetStage, true);
    toast.success(
      targetStage === "fechado"
        ? `${lead.businessName} concluiu GBP + Site Express e avançou para 04. Concluído / Ativo!`
        : `${lead.businessName} avançou automaticamente para 03. Em Otimização GBP / Site!`
    );

    const bizPayload = {
      name: lead.businessName,
      category: lead.category,
      city: (lead.city || "Anápolis").split("-")[0].trim(),
      phone: lead.phone,
    };
    if (workflowType === "gbp" && onOpenGbpPackage) {
      onOpenGbpPackage(bizPayload);
    } else if (workflowType === "site" && onOpenSiteExpress) {
      onOpenSiteExpress(bizPayload);
    }
  };

  const proposalTotal = useMemo(() => {
    return selectedPackageIds.reduce((sum, id) => {
      const pkg = packages.find((p) => p.id === id);
      return sum + Number(pkg?.price || 0);
    }, 0);
  }, [selectedPackageIds, packages]);

  const selectedPackagesList = useMemo(
    () => packages.filter((p) => selectedPackageIds.includes(p.id)),
    [packages, selectedPackageIds]
  );

  // Native G360 Electronic Signature Link (/contrato/:id) or optional external link
  const generatedClientSignLink = useMemo(() => {
    const ext = contractForm.externalSignatureUrl?.trim();
    if (ext) return ext;
    if (activeContract?.id && typeof window !== "undefined") {
      return `${window.location.origin}/contrato/${activeContract.id}`;
    }
    return "";
  }, [contractForm.externalSignatureUrl, activeContract?.id]);

  const renderedCustomContractText = useMemo(() => {
    const scopeStr =
      selectedPackagesList
        .map((p) => `- ${p.name} (${p.variant}): R$ ${Number(p.price).toLocaleString("pt-BR")}`)
        .join("\n") || "- Pacote Completo de Otimização Google Meu Negócio + Site Express";

    return customContractTemplate
      .replace(/\{\{CLIENTE_NOME\}\}/g, contractForm.clientName || "")
      .replace(/\{\{CLIENTE_CNPJ\}\}/g, contractForm.cnpjCpf || "")
      .replace(/\{\{CLIENTE_ENDERECO\}\}/g, contractForm.address || "")
      .replace(/\{\{RESPONSAVEL\}\}/g, contractForm.representativeName || "")
      .replace(/\{\{PRESTADOR_NOME\}\}/g, contractForm.providerName || "")
      .replace(/\{\{PRESTADOR_CPF\}\}/g, contractForm.providerCpfCnpj || "")
      .replace(/\{\{PRESTADOR_RG\}\}/g, contractForm.providerRg || "")
      .replace(/\{\{PRESTADOR_ENDERECO\}\}/g, contractForm.providerAddress || "")
      .replace(/\{\{ESCOPO_SERVICOS\}\}/g, scopeStr)
      .replace(/\{\{VALOR\}\}/g, `${proposalTotal.toLocaleString("pt-BR")},00`)
      .replace(/\{\{CONDICOES\}\}/g, contractForm.paymentTerms || "")
      .replace(/\{\{DATA\}\}/g, contractForm.startDate || "")
      .replace(/\{\{VIGENCIA\}\}/g, contractForm.durationMonths || "12");
  }, [customContractTemplate, contractForm, selectedPackagesList, proposalTotal]);

  const handleUploadCustomContractFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || "");
      if (content.trim()) {
        setCustomContractTemplate(content);
        setUseCustomTemplate(true);
        try {
          ownerStorage.setItem("g360_custom_contract_template", content);
        } catch {}
        toast.success(`Modelo de contrato "${file.name}" carregado com sucesso!`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAndGenerateContractLink = async (silent = false) => {
    setSavingContract(true);
    try {
      const payload = {
        id: activeContract?.leadId === (selectedLead?.id || "") ? activeContract?.id : undefined,
        leadId: selectedLead?.id || "",
        clientName: contractForm.clientName,
        representativeName: contractForm.representativeName,
        cnpjCpf: contractForm.cnpjCpf,
        clientPhone: contractForm.clientPhone,
        address: contractForm.address,
        providerName: contractForm.providerName,
        providerCpfCnpj: contractForm.providerCpfCnpj,
        providerRg: contractForm.providerRg,
        providerAddress: contractForm.providerAddress,
        totalValue: proposalTotal,
        paymentTerms: contractForm.paymentTerms,
        durationMonths: contractForm.durationMonths,
        startDate: contractForm.startDate,
        selectedPackages: selectedPackagesList,
        contractText: renderedCustomContractText,
        externalSignatureUrl: contractForm.externalSignatureUrl,
      };
      const { data } = await api.post("/g360/contracts", payload);
      if (data?.contract) {
        setActiveContract(data.contract);
        const link = `${window.location.origin}/contrato/${data.contract.id}`;
        if (!silent) {
          navigator.clipboard.writeText(link);
          toast.success("Link oficial de assinatura eletrônica gerado e copiado!");
        }
        return data.contract;
      }
    } catch (e) {
      if (!silent) toast.error(fmtErr(e, "Erro ao gerar contrato digital"));
    } finally {
      setSavingContract(false);
    }
    return null;
  };

  useEffect(() => {
    if (subView === "contract") {
      handleSaveAndGenerateContractLink(true);
    }
  }, [subView, selectedLead?.id]);

  const handleDispatchProposalWhatsApp = () => {
    const client = selectedLead?.businessName || contractForm.clientName || "Cliente";
    const phoneDigits = String(selectedLead?.phone || contractForm.clientPhone || "").replace(
      /\D/g,
      ""
    );
    const itemsText = selectedPackagesList
      .map(
        (pkg) =>
          `✅ *${pkg.name}*\n   Modalidade: ${pkg.variant}\n   Escopo: ${pkg.description}\n   Investimento: *R$ ${Number(
            pkg.price || 0
          ).toLocaleString("pt-BR")},00*`
      )
      .join("\n\n");

    const msg =
      `Olá! Segue a *PROPOSTA COMERCIAL G360* preparada para *${client.toUpperCase()}*:\n\n` +
      `${itemsText}\n\n` +
      `💰 *Investimento Total:* R$ ${proposalTotal.toLocaleString("pt-BR")},00\n` +
      `🚀 *Início:* Imediato após aprovação.\n\n` +
      `Podemos avançar com a emissão do contrato digital?`;

    navigator.clipboard.writeText(msg);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 2500);

    // Mark "Proposta Enviada" badge on the lead in Stage 1
    if (selectedLead?.id) {
      setProposalSentMap((prev) => {
        const next = { ...prev, [selectedLead.id]: true };
        try {
          ownerStorage.setItem("g360_crm_proposal_sent", JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    const waTarget =
      phoneDigits.length >= 10
        ? `https://wa.me/55${phoneDigits.replace(/^55/, "")}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waTarget, "_blank");
    toast.success("Proposta copiada e enviada para o WhatsApp! Marcado como 'Proposta Enviada'.");
  };

  const handleDownloadProposalPdf = () => {
    const rawClient = selectedLead?.businessName || contractForm.clientName || "Cliente";
    const client = escapeHtml(rawClient);
    const provider = escapeHtml(contractForm.providerName);
    const address = escapeHtml(selectedLead?.address || selectedLead?.city || "Anápolis - GO");
    const payment = escapeHtml(contractForm.paymentTerms);
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Proposta Comercial G360 — ${client}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1E293B; background: #F8FAFC; padding: 32px; margin: 0; }
  .sheet { max-width: 820px; margin: 0 auto; background: #FFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 40px; }
  .pkg { border: 1px solid #CBD5E1; border-radius: 12px; padding: 18px; margin-bottom: 14px; background: #F8FAFC; }
  .total { background: #EFF6FF; border: 2px solid #2563EB; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
  @media print { body { background: #FFF; padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #E2E8F0;padding-bottom:18px;margin-bottom:24px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:#2563EB;text-transform:uppercase;">Proposta Comercial Oficial · G360 Intelligence</div>
        <h1 style="margin:4px 0 0;font-size:24px;">${client}</h1>
        <div style="font-size:13px;color:#64748B;margin-top:4px;">${address}</div>
      </div>
      <div style="text-align:right;font-size:13px;color:#64748B;">
        Data: <strong>${new Date().toLocaleDateString("pt-BR")}</strong><br/>
        Consultor: <strong>${provider}</strong>
      </div>
    </div>

    <h3 style="font-size:16px;margin-bottom:12px;">Pacotes e Soluções Selecionadas:</h3>
    ${selectedPackagesList
      .map(
        (pkg) => `
      <div class="pkg">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;">${escapeHtml(pkg.badge)}</span>
            <h4 style="margin:4px 0;font-size:17px;">${escapeHtml(pkg.name)}</h4>
            <div style="font-size:12px;font-weight:600;color:#475569;">Modalidade: ${escapeHtml(pkg.variant)}</div>
          </div>
          <div style="font-size:20px;font-weight:800;color:#1E293B;">R$ ${Number(pkg.price || 0).toLocaleString("pt-BR")},00</div>
        </div>
        <p style="font-size:13px;color:#475569;margin:10px 0 0;line-height:1.5;">${escapeHtml(pkg.description)}</p>
      </div>`
      )
      .join("")}

    <div class="total">
      <div>
        <div style="font-size:14px;font-weight:700;color:#1E293B;">INVESTIMENTO TOTAL APROVADO</div>
        <div style="font-size:12px;color:#475569;">Condição sugerida: ${payment}</div>
      </div>
      <div style="font-size:28px;font-weight:800;color:#2563EB;">R$ ${proposalTotal.toLocaleString("pt-BR")},00</div>
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Proposta-G360-${rawClient.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Proposta HTML baixada. Para PDF, use Imprimir e Salvar como PDF no navegador.");
  };

  const handleWhatsAppContractDispatch = async () => {
    const savedContract = await handleSaveAndGenerateContractLink(true);
    if (selectedLead && selectedLead.stage === "prospeccao") {
      await handleMoveStage(selectedLead, "proposta", true);
    }
    const signUrl =
      contractForm.externalSignatureUrl?.trim() ||
      (savedContract?.id ? `${window.location.origin}/contrato/${savedContract.id}` : generatedClientSignLink);

    const phoneDigits = String(contractForm.clientPhone || selectedLead?.phone || "").replace(
      /\D/g,
      ""
    );
    const pkgSummary = selectedPackagesList
      .map((p) => `• ${p.name} (${p.variant})`)
      .join("\n");

    const text =
      `Olá *${contractForm.representativeName}* (*${contractForm.clientName}*), segue o *Contrato Digital de Prestação de Serviços G360* para conferência e assinatura eletrônica:\n\n` +
      `📄 *Escopo Contratado:*\n${pkgSummary}\n\n` +
      `👤 *Contratado / Prestador:* ${contractForm.providerName}${contractForm.providerCpfCnpj ? ` (CPF/CNPJ: ${contractForm.providerCpfCnpj})` : ""}\n` +
      `💳 *Valor Total:* R$ ${proposalTotal.toLocaleString("pt-BR")},00\n` +
      `📌 *Condições:* ${contractForm.paymentTerms}\n\n` +
      `✍️ *Clique no link abaixo para ler e assinar digitalmente na tela do celular (com validade jurídica MP 2.200-2/2001 e Certificado SHA-256):*\n${signUrl}\n\n` +
      `Assim que assinar, o certificado digital é liberado na hora!`;

    navigator.clipboard.writeText(text);
    const waTarget =
      phoneDigits.length >= 10
        ? `https://wa.me/55${phoneDigits.replace(/^55/, "")}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waTarget, "_blank");
    toast.success("Contrato Digital com link de assinatura enviado para o WhatsApp!");
  };

  const handleDownloadContractPdf = async () => {
    if (selectedLead && selectedLead.stage === "prospeccao") {
      await handleMoveStage(selectedLead, "proposta", true);
    }
    const safeClientName = escapeHtml(contractForm.clientName);
    const safeRepName = escapeHtml(contractForm.representativeName);
    const safeCnpjCpf = escapeHtml(contractForm.cnpjCpf);
    const safeProviderName = escapeHtml(contractForm.providerName);
    const safeProviderCpfCnpj = escapeHtml(contractForm.providerCpfCnpj);
    const safeProviderRg = escapeHtml(contractForm.providerRg);
    const safeSignLink = escapeHtml(generatedClientSignLink);
    const safeContractText = escapeHtml(renderedCustomContractText);

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Contrato de Prestação de Serviços — ${safeClientName}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; color: #1E293B; background: #F8FAFC; padding: 32px; margin: 0; line-height: 1.65; }
  .sheet { max-width: 820px; margin: 0 auto; background: #FFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 48px; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
  .sig-box { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: center; }
  .sig-line { border-top: 1px solid #1E293B; padding-top: 8px; font-family: sans-serif; font-size: 13px; }
  @media print { body { background: #FFF; padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div style="text-align:center;border-bottom:2px solid #1E293B;padding-bottom:16px;margin-bottom:24px;font-family:sans-serif;">
      <div style="font-size:11px;font-weight:700;color:#2563EB;letter-spacing:1px;text-transform:uppercase;">Instrumento Particular de Prestação de Serviços (MP 2.200-2/2001)</div>
      <h1 style="font-size:20px;margin:6px 0 0;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS G360</h1>
    </div>
    <pre>${safeContractText}</pre>
    <div class="sig-box">
      <div class="sig-line">
        <strong>${safeRepName}</strong><br/>
        ${safeClientName} — CNPJ/CPF: ${safeCnpjCpf}<br/>
        (Contratante)
      </div>
      <div class="sig-line">
        <strong>${safeProviderName}</strong><br/>
        CPF: ${safeProviderCpfCnpj} · RG: ${safeProviderRg}<br/>
        (Contratado / Prestador)
      </div>
    </div>
    <div style="margin-top:28px;padding:14px;border:1px solid #CBD5E1;background:#F8FAFC;border-radius:8px;font-family:sans-serif;font-size:12px;color:#334155;">
      <strong>Status do Instrumento:</strong> Minuta emitida em ${new Date().toLocaleDateString("pt-BR")} — Aguardando assinatura das partes (via plataforma externa ou assinatura física presencial).<br/>
      ${
        safeSignLink
          ? `<strong>Link Externo de Assinatura:</strong> <a href="${safeSignLink}" target="_blank" rel="noopener noreferrer">${safeSignLink}</a>`
          : "Para assinatura eletrônica válida, utilize uma plataforma especializada (Autentique, ZapSign ou Gov.br)."
      }
    </div>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Minuta-Contrato-G360-${(contractForm.clientName || "cliente")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Minuta HTML baixada para conferência. Para PDF, imprima pelo navegador.");
  };

  const handleEmailDispatch = () => {
    const subject = encodeURIComponent(
      `Contrato Digital de Prestação de Serviços G360 - ${contractForm.clientName}`
    );
    const body = encodeURIComponent(
      `${renderedCustomContractText}\n\nLink para Assinatura Eletrônica:\n${generatedClientSignLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    toast.success("Cliente de E-mail aberto com o contrato completo e link de assinatura!");
  };

  const handleCnpjLookup = async (rawCnpj, target = "contract") => {
    const clean = String(rawCnpj || "").replace(/\D/g, "");
    if (clean.length !== 14) {
      toast.error("Digite os 14 números do CNPJ para consultar gratuitamente na Receita/BrasilAPI.");
      return;
    }
    setLookingUpCnpj(true);
    try {
      const { data } = await api.post("/g360/cnpj-lookup", { cnpj: clean });
      const info = data?.data;
      if (info) {
        if (target === "contract") {
          setContractForm((prev) => ({
            ...prev,
            cnpjCpf: info.cnpj || prev.cnpjCpf,
            clientName: info.nomeFantasia || info.razaoSocial || prev.clientName,
            representativeName: info.responsavelSugerido || prev.representativeName,
            address: info.enderecoCompleto || prev.address,
            clientPhone: info.telefone || prev.clientPhone,
          }));
        } else {
          setNewLeadForm((prev) => ({
            ...prev,
            cnpj: info.cnpj || prev.cnpj,
            businessName: info.nomeFantasia || info.razaoSocial || prev.businessName,
            contactName: info.responsavelSugerido || prev.contactName,
            phone: info.telefone || prev.phone,
            city: info.cidade && info.uf ? `${info.cidade} - ${info.uf}` : prev.city,
            category: info.cnaePrincipal || prev.category,
            notes: `Razão Social: ${info.razaoSocial} | Situação: ${info.situacao} | CNAE: ${info.cnaePrincipal}`,
          }));
        }
        toast.success(`Dados reais carregados via ${data.source}!`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Não foi possível consultar este CNPJ agora"));
    } finally {
      setLookingUpCnpj(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!newLeadForm.businessName.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    try {
      const { data } = await api.post("/g360/crm/leads", newLeadForm);
      if (data?.lead) {
        setLeads((prev) => [data.lead, ...prev]);
        setNewLeadOpen(false);
        setNewLeadForm({
          businessName: "",
          contactName: "",
          phone: "",
          cnpj: "",
          city: "Anápolis - GO",
          category: "Comércio Local",
          dealValue: 997,
          stage: "prospeccao",
          notes: "",
        });
        toast.success("Empresa adicionada ao funil CRM na coluna 01. Em Negociação!");
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao salvar lead"));
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      await api.delete(`/g360/crm/leads/${id}`);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead removido do CRM");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao remover lead"));
    }
  };

  const cardClass = dark
    ? "bg-[#14121E] border border-white/[0.08] text-[#EDE9FE] shadow-[0_4px_20px_rgba(0,0,0,0.35)] rounded-2xl"
    : "bg-white border border-slate-200/80 text-[#1A1033] shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl";
  const mutedText = dark ? "text-[#9D98B3]" : "text-[#64748B]";
  const subtleBg = dark ? "bg-white/[0.04]" : "bg-slate-50";
  const borderCol = dark ? "border-white/[0.08]" : "border-slate-200/80";

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[13px] font-bold cursor-pointer transition-colors shadow-sm"
        >
          ← Voltar para Auditoria
        </button>
      )}
      {/* TOP BAR: Navigation between Kanban CRM, 3-Package Proposal Generator, and Contract Generator */}
      <section className={`rounded-2xl p-5 sm:p-6 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
              Gestão Comercial Automática G360
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-extrabold tracking-tight mt-0.5 text-[#1A1033] dark:text-[#EDE9FE]">
              Funil CRM Inteligente, 3 Pacotes de Proposta e Contrato Digital com Link
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "kanban", label: "Funil CRM (4 Etapas)", icon: Briefcase },
              { id: "folders", label: "Pasta de Clientes & Vencimentos (30/15/10d)", icon: FolderOpen },
              { id: "proposal", label: "Gerador de Proposta (3 Pacotes)", icon: FileText },
              { id: "contract", label: "Emitir Contrato Digital", icon: FileSignature },
            ].map((item) => {
              const Icon = item.icon;
              const active = subView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubView(item.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] border-transparent text-white shadow-md shadow-purple-500/20"
                      : `${borderCol} ${subtleBg} ${mutedText} hover:text-[#7C3AED] hover:border-[#7C3AED]`
                  }`}
                  data-testid={`crm-tab-${item.id}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setNewLeadOpen(true)}
              className="px-4 py-2 rounded-full bg-[#16A34A] hover:opacity-90 text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              data-testid="crm-new-lead-btn"
            >
              <Plus size={15} /> Novo Lead
            </button>
          </div>
        </div>
      </section>

      {/* VIEW: PASTA DE CLIENTES 360° & ALERTAS DE VENCIMENTO (30, 15, 10 DIAS) */}
      {subView === "folders" && (() => {
        const todayMs = new Date().setHours(0, 0, 0, 0);
        const enrichedClients = leads.map((ld, idx) => {
          // Default staggered due dates (10 days, 15 days, 28 days) so consultant immediately sees 30/15/10 day expiration alerts
          const defaultOffsetDays = idx === 0 ? 10 : idx === 1 ? 15 : idx === 2 ? 28 : 45;
          const fallbackDate = new Date(todayMs + defaultOffsetDays * 86400000).toISOString().slice(0, 10);
          const dueDateStr = customDueDates[ld.id] || ld.contractDueDate || fallbackDate;
          const dueMs = new Date(dueDateStr + "T00:00:00").getTime();
          const daysRemaining = Math.ceil((dueMs - todayMs) / 86400000);

          const matchedContract = contractsList.find(
            (c) =>
              c.leadId === ld.id ||
              String(c.clientName || "").toLowerCase() === String(ld.businessName || "").toLowerCase()
          );
          const matchedSite = sitesList.find(
            (s) =>
              String(s.business_name || s.name || "").toLowerCase() === String(ld.businessName || "").toLowerCase() ||
              s.slug === ld.projectSlug
          );

          let alertLevel = "ok"; // "expired" | "10d" | "15d" | "30d" | "ok"
          if (daysRemaining < 0) alertLevel = "expired";
          else if (daysRemaining <= 10) alertLevel = "10d";
          else if (daysRemaining <= 15) alertLevel = "15d";
          else if (daysRemaining <= 30) alertLevel = "30d";

          return {
            ...ld,
            dueDateStr,
            daysRemaining,
            alertLevel,
            matchedContract,
            matchedSite,
          };
        });

        const count10d = enrichedClients.filter((c) => c.daysRemaining >= 0 && c.daysRemaining <= 10).length;
        const count15d = enrichedClients.filter((c) => c.daysRemaining > 10 && c.daysRemaining <= 15).length;
        const count30d = enrichedClients.filter((c) => c.daysRemaining > 15 && c.daysRemaining <= 30).length;
        const countExpired = enrichedClients.filter((c) => c.daysRemaining < 0).length;

        const filteredClients = enrichedClients.filter((c) => {
          if (folderFilter === "10d") return c.daysRemaining >= 0 && c.daysRemaining <= 10;
          if (folderFilter === "15d") return c.daysRemaining >= 0 && c.daysRemaining <= 15;
          if (folderFilter === "30d") return c.daysRemaining >= 0 && c.daysRemaining <= 30;
          if (folderFilter === "expired") return c.daysRemaining < 0;
          return true;
        });

        return (
          <div className="space-y-6" data-testid="client-folders-360-view">
            {/* Expiration Radar Cards: 10 Dias, 15 Dias, 30 Dias & Vencidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <button
                type="button"
                onClick={() => setFolderFilter("all")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  folderFilter === "all" ? "ring-2 ring-[#7C3AED]" : ""
                } ${cardClass}`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                  Total de Pastas
                </div>
                <div className="text-[28px] font-black mt-1 tabular-nums">{enrichedClients.length}</div>
                <div className={`text-[11.5px] ${mutedText}`}>Clientes com dossiê 360°</div>
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter("10d")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  folderFilter === "10d" ? "ring-2 ring-[#EF4444]" : ""
                } ${cardClass}`}
                data-testid="filter-due-10d"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#EF4444]">
                    Aviso 10 Dias
                  </span>
                  <Bell size={15} className="text-[#EF4444]" />
                </div>
                <div className="text-[28px] font-black mt-1 text-[#EF4444] tabular-nums">{count10d}</div>
                <div className={`text-[11.5px] ${mutedText}`}>Vencem em até 10 dias</div>
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter("15d")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  folderFilter === "15d" ? "ring-2 ring-[#F59E0B]" : ""
                } ${cardClass}`}
                data-testid="filter-due-15d"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F59E0B]">
                    Aviso 15 Dias
                  </span>
                  <AlertTriangle size={15} className="text-[#F59E0B]" />
                </div>
                <div className="text-[28px] font-black mt-1 text-[#F59E0B] tabular-nums">{count15d}</div>
                <div className={`text-[11.5px] ${mutedText}`}>Vencem entre 11 e 15 dias</div>
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter("30d")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  folderFilter === "30d" ? "ring-2 ring-[#3B82F6]" : ""
                } ${cardClass}`}
                data-testid="filter-due-30d"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3B82F6]">
                    Aviso 30 Dias
                  </span>
                  <Calendar size={15} className="text-[#3B82F6]" />
                </div>
                <div className="text-[28px] font-black mt-1 text-[#3B82F6] tabular-nums">{count30d}</div>
                <div className={`text-[11.5px] ${mutedText}`}>Vencem entre 16 e 30 dias</div>
              </button>

              <button
                type="button"
                onClick={() => setFolderFilter("expired")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  folderFilter === "expired" ? "ring-2 ring-rose-600" : ""
                } ${cardClass}`}
              >
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                  Vencidos
                </div>
                <div className="text-[28px] font-black mt-1 text-rose-600 tabular-nums">{countExpired}</div>
                <div className={`text-[11.5px] ${mutedText}`}>Renovação imediata</div>
              </button>
            </div>

            {/* Client 360° Folders List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredClients.map((client) => {
                const badgeColor =
                  client.daysRemaining < 0
                    ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
                    : client.daysRemaining <= 10
                    ? "bg-red-500/15 text-red-500 border-red-500/30"
                    : client.daysRemaining <= 15
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                    : client.daysRemaining <= 30
                    ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                    : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";

                const badgeText =
                  client.daysRemaining < 0
                    ? `VENCIDO HÁ ${Math.abs(client.daysRemaining)} DIAS`
                    : client.daysRemaining <= 10
                    ? `⚠️ ALERTA 10 DIAS: Vence em ${client.daysRemaining}d`
                    : client.daysRemaining <= 15
                    ? `🔔 ALERTA 15 DIAS: Vence em ${client.daysRemaining}d`
                    : client.daysRemaining <= 30
                    ? `📅 ALERTA 30 DIAS: Vence em ${client.daysRemaining}d`
                    : `Em dia (${client.daysRemaining} dias restantes)`;

                const siteUrl =
                  client.websiteUrl ||
                  (client.matchedSite?.slug ? `/site/${client.matchedSite.slug}` : "");

                const waPhone = String(client.whatsapp || client.phone || "").replace(/\D/g, "");
                const renewalMsg =
                  `Olá *${client.contactName || client.businessName}*! Tudo bem?\n\n` +
                  `Passando para lembrar que o ciclo do nosso contrato/manutenção digital da *${client.businessName}* vence em *${new Date(
                    client.dueDateStr + "T12:00:00"
                  ).toLocaleDateString("pt-BR")}* (${
                    client.daysRemaining >= 0 ? `faltam ${client.daysRemaining} dias` : "vencido"
                  }).\n\n` +
                  `Deseja confirmar a renovação para mantermos o posicionamento no Google Meu Negócio e o Site Express ativos?`;

                return (
                  <div
                    key={client.id}
                    className={`p-5 rounded-2xl border space-y-4 ${cardClass}`}
                    data-testid={`client-folder-card-${client.id}`}
                  >
                    {/* Folder Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-inherit">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] flex items-center justify-center shrink-0">
                          <FolderOpen size={22} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-[17px]">{client.businessName}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeColor}`}>
                              {badgeText}
                            </span>
                            {client.matchedSite && client.daysRemaining < 0 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1"
                                title="Site fora do ar automaticamente pelo vencimento do contrato"
                              >
                                <PowerOff size={10} /> Site Fora do Ar (Vencido)
                              </span>
                            )}
                            {client.matchedSite && client.daysRemaining >= 0 && client.matchedSite.status === "suspended" && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1"
                                title="Site desativado manualmente pelo consultor"
                              >
                                <PowerOff size={10} /> Site Fora do Ar (Pausado)
                              </span>
                            )}
                            {client.matchedSite && client.daysRemaining >= 0 && client.matchedSite.status !== "suspended" && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1"
                                title="Site online e acessível publicamente"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Site No Ar
                              </span>
                            )}
                          </div>
                          <div className={`text-[12px] mt-0.5 ${mutedText}`}>
                            Responsável: <strong>{client.contactName || "Diretoria"}</strong> · {client.phone} · {client.city}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className={`text-[11px] font-bold ${mutedText}`}>Vencimento:</label>
                        <input
                          type="date"
                          value={client.dueDateStr}
                          onChange={(e) => handleUpdateDueDate(client.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg border text-[12px] font-mono outline-none ${borderCol} ${subtleBg}`}
                          title="Alterar data de vencimento (ao colocar data futura o site volta ao ar automaticamente)"
                        />
                      </div>
                    </div>

                    {/* 4-Pillar Client Assets Grid: Contrato, Site Gerado, Pacote GBP & Diagnóstico */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                      {/* 1. Contrato Digital */}
                      <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#7C3AED] flex items-center gap-1.5">
                            <FileSignature size={14} /> 1. Contrato do Cliente
                          </span>
                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                              client.matchedContract?.status === "signed"
                                ? "bg-emerald-500/20 text-emerald-500"
                                : "bg-amber-500/20 text-amber-500"
                            }`}
                          >
                            {client.matchedContract?.status === "signed" ? "Assinado (SHA-256)" : "Pendente / Minuta"}
                          </span>
                        </div>
                        <div className={`text-[11.5px] ${mutedText}`}>
                          Valor: <strong>R$ {Number(client.dealValue || 997).toLocaleString("pt-BR")},00</strong>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {client.matchedContract ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDownloadSignedContractCopy(client.matchedContract)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Download size={12} /> Baixar Contrato PDF
                              </button>
                              <a
                                href={`/contrato/${client.matchedContract.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold flex items-center gap-1 ${borderCol}`}
                              >
                                <ExternalLink size={12} /> Ver Link
                              </a>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLeadId(client.id);
                                setSubView("contract");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <FileSignature size={12} /> Emitir Contrato Agora
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2. Site Gerado do Cliente & Controle No Ar / Fora do Ar */}
                      {(() => {
                        const hasSite = Boolean(client.matchedSite || siteUrl);
                        const isExpired = client.daysRemaining < 0;
                        const isManuallySuspended = client.matchedSite?.status === "suspended";
                        const isForcedActive = client.matchedSite?.status === "forced_active";
                        const isOffline = hasSite && (isManuallySuspended || (isExpired && !isForcedActive));

                        let siteStatusBadge;
                        if (!hasSite) {
                          siteStatusBadge = (
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400">
                              Ainda não gerado
                            </span>
                          );
                        } else if (isExpired && !isForcedActive) {
                          siteStatusBadge = (
                            <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                              <PowerOff size={11} /> Fora do Ar (Vencido)
                            </span>
                          );
                        } else if (isManuallySuspended) {
                          siteStatusBadge = (
                            <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                              <PowerOff size={11} /> Fora do Ar (Pausado)
                            </span>
                          );
                        } else {
                          siteStatusBadge = (
                            <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> No Ar (Ativo)
                            </span>
                          );
                        }

                        return (
                          <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2.5`}>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[#7C3AED] flex items-center gap-1.5">
                                <Globe size={14} /> 2. Site Express do Cliente
                              </span>
                              {siteStatusBadge}
                            </div>

                            {/* Automatic Expiration Warning Banner if Contract Expired */}
                            {hasSite && isExpired && !isForcedActive && (
                              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-500 space-y-1">
                                <div className="font-extrabold flex items-center gap-1">
                                  <AlertTriangle size={13} /> Site fora do ar automaticamente
                                </div>
                                <div className="leading-relaxed text-[10.5px] opacity-90">
                                  O contrato deste cliente venceu há <strong>{Math.abs(client.daysRemaining)} dias</strong>. Conforme regra do sistema, o site sai do ar sozinho ao vencer o contrato para garantir a renovação.
                                </div>
                              </div>
                            )}

                            {/* Manual Pause Notice */}
                            {hasSite && isManuallySuspended && !isExpired && (
                              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-500">
                                ⏸️ <strong>Site pausado manualmente:</strong> Visitantes que acessarem verão a tela de site temporariamente indisponível.
                              </div>
                            )}

                            <div className={`text-[11.5px] truncate ${mutedText}`}>
                              {siteUrl ? `URL: ${siteUrl}` : "Gere ou edite o site oficial em 1 clique"}
                            </div>

                            {/* Action Buttons: Toggle No Ar / Fora do Ar, Renovar, Abrir e Editar */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {hasSite && (
                                <>
                                  {isOffline ? (
                                    <>
                                      {isExpired && (
                                        <button
                                          type="button"
                                          onClick={() => handleReactivateWithRenewal(client, 30)}
                                          className="px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                                          title="Estende o vencimento por 30 dias e reativa o site imediatamente"
                                        >
                                          <RefreshCw size={11} /> Reativar (+30 dias)
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSiteStatus(client, "active")}
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                                        title="Colocar o site no ar imediatamente"
                                      >
                                        <Power size={11} /> Colocar No Ar
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSiteStatus(client, "suspended")}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                                      title="Tirar o site do ar (exibirá página de indisponível)"
                                    >
                                      <PowerOff size={11} /> Tirar do Ar
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleLaunchWorkflowFromCrm(client, "site")}
                                className="px-2.5 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Layers size={11} /> {siteUrl ? "Editar Site" : "Gerar Site Express"}
                              </button>

                              {siteUrl && (
                                <a
                                  href={siteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${borderCol}`}
                                  title="Testar como o site aparece para o público"
                                >
                                  <ExternalLink size={11} /> Abrir Site
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 3. Pacote GBP do Cliente */}
                      <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#7C3AED] flex items-center gap-1.5">
                            <Sparkles size={14} /> 3. Pacote GBP (Ficha Google)
                          </span>
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[#7C3AED]">
                            Score {client.gbpScoreBefore || 45}% → {client.gbpScoreAfter || 92}%
                          </span>
                        </div>
                        <div className={`text-[11.5px] ${mutedText}`}>
                          Descrição 750c, 20 Serviços, Produtos, 11 Posts e Fotos SEO
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleLaunchWorkflowFromCrm(client, "gbp")}
                            className="w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            data-testid={`open-client-gbp-btn-${client.id}`}
                          >
                            <Sparkles size={12} /> Acessar Pacote GBP Deste Cliente
                          </button>
                        </div>
                      </div>

                      {/* 4. Aviso de Vencimento / Renovação (30, 15, 10 dias) */}
                      <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#16A34A] flex items-center gap-1.5">
                            <Bell size={14} /> 4. Cobrança & Renovação
                          </span>
                          <span className="text-[10.5px] font-mono font-bold">
                            {new Date(client.dueDateStr + "T12:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className={`text-[11.5px] ${mutedText}`}>
                          Dispare lembrete de 30, 15 ou 10 dias direto no WhatsApp
                        </div>
                        <div className="pt-1 flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${waPhone ? `55${waPhone.replace(/^55/, "")}` : ""}?text=${encodeURIComponent(renewalMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5"
                          >
                            <Phone size={12} /> Avisar Vencimento no WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* VIEW 1: KANBAN CRM WITH AUTOMATIC PROGRESSION */}
      {subView === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {CRM_STAGES.map((stg, stgIdx) => {
            const stageLeads = leads.filter((l) => l.stage === stg.id);
            const stageSum = stageLeads.reduce((a, b) => a + Number(b.dealValue || 0), 0);
            const nextStageId = CRM_STAGES[stgIdx + 1]?.id;

            return (
              <div
                key={stg.id}
                className={`rounded-2xl p-4 space-y-3 min-h-[500px] flex flex-col ${cardClass}`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-inherit">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stg.accent }}
                    />
                    <h2 className="font-bold text-[13.5px]">{stg.label}</h2>
                  </div>
                  <span className="text-[11.5px] font-mono font-bold tabular-nums text-[#7C3AED] dark:text-[#A78BFA]">
                    R$ {stageSum.toLocaleString("pt-BR")} ({stageLeads.length})
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageLeads.map((ld) => {
                    const isProposalSent = Boolean(proposalSentMap[ld.id]);
                    const wf = workflowCompletionMap[ld.id] || { gbp: false, site: false };

                    return (
                      <div
                        key={ld.id}
                        className={`p-4 rounded-xl border space-y-3 transition-all ${borderCol} ${subtleBg}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-[14px] leading-snug">{ld.businessName}</div>
                            <div className={`text-[11.5px] ${mutedText}`}>
                              {ld.category} · {ld.city}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(ld.id)}
                            className={`p-1 rounded hover:bg-black/10 ${mutedText}`}
                            title="Excluir lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Stage 1 Quick Yellow Badge Toggle: "Proposta Enviada" */}
                        {stg.id === "prospeccao" && (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => toggleProposalSentBadge(ld.id)}
                              className={`w-full py-1 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-between border transition-all cursor-pointer ${
                                isProposalSent
                                  ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]"
                                  : `${borderCol} ${mutedText} hover:border-[#F59E0B]`
                              }`}
                            >
                              <span>
                                {isProposalSent
                                  ? "✓ Proposta Enviada ao Cliente"
                                  : "Marcar: Proposta Enviada"}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isProposalSent ? "bg-[#F59E0B]" : "bg-slate-400"
                                }`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Progress indicators for GBP & Site Express */}
                        {(wf.gbp || wf.site || stg.id === "otimizacao" || stg.id === "fechado") && (
                          <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                wf.gbp || stg.id === "fechado"
                                  ? "bg-[#DCFCE7] text-[#15803D]"
                                  : "bg-[#FEF3C7] text-[#B45309]"
                              }`}
                            >
                              GBP: {wf.gbp || stg.id === "fechado" ? "Gerado ✓" : "Pendente"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                wf.site || stg.id === "fechado"
                                  ? "bg-[#DCFCE7] text-[#15803D]"
                                  : "bg-[#FEF3C7] text-[#B45309]"
                              }`}
                            >
                              Site: {wf.site || stg.id === "fechado" ? "Criado ✓" : "Pendente"}
                            </span>
                            {stg.id === "fechado" && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-normal border border-amber-200 dark:border-amber-900/60">
                                Assinatura externa não verificada
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                          <span className="font-mono font-bold text-[#16A34A] tabular-nums">
                            R$ {Number(ld.dealValue || 0).toLocaleString("pt-BR")}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums">
                            {ld.gbpScoreBefore !== null && ld.gbpScoreBefore !== undefined ? (
                              <>
                                Score: <strong className="text-[#EF4444]">{ld.gbpScoreBefore}</strong>
                                {ld.gbpScoreAfter !== null && ld.gbpScoreAfter !== undefined ? (
                                  <> → <strong className="text-[#16A34A]">{ld.gbpScoreAfter}</strong></>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-400">Score: Não auditado</span>
                            )}
                          </span>
                        </div>

                        {ld.notes && (
                          <p className={`text-[11.5px] leading-relaxed line-clamp-2 ${mutedText}`}>
                            {ld.notes}
                          </p>
                        )}

                        {/* Quick Action Buttons inside each CRM Card */}
                        <div className="pt-2 border-t border-inherit grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(ld.id);
                              setSubView("proposal");
                            }}
                            className={`py-1.5 px-2 rounded-full border text-center transition-all hover:border-[#7C3AED] hover:text-[#7C3AED] cursor-pointer ${borderCol}`}
                          >
                            Gerar Proposta
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLeadId(ld.id);
                              setSubView("contract");
                            }}
                            className={`py-1.5 px-2 rounded-full border text-center transition-all hover:border-[#7C3AED] hover:text-[#7C3AED] cursor-pointer ${borderCol}`}
                          >
                            Emitir Contrato
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLaunchWorkflowFromCrm(ld, "gbp")}
                            className="py-1.5 px-2 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] dark:text-[#A78BFA] text-center hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                          >
                            Pacote GBP
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLaunchWorkflowFromCrm(ld, "site")}
                            className="py-1.5 px-2 rounded-full bg-[#16A34A]/15 text-[#16A34A] text-center hover:bg-[#16A34A] hover:text-white transition-colors cursor-pointer"
                          >
                            Site Express
                          </button>
                        </div>

                        {nextStageId && (
                          <button
                            type="button"
                            onClick={() => handleMoveStage(ld, nextStageId)}
                            className="w-full py-2 px-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white text-[11.5px] font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all cursor-pointer"
                          >
                            <span>Avançar Etapa</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: 3 CUSTOMIZABLE PACKAGES PROPOSAL GENERATOR */}
      {subView === "proposal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 3 Customizable Package Cards */}
          <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-inherit">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                  3 Pacotes Comerciais Personalizáveis
                </div>
                <h2 className="text-[18px] font-extrabold mt-0.5 text-[#1A1033] dark:text-[#EDE9FE]">
                  Escolha e Edite os Pacotes da Proposta
                </h2>
              </div>

              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className={`px-3.5 py-2 rounded-xl border text-[13px] font-semibold outline-none focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    Cliente: {l.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {packages.map((pkg, idx) => {
                const checked = selectedPackageIds.includes(pkg.id);
                const PkgIcon = idx === 0 ? QrCode : idx === 1 ? Globe : Sparkles;

                return (
                  <div
                    key={pkg.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                      checked
                        ? dark
                          ? "bg-[#7C3AED]/20 border-[#A78BFA]"
                          : "bg-[#F5F3FF] border-[#7C3AED] shadow-sm"
                        : `${borderCol} ${subtleBg}`
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPackageIds((prev) => [...prev, pkg.id]);
                            } else {
                              setSelectedPackageIds((prev) => prev.filter((id) => id !== pkg.id));
                            }
                          }}
                          className="mt-1 w-4 h-4 accent-[#7C3AED]"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                            <PkgIcon size={13} />
                            <span>{pkg.badge}</span>
                          </div>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleUpdatePackage(pkg.id, "name", e.target.value)}
                            className="w-full font-bold text-[15px] bg-transparent border-b border-transparent focus:border-[#7C3AED] outline-none"
                          />
                        </div>
                      </label>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[12px] font-bold ${mutedText}`}>R$</span>
                        <input
                          type="number"
                          value={pkg.price}
                          onChange={(e) =>
                            handleUpdatePackage(pkg.id, "price", Number(e.target.value || 0))
                          }
                          className={`w-28 px-3 py-1.5 rounded-xl border font-mono font-extrabold text-[15px] text-right tabular-nums outline-none ${borderCol} ${
                            dark ? "bg-[#202124]" : "bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Variant / Modality Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                          Modalidade / Tipo do Pacote:
                        </label>
                        <select
                          value={pkg.variant}
                          onChange={(e) => handleUpdatePackage(pkg.id, "variant", e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-[12.5px] font-semibold outline-none ${borderCol} ${
                            dark ? "bg-[#202124]" : "bg-white"
                          }`}
                        >
                          {(pkg.variants || []).map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                          Formato de Cobrança:
                        </label>
                        <input
                          type="text"
                          value={pkg.billing}
                          onChange={(e) => handleUpdatePackage(pkg.id, "billing", e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-[12.5px] font-medium outline-none ${borderCol} ${
                            dark ? "bg-[#202124]" : "bg-white"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                        Descrição e Entregáveis do Pacote (Editável):
                      </label>
                      <textarea
                        rows={2}
                        value={pkg.description}
                        onChange={(e) => handleUpdatePackage(pkg.id, "description", e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-[12.5px] leading-relaxed outline-none ${borderCol} ${
                          dark ? "bg-[#202124]" : "bg-white"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Proposal Preview & Direct WhatsApp / PDF Dispatch */}
          <div className={`lg:col-span-5 rounded-2xl p-6 space-y-5 ${cardClass}`}>
            <div className="pb-4 border-b border-inherit flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                  Documento Oficial G360
                </div>
                <h3 className="text-[20px] font-extrabold mt-0.5 text-[#1A1033] dark:text-[#EDE9FE]">Proposta Comercial</h3>
              </div>
              <span className={`text-[12px] font-mono ${mutedText}`}>
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 text-[13px] ${borderCol} ${subtleBg}`}>
              <div className={mutedText}>Empresa Destinatária:</div>
              <div className="font-bold text-[16px] text-[#1A1033] dark:text-[#EDE9FE]">
                {selectedLead?.businessName || "Cliente Selecionado"}
              </div>
              <div className={mutedText}>
                {selectedLead?.address || selectedLead?.city || "Anápolis - GO"} · Score Atual:{" "}
                <strong className="text-[#DC2626]">{selectedLead?.gbpScoreBefore || 44}/100</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>
                Pacotes Selecionados ({selectedPackagesList.length}):
              </div>
              {selectedPackagesList.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`p-3.5 rounded-xl border space-y-1 text-[13px] ${borderCol} ${subtleBg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#7C3AED] dark:text-[#A78BFA]">
                        {pkg.badge}
                      </span>
                      <div className="font-bold text-[#1A1033] dark:text-[#EDE9FE]">{pkg.name}</div>
                      <div className={`text-[11.5px] font-semibold ${mutedText}`}>
                        Modalidade: {pkg.variant}
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-[14px] tabular-nums shrink-0 text-[#16A34A]">
                      R$ {Number(pkg.price || 0).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className={`text-[12px] pt-1 ${mutedText}`}>{pkg.description}</p>
                </div>
              ))}
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${borderCol} ${subtleBg}`}>
              <span className="font-bold text-[14px]">Investimento Total</span>
              <span className="text-[24px] font-mono font-extrabold text-[#7C3AED] dark:text-[#A78BFA] tabular-nums">
                R$ {proposalTotal.toLocaleString("pt-BR")},00
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDispatchProposalWhatsApp}
                data-testid="dispatch-proposal-whatsapp-btn"
                className="py-3 px-4 rounded-full bg-[#16A34A] hover:opacity-95 text-white font-semibold text-[13px] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {copiedProposal ? <Check size={16} /> : <Send size={16} />}
                <span>{copiedProposal ? "Enviado!" : "Disparar para WhatsApp"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadProposalPdf}
                data-testid="save-proposal-pdf-btn"
                className="py-3 px-4 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] hover:opacity-95 text-white font-semibold text-[13px] flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
              >
                <Download size={16} />
                <span>Baixar proposta HTML</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: DIGITAL CONTRACT GENERATOR WITH UPLOAD & ELECTRONIC SIGNATURE LINK */}
      {subView === "contract" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="pb-3 border-b border-inherit flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] dark:text-[#A78BFA]">
                  Emissão Instantânea + Link de Assinatura
                </div>
                <h2 className="text-[18px] font-extrabold mt-0.5 text-[#1A1033] dark:text-[#EDE9FE]">Configurar Contrato Digital</h2>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.html"
                onChange={handleUploadCustomContractFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`px-3.5 py-1.5 rounded-full border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${borderCol} ${subtleBg} hover:border-[#7C3AED] hover:text-[#7C3AED]`}
                title="Subir seu próprio modelo de contrato (.txt, .md, .html)"
              >
                <Upload size={14} className="text-[#7C3AED] dark:text-[#A78BFA]" />
                <span>Subir Meu Contrato</span>
              </button>
            </div>

            <div className="space-y-4 text-[13px]">
              {/* Prestador: Marcus Henrique Pires Dias */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1.5">
                    <Check size={14} /> Seus Dados (Prestador Salvo)
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProviderEdit(!showProviderEdit)}
                    className="text-[11px] font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:underline cursor-pointer"
                  >
                    {showProviderEdit ? "Recolher" : "Editar meus dados"}
                  </button>
                </div>

                {!showProviderEdit ? (
                  <div className="text-[12px] space-y-0.5 opacity-90">
                    <div className="font-bold">{contractForm.providerName}</div>
                    <div className={mutedText}>
                      CPF: {contractForm.providerCpfCnpj} · RG: {contractForm.providerRg}
                    </div>
                    <div className={`text-[11px] ${mutedText} truncate`}>
                      {contractForm.providerAddress}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 text-[12px]">
                    <div>
                      <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={contractForm.providerName}
                        onChange={(e) => handleUpdateProvider("providerName", e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg border outline-none ${borderCol} ${subtleBg}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                          CPF
                        </label>
                        <input
                          type="text"
                          value={contractForm.providerCpfCnpj}
                          onChange={(e) => handleUpdateProvider("providerCpfCnpj", e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg border outline-none ${borderCol} ${subtleBg}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                          RG
                        </label>
                        <input
                          type="text"
                          value={contractForm.providerRg}
                          onChange={(e) => handleUpdateProvider("providerRg", e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg border outline-none ${borderCol} ${subtleBg}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={contractForm.providerAddress}
                        onChange={(e) => handleUpdateProvider("providerAddress", e.target.value)}
                        className={`w-full px-3 py-1.5 rounded-lg border outline-none ${borderCol} ${subtleBg}`}
                      />
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <span className="font-bold">Nota de Privacidade:</span>
                      <span>Seus dados cadastrais ficam salvos exclusivamente no seu navegador local (localStorage) para sua conveniência. Não salve dados sensíveis em computadores públicos ou compartilhados.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Client fields */}
              <div className="p-3.5 rounded-xl border border-inherit space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  2. Dados do Cliente (Contratante)
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Nome da Empresa / Cliente
                  </label>
                  <input
                    type="text"
                    value={contractForm.clientName}
                    onChange={(e) => setContractForm((f) => ({ ...f, clientName: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                      Responsável Legal
                    </label>
                    <input
                      type="text"
                      value={contractForm.representativeName}
                      onChange={(e) =>
                        setContractForm((f) => ({ ...f, representativeName: e.target.value }))
                      }
                      className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                      WhatsApp do Cliente
                    </label>
                    <input
                      type="text"
                      value={contractForm.clientPhone}
                      onChange={(e) =>
                        setContractForm((f) => ({ ...f, clientPhone: e.target.value }))
                      }
                      placeholder="(62) 99999-9999"
                      className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-semibold uppercase ${mutedText}`}>
                      CNPJ ou CPF do Cliente
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCnpjLookup(contractForm.cnpjCpf, "contract")}
                      disabled={lookingUpCnpj}
                      className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      {lookingUpCnpj ? "Consultando..." : "Puxar pelo CNPJ"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={contractForm.cnpjCpf}
                    onChange={(e) => setContractForm((f) => ({ ...f, cnpjCpf: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Endereço do Cliente
                  </label>
                  <input
                    type="text"
                    value={contractForm.address}
                    onChange={(e) => setContractForm((f) => ({ ...f, address: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Condições de Pagamento
                  </label>
                  <input
                    type="text"
                    value={contractForm.paymentTerms}
                    onChange={(e) => setContractForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
              </div>

              {/* Electronic Signature Link (G360 Native Link + Optional Autentique / ZapSign / Gov.br) */}
              <div className={`p-3.5 rounded-xl border space-y-2.5 ${borderCol} ${subtleBg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                    <Link2 size={14} /> Link Oficial de Assinatura Digital (/contrato/:id)
                  </span>
                  <div className="flex items-center gap-2">
                    {generatedClientSignLink && (
                      <a
                        href={generatedClientSignLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="open-contract-sign-page-link"
                        className="text-[11px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1"
                      >
                        Abrir Página
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedClientSignLink);
                        toast.success("Link de assinatura eletrônica copiado!");
                      }}
                      className="text-[11px] font-bold text-[#2563EB] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} /> Copiar Link
                    </button>
                  </div>
                </div>
                {generatedClientSignLink && (
                  <div
                    data-testid="crm-generated-contract-link"
                    className={`text-[11.5px] font-mono break-all p-2.5 rounded-lg border text-emerald-600 dark:text-emerald-400 font-bold ${borderCol} ${
                      dark ? "bg-[#151126]" : "bg-white"
                    }`}
                  >
                    {generatedClientSignLink}
                  </div>
                )}
                <input
                  type="text"
                  value={contractForm.externalSignatureUrl}
                  onChange={(e) =>
                    setContractForm((f) => ({ ...f, externalSignatureUrl: e.target.value }))
                  }
                  placeholder="Opcional: Cole link do Autentique, ZapSign ou Gov.br se preferir externo"
                  className={`w-full px-3 py-1.5 rounded-lg border text-[11.5px] outline-none ${borderCol} ${
                    dark ? "bg-[#303134]" : "bg-white"
                  }`}
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {activeContract?.status === "signed" && activeContract?.signature ? (
                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-[12px] space-y-1.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <BadgeCheck size={16} /> Contrato Assinado Digitalmente!
                  </div>
                  <div className="text-[11.5px]">
                    Assinado por <strong>{activeContract.signature.signerName}</strong> ({activeContract.signature.signerDocument}) em{" "}
                    {new Date(activeContract.signature.signedAt).toLocaleString("pt-BR")}.
                  </div>
                  <div className="text-[10.5px] font-mono break-all opacity-80">
                    SHA-256: {activeContract.signature.sha256Hash}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-[12px] space-y-1">
                  <div className="font-bold text-[#7C3AED] flex items-center gap-1.5">
                    <FileSignature size={15} /> Assinatura Eletrônica Nativa Ativa (MP 2.200-2/2001)
                  </div>
                  <p className="text-[11.5px] opacity-90 leading-relaxed">
                    Ao disparar no WhatsApp, o cliente recebe o link exclusivo para assinar na tela do celular com registro de IP, data/hora e certificado criptográfico SHA-256.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={savingContract}
                onClick={() => handleSaveAndGenerateContractLink(false)}
                data-testid="generate-contract-link-btn"
                className="w-full py-2.5 rounded-xl font-bold text-[12.5px] flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-md hover:opacity-95"
              >
                <FileSignature size={15} />
                <span>
                  {savingContract
                    ? "Atualizando Link de Assinatura..."
                    : "Atualizar e Copiar Link de Assinatura (/contrato/:id)"}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppContractDispatch}
                  data-testid="dispatch-contract-whatsapp-btn"
                  className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:opacity-95 text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone size={14} /> Disparar c/ Link no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleEmailDispatch}
                  className="py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText size={14} /> Enviar por E-mail
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadContractPdf}
                data-testid="download-contract-pdf-btn"
                className={`w-full py-2.5 rounded-xl border font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer ${borderCol} ${subtleBg} hover:border-[#7C3AED]`}
              >
                <Download size={15} /> Baixar Contrato HTML / Imprimir PDF
              </button>
            </div>
          </div>

          {/* Right: Contract Document Preview & Custom Clause Editor */}
          <div className={`lg:col-span-7 rounded-2xl p-6 sm:p-8 space-y-4 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4 border-inherit">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED]">
                  Instrumento Particular de Prestação de Serviços Digitais
                </div>
                <h3 className="text-[18px] font-bold mt-0.5">
                  CONTRATO DIGITAL G360 & ASSINATURA ELETRÔNICA
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setUseCustomTemplate((v) => !v)}
                className={`px-3 py-1.5 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol} ${subtleBg}`}
              >
                <Edit3 size={14} className="text-[#7C3AED]" />
                <span>{useCustomTemplate ? "Ver Prévia Formatada" : "Editar Minhas Cláusulas"}</span>
              </button>
            </div>

            {useCustomTemplate ? (
              <div className="space-y-3">
                <div className={`text-[12px] p-3 rounded-xl border ${borderCol} ${subtleBg}`}>
                  Edite livremente seu contrato abaixo ou suba um arquivo <code>.txt/.md</code>. As variáveis{" "}
                  <code>{"{{CLIENTE_NOME}}"}</code>, <code>{"{{CLIENTE_CNPJ}}"}</code>,{" "}
                  <code>{"{{RESPONSAVEL}}"}</code>, <code>{"{{VALOR}}"}</code> e{" "}
                  <code>{"{{ESCOPO_SERVICOS}}"}</code> são preenchidas automaticamente.
                </div>
                <textarea
                  rows={16}
                  value={customContractTemplate}
                  onChange={(e) => {
                    setCustomContractTemplate(e.target.value);
                    try {
                      ownerStorage.setItem("g360_custom_contract_template", e.target.value);
                    } catch {}
                  }}
                  className={`w-full p-4 rounded-xl border font-mono text-[12.5px] leading-relaxed outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
            ) : (
              <div className="space-y-3 text-[13px] leading-relaxed">
                <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                  {renderedCustomContractText}
                </pre>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                  <div className={`pt-3 border-t ${borderCol}`}>
                    {activeContract?.signature?.signatureDataUrl && (
                      <img
                        src={activeContract.signature.signatureDataUrl}
                        alt="Assinatura Contratante"
                        className="max-h-16 mx-auto mb-1 object-contain"
                      />
                    )}
                    <div className="font-bold">{contractForm.representativeName}</div>
                    <div className={`text-[11px] ${mutedText}`}>
                      {contractForm.clientName} (Contratante)
                    </div>
                  </div>
                  <div className={`pt-3 border-t ${borderCol}`}>
                    <div className="font-bold">{contractForm.providerName}</div>
                    <div className={`text-[11px] ${mutedText}`}>
                      Contratado(a) (CPF: {contractForm.providerCpfCnpj} | RG:{" "}
                      {contractForm.providerRg || "5056144"})
                    </div>
                  </div>
                </div>

                <div className={`mt-4 p-4 rounded-xl border ${borderCol} ${subtleBg} space-y-2 text-[12px]`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-[#7C3AED] flex items-center gap-1.5">
                      <FileSignature size={15} />{" "}
                      {activeContract?.status === "signed"
                        ? "Certificado de Assinatura Eletrônica Emitido"
                        : "Link de Assinatura Eletrônica Pronto para Envio"}
                    </div>
                    <span
                      className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                        activeContract?.status === "signed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                      }`}
                    >
                      {activeContract?.status === "signed" ? "Assinado com Hash SHA-256" : "Pronto para Assinar"}
                    </span>
                  </div>
                  <p className={`text-[11.5px] leading-relaxed ${mutedText}`}>
                    Instrumento particular em conformidade com o Art. 10, § 2º da MP 2.200-2/2001 e Art. 784, § 4º do CPC.
                  </p>
                  {generatedClientSignLink && (
                    <div className="pt-2 border-t border-inherit text-[11px] font-mono break-all text-emerald-600 dark:text-emerald-400">
                      <strong>Link Oficial do Signatário:</strong>{" "}
                      <a href={generatedClientSignLink} target="_blank" rel="noopener noreferrer" className="underline">
                        {generatedClientSignLink}
                      </a>
                    </div>
                  )}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadSignedContractCopy(activeContract)}
                      className="px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                      data-testid="download-signed-contract-pdf-btn"
                    >
                      <Download size={14} />
                      <span>Baixar / Imprimir Cópia do Contrato com Assinatura e Certificado SHA-256</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {newLeadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLead}
            className={`max-w-md w-full rounded-2xl border p-6 space-y-4 ${
              dark ? "bg-[#303134] border-[#5F6368] text-[#E8EAED]" : "bg-white border-[#CBD5E1] text-[#1E293B]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-[17px] font-bold">Adicionar Empresa ao CRM</h3>
              <button type="button" onClick={() => setNewLeadOpen(false)} className={mutedText}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block text-[11px] font-semibold uppercase ${mutedText}`}>
                    CNPJ (Opcional — Preenchimento Automático Gratuito)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCnpjLookup(newLeadForm.cnpj, "lead")}
                    disabled={lookingUpCnpj}
                    className="text-[11px] font-bold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    {lookingUpCnpj ? "Buscando..." : "Buscar na Receita"}
                  </button>
                </div>
                <input
                  type="text"
                  value={newLeadForm.cnpj}
                  onChange={(e) => setNewLeadForm((f) => ({ ...f, cnpj: e.target.value }))}
                  placeholder="Digite os 14 números do CNPJ e clique em Buscar"
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.businessName}
                  onChange={(e) => setNewLeadForm((f) => ({ ...f, businessName: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Contato / Dono
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm((f) => ({ ...f, contactName: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm((f) => ({ ...f, phone: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm((f) => ({ ...f, city: e.target.value }))}
                    className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                    Valor Estimado (R$)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.dealValue}
                    onChange={(e) =>
                      setNewLeadForm((f) => ({ ...f, dealValue: Number(e.target.value || 0) }))
                    }
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm((f) => ({ ...f, notes: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewLeadOpen(false)}
                className={`px-4 py-2 rounded-xl border text-[13px] font-semibold ${borderCol}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold cursor-pointer"
              >
                Salvar no CRM
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
