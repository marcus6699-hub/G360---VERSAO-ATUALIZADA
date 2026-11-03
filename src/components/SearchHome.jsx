import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Lenis from "lenis";
import { toast } from "sonner";
import {
  Search,
  Star,
  BadgeCheck,
  Loader2,
  Store,
  UtensilsCrossed,
  Stethoscope,
  ShoppingBag,
  Wand2,
  MonitorSmartphone,
  CopyPlus,
  MapPin,
  Globe,
  Film,
  ImagePlus,
  Sparkles,
  RefreshCw,
  Maximize2,
  Rocket,
  CheckCircle2,
  Radar,
  Keyboard,
  X,
  Layers,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import {
  ZYCRON_RAMOS,
  ZYCRON_MAP_PINS,
  ALL_TEMPLATE_IDS,
  buildBusinessFromRamo,
} from "@/lib/sitegen/zycronCatalog";
import { SITE_TEMPLATES } from "@/lib/sitegen/theme";
import { createProjectData } from "@/lib/sitegen/projectFactory";
import { generateSiteHtml } from "@/lib/sitegen/generateSiteHtml";

const DEMO_CHIPS = [
  "Farmácia Anápolis - DrogaLu",
  "Clínica Dr. Samuel",
  "Pamonharia do Simprão",
  "Farmácia Moreira",
  "Oficina Impacto Baterias",
  "Studio Bella Hair",
];

const GENERATION_STEPS = [
  "Entendendo o ramo e a cidade",
  "Escrevendo os textos persuasivos",
  "Montando o site e catálogo",
];

export default function SearchHome({ onPick, onClone, onQuickGenerate, onOpenTemplates }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  // Zycron Radar & 1-Click Niche Generator state
  const [zycronMode, setZycronMode] = useState("map"); // "map" | "type"
  const [selectedPinId, setSelectedPinId] = useState(ZYCRON_MAP_PINS[0].id);
  const [customName, setCustomName] = useState("Padaria Pão Quente");
  const [customRamo, setCustomRamo] = useState("Padaria e confeitaria");
  const [customCity, setCustomCity] = useState("Campinas, SP");
  const [templateOverrideId, setTemplateOverrideId] = useState("");
  const [genStep, setGenStep] = useState(3); // 0..2 = animating, 3 = ready
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const selectedPin = useMemo(
    () => ZYCRON_MAP_PINS.find((p) => p.id === selectedPinId) || ZYCRON_MAP_PINS[0],
    [selectedPinId]
  );

  // Active business rendered inside the iPhone frame
  const activeBusiness = useMemo(() => {
    if (zycronMode === "map") {
      return buildBusinessFromRamo({
        nome: selectedPin.name,
        ramo: selectedPin.ramo,
        cidade: selectedPin.city,
      });
    }
    return buildBusinessFromRamo({
      nome: customName || "Comércio Local",
      ramo: customRamo,
      cidade: customCity || "Campinas, SP",
    });
  }, [zycronMode, selectedPin, customName, customRamo, customCity]);

  const activeTemplateId = useMemo(() => {
    if (templateOverrideId && SITE_TEMPLATES.some((t) => t.id === templateOverrideId)) {
      return templateOverrideId;
    }
    return activeBusiness.recommended_template || "zycron-padaria";
  }, [templateOverrideId, activeBusiness.recommended_template]);

  const activeTemplateObj = useMemo(
    () => SITE_TEMPLATES.find((t) => t.id === activeTemplateId) || SITE_TEMPLATES[0],
    [activeTemplateId]
  );

  const previewHtml = useMemo(() => {
    const proj = createProjectData(activeBusiness, activeTemplateObj.archetype, activeTemplateObj.id);
    return generateSiteHtml(proj, { editor: false });
  }, [activeBusiness, activeTemplateObj]);

  const triggerStepAnimation = () => {
    setGenStep(0);
    setTimeout(() => setGenStep(1), 220);
    setTimeout(() => setGenStep(2), 460);
    setTimeout(() => setGenStep(3), 720);
  };

  const handleSelectPin = (pin) => {
    setSelectedPinId(pin.id);
    setTemplateOverrideId("");
    triggerStepAnimation();
  };

  const handleCycleTemplate = () => {
    const idx = ALL_TEMPLATE_IDS.indexOf(activeTemplateId);
    const nextId = ALL_TEMPLATE_IDS[(idx + 1) % ALL_TEMPLATE_IDS.length];
    setTemplateOverrideId(nextId);
    const nextTpl = SITE_TEMPLATES.find((t) => t.id === nextId);
    toast.success(`Modelo alterado para: ${nextTpl?.name || nextId}`);
  };

  const handleManualGenerate = (e) => {
    e.preventDefault();
    setTemplateOverrideId("");
    triggerStepAnimation();
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      prevent: (node) => !!node?.closest?.("[data-lenis-prevent]"),
    });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/places/autocomplete", { params: { q } });
        setItems(data.suggestions || []);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  const handleCloneByUrl = async (e) => {
    e.preventDefault();
    if (!cloneUrl.trim()) {
      toast.error("Cole o link (URL) do site que deseja replicar.");
      return;
    }
    setCloning(true);
    try {
      const { data } = await api.post("/ai/clone-site", { url: cloneUrl });
      if (data.business && onClone) {
        toast.success("Estrutura extraída do site! Revise e gere a réplica.");
        onClone(data.business);
      }
    } catch (err) {
      toast.error(fmtErr(err, "Não foi possível replicar a URL informada"));
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="flex-1" data-testid="search-home">
      <section className="max-w-[880px] mx-auto px-5 pt-14 sm:pt-20 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500 border border-[#E4E4E7] bg-white rounded-full px-4 py-2 mb-7"
        >
          <span className="status-dot on" /> Busca Google Meu Negócio · Radar Zycron · 7 Modelos Reais
        </motion.div>
        <h1 className="font-extrabold text-slate-900" style={{ fontSize: "clamp(36px,5.2vw,62px)", lineHeight: 1.03, letterSpacing: "-0.045em" }}>
          <span className="mask-line">
            <span>Digite a empresa.</span>
          </span>
          <span className="mask-line">
            <span style={{ animationDelay: ".18s" }}>
              Receba o <em className="italic" style={{ color: "#2D7819" }}>site pronto</em>.
            </span>
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-slate-500 text-[15.5px] leading-relaxed max-w-xl mx-auto mt-5"
        >
          Puxamos fotos, avaliações, horários e contato direto da ficha do Google, garimpamos comércios sem site pelo mapa ou replicamos qualquer site por URL.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative mt-9" ref={boxRef}>
          <div className="search-glow flex items-center gap-3 bg-white border border-[#E4E4E7] rounded-2xl px-5 py-4 transition-shadow">
            <Search size={20} className="text-slate-400 flex-none" />
            <input
              data-testid="search-gmb-input"
              aria-label="Digite o nome da empresa e cidade"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => items.length && setOpen(true)}
              placeholder="Digite o nome da empresa e cidade (ex: Farmácia Anápolis - DrogaLu)"
              className="flex-1 bg-transparent outline-none text-[15.5px] text-slate-900 placeholder:text-slate-400"
            />
            {loading && <Loader2 size={18} className="animate-spin text-slate-400" />}
          </div>
          {open && items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute left-0 right-0 mt-2 panel overflow-hidden text-left z-30"
              data-testid="gmb-autocomplete-dropdown"
            >
              {items.map((s, i) => (
                <button
                  key={s.place_id + i}
                  data-testid={`gmb-autocomplete-item-${i}`}
                  onClick={() => {
                    setOpen(false);
                    onPick(s);
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} referrerPolicy="no-referrer" className="w-11 h-11 rounded-xl object-cover flex-none" />
                  ) : (
                    <span className="w-11 h-11 rounded-xl bg-slate-100 grid place-items-center flex-none">
                      <Store size={17} className="text-slate-400" />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <b className="text-[14px] text-slate-900 truncate">{s.name}</b>
                      <BadgeCheck size={14} className="text-blue-500 flex-none" />
                    </span>
                    <span className="block text-[12px] text-slate-500 truncate">
                      {s.category} · {s.city}
                      {s.uf ? " — " + s.uf : ""}
                    </span>
                  </span>
                  {s.rating != null && (
                    <span className="flex items-center gap-1 text-[12.5px] font-bold text-slate-700 flex-none">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {String(s.rating).replace(".", ",")}
                      <span className="font-medium text-slate-400">({s.rating_count})</span>
                    </span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-2 mt-5">
          {DEMO_CHIPS.map((c, i) => (
            <button
              key={c}
              data-testid={`demo-chip-${i}`}
              onClick={() => setQ(c)}
              className="text-[12.5px] font-semibold text-slate-600 bg-white border border-[#E4E4E7] rounded-full px-4 py-2 hover:border-slate-900 hover:text-slate-900 transition-colors"
            >
              {c}
            </button>
          ))}
        </motion.div>

        {/* Clonador / Replicador Rápido de Site por URL */}
        <motion.form
          onSubmit={handleCloneByUrl}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 panel !rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-left"
          data-testid="home-clone-bar"
        >
          <div className="flex items-center gap-2.5 flex-1 px-2">
            <CopyPlus size={18} className="text-emerald-600 flex-none" />
            <input
              data-testid="home-clone-url-input"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="Tem um site de referência? Cole a URL aqui para replicar a estrutura com IA..."
              className="flex-1 bg-transparent outline-none text-[13.5px] text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={cloning}
            data-testid="home-clone-submit-btn"
            className="btn-primary-dark !py-2.5 !px-4 !text-[12.5px] flex-none"
          >
            {cloning ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />} Replicar Site
          </button>
        </motion.form>
      </section>

      {/* ZYCRON INTERACTIVE RADAR & 1-CLICK NICHE SITE SIMULATOR */}
      <section className="max-w-[1220px] mx-auto px-5 pb-14" data-testid="zycron-radar-simulator">
        <div className="rounded-3xl bg-[#141210] text-[#FBF7F0] border border-amber-500/25 p-6 sm:p-9 shadow-2xl">
          {/* Top Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-1 rounded-full mb-2">
                <Sparkles size={12} /> Motor Zycron Prospect Integrado · Teste ao Vivo
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Encontre comércios sem site ou gere por ramo em segundos
              </h2>
            </div>

            {/* Mode Switcher: "Pelo Mapa" vs "Digitar o Comércio" */}
            <div className="inline-flex bg-white/5 p-1.5 rounded-2xl border border-white/10 self-start">
              <button
                type="button"
                data-testid="zycron-tab-map"
                onClick={() => setZycronMode("map")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${
                  zycronMode === "map" ? "bg-amber-400 text-slate-950 shadow" : "text-white/70 hover:text-white"
                }`}
              >
                <Radar size={15} /> Pelo Mapa (Sem Site)
              </button>
              <button
                type="button"
                data-testid="zycron-tab-type"
                onClick={() => setZycronMode("type")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-extrabold transition-all ${
                  zycronMode === "type" ? "bg-amber-400 text-slate-950 shadow" : "text-white/70 hover:text-white"
                }`}
              >
                <Keyboard size={15} /> Digitar o Comércio (28 Ramos)
              </button>
            </div>
          </div>

          {/* Main Grid: Left Map/Form + Right Live iPhone 9:41 Preview */}
          <div className="grid lg:grid-cols-12 gap-8 pt-7 items-center">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {zycronMode === "map" ? (
                <>
                  {/* Interactive Radar Map Canvas */}
                  <div className="relative h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border border-white/15 bg-[#1B2320]">
                    {/* Stylized Street Grid SVG */}
                    <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="zycron-grid" width="56" height="56" patternUnits="userSpaceOnUse">
                          <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#6EE7B7" strokeWidth="0.6" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#zycron-grid)" />
                      <path d="M0 110 Q 260 140 520 75 T 900 180" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeOpacity="0.35" />
                      <path d="M120 0 L 290 400 M 440 0 L 380 400" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeOpacity="0.25" />
                    </svg>

                    {/* Top Map Legend */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/75 text-white backdrop-blur-md border border-white/10">
                        <MapPin size={12} className="text-amber-400" /> Campinas, SP · 5 comércios sem site encontrados
                      </span>
                      <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold px-3 py-1.5 rounded-full bg-black/75 text-white/80 border border-white/10">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Sem site
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Já tem site
                        </span>
                      </div>
                    </div>

                    {/* Map Pins */}
                    {ZYCRON_MAP_PINS.map((pin) => {
                      const active = pin.id === selectedPin.id;
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          data-testid={`zycron-map-pin-${pin.id}`}
                          onClick={() => handleSelectPin(pin)}
                          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all ${
                            active ? "z-20 scale-110" : "z-10 hover:scale-105"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-extrabold shadow-lg border transition-all ${
                              active
                                ? "bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/30"
                                : pin.hasSite
                                ? "bg-slate-800/90 text-white/55 border-white/10"
                                : "bg-[#1E1915]/95 text-amber-300 border-amber-400/50 hover:bg-amber-400 hover:text-slate-950"
                            }`}
                          >
                            <MapPin size={12} />
                            <span className="truncate max-w-[130px]">{pin.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Pin Details Card */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {selectedPin.hasSite ? "Já possui site" : "Não tem site · Oportunidade"}
                        </span>
                        <span className="text-[12px] font-bold text-amber-300 flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" /> {selectedPin.rating} ({selectedPin.reviews} avaliações)
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white" data-testid="zycron-selected-pin-name">
                        {selectedPin.name}
                      </h3>
                      <p className="text-[12.5px] text-white/65">
                        {selectedPin.ramo} · {selectedPin.address} · Sugestão:{" "}
                        <b className="text-emerald-300">
                          R$ {selectedPin.suggestedPrice} + R$ {selectedPin.suggestedMonthly}/mês
                        </b>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-center">
                      <button
                        type="button"
                        data-testid="zycron-open-editor-btn"
                        onClick={() =>
                          onQuickGenerate &&
                          onQuickGenerate(activeBusiness, activeTemplateObj.archetype, activeTemplateObj.id)
                        }
                        className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[12.5px] inline-flex items-center gap-1.5 transition-colors shadow"
                      >
                        <Rocket size={14} /> Abrir no Editor
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Mode 2: "Digitar o Comércio" */
                <form onSubmit={handleManualGenerate} className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        Nome do Comércio
                      </label>
                      <input
                        data-testid="zycron-custom-name-input"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ex: Barbearia Dom Bigode"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white text-[14px] font-semibold outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                        Cidade / Região
                      </label>
                      <input
                        data-testid="zycron-custom-city-input"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="Ex: Campinas, SP"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white text-[14px] font-semibold outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Escolha o Ramo ({ZYCRON_RAMOS.length} nichos prontos)
                    </label>
                    <select
                      data-testid="zycron-custom-ramo-select"
                      value={customRamo}
                      onChange={(e) => {
                        setCustomRamo(e.target.value);
                        setTemplateOverrideId("");
                        triggerStepAnimation();
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/15 text-white text-[14px] font-semibold outline-none focus:border-amber-400"
                    >
                      {ZYCRON_RAMOS.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Ramo Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Padaria e confeitaria",
                      "Barbearia",
                      "Costureira e ateliê",
                      "Pizzaria",
                      "Clínica odontológica",
                      "Oficina mecânica",
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setCustomRamo(r);
                          setTemplateOverrideId("");
                          triggerStepAnimation();
                        }}
                        className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                          customRamo === r
                            ? "bg-amber-400 text-slate-950 border-amber-400"
                            : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <button
                      type="submit"
                      data-testid="zycron-generate-now-btn"
                      className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[13px] inline-flex items-center gap-2 transition-colors"
                    >
                      <Sparkles size={15} /> Atualizar Prévia no Celular
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onQuickGenerate &&
                        onQuickGenerate(activeBusiness, activeTemplateObj.archetype, activeTemplateObj.id)
                      }
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[13px] inline-flex items-center gap-2 transition-colors"
                    >
                      <Rocket size={15} /> Abrir no Editor Completo
                    </button>
                  </div>
                </form>
              )}

              {/* 3-Step Animated Checklist (Entendendo o ramo -> Escrevendo os textos -> Montando o site) */}
              <div className="grid sm:grid-cols-3 gap-2.5">
                {GENERATION_STEPS.map((label, idx) => {
                  const done = genStep > idx;
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                        done
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      <CheckCircle2 size={14} className={done ? "text-emerald-400 flex-none" : "text-white/30 flex-none"} />
                      <span className="truncate">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (5 cols): Live iPhone 9:41 Frame + "Ver em outro modelo" */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[330px] rounded-[38px] bg-[#0B0A09] p-3 border-4 border-[#2E2925] shadow-2xl">
                {/* iPhone Status Bar (9:41 + Notch) */}
                <div className="flex items-center justify-between px-4 py-1.5 text-[11px] font-bold text-white/80">
                  <span>9:41</span>
                  <span className="w-20 h-4 rounded-full bg-black border border-white/10" />
                  <span className="text-[10px] text-emerald-400">5G ●●●</span>
                </div>

                {/* Scaled Mobile Site Iframe */}
                <div className="relative w-full h-[460px] rounded-[26px] overflow-hidden bg-white">
                  <div
                    className="origin-top-left"
                    style={{
                      width: "125%",
                      height: "575px",
                      transform: "scale(0.8)",
                    }}
                  >
                    <iframe
                      title={`Prévia Zycron ${activeBusiness.name}`}
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>

              {/* Controls below the iPhone Frame */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  data-testid="zycron-cycle-template-btn"
                  onClick={handleCycleTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[12px] inline-flex items-center gap-1.5 border border-white/15 transition-colors"
                >
                  <RefreshCw size={13} /> Ver em outro modelo ({activeTemplateObj.name.split("·")[0].trim()})
                </button>
                <button
                  type="button"
                  data-testid="zycron-fullscreen-preview-btn"
                  onClick={() => setFullscreenOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[12px] inline-flex items-center gap-1.5 border border-white/15 transition-colors"
                >
                  <Maximize2 size={13} /> Tela cheia
                </button>
                {onOpenTemplates && (
                  <button
                    type="button"
                    onClick={() => onOpenTemplates(activeBusiness, activeTemplateObj.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-[12px] inline-flex items-center gap-1.5 border border-amber-400/30 transition-colors"
                  >
                    <Layers size={13} /> Ver todos os 7 modelos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1080px] mx-auto px-5 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: UtensilsCrossed, t: "Gastronomia & Padarias", d: "Cardápio com filtros, fotos em arco ou estilo WhatsApp e pedido direto em 1 toque." },
            { icon: Stethoscope, t: "Barbearias, Clínicas & Serviços", d: "Hero split dark ou editorial, galeria 'Por dentro' e agendamento rápido." },
            { icon: ShoppingBag, t: "Moda, Boutiques & Produtos", d: "Lookbook numerado 01..06, vitrine express e cotação instantânea no WhatsApp." },
          ].map((f, i) => (
            <motion.div
              key={f.t}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="panel p-6"
              data-testid={`feature-card-${i}`}
            >
              <span className="w-11 h-11 rounded-xl bg-slate-900 text-amber-300 grid place-items-center mb-4">
                <f.icon size={19} strokeWidth={1.75} />
              </span>
              <b className="block text-[15px] text-slate-900 tracking-tight">{f.t}</b>
              <p className="text-[13px] text-slate-500 leading-relaxed mt-1.5">{f.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="panel mt-4 p-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12.5px] font-semibold text-slate-600">
          <span className="flex items-center gap-2">
            <Wand2 size={15} className="text-slate-900" /> Bio & Catálogo com IA Gratuita
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={15} className="text-emerald-600" /> Google Maps Grounding
          </span>
          <span className="flex items-center gap-2">
            <Globe size={15} className="text-blue-600" /> Google Search Grounding
          </span>
          <span className="flex items-center gap-2">
            <ImagePlus size={15} className="text-purple-600" /> Criar & Editar Imagens IA
          </span>
          <span className="flex items-center gap-2">
            <Film size={15} className="text-rose-600" /> Animar Foto em Vídeo (16:9 / 9:16)
          </span>
          <span className="flex items-center gap-2">
            <MonitorSmartphone size={15} className="text-slate-900" /> Exportação HTML Independente
          </span>
        </div>
      </section>

      {/* Fullscreen Modal for Live Site Inspection */}
      {fullscreenOpen && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-3 sm:p-6"
          onClick={() => setFullscreenOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl border border-[#E4E4E7] max-w-[1380px] w-full mx-auto"
          >
            <div className="px-5 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between gap-4 flex-wrap">
              <div>
                <b className="text-[15px] text-slate-900">{activeBusiness.name}</b>
                <span className="text-[12px] text-slate-500 ml-2">· {activeTemplateObj.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCycleTemplate}
                  className="px-3.5 py-2 rounded-xl border border-[#E4E4E7] hover:bg-slate-50 text-[12px] font-bold text-slate-700 inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Trocar Modelo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFullscreenOpen(false);
                    onQuickGenerate && onQuickGenerate(activeBusiness, activeTemplateObj.archetype, activeTemplateObj.id);
                  }}
                  className="btn-primary-dark !py-2 !px-4 !text-[12.5px] !rounded-xl"
                >
                  <Rocket size={14} /> Personalizar no Editor
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreenOpen(false)}
                  className="w-9 h-9 rounded-full border border-[#E4E4E7] grid place-items-center text-slate-500 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe title="Prévia em tela cheia" srcDoc={previewHtml} className="w-full h-full border-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
