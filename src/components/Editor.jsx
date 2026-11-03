import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Download,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Archive,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Globe,
  UploadCloud,
  Check,
  Copy,
  X,
  FileCheck,
  Sun,
  Moon,
} from "lucide-react";
import { generateSiteHtml, downloadHtml, downloadSiteZip, defaultSections } from "@/lib/sitegen/generateSiteHtml";
import { PALETTES, ALL_PALETTES, FONT_PAIRS, SITE_TEMPLATES } from "@/lib/sitegen/theme";
import SectionsPanel from "@/components/SectionsPanel";
import ItemsPanel from "@/components/ItemsPanel";
import BrandPanel from "@/components/BrandPanel";
import MarketingPanel from "@/components/MarketingPanel";
import AiStudioPanel from "@/components/AiStudioPanel";
import Inspector from "@/components/Inspector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VIEWPORTS = [
  { id: "desktop", icon: Monitor, label: "Computador", width: 1200 },
  { id: "tablet", icon: Tablet, label: "Tablet", width: 768 },
  { id: "mobile", icon: Smartphone, label: "Celular", width: 390 },
];

export default function Editor({ project, onProject, onSave, onExit, dark = false, onToggleTheme }) {
  const [viewport, setViewport] = useState(() => typeof window !== "undefined" && window.innerWidth < 640 ? "mobile" : "desktop");
  useEffect(() => {
    const resize = () => { if (window.innerWidth < 640) { setViewport('mobile'); setSidebarOpen(false); } else if (window.innerWidth >= 1024) setViewport('desktop'); };
    window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize);
  }, []);
  const [tab, setTab] = useState("sections");
  const [inspector, setInspector] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1024);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);
  const [history, setHistory] = useState([project.data]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const isUndoRedoRef = useRef(false);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      isUndoRedoRef.current = true;
      const prevData = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      onProject((p) => ({ ...p, data: prevData }));
      setDirty(true);
      toast.info("Ação desfeita (Undo)");
    }
  }, [history, historyIdx, onProject]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextData = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      onProject((p) => ({ ...p, data: nextData }));
      setDirty(true);
      toast.info("Ação refeita (Redo)");
    }
  }, [history, historyIdx, onProject]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);
  const saveTimer = useRef(null);
  const projectRef = useRef(project);
  const iframeRef = useRef(null);
  const scrollYRef = useRef(0);
  projectRef.current = project;

  const html = useMemo(() => generateSiteHtml(project.data, { editor: true }), [project.data]);

  const recordIframeScroll = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win && typeof win.scrollY === "number") {
        scrollYRef.current = win.scrollY;
      }
    } catch {
      // ignore cross-origin if any
    }
  };

  const handleIframeLoad = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      if (scrollYRef.current > 0) {
        win.scrollTo(0, scrollYRef.current);
      }
      win.addEventListener(
        "scroll",
        () => {
          scrollYRef.current = win.scrollY;
        },
        { passive: true }
      );
    } catch {
      // ignore
    }
  };

  const patchData = useCallback(
    (fn) => {
      recordIframeScroll();
      const currentData = projectRef.current?.data;
      if (!currentData) return;
      const nextData = fn(currentData);
      if (!isUndoRedoRef.current) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1);
          return [...sliced, nextData];
        });
        setHistoryIdx((prev) => prev + 1);
      }
      isUndoRedoRef.current = false;
      onProject((p) => ({ ...p, archetype: nextData.archetype || p.archetype, data: nextData }));
      setDirty(true);
    },
    [onProject, historyIdx]
  );

  const switchTemplate = (tplId) => {
    const tpl = SITE_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    scrollYRef.current = 0;
    patchData((d) => ({
      ...d,
      templateId: tpl.id,
      archetype: tpl.archetype,
      paletteId: tpl.paletteId,
      fontId: tpl.fontId,
      sections: d.archetype === tpl.archetype ? d.sections : defaultSections(tpl.archetype),
    }));
    toast.success(`Modelo alterado para ${tpl.name}`);
  };

  const doSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(projectRef.current);
      setDirty(false);
      toast.success("Projeto salvo");
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    if (!dirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave(projectRef.current)
        .then(() => setDirty(false))
        .catch(() => {});
    }, 2500);
    return () => clearTimeout(saveTimer.current);
  }, [dirty, project, onSave]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || d.__sxp !== 1 || (d.type === "edit" && (typeof d.key !== "string" || typeof d.value !== "string" || d.value.length > 10000))) return;
      if (d.type === "edit") {
        const item = d.key.match(/^item\.(\d+)\.(name|description|price|badge)$/);
        const faq = d.key.match(/^faq\.(\d+)\.(q|a)$/);
        if (item) {
          const [, idx, field] = item;
          patchData((data) => ({
            ...data,
            business: {
              ...data.business,
              items: data.business.items.map((it, i) => (i === +idx ? { ...it, [field]: d.value } : it)),
            },
          }));
        } else if (faq) {
          const [, idx, field] = faq;
          patchData((data) => ({
            ...data,
            business: {
              ...data.business,
              faqs: data.business.faqs.map((f, i) => (i === +idx ? { ...f, [field]: d.value } : f)),
            },
          }));
        } else {
          patchData((data) => ({ ...data, texts: { ...data.texts, [d.key]: d.value } }));
        }
      } else if (d.type === "inspect-button") {
        setInspector({ type: "button", id: d.id });
      } else if (d.type === "inspect-image") {
        setInspector({ type: "image", id: d.id });
      } else if (d.type === "edit-logo") {
        setSidebarOpen(true);
        setTab("brand");
        toast.info("Envie sua logomarca na aba 'Marca' para aplicar o logo e extrair as cores automaticamente!");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [patchData]);

  const vp = VIEWPORTS.find((v) => v.id === viewport) || VIEWPORTS[0];
  const arch = project.data.archetype || project.archetype || "produtos";
  const currentTemplateId =
    project.data.templateId || (arch === "gastronomia" ? "simprao" : arch === "servicos" ? "atelie-val" : "vitrine-express");
  const basePalList = PALETTES[arch] || ALL_PALETTES;
  const palList = project.data.customPalette?.vars
    ? [project.data.customPalette, ...basePalList]
    : basePalList;
  const scale = zoom / 100;

  return (
    <div
      className={`${
        isFullscreen ? "fixed inset-0 z-50 bg-white" : "flex-1"
      } flex flex-col min-h-0 overflow-hidden`}
      data-testid="editor-root"
      style={{ height: isFullscreen ? "100vh" : "calc(100vh - 64px)" }}
    >
      {/* Floating Fullscreen Controls when in True Fullscreen */}
      {isFullscreen && (
        <div className="fixed top-3 right-4 z-[60] flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/15">
          <button
            type="button"
            onClick={() => setSidebarOpen((s) => !s)}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
            <span>{sidebarOpen ? "Ocultar Painel" : "Editar Painel"}</span>
          </button>
          <button
            type="button"
            onClick={doSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            <span>{dirty ? "Salvar" : "Salvo"}</span>
          </button>
          <button
            type="button"
            data-testid="exit-fullscreen-floating-btn"
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
          >
            <Minimize2 size={13} />
            <span>Sair da Tela Cheia</span>
          </button>
        </div>
      )}

      {/* Top Toolbar (Hidden in True Fullscreen mode so canvas uses 100% height) */}
      <div className={`${isFullscreen ? "hidden" : "flex"} ${dark ? "bg-[#0F0B1E] border-white/10 text-slate-100" : "bg-white border-[#E4E4E7] text-slate-900"} border-b px-3.5 py-2 items-center gap-2 flex-wrap overflow-x-visible z-20 transition-colors`}>
        <button
          data-testid="editor-back-button"
          onClick={onExit}
          className={`flex-none flex items-center gap-1.5 text-[12.5px] font-semibold px-2 py-1.5 rounded-lg transition-colors ${
            dark ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ArrowLeft size={14} /> <span className="hidden xl:inline">Clientes</span>
        </button>

        <button
          data-testid="sidebar-toggle-top"
          onClick={() => setSidebarOpen((s) => !s)}
          title={sidebarOpen ? "Recolher menu lateral" : "Abrir menu lateral"}
          className={`flex-none flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
            dark
              ? "text-slate-200 border-white/15 hover:bg-white/10"
              : "text-slate-600 hover:text-slate-900 border-[#E4E4E7] hover:bg-slate-50"
          }`}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          <span className="hidden lg:inline">{sidebarOpen ? "Recolher Menu" : "Abrir Menu"}</span>
        </button>

        <input
          data-testid="editor-project-name"
          aria-label="Nome do projeto"
          value={project.name}
          onChange={(e) => {
            onProject((p) => ({ ...p, name: e.target.value }));
            setDirty(true);
          }}
          className={`text-[13.5px] font-bold bg-transparent border border-transparent rounded-lg px-2 py-1 outline-none w-[160px] truncate transition-colors ${
            dark
              ? "text-white hover:border-white/20 focus:border-purple-400"
              : "text-slate-900 hover:border-[#E4E4E7] focus:border-slate-900"
          }`}
        />
        <span
          className={`flex-none text-[10.5px] font-bold px-2.5 py-1 rounded-full ${
            project.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
          data-testid="editor-status-pill"
        >
          {project.status === "active" ? "Ativo localmente" : "Suspenso"}
        </span>

        <div className={`flex-none flex items-center rounded-lg p-0.5 gap-0.5 ml-auto ${dark ? "bg-white/10" : "bg-slate-100"}`}>
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              data-testid={`viewport-switch-${v.id}`}
              onClick={() => setViewport(v.id)}
              title={v.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                viewport === v.id
                  ? dark
                    ? "bg-[#7C3AED] text-white shadow-sm"
                    : "bg-white shadow-sm text-slate-900"
                  : dark
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <v.icon size={13} /> <span className="hidden 2xl:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Template Switcher */}
        <Select value={currentTemplateId} onValueChange={switchTemplate}>
          <SelectTrigger
            data-testid="template-select"
            aria-label="Modelo de Layout"
            className="flex-none w-[162px] h-8 text-[12px] font-bold bg-amber-50/70 border-amber-300 text-slate-900"
          >
            <Layers size={13} className="text-amber-600 mr-1 flex-none" />
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent>
            {SITE_TEMPLATES.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                <span className="flex items-center gap-2">
                  <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: tpl.colors[1] }} />
                  {tpl.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={project.data.paletteId} onValueChange={(v) => patchData((d) => ({ ...d, paletteId: v }))}>
          <SelectTrigger data-testid="palette-select" aria-label="Paleta de cores" className="flex-none w-[136px] h-8 text-[12px] font-semibold">
            <SelectValue placeholder="Paleta" />
          </SelectTrigger>
          <SelectContent>
            {palList.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <i className="w-3 h-3 rounded-full inline-block" style={{ background: p.vars.sec }} />
                  {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={project.data.fontId} onValueChange={(v) => patchData((d) => ({ ...d, fontId: v }))}>
          <SelectTrigger data-testid="font-select" aria-label="Tipografia" className="flex-none w-[140px] h-8 text-[12px] font-semibold">
            <SelectValue placeholder="Tipografia" />
          </SelectTrigger>
          <SelectContent>
            {FONT_PAIRS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: f.heading }}>{f.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onToggleTheme && (
          <button
            type="button"
            data-testid="editor-theme-toggle-btn"
            onClick={onToggleTheme}
            className={`flex-none flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              dark
                ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                : "border-[#E4E4E7] bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
            title={dark ? "Alternar para Modo Dia" : "Alternar para Modo Noite"}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hidden xl:inline">{dark ? "Modo Dia" : "Modo Noite"}</span>
          </button>
        )}

        <button
          data-testid="editor-save-button"
          onClick={doSave}
          disabled={saving}
          className={`flex-none flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            dark ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-[#E4E4E7] hover:bg-slate-50 text-slate-700"
          }`}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {dirty ? "Salvar" : "Salvo"}
        </button>
        <a
          data-testid="editor-open-site"
          href={`/site/${project.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-none flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            dark ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-[#E4E4E7] hover:bg-slate-50 text-slate-700"
          }`}
        >
          <ExternalLink size={13} /> <span className="hidden sm:inline">Abrir</span>
        </a>
        {/* Undo / Redo controls */}
        <div className={`flex items-center border rounded-lg overflow-hidden ${dark ? "border-white/15 bg-white/5" : "border-[#E4E4E7] bg-white"}`}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className={`p-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
              dark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"
            }`}
            title="Desfazer (Ctrl+Z)"
            aria-label="Desfazer"
          >
            <Undo2 size={13} />
          </button>
          <div className={`w-[1px] h-4 ${dark ? "bg-white/15" : "bg-[#E4E4E7]"}`} />
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className={`p-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
              dark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-50"
            }`}
            title="Refazer (Ctrl+Y)"
            aria-label="Refazer"
          >
            <Redo2 size={13} />
          </button>
        </div>

        <button
          type="button"
          data-testid="toggle-fullscreen-button"
          onClick={() => {
            setIsFullscreen((f) => {
              const next = !f;
              if (next) setSidebarOpen(false);
              else setSidebarOpen(true);
              return next;
            });
          }}
          className={`flex-none flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-colors ${
            dark ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-[#E4E4E7] hover:bg-slate-50 text-slate-700"
          }`}
          title="Alternar Tela Cheia do Canvas"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span className="hidden sm:inline">{isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}</span>
        </button>

        <button
          type="button"
          data-testid="publish-online-button"
          onClick={() => setPublishModalOpen(true)}
          className="flex-none flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-sm transition-all cursor-pointer"
          title="Opções de publicação gratuita (Netlify Drop, Vercel e Link Oficial)"
        >
          <Globe size={13} />
          <span>Publicar Online</span>
        </button>

        <button
          data-testid="export-zip-button"
          onClick={async () => {
            await downloadSiteZip(project.data, `${project.slug}.zip`, project.slug);
            toast.success("Pasta ZIP completa baixada (HTML + Sitemap.xml + Robots.txt + Google Search Console + Hospedagem)!");
          }}
          className="flex-none flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
          title="Baixar pasta ZIP completa para subir na hospedagem e usar no Google Search Console"
        >
          <Archive size={13} />
          <span>Baixar Pasta ZIP Completa</span>
        </button>

        <button
          data-testid="export-html-button"
          onClick={() => {
            downloadHtml(project.data, `${project.slug}.html`, project.slug);
            toast.success("HTML único exportado");
          }}
          className={`flex-none flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            dark ? "border-white/15 text-slate-300 hover:bg-white/10" : "border-[#E4E4E7] hover:bg-slate-50 text-slate-600"
          }`}
          title="Baixar apenas o arquivo index.html"
        >
          <Download size={12} /> <span>HTML</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Retractable Left Sidebar (Canva Style) */}
        <aside
          data-testid="editor-sidebar"
          className={`relative flex-none border-r flex flex-col min-h-0 transition-all duration-300 ease-in-out ${
            dark ? "bg-[#120E24] border-white/10 text-slate-100" : "bg-white border-[#E4E4E7] text-slate-900"
          } ${
            sidebarOpen ? "w-[310px]" : "w-0 border-r-0 overflow-hidden"
          }`}
        >
          <div className="w-[310px] flex flex-col h-full min-h-0">
            <div className={`flex border-b ${dark ? "border-white/10" : "border-[#E4E4E7]"}`}>
              {[
                ["sections", "Seções"],
                ["items", "Itens"],
                ["brand", "Marca"],
                ["marketing", "Mkt"],
                ["ai", "IA Grátis"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  data-testid={`editor-tab-${id}`}
                  onClick={() => setTab(id)}
                  className={`flex-1 text-[11.5px] font-bold py-3 transition-colors ${
                    tab === id
                      ? id === "ai"
                        ? "text-amber-500 border-b-2 border-amber-500 bg-amber-500/10"
                        : dark
                        ? "text-white border-b-2 border-purple-400 bg-white/5"
                        : "text-slate-900 border-b-2 border-slate-900"
                      : dark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto studio-scroll p-4" data-lenis-prevent="true">
              {tab === "sections" && <SectionsPanel data={project.data} onChange={patchData} />}
              {tab === "items" && <ItemsPanel data={project.data} onChange={patchData} />}
              {tab === "brand" && <BrandPanel data={project.data} onChange={patchData} />}
              {tab === "marketing" && <MarketingPanel data={project.data} onChange={patchData} />}
              {tab === "ai" && <AiStudioPanel data={project.data} onChange={patchData} />}
            </div>
          </div>
        </aside>

        {/* Canva-Style Edge Pull Tab on Sidebar Border */}
        <button
          data-testid="sidebar-collapse-handle"
          aria-label={sidebarOpen ? "Recolher barra lateral" : "Expandir barra lateral"}
          onClick={() => setSidebarOpen((s) => !s)}
          style={{ left: sidebarOpen ? "310px" : "0px" }}
          className={`absolute top-1/2 -translate-y-1/2 z-30 w-5 h-16 border border-l-0 rounded-r-xl shadow-md flex items-center justify-center hover:w-6 transition-all duration-300 cursor-pointer ${
            dark
              ? "bg-[#120E24] border-white/15 text-slate-300 hover:text-white"
              : "bg-white border-[#D4D4D8] text-slate-500 hover:text-slate-900"
          }`}
          title={sidebarOpen ? "Esconder menu lateral (Estilo Canva)" : "Mostrar menu lateral"}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Canvas Area + Bottom Zoom Bar (Single clean scrollbar inside site) */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${dark ? "bg-[#0B0914]" : "bg-[#F1F5F9]"}`}>
          <div
            className={`flex-1 min-w-0 min-h-0 overflow-x-auto overflow-y-hidden studio-scroll ${
              isFullscreen && viewport === "desktop" ? "p-0" : "p-3 sm:p-5"
            } flex justify-center items-stretch`}
            data-lenis-prevent="true"
          >
            <div
              style={{
                width:
                  isFullscreen && viewport === "desktop" && scale === 1
                    ? "100%"
                    : `${Math.round(vp.width * scale)}px`,
                transition: "width .2s ease",
              }}
              className="flex-none h-full relative"
            >
              <div
                className={`canvas-shell bg-white ${
                  isFullscreen && viewport === "desktop" && scale === 1
                    ? "rounded-none border-0"
                    : "rounded-2xl shadow-2xl border border-[#D4D4D8]"
                } overflow-hidden origin-top-left`}
                style={{
                  width:
                    isFullscreen && viewport === "desktop" && scale === 1
                      ? "100%"
                      : `${vp.width}px`,
                  height: scale === 1 ? "100%" : `${Math.round(100 / scale)}%`,
                  transform: scale === 1 ? "none" : `scale(${scale})`,
                }}
              >
                <iframe sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation"
                  ref={iframeRef}
                  key={viewport}
                  onLoad={handleIframeLoad}
                  title="Canvas do site"
                  data-testid="editor-canvas"
                  srcDoc={html}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>

          {/* Canva-Style Bottom Zoom Bar */}
          <div
            data-testid="editor-zoom-bar"
            className={`${isFullscreen ? "hidden" : "flex"} h-11 border-t px-5 items-center justify-between gap-4 text-[12px] select-none z-20 transition-colors ${
              dark ? "bg-[#0F0B1E] border-white/10 text-slate-300" : "bg-white border-[#E4E4E7] text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span className="hidden sm:inline">
                Modo Canva · Clique em textos para editar, em fotos (inclusive dos itens) para trocar imagem, ou em botões para personalizar
              </span>
              <span className="sm:hidden">Editor Visual</span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                data-testid="zoom-out-button"
                aria-label="Diminuir zoom"
                onClick={() => setZoom((z) => Math.max(50, z - 5))}
                className={`p-1 rounded transition-colors ${dark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"}`}
                title="Diminuir zoom"
              >
                <ZoomOut size={15} />
              </button>
              <input
                data-testid="zoom-slider"
                aria-label="Ajustar zoom do canvas"
                type="range"
                min={50}
                max={100}
                step={5}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-28 sm:w-36 accent-purple-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <button
                data-testid="zoom-in-button"
                aria-label="Aumentar zoom"
                onClick={() => setZoom((z) => Math.min(100, z + 5))}
                className={`p-1 rounded transition-colors ${dark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"}`}
                title="Aumentar zoom"
              >
                <ZoomIn size={15} />
              </button>
              <span data-testid="zoom-value" className={`font-bold tabular-nums w-11 text-right ${dark ? "text-white" : "text-slate-900"}`}>
                {zoom}%
              </span>
              <button
                data-testid="zoom-reset-button"
                onClick={() => setZoom(zoom === 100 ? 80 : 100)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-bold transition-colors ${
                  dark ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-[#E4E4E7] hover:bg-slate-50 text-slate-700"
                }`}
                title="Alternar ajuste de tela (80% / 100%)"
              >
                <Maximize2 size={12} /> {zoom === 100 ? "Ajustar" : "100%"}
              </button>
            </div>
          </div>
        </div>

        {inspector && (
          <Inspector inspector={inspector} data={project.data} onChange={patchData} onClose={() => setInspector(null)} />
        )}
      </div>

      {/* MODAL DE PUBLICAÇÃO ONLINE (VERCEL / NETLIFY DROP / LINK OFICIAL / SEARCH CONSOLE) */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#120E24] rounded-2xl border border-purple-900/15 dark:border-white/10 shadow-2xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-4 border-b border-inherit pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">
                    Publicar Site Online & Google Search Console
                  </h3>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hospede gratuitamente na Vercel/Netlify ou use o link público oficial do G360.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-[13px]">
              {/* Opção 1: Link Direto Imediato G360 */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1">
                    <Check size={13} /> Link Público Oficial (Já Ativo na Nuvem)
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white break-all text-[12.5px]">
                    {window.location.origin}/site/{project.slug}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/site/${project.slug}`);
                      setCopiedLiveUrl(true);
                      toast.success("Link do site copiado para a área de transferência!");
                      setTimeout(() => setCopiedLiveUrl(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedLiveUrl ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLiveUrl ? "Copiado!" : "Copiar Link"}</span>
                  </button>
                  <a
                    href={`/site/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[12px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={13} /> <span>Abrir</span>
                  </a>
                </div>
              </div>

              {/* Opção 2: Netlify Drop Gratuito (Sem conta necessária) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <b className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UploadCloud size={15} className="text-[#00AD9F]" /> Hospedagem Gratuita no Netlify Drop (1 Clique)
                  </b>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    100% Gratuito
                  </span>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Baixe a <b>Pasta ZIP</b> completa clicando no botão abaixo, acesse o <b>Netlify Drop</b> e apenas arraste a pasta ZIP. Seu site ficará online em segundos com certificado SSL grátis e suporte a domínio personalizado!
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#00AD9F] hover:bg-[#008f83] text-white font-bold text-[12px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ExternalLink size={13} /> <span>Abrir Netlify Drop</span>
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      await downloadSiteZip(project.data, `${project.slug}.zip`, project.slug);
                      toast.success("Pasta ZIP completa baixada com sucesso!");
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Archive size={13} /> <span>Baixar Pasta ZIP Agora</span>
                  </button>
                </div>
              </div>

              {/* Opção 3: Google Search Console */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <b className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck size={15} className="text-amber-500" /> Google Search Console (Sitemap & Indexação)
                  </b>
                  <span className="text-[11px] font-bold text-slate-500">sitemap.xml incluso</span>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  A pasta ZIP gerada já inclui <b>sitemap.xml</b> e <b>robots.txt</b> oficiais. Para indexar seu site no Google, acesse o <b>Search Console</b>, informe a URL do site e envie o sitemap.
                </p>
                <div className="pt-1">
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:text-slate-900 font-bold text-[12px] cursor-pointer"
                  >
                    <ExternalLink size={13} /> <span>Acessar Google Search Console</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-inherit">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-[12.5px] cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
