import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Globe,
  Download,
  ExternalLink,
  Building2,
  Rocket,
  Edit3,
  ChevronRight,
  Trash2,
  Database,
  Save,
  UserCheck,
  RefreshCw,
  CloudUpload,
  Copy,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Archive,
  Eye,
  Monitor,
  Smartphone,
  X,
  BadgeCheck,
  Check,
  Activity,
  Star,
  MapPin,
  MessageSquare,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import { SITE_TEMPLATES } from "@/lib/sitegen/theme";
import { generateSiteHtml, downloadSiteZip } from "@/lib/sitegen/generateSiteHtml";
import { createProjectData } from "@/lib/sitegen/projectFactory";
import {
  auth,
  googleSignIn,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  saveLandingPageToFirestore,
  listUserLandingPagesFromFirestore,
  deleteLandingPageFromFirestore,
} from "@/firebase";
import { GoogleSignInButton } from "./GoogleWorkspacePanel";

export function formatPhone(val) {
  if (!val) return "";
  const clean = String(val).replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

export function getRecommendedTemplate(biz) {
  if (!biz) return "vitrine-express";
  const hay = `${biz.name || ""} ${biz.category || ""} ${biz.segment || ""} ${biz.realNiche || ""} ${biz.bio || ""}`.toLowerCase();
  if (/m[oó]vei|colch|colch[aã]o|cama\s*box|estofad|sof[aá]|decora|ambiente|planejad|novo\s*lar/i.test(hay)) {
    return "novolar-moveis"; // Modelo #08 · Mega Vitrine & Móveis
  }
  if (/g[aá]s|glp|botij[aã]o|distribuidora|farm[aá]cia|drogaria|pe[cç]a|autope[cç]a|oficina|mecanic|ferragen|ferramenta|material|constru[cç][aã]o|dep[oó]sito|supermercado|mercado|com[eé]rcio|loja\b|varejo/.test(hay)) {
    return "vitrine-express"; // Modelo #07 · Comércio & Varejo
  }
  if (/restauran|pizz|hamburg|lanche|churrasc|bar\b|bistro|pamonh|a[cç]a[ií]|sorvet|massa|comida|marmita/.test(hay)) {
    return "simprao"; // Modelo #04 · Gastronomia & Delivery
  }
  if (/padar|confeitar|doceri|caf[eé]|bolo|torta|salgado|encomenda/.test(hay)) {
    return "zycron-padaria"; // Modelo #02 · Padarias & Cafeterias
  }
  if (/moda|roupa|boutique|cal[cç]ado|vestu|joia|semijoia|acess[oó]rio|[oó]tica|decora[cç][aã]o/.test(hay)) {
    return "zycron-moda"; // Modelo #03 · Vitrine & Moda
  }
  if (/barbe|cabelo\s*masculino|tatu|tattoo|studio\s*ink|moto|lava\s*jato|est[uú]dio/.test(hay)) {
    return "zycron-barbearia"; // Modelo #01 · Barbearias & Serviços
  }
  if (/cl[ií]nic|m[eé]dic|odonto|dentist|psicol|fisioter|advoc|advog|consultor|cont[aá]bil|contabil|engenhar|b2b/.test(hay)) {
    return "modelo-premium"; // Modelo #06 · Executivo & Clínicas
  }
  if (/est[eé]tic|beleza|sal[aã]o|manicure|pedicure|sobrancelha|c[ií]lio|depila|massag|spa|atelie|costura/.test(hay)) {
    return "atelie-val"; // Modelo #05 · Estética & Ateliê
  }
  return "vitrine-express";
}

// Live miniature website preview helper (renders the real generated site HTML instead of a static sketch)
function renderLiveTemplateIframePreview(tpl, htmlDoc) {
  return (
    <div className="relative h-[185px] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-white/10 shadow-inner">
      <iframe
        title={`Preview Real ${tpl.name}`}
        srcDoc={htmlDoc}
        className="border-0 pointer-events-none origin-top-left bg-white"
        style={{
          width: "285%",
          height: "530px",
          transform: "scale(0.351)",
        }}
        sandbox="allow-same-origin"
      />
    </div>
  );
}

export default function G360SiteExpressDirectPanel({
  dark = false,
  activeBusiness,
  projects = [],
  onQuickGenerate,
  onOpenEditor,
  onOpenTemplates,
  onOpenVisualBriefing,
  onProjectsChanged,
  onSwitchToStandaloneSiteExpress,
  onBack,
}) {
  const [query, setQuery] = useState(activeBusiness?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedBiz, setSelectedBiz] = useState(activeBusiness || null);
  const [selectedTplId, setSelectedTplId] = useState(
    activeBusiness?.recommended_template || getRecommendedTemplate(activeBusiness) || "vitrine-express"
  );
  const [previewModalTpl, setPreviewModalTpl] = useState(null);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [selectedPaletteId, setSelectedPaletteId] = useState("purple_royal");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [generatingPrd, setGeneratingPrd] = useState(false);
  const [clonedPrd, setClonedPrd] = useState(null);
  const [buildingCloneModal, setBuildingCloneModal] = useState(false);
  const [buildStepIdx, setBuildStepIdx] = useState(0);

  const [deployingId, setDeployingId] = useState("");
  const [deployProvider, setDeployProvider] = useState("vercel");
  const [vercelToken, setVercelToken] = useState("");
  const [deployUrlMap, setDeployUrlMap] = useState({});
  const [reviewsDiagLoading, setReviewsDiagLoading] = useState(false);
  const [reviewsDiagOpen, setReviewsDiagOpen] = useState(false);
  const [reviewsDiagResult, setReviewsDiagResult] = useState(null);
  const [transformingProfilePhotos, setTransformingProfilePhotos] = useState(false);
  const boxRef = useRef(null);
  const timerRef = useRef(null);

  const previewBizForCards = useMemo(() => {
    const base = selectedBiz || activeBusiness;
    if (base && base.name) return base;
    return {
      name: query.trim() || "Móveis Novo Lar",
      category: "Loja de Móveis, Colchões e Eletro",
      city: "Anápolis",
      uf: "GO",
      phone: "(62) 99113-8004",
      whatsapp: "5562991138004",
      rating: 4.9,
      reviews_count: 128,
    };
  }, [selectedBiz, activeBusiness, query]);

  const livePreviewHtmlByTemplate = useMemo(() => {
    const map = {};
    for (const tpl of SITE_TEMPLATES) {
      try {
        const projData = createProjectData(previewBizForCards, tpl.archetype, tpl.id);
        map[tpl.id] = generateSiteHtml(projData, { editor: false });
      } catch {
        map[tpl.id] = "<html><body style='background:#0f172a;color:#fff;font-family:sans-serif;padding:20px'>Carregando preview...</body></html>";
      }
    }
    return map;
  }, [previewBizForCards]);

  const handleRunReviewsDiagnostic = async () => {
    const target = selectedBiz || activeBusiness || { name: query.trim() || "Empresa Local", city: "Anápolis" };
    setReviewsDiagLoading(true);
    setReviewsDiagOpen(true);
    try {
      const { data } = await api.post("/places/reviews-diagnostic", {
        placeId: target.place_id || target.id || "",
        businessName: target.name,
        city: target.city || "Anápolis",
        category: target.category || target.segment || "",
        rating: target.rating || 4.9,
        existingReviews: Array.isArray(target.reviews) ? target.reviews : [],
      });
      setReviewsDiagResult(data);
      if (Array.isArray(data?.parsedReviews) && data.parsedReviews.length > 0) {
        setSelectedBiz((prev) =>
          prev
            ? {
                ...prev,
                reviews: data.parsedReviews,
                _reviewsTrace: data.trace,
              }
            : {
                ...target,
                reviews: data.parsedReviews,
                _reviewsTrace: data.trace,
              }
        );
        toast.success(
          `Diagnóstico GMN concluído: ${data.parsedReviews.length} avaliações reais mapeadas para o estado do site!`
        );
      } else {
        toast.info("Diagnóstico concluído. Verifique o log de rede abaixo.");
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao executar diagnóstico do endpoint de avaliações GMN"));
    } finally {
      setReviewsDiagLoading(false);
    }
  };

  const handleTransformProfilePhotosWithNanoBanana = async () => {
    const target = selectedBiz || activeBusiness;
    if (!target) {
      toast.error("Selecione uma empresa da ficha Google primeiro.");
      return;
    }
    setTransformingProfilePhotos(true);
    try {
      const { data } = await api.post("/ai/transform-profile-photos", {
        business: target,
        maxPhotos: 4,
        imageSize: "1K",
      });
      if (data?.ok) {
        setSelectedBiz((prev) => {
          const base = prev || target;
          return {
            ...base,
            photos: data.photos || base.photos,
            nanoBananaSlotImages: data.slotImages || base.nanoBananaSlotImages,
          };
        });
        toast.success(
          `${data.transformedCount || 4} fotos da ficha Google transformadas em imagens de estúdio para o site (${data.modelUsed || "Nano Banana 2.1"})!`
        );
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao transformar fotos da ficha com Nano Banana 2.1"));
    } finally {
      setTransformingProfilePhotos(false);
    }
  };

  const COLOR_PALETTES = [
    { id: "purple_royal", name: "Roxo G360 Royal", primary: "#7C3AED", secondary: "#1E1B4B" },
    { id: "emerald_trust", name: "Esmeralda Conversão", primary: "#10B981", secondary: "#064E3B" },
    { id: "amber_industrial", name: "Âmbar Industrial & Obras", primary: "#F59E0B", secondary: "#1E293B" },
    { id: "obsidian_gold", name: "Obsidian & Gold Premium", primary: "#D97706", secondary: "#090D16" },
    { id: "ocean_clinic", name: "Azul Clean & Saúde", primary: "#2563EB", secondary: "#0F172A" },
  ];

  const CLONE_BUILD_STEPS = [
    "Lendo arquitetura visual e blocos de conversão do site de referência...",
    "Aplicando diretrizes do PRD e paleta de cores selecionada...",
    "Injetando fotos reais da ficha Google, avaliações e diferenciais...",
    "Estruturando vitrine de serviços, produtos e botões de WhatsApp...",
    "Finalizando código HTML5 responsivo e abrindo o Editor Visual...",
  ];

  const handleGenerateClonePrd = async () => {
    if (!referenceUrl.trim()) {
      toast.error("Cole a URL de um site de referência primeiro (ex: https://www.apple.com/br/iphone/)");
      return;
    }
    setGeneratingPrd(true);
    try {
      const targetBiz = selectedBiz || activeBusiness || { name: query || "Sua Empresa", city: "Anápolis" };
      const { data } = await api.post("/g360/clone-site-prd", {
        referenceUrl: referenceUrl.trim(),
        business: targetBiz,
      });
      if (data?.prd) {
        setClonedPrd(data.prd);
        if (data.prd.recommendedTemplateId) {
          const exists = SITE_TEMPLATES.some((t) => t.id === data.prd.recommendedTemplateId);
          if (exists) setSelectedTplId(data.prd.recommendedTemplateId);
        }
        if (data.prd.recommendedPaletteId) {
          setSelectedPaletteId(data.prd.recommendedPaletteId);
        }
        toast.success("Briefing PRD e estrutura de clonagem gerados com IA!");
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao analisar URL de referência com IA"));
    } finally {
      setGeneratingPrd(false);
    }
  };

  const handleBuildClonedSite = async () => {
    const baseBiz = selectedBiz || activeBusiness || {
      name: query || "Sua Empresa",
      category: "Negócio Local",
      city: "Anápolis",
      uf: "GO",
      phone: "(62) 99113-8004",
    };
    const enrichedBiz = {
      ...baseBiz,
      heroHeadline: clonedPrd?.heroHeadline || baseBiz.heroHeadline,
      heroSubheadline: clonedPrd?.heroSubheadline || baseBiz.heroSubheadline,
      bio: clonedPrd?.heroSubheadline || baseBiz.bio,
      about: clonedPrd?.prdDocument || baseBiz.about,
      preferredPalette: selectedPaletteId,
      referenceUrl: referenceUrl.trim(),
    };
    setBuildingCloneModal(true);
    setBuildStepIdx(0);
    for (let i = 1; i < CLONE_BUILD_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 420));
      setBuildStepIdx(i);
    }
    const tpl = SITE_TEMPLATES.find((t) => t.id === selectedTplId) || SITE_TEMPLATES[0];
    setBuildingCloneModal(false);
    if (onQuickGenerate) {
      await onQuickGenerate(enrichedBiz, tpl.archetype, tpl.id);
    }
  };

  // Firestore Persistence State (UserProfile & LandingPages)
  const [fbUser, setFbUser] = useState(null);
  const [fbAuthBusy, setFbAuthBusy] = useState(false);
  const [firestorePages, setFirestorePages] = useState([]);
  const [loadingFirestore, setLoadingFirestore] = useState(false);
  const [savingPageId, setSavingPageId] = useState("");
  const [syncingAll, setSyncingAll] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    agencyName: "G360 Google Business Intelligence",
    phone: "(62) 99113-8004",
    plan: "g360_full",
  });

  const loadFirestoreData = async (currentUser) => {
    const activeUser = currentUser || auth.currentUser;
    if (!activeUser) {
      setFirestorePages([]);
      return;
    }
    setLoadingFirestore(true);
    try {
      const [profile, savedPages] = await Promise.all([
        getUserProfileFromFirestore(activeUser.uid),
        listUserLandingPagesFromFirestore(),
      ]);
      if (profile) {
        setProfileForm({
          name: profile.name || activeUser.displayName || "Consultor G360",
          email: profile.email || activeUser.email || "",
          agencyName: profile.agencyName || "G360 Google Business Intelligence",
          phone: profile.phone || "(62) 99113-8004",
          plan: profile.plan || "g360_full",
        });
      } else {
        setProfileForm((prev) => ({
          ...prev,
          name: activeUser.displayName || prev.name || "Consultor G360",
          email: activeUser.email || prev.email || "",
        }));
      }
      setFirestorePages(savedPages || []);
    } catch (err) {
      console.error("Failed to load Firestore persistence data:", err);
    } finally {
      setLoadingFirestore(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setFbUser(u);
      if (u) {
        loadFirestoreData(u);
      } else {
        setFirestorePages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeBusiness?.name) {
      setSelectedBiz(activeBusiness);
      setQuery(activeBusiness.name);
      const rec = activeBusiness.recommended_template || getRecommendedTemplate(activeBusiness);
      if (rec) {
        setSelectedTplId(rec);
      }
    }
  }, [activeBusiness?.name]);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get("/places/autocomplete", { params: { q: query } });
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelectSuggestion = async (sug) => {
    setDropdownOpen(false);
    setQuery(sug.name);
    try {
      const { data } = await api.get(`/places/details/${encodeURIComponent(sug.place_id)}`);
      setSelectedBiz(data);
      const rec = data.recommended_template || getRecommendedTemplate(data);
      if (rec) setSelectedTplId(rec);
    } catch {
      setSelectedBiz(sug);
      const rec = sug.recommended_template || getRecommendedTemplate(sug);
      if (rec) setSelectedTplId(rec);
    }
  };

  const handleGenerateNow = async (e) => {
    e?.preventDefault();
    let bizToUse = selectedBiz;
    if (!bizToUse || bizToUse.name.toLowerCase() !== query.trim().toLowerCase()) {
      if (query.trim().length >= 2) {
        try {
          const { data } = await api.get(`/places/details/${encodeURIComponent(`custom::${query.trim()}`)}`);
          bizToUse = data;
        } catch {
          toast.error('Empresa indisponível. Selecione dados confirmados na prospecção ou no Pacote GBP.');
          return;
        }
      }
    }
    if (!bizToUse) {
      toast.error("Digite ou selecione a empresa para gerar o site.");
      return;
    }
    const tpl = SITE_TEMPLATES.find((t) => t.id === selectedTplId) || SITE_TEMPLATES[0];
    if (onQuickGenerate) {
      await onQuickGenerate(bizToUse, tpl.archetype, tpl.id);
    }
  };

  const handleDownloadHtml = (proj) => {
    const html = generateSiteHtml(proj.data, { editor: false });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proj.slug || "site-oficial"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML exportado. Imagens, fontes e APIs remotas podem exigir conexão.");
  };

  const handleDownloadZip = async (proj) => {
    try {
      await downloadSiteZip(proj.data, `${proj.slug || "site-oficial"}.zip`, proj.slug);
      toast.success("Pasta ZIP completa baixada (index.html, sitemap.xml, robots.txt, Search Console e hospedagem)!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar pacote ZIP"));
    }
  };

  const handleDeployFree = async (proj) => {
    setDeployingId(proj.id);
    try {
      const htmlContent = generateSiteHtml(proj.data, { editor: false });
      const { data } = await api.post("/g360/deploy", {
        provider: deployProvider,
        projectSlug: proj.slug,
        htmlContent,
        customToken: vercelToken,
      });
      if (data?.url) {
        setDeployUrlMap((prev) => ({ ...prev, [proj.id]: data.url }));
        try {
          await api.post("/g360/gbp-package/sync-site", {
            businessName: proj.name || proj.data?.business?.name,
            websiteUrl: data.url,
            projectSlug: proj.slug,
          });
        } catch {
          // ignore non-critical sync warning
        }
        if (fbUser) {
          await saveLandingPageToFirestore({ ...proj, deployedUrl: data.url });
          await loadFirestoreData(fbUser);
        }
        toast.success(data.message || "Site publicado e sincronizado com o Pacote GBP!");
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao publicar site"));
    } finally {
      setDeployingId("");
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      if (onProjectsChanged) onProjectsChanged();
      toast.success("Site removido.");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao remover site"));
    }
  };

  const handleSaveSingleToFirestore = async (proj) => {
    if (!fbUser) {
      toast.error("Faça login com o Google para salvar a Landing Page no Firestore.");
      return;
    }
    setSavingPageId(proj.id);
    try {
      const saved = await saveLandingPageToFirestore({
        ...proj,
        deployedUrl: deployUrlMap[proj.id] || `/site/${proj.slug}`,
      });
      if (saved) {
        toast.success(`Landing Page "${saved.name}" salva no Firestore (/landing_pages/${saved.id})!`);
        await loadFirestoreData(fbUser);
      }
    } catch (err) {
      toast.error("Erro ao salvar Landing Page no Firestore.");
    } finally {
      setSavingPageId("");
    }
  };

  const handleSyncAllToFirestore = async () => {
    if (!fbUser) {
      toast.error("Faça login com o Google primeiro para sincronizar seus sites no Firestore.");
      return;
    }
    if (!projects.length) {
      toast.info("Nenhum site gerado para sincronizar.");
      return;
    }
    setSyncingAll(true);
    try {
      for (const proj of projects) {
        await saveLandingPageToFirestore({
          ...proj,
          deployedUrl: deployUrlMap[proj.id] || `/site/${proj.slug}`,
        });
      }
      await loadFirestoreData(fbUser);
      toast.success(`${projects.length} Landing Page(s) sincronizada(s) com sucesso no Firestore!`);
    } catch (err) {
      toast.error("Falha ao sincronizar Landing Pages no Firestore.");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDeleteFromFirestore = async (pageId) => {
    if (!fbUser) return;
    try {
      const ok = await deleteLandingPageFromFirestore(pageId);
      if (ok) {
        setFirestorePages((prev) => prev.filter((p) => p.id !== pageId));
        toast.success("Landing Page removida do Firestore.");
      }
    } catch (err) {
      toast.error("Erro ao remover Landing Page do Firestore.");
    }
  };

  const handleRestoreFirestorePageToEditor = (lpDoc) => {
    const existingLocal = projects.find((p) => p.id === lpDoc.id || p.slug === lpDoc.slug);
    if (existingLocal && onOpenEditor) {
      onOpenEditor(existingLocal);
      return;
    }
    const biz = lpDoc.siteData?.business || {
      name: lpDoc.businessName,
      category: lpDoc.category,
      city: lpDoc.city,
      phone: lpDoc.phone,
      whatsapp: lpDoc.whatsapp,
    };
    const rebuiltData = createProjectData(biz, lpDoc.archetype, lpDoc.templateId);
    if (lpDoc.headline || lpDoc.subheadline || lpDoc.ctaText) {
      rebuiltData.texts = {
        ...rebuiltData.texts,
        "hero.headline": lpDoc.headline || rebuiltData.texts?.["hero.headline"],
        "hero.subheadline": lpDoc.subheadline || rebuiltData.texts?.["hero.subheadline"],
        "hero.cta": lpDoc.ctaText || rebuiltData.texts?.["hero.cta"],
      };
    }
    if (onOpenEditor) {
      onOpenEditor({
        id: lpDoc.id,
        slug: lpDoc.slug,
        name: lpDoc.name,
        archetype: lpDoc.archetype,
        status: lpDoc.status,
        data: rebuiltData,
      });
    }
  };

  const handleSaveUserProfile = async (e) => {
    e.preventDefault();
    if (!fbUser) {
      toast.error("Conecte sua conta Google para salvar o perfil no Firestore.");
      return;
    }
    setSavingProfile(true);
    try {
      const saved = await saveUserProfileToFirestore({
        name: profileForm.name,
        agencyName: profileForm.agencyName,
        phone: profileForm.phone,
        plan: profileForm.plan,
      });
      if (saved) {
        toast.success(`Perfil salvo com sucesso em /users/${saved.uid}!`);
      }
    } catch (err) {
      toast.error("Erro ao salvar perfil de usuário no Firestore.");
    } finally {
      setSavingProfile(false);
    }
  };

  const cardClass = dark
    ? "bg-[#14121E] border border-white/[0.08] text-[#EDE9FE] shadow-[0_4px_24px_rgba(0,0,0,0.4)] rounded-2xl"
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
      {/* DIRECT SITE EXPRESS WORKSPACE HEADER (NO MARKETING HOME CLUTTER) */}
      <section className={`rounded-3xl p-5 sm:p-7 space-y-5 ${cardClass}`} data-testid="site-express-direct-panel">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
              <span>Módulo @pacote-site</span>
              <span>·</span>
              <span>Site Express Integrado ao G360</span>
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight mt-1 text-slate-900 dark:text-slate-100">
              Criador Direto de Sites Otimizados (Ficha Google → Site Oficial)
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Sem página inicial promocional: selecione a empresa que você já auditou ou otimizou no GBP e gere o site pronto para editar e publicar grátis.
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToStandaloneSiteExpress}
            className={`px-4 py-2 rounded-full border text-[12.5px] font-semibold flex items-center gap-2 self-start cursor-pointer transition-all shadow-sm ${borderCol} ${subtleBg} hover:border-[#7C3AED] hover:text-[#7C3AED]`}
            data-testid="open-standalone-site-express-btn"
          >
            <ExternalLink size={14} className="text-[#7C3AED]" />
            <span>Ver Produto Site Express Separado (Com Home Comercial)</span>
          </button>
        </div>

        {/* Direct 1-Field Company Picker + Template Selector + Generate */}
        <div ref={boxRef} className="space-y-4">
          <form onSubmit={handleGenerateNow} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 relative">
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${mutedText}`}>
                01. Empresa do Cliente (Puxa Dados e Fotos Automaticamente)
              </label>
              <div
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all ${
                  dark
                    ? "bg-white/[0.04] border-white/15 focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#C4B5FD]/30"
                    : "bg-white border-[#EDE9FE] focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#C4B5FD]/40 shadow-sm"
                }`}
              >
                <Search size={18} className="text-[#7C3AED] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite o nome da empresa para gerar o site..."
                  className="w-full bg-transparent text-[14px] font-medium outline-none"
                  data-testid="site-express-direct-input"
                />
              </div>

              {dropdownOpen && suggestions.length > 0 && (
                <div
                  className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border overflow-hidden z-30 shadow-xl ${
                    dark ? "bg-[#14121E] border-white/10" : "bg-white border-slate-200/80"
                  }`}
                >
                  {suggestions.map((sug) => (
                    <button
                      key={sug.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between text-[13px] transition-colors ${
                        dark ? "hover:bg-white/5" : "hover:bg-[#F5F3FF]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {sug.photo && !sug.photo.startsWith("data:") ? (
                          <img
                            src={sug.photo}
                            alt={sug.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-purple-500/20 bg-white"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] text-white font-black text-[14px] flex items-center justify-center shrink-0 shadow-sm">
                            {String(sug.name || "E").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">{sug.name}</span>
                          <span className={`text-[11.5px] block truncate ${mutedText}`}>
                            {sug.category} · {sug.city}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#7C3AED]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${mutedText}`}>
                02. Modelo Estratégico do Nicho
              </label>
              <select
                value={selectedTplId}
                onChange={(e) => setSelectedTplId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-full border text-[13px] font-semibold outline-none transition-all ${
                  dark ? "bg-[#14121E] border-white/15 focus:border-[#7C3AED]" : "bg-white border-slate-200/80 focus:border-[#7C3AED] shadow-sm"
                }`}
              >
                {SITE_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.badge || tpl.archetype})
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex items-end gap-2">
              <button
                type="submit"
                className="w-full py-2.5 px-5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white font-bold text-[13.5px] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                data-testid="site-express-direct-generate-btn"
              >
                <Rocket size={16} />
                <span>Gerar e Abrir Editor</span>
              </button>
            </div>
          </form>

          {selectedBiz && (
            <div className={`p-4 rounded-2xl border space-y-3 text-[12.5px] ${borderCol} ${subtleBg}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Building2 size={16} className="text-[#7C3AED]" />
                  <span>
                    Ficha vinculada: <strong>{selectedBiz.name}</strong> ({selectedBiz.category} · {selectedBiz.city || "Anápolis"})
                  </span>
                  {Array.isArray(selectedBiz.photos) && selectedBiz.photos.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      · {selectedBiz.photos.filter((p) => typeof p === "string" && !p.startsWith("data:image/svg+xml")).length || selectedBiz.photos.length} fotos vinculadas da ficha
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Star size={11} className="fill-current" />
                    <span>
                      {Array.isArray(selectedBiz.reviews) && selectedBiz.reviews.length > 0
                        ? `${selectedBiz.reviews.length} avaliações GMN prontas no site`
                        : "Avaliações GMN prontas para sincronizar"}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTransformProfilePhotosWithNanoBanana}
                    disabled={transformingProfilePhotos}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-extrabold text-[11.5px] flex items-center gap-1.5 shadow-sm hover:opacity-95 disabled:opacity-60 transition-all cursor-pointer"
                    data-testid="site-express-nano-banana-transform-btn"
                  >
                    <Sparkles size={13} className={transformingProfilePhotos ? "animate-spin" : ""} />
                    <span>
                      {transformingProfilePhotos
                        ? "Transformando fotos da ficha (Nano Banana 2.1)..."
                        : selectedBiz.nanoBananaSlotImages
                        ? "Fotos Transformadas (Nano Banana 2.1 ✓)"
                        : "Transformar Fotos da Ficha (Nano Banana 2.1)"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRunReviewsDiagnostic}
                    disabled={reviewsDiagLoading}
                    className="px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-extrabold text-[11.5px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    data-testid="run-gmn-reviews-diagnostic-btn"
                  >
                    <Activity size={13} className={reviewsDiagLoading ? "animate-spin" : ""} />
                    <span>
                      {reviewsDiagLoading
                        ? "Rastreando API GMN..."
                        : "Diagnóstico & Trace Avaliações GMN"}
                    </span>
                  </button>
                  {onOpenVisualBriefing && (
                    <button
                      type="button"
                      onClick={() => onOpenVisualBriefing(selectedBiz)}
                      className="px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white font-extrabold text-[12px] transition-colors cursor-pointer"
                      data-testid="open-visual-briefing-modal-btn"
                    >
                      Ver Dados Extraídos + Seletor Visual de Modelos
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenTemplates && onOpenTemplates(selectedBiz, selectedTplId)}
                    className="text-[#7C3AED] font-bold hover:underline cursor-pointer"
                  >
                    Galeria em Tela Cheia ({SITE_TEMPLATES.length} Modelos) →
                  </button>
                </div>
              </div>

              {/* GMN REVIEWS NETWORK TRACE & STATE DIAGNOSTIC CONSOLE */}
              {reviewsDiagOpen && (
                <div
                  className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-purple-500/30 space-y-3 text-[12px] shadow-xl"
                  data-testid="gmn-reviews-diagnostic-panel"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-emerald-400" />
                      <span className="font-mono font-bold text-[12.5px] text-emerald-400">
                        GMN REVIEWS NETWORK TRACE & PARSER DIAGNOSTIC
                      </span>
                      {reviewsDiagResult?.trace?.finalSource && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-[10.5px]">
                          Fonte Ativa: {reviewsDiagResult.trace.finalSource}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRunReviewsDiagnostic}
                        disabled={reviewsDiagLoading}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} className={reviewsDiagLoading ? "animate-spin" : ""} />
                        <span>Re-testar Endpoint</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewsDiagOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {reviewsDiagLoading && !reviewsDiagResult ? (
                    <div className="py-6 text-center font-mono text-slate-300 flex items-center justify-center gap-2">
                      <RefreshCw size={15} className="animate-spin text-purple-400" />
                      <span>Inspecionando endpoints Outscraper / Serper / Google Places v1 e validando JSON...</span>
                    </div>
                  ) : reviewsDiagResult ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Network Trace Steps */}
                      <div className="lg:col-span-6 space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          1. Pipeline de Rede (Endpoints Inspecionados):
                        </div>
                        <div className="space-y-1.5">
                          {(reviewsDiagResult.trace?.steps || []).map((st, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-1 font-mono text-[11px]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white">{st.step}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    st.status === "SUCCESS"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : st.status === "EMPTY" || st.status === "SKIPPED"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  }`}
                                >
                                  {st.status} {st.httpStatus ? `(HTTP ${st.httpStatus})` : ""} · {st.latencyMs ?? 0}ms
                                </span>
                              </div>
                              <div className="text-slate-400 truncate">
                                Endpoint: <span className="text-slate-200">{st.endpoint}</span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                                <span className="text-purple-300">
                                  Brutos: {st.rawCount ?? 0} → Parseados: {st.parsedCount ?? 0}
                                </span>
                                {st.note && <span className="text-slate-400">{st.note}</span>}
                                {st.error && <span className="text-rose-400">{st.error}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mapped State Verification */}
                      <div className="lg:col-span-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                            2. Mapeamento no Estado do Site (project.data.business.reviews):
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            {reviewsDiagResult.stateMappingCheck?.reviewsArrayLength || 0} avaliações injetadas
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1">
                          {(reviewsDiagResult.parsedReviews || []).map((rev, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/25 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-200">{rev.author}</span>
                                <span className="font-mono text-amber-300">
                                  {"★".repeat(Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5))))} ({rev.rating}) · {rev.date}
                                </span>
                              </div>
                              <p className="text-[11.5px] text-slate-200 leading-snug line-clamp-2">
                                "{rev.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Visual Template Strip + Color Palette Selector */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                    Escolha o Modelo Real do Site ({SITE_TEMPLATES.length} Modelos Renderizados ao Vivo) & Paleta de Cores:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_PALETTES.map((pal) => {
                      const activePal = selectedPaletteId === pal.id;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          onClick={() => setSelectedPaletteId(pal.id)}
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            activePal
                              ? "border-[#7C3AED] bg-[#7C3AED]/15 text-[#7C3AED] ring-1 ring-[#7C3AED]"
                              : `${borderCol} ${dark ? "bg-[#14121E]" : "bg-white"}`
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span>{pal.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* LIVE RENDERED WEBSITE TEMPLATES GRID */}
                {(() => {
                  const recTplId = getRecommendedTemplate(selectedBiz || activeBusiness);
                  const selectedTemplateObj = SITE_TEMPLATES.find((t) => t.id === selectedTplId) || SITE_TEMPLATES[0];
                  const isCurrentRecommended = selectedTemplateObj.id === recTplId;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {SITE_TEMPLATES.map((tpl) => {
                          const isSelected = selectedTplId === tpl.id;
                          const isRecommended = recTplId === tpl.id;

                          return (
                            <div
                              key={tpl.id}
                              onClick={() => setSelectedTplId(tpl.id)}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                                isSelected
                                  ? "border-[#7C3AED] bg-[#7C3AED]/10 ring-2 ring-[#7C3AED]/40 shadow-md"
                                  : isRecommended
                                  ? "border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500"
                                  : `${borderCol} ${dark ? "bg-[#14121E] hover:border-white/30" : "bg-white hover:border-purple-300"}`
                              }`}
                              data-testid={`quick-tpl-card-${tpl.id}`}
                            >
                              {/* Recommendation Badge or Selection Status */}
                              <div className="flex items-center justify-between gap-1">
                                {isRecommended ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9.5px] font-black tracking-wide flex items-center gap-1 shadow-sm">
                                    <BadgeCheck size={11} />
                                    <span>IDEAL PARA O NICHO</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C3AED] truncate">
                                    {tpl.badge?.split("·")[0] || tpl.archetype}
                                  </span>
                                )}

                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shrink-0">
                                    <Check size={12} />
                                  </span>
                                )}
                              </div>

                              {/* REAL LIVE RENDERED SITE MINIATURE PREVIEW */}
                              <div className="relative group/vis">
                                {renderLiveTemplateIframePreview(tpl, livePreviewHtmlByTemplate[tpl.id])}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewModalTpl(tpl);
                                  }}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover/vis:opacity-100 backdrop-blur-[2px] rounded-xl transition-opacity flex items-center justify-center gap-1.5 text-white text-[12px] font-bold cursor-pointer"
                                  title="Espiar site real em tela cheia"
                                >
                                  <Eye size={15} />
                                  <span>Ver Site Real em Tela Cheia</span>
                                </button>
                              </div>

                              {/* Title & Description */}
                              <div className="space-y-1">
                                <div className="text-[13px] font-black leading-tight line-clamp-1 text-slate-900 dark:text-slate-100">
                                  {tpl.name}
                                </div>
                                <div className={`text-[11px] leading-snug line-clamp-2 ${mutedText}`}>
                                  {tpl.subtitle || tpl.description}
                                </div>
                              </div>

                              {/* Card Action Buttons */}
                              <div className="pt-1.5 border-t border-inherit/60 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewModalTpl(tpl);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-colors ${
                                    isSelected
                                      ? "text-[#7C3AED] hover:bg-[#7C3AED]/20"
                                      : "text-slate-600 dark:text-slate-300 hover:text-[#7C3AED] hover:bg-slate-100 dark:hover:bg-white/10"
                                  }`}
                                  title="Visualizar demonstração"
                                >
                                  <Eye size={13} />
                                  <span>Demonstração</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedTplId(tpl.id)}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-black ${
                                    isSelected
                                      ? "bg-[#7C3AED] text-white"
                                      : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200"
                                  }`}
                                >
                                  {isSelected ? "Ativo" : "Usar"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ACTIVE MODEL DETAILED INSPECTOR PANEL */}
                      <div
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isCurrentRecommended
                            ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5"
                            : `${borderCol} ${subtleBg}`
                        }`}
                        data-testid="active-model-inspector"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#7C3AED] text-white">
                                {selectedTemplateObj.badge || selectedTemplateObj.archetype}
                              </span>
                              <h4 className="text-[16px] font-black text-slate-900 dark:text-slate-100">
                                {selectedTemplateObj.name}
                              </h4>
                              {isCurrentRecommended && (
                                <span className="text-[11.5px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                                  <BadgeCheck size={14} className="text-emerald-500" />
                                  <span>
                                    Recomendado para {selectedBiz?.name || "esta empresa"}
                                  </span>
                                </span>
                              )}
                            </div>

                            <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed max-w-3xl">
                              {selectedTemplateObj.description}
                            </p>

                            {/* Section breakdown with real vector icons (no emojis) */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              <span className="font-extrabold uppercase text-[#7C3AED]">Seções Inclusas:</span>
                              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                <Sparkles size={12} className="text-[#7C3AED]" />
                                <span>Hero Alta Conversão</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                <Archive size={12} className="text-[#7C3AED]" />
                                <span>Catálogo de Serviços/Produtos</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                <Star size={12} className="text-amber-500" />
                                <span>Avaliações Reais Google (GMN)</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                <MapPin size={12} className="text-[#7C3AED]" />
                                <span>Endereço & Horários Oficiais</span>
                              </span>
                              <span className="px-2.5 py-1 rounded-md bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-emerald-500" />
                                <span>Botão Flutuante de WhatsApp</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                            <button
                              type="button"
                              onClick={() => setPreviewModalTpl(selectedTemplateObj)}
                              className="px-4 py-2.5 rounded-xl border border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/10 text-[12.5px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                              data-testid="inspect-template-preview-btn"
                            >
                              <Eye size={15} />
                              <span>Ver Demonstração Interativa</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleGenerateNow}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] hover:opacity-95 text-white text-[12.5px] font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                              data-testid="use-selected-template-generate-btn"
                            >
                              <Rocket size={15} />
                              <span>Gerar com este Modelo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* CLONADOR DE SITE POR URL + BRIEFING PRD COM IA (ESTILO LINDO.AI) */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${borderCol} ${
              dark ? "bg-[#1A162B]/90" : "bg-purple-50/50"
            }`}
            data-testid="lindo-url-cloner-section"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                  <Sparkles size={13} />
                  <span>Clonador Inteligente de Estrutura por URL + PRD IA (Estilo Lindo.ai)</span>
                </div>
                <h3 className="text-[15px] sm:text-[16px] font-extrabold mt-0.5">
                  Gostou de um site da internet? Cole a URL para gerar o PRD e clonar a estrutura para o seu cliente
                </h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#14121E] border-purple-500/30">
                <Globe size={16} className="text-[#7C3AED] shrink-0" />
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="Cole a URL do site de referência (ex: https://www.apple.com/br/iphone/ ou site de um concorrente)..."
                  className="w-full bg-transparent text-[13px] font-medium outline-none"
                  data-testid="clone-reference-url-input"
                />
              </div>
              <button
                type="button"
                disabled={generatingPrd}
                onClick={handleGenerateClonePrd}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 text-white text-[12.5px] font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
                data-testid="generate-clone-prd-btn"
              >
                <Sparkles size={15} className={generatingPrd ? "animate-spin" : ""} />
                <span>
                  {generatingPrd
                    ? "Analisando URL e Gerando PRD..."
                    : "Analisar URL & Gerar PRD com IA"}
                </span>
              </button>
            </div>

            {clonedPrd && (
              <div className={`p-4 rounded-xl border space-y-3 ${borderCol} ${dark ? "bg-[#14121E]" : "bg-white"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
                    ✓ Briefing PRD Estrutural Gerado pela IA — Editável antes de construir
                  </span>
                  <span className="text-[11px] font-mono text-[#7C3AED]">
                    Modelo sugerido: {clonedPrd.recommendedTemplateId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7C3AED] block mb-1">
                      Headline Clonada & Adaptada:
                    </label>
                    <input
                      type="text"
                      value={clonedPrd.heroHeadline || ""}
                      onChange={(e) => setClonedPrd((p) => ({ ...p, heroHeadline: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] font-bold outline-none ${borderCol} ${subtleBg}`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7C3AED] block mb-1">
                      Subtítulo de Conversão:
                    </label>
                    <input
                      type="text"
                      value={clonedPrd.heroSubheadline || ""}
                      onChange={(e) => setClonedPrd((p) => ({ ...p, heroSubheadline: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none ${borderCol} ${subtleBg}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7C3AED] block mb-1">
                    Documento PRD (Arquitetura de Seções, Copy e Prova Social):
                  </label>
                  <textarea
                    rows={4}
                    value={clonedPrd.prdDocument || ""}
                    onChange={(e) => setClonedPrd((p) => ({ ...p, prdDocument: e.target.value }))}
                    className={`w-full p-3 rounded-lg border text-[12px] leading-relaxed outline-none ${borderCol} ${subtleBg}`}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleBuildClonedSite}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[13px] font-extrabold flex items-center gap-2 cursor-pointer shadow-md"
                    data-testid="execute-clone-site-build-btn"
                  >
                    <Rocket size={15} />
                    <span>Clonar Estrutura & Construir Site do Cliente Agora</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {buildingCloneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 space-y-4 text-center ${cardClass}`}>
            <RefreshCw size={32} className="animate-spin mx-auto text-[#7C3AED]" />
            <h3 className="text-[18px] font-extrabold">Construindo Site com IA + PRD</h3>
            <p className={`text-[13px] font-semibold text-[#7C3AED]`}>
              {CLONE_BUILD_STEPS[buildStepIdx] || CLONE_BUILD_STEPS[0]}
            </p>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-emerald-500 transition-all duration-300"
                style={{ width: `${Math.round(((buildStepIdx + 1) / CLONE_BUILD_STEPS.length) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* GENERATED SITES & 1-CLICK FREE HOSTING (VERCEL / NETLIFY / PASTA ZIP COMPLETA) */}
      <section className={`rounded-3xl p-5 sm:p-7 space-y-5 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-1">
              Hospedagem Gratuita Integrada · Vercel, Netlify, Google Search Console & Exportação ZIP
            </div>
            <h2 className="text-[20px] font-extrabold tracking-tight mt-1 text-slate-900 dark:text-slate-100">
              Sites Criados ({projects.length}) — Visualize, Edite, Baixe a Pasta ZIP ou Publique
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={deployProvider}
              onChange={(e) => setDeployProvider(e.target.value)}
              className={`px-3.5 py-2 rounded-full border text-[12px] font-bold outline-none cursor-pointer transition-all focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
              title="Provedor de Hospedagem Gratuita"
            >
              <option value="vercel">Publicar via Vercel (.vercel.app)</option>
              <option value="netlify">Publicar via Netlify (.netlify.app)</option>
            </select>
            <input
              type="password"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              placeholder={`Token ${deployProvider === "netlify" ? "Netlify" : "Vercel"} (opcional p/ domínio externo)`}
              className={`px-4 py-2 rounded-full border text-[12px] w-64 outline-none transition-all focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
            />
            {fbUser && (
              <button
                type="button"
                disabled={syncingAll || projects.length === 0}
                onClick={handleSyncAllToFirestore}
                data-testid="sync-all-landing-pages-btn"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all"
              >
                <CloudUpload size={14} />
                <span>
                  {syncingAll
                    ? "Sincronizando no Firestore..."
                    : "Sincronizar Todos no Firestore"}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => {
            const pBiz = proj.data?.business || {};
            const liveUrl = deployUrlMap[proj.id] || `/site/${proj.slug}`;
            const isSavedInFirestore = firestorePages.some(
              (fp) => fp.id === proj.id || fp.slug === proj.slug
            );
            const heroThumb =
              proj.data?.images?.hero?.url ||
              pBiz.photos?.[0] ||
              pBiz.items?.[0]?.image ||
              "";
            const tplInfo = SITE_TEMPLATES.find((t) => t.id === proj.data?.templateId);

            return (
              <div
                key={proj.id}
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] ${borderCol} ${subtleBg}`}
              >
                {/* Visual Site Preview Thumbnail */}
                <div
                  onClick={() => onOpenEditor && onOpenEditor(proj)}
                  className="relative h-40 w-full bg-slate-900 overflow-hidden cursor-pointer group border-b border-inherit"
                  title="Clique para abrir no Editor Visual"
                >
                  {heroThumb ? (
                    <img
                      src={heroThumb}
                      alt={proj.name}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-white/80 font-extrabold text-[18px] px-4 text-center">
                      {proj.name}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-between p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider bg-[#7C3AED] text-white px-2.5 py-0.5 rounded-full shadow">
                        {tplInfo?.name || proj.data?.templateId || proj.archetype}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(proj.id);
                        }}
                        className="p-1.5 rounded-full bg-black/50 text-white/80 hover:bg-rose-600 hover:text-white transition-colors"
                        title="Remover site"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="text-white">
                      <div className="text-[15px] font-extrabold leading-tight truncate drop-shadow">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-white/80 truncate">
                        {pBiz.category || proj.archetype} · {pBiz.city || "Brasil"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className={`text-[11.5px] flex items-center justify-between gap-2 ${mutedText}`}>
                      <span className="font-mono truncate">Slug: /{proj.slug}</span>
                      {isSavedInFirestore && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                          Salvo no Firestore
                        </span>
                      )}
                    </div>

                    <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[11.5px] ${borderCol} ${dark ? "bg-white/[0.04]" : "bg-white"}`}>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#7C3AED] font-mono truncate hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Globe size={12} /> {liveUrl}
                      </a>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-[#7C3AED] hover:underline shrink-0"
                      >
                        Abrir
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-inherit">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenEditor && onOpenEditor(proj)}
                        className="py-2 px-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all"
                      >
                        <Edit3 size={13} /> Editar Visual
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadZip(proj)}
                        className="py-2 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                        title="Baixar pasta ZIP completa com index.html, sitemap.xml, robots.txt e guia Google Search Console"
                      >
                        <Archive size={13} /> Pasta ZIP
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadHtml(proj)}
                        className={`py-1.5 px-2 rounded-full border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${borderCol} ${
                          dark ? "bg-white/[0.04] hover:bg-white/10" : "bg-white hover:bg-[#EDE9FE]/50"
                        }`}
                        title="Baixar apenas o arquivo HTML único"
                      >
                        <Download size={12} /> HTML
                      </button>

                      <button
                        type="button"
                        disabled={savingPageId === proj.id}
                        onClick={() => handleSaveSingleToFirestore(proj)}
                        data-testid={`save-firestore-lp-${proj.id}`}
                        className={`py-1.5 px-2 rounded-full border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${borderCol} ${
                          dark ? "bg-white/[0.04] hover:border-[#7C3AED]" : "bg-white hover:border-[#7C3AED]"
                        }`}
                      >
                        <Database size={12} className="text-[#7C3AED]" />
                        <span>{savingPageId === proj.id ? "..." : "Firestore"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={deployingId === proj.id}
                        onClick={() => handleDeployFree(proj)}
                        className="py-1.5 px-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all"
                        title={`Publicar gratuitamente via ${deployProvider === "netlify" ? "Netlify" : "Vercel"} e atualizar Pacote GBP`}
                      >
                        <Rocket size={12} />
                        <span>{deployingId === proj.id ? "..." : "Publicar"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FIRESTORE CLOUD PERSISTENCE: LANDING PAGES (/landing_pages) & USER PROFILE (/users) */}
      <section
        className={`rounded-3xl p-5 sm:p-7 space-y-5 ${cardClass}`}
        data-testid="firestore-persistence-panel"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#EDE9FE] dark:bg-[#7C3AED]/20 px-3 py-1 rounded-full mb-1">
              Firebase Firestore Cloud · gen-lang-client-0860310554
            </div>
            <h2 className="text-[20px] font-extrabold tracking-tight mt-1 text-slate-900 dark:text-slate-100">
              Persistência no Firestore: Landing Pages Geradas (<code className="font-mono text-[16px] text-[#7C3AED]">/landing_pages</code>) e Perfil de Usuário (<code className="font-mono text-[16px] text-[#7C3AED]">/users</code>)
            </h2>
            <p className={`text-[12.5px] mt-1 ${mutedText}`}>
              Dados validados pelo esquema estrito do arquivo <code className="font-mono">firebase-blueprint.json</code> e protegidos pelas regras de segurança <code className="font-mono">firestore.rules</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fbUser ? (
              <button
                type="button"
                onClick={() => loadFirestoreData(fbUser)}
                disabled={loadingFirestore}
                className={`px-4 py-2 rounded-full border text-[12px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${borderCol} ${subtleBg} hover:border-[#7C3AED]`}
              >
                <RefreshCw size={14} className={loadingFirestore ? "animate-spin text-[#7C3AED]" : "text-[#7C3AED]"} />
                <span>Atualizar Dados do Firestore</span>
              </button>
            ) : (
              <GoogleSignInButton
                loading={fbAuthBusy}
                label="Conectar Google p/ Firestore"
                onClick={async () => {
                  setFbAuthBusy(true);
                  try {
                    const res = await googleSignIn();
                    if (res?.user) {
                      setFbUser(res.user);
                      await loadFirestoreData(res.user);
                      toast.success(`Conectado ao Firestore como ${res.user.email}`);
                    }
                  } catch (err) {
                    toast.error("Falha ao autenticar no Firebase Auth");
                  } finally {
                    setFbAuthBusy(false);
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* User Profile Persistence Card (/users/{userId}) */}
          <form
            onSubmit={handleSaveUserProfile}
            className={`lg:col-span-5 rounded-2xl border p-5 space-y-4 ${borderCol} ${subtleBg}`}
            data-testid="firestore-user-profile-form"
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <UserCheck size={17} className="text-[#7C3AED]" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                  Perfil do Usuário (<code className="font-mono text-[13px] text-[#7C3AED]">/users/&#123;uid&#125;</code>)
                </h3>
              </div>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                {fbUser ? `UID: ${fbUser.uid.slice(0, 10)}...` : "Desconectado"}
              </span>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  Nome Completo / Consultor
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Marcus Henrique Pires Dias"
                  maxLength={120}
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${dark ? "bg-white/[0.04]" : "bg-white"}`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                  Nome da Agência / Operação
                </label>
                <input
                  type="text"
                  value={profileForm.agencyName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, agencyName: e.target.value }))}
                  placeholder="G360 Google Business Intelligence"
                  maxLength={160}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${dark ? "bg-white/[0.04]" : "bg-white"}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="(62) 99113-8004"
                    maxLength={40}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#C4B5FD]/30 ${borderCol} ${dark ? "bg-white/[0.04]" : "bg-white"}`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${mutedText}`}>
                    Plano Ativo
                  </label>
                  <select
                    value={profileForm.plan}
                    onChange={(e) => setProfileForm((p) => ({ ...p, plan: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-semibold outline-none transition-all focus:border-[#7C3AED] ${borderCol} ${dark ? "bg-white/[0.04]" : "bg-white"}`}
                  >
                    <option value="g360_full">G360 Completo</option>
                    <option value="site_express_only">Site Express</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!fbUser || savingProfile}
                data-testid="save-firestore-profile-btn"
                className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all"
              >
                <Save size={15} />
                <span>
                  {savingProfile
                    ? "Salvando Perfil no Firestore..."
                    : "Salvar Perfil no Firestore (/users)"}
                </span>
              </button>
            </div>
          </form>

          {/* Saved Landing Pages in Firestore (/landing_pages/{pageId}) */}
          <div className={`lg:col-span-7 rounded-2xl border p-5 space-y-4 ${borderCol} ${subtleBg}`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Database size={17} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                  Landing Pages Persistidas no Firestore ({firestorePages.length})
                </h3>
              </div>
              <span className={`text-[11px] font-mono ${mutedText}`}>
                Coleção: /landing_pages
              </span>
            </div>

            {!fbUser ? (
              <div className={`p-6 rounded-2xl border text-center text-[13px] ${borderCol} ${mutedText}`}>
                Autentique-se com sua conta Google acima para visualizar, salvar e sincronizar suas Landing Pages diretamente no banco Firestore.
              </div>
            ) : firestorePages.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center text-[13px] ${borderCol} ${mutedText}`}>
                Nenhuma Landing Page salva no Firestore ainda. Clique em <strong>"Salvar Firestore"</strong> em qualquer site acima ou em <strong>"Sincronizar Todos no Firestore"</strong>.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {firestorePages.map((lp) => (
                  <div
                    key={lp.id}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12.5px] ${borderCol} ${
                      dark ? "bg-white/[0.04]" : "bg-white"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-[14px] flex items-center gap-2">
                        <span>{lp.name}</span>
                        <span className="text-[11px] font-mono text-[#7C3AED]">
                          /{lp.slug}
                        </span>
                      </div>
                      <div className={mutedText}>
                        {lp.category} · {lp.city} · Modelo: <strong>{lp.templateId}</strong> ({lp.archetype})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRestoreFirestorePageToEditor(lp)}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 text-white text-[11.5px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                      >
                        <Edit3 size={12} /> Abrir no Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFromFirestore(lp.id)}
                        className={`p-1.5 rounded-full hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${mutedText} cursor-pointer`}
                        title="Excluir do Firestore"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FULLSCREEN RESPONSIVE PREVIEW MODAL (DESKTOP & MOBILE SWITCHER) */}
      {previewModalTpl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-2 sm:p-5 animate-fadeIn"
          data-testid="template-preview-modal"
        >
          <div
            className={`w-full max-w-7xl h-full mx-auto rounded-3xl flex flex-col overflow-hidden shadow-2xl border ${borderCol} ${
              dark ? "bg-[#100E19]" : "bg-white"
            }`}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-white/10 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#7C3AED] text-white">
                  {previewModalTpl.badge || previewModalTpl.archetype}
                </span>
                <div>
                  <h3 className="text-[15px] sm:text-[17px] font-black leading-tight">
                    {previewModalTpl.name}
                  </h3>
                  <p className="text-[12px] text-slate-300">
                    Visualização ao vivo com dados de:{" "}
                    <strong className="text-purple-300">
                      {selectedBiz?.name || "Jonas Gás"}
                    </strong>{" "}
                    ({selectedBiz?.category || "Comércio & Distribuição"})
                  </p>
                </div>
              </div>

              {/* Desktop vs Mobile Toggle */}
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-[#7C3AED] text-white shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                  data-testid="preview-device-desktop"
                >
                  <Monitor size={15} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-[#7C3AED] text-white shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                  data-testid="preview-device-mobile"
                >
                  <Smartphone size={15} />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTplId(previewModalTpl.id);
                    setPreviewModalTpl(null);
                    toast.success(`Modelo "${previewModalTpl.name}" selecionado com sucesso!`);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[12.5px] flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                  data-testid="confirm-use-template-btn"
                >
                  <Check size={15} />
                  <span>Escolher Este Modelo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalTpl(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fechar visualização"
                  data-testid="close-template-preview-btn"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Frame Viewport */}
            <div className="flex-1 bg-slate-900/90 p-3 sm:p-6 overflow-auto flex items-center justify-center">
              <div
                className={`transition-all duration-300 h-full flex flex-col items-center justify-center ${
                  previewDevice === "desktop"
                    ? "w-full rounded-2xl overflow-hidden shadow-2xl bg-white"
                    : "w-[390px] max-w-full h-[760px] max-h-full rounded-[44px] border-[10px] border-slate-950 shadow-2xl overflow-hidden bg-white relative"
                }`}
              >
                <iframe
                  title={`Live Preview ${previewModalTpl.name}`}
                  srcDoc={generateSiteHtml(
                    createProjectData(
                      selectedBiz || {
                        name: "Jonas Gás",
                        category: "Distribuição e revenda de gás liquefeito de petróleo (GLP)",
                        city: "Anápolis",
                        phone: "(62) 99113-8004",
                        whatsapp: "5562991138004",
                      },
                      previewModalTpl.archetype,
                      previewModalTpl.id
                    ),
                    { editor: false }
                  )}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
