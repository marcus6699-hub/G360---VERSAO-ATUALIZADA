import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import { toast } from "sonner";
import {
  Search,
  BadgeCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Globe,
  Star,
  CheckCircle2,
  XCircle,
  Briefcase,
  Sparkles,
  Layers,
  SlidersHorizontal,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Building2,
  Navigation,
  BarChart3,
  Printer,
  X,
  Plus,
  Minus,
  ExternalLink,
  Clock,
  Download,
  LocateFixed,
  History,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import { parseSafeReviewCount } from "@/lib/utils";

const QUICK_PROSPECTS = [
  "Castelinho Pizzaria & Empório Anápolis",
  "Sorvetes Campo Grande",
  "Encanto Móveis Planejados",
  "Central Gás & Água Anápolis",
  "Farmácia Anápolis - DrogaLu",
  "Clínica Dr. Samuel",
];

const GBP_CHECK_LOADING_STEPS = [
  "Carregando informações do negócio",
  "Analisando dados do perfil",
  "Coletando fotos e vídeos",
  "Localizando as avaliações",
  "Lendo as avaliações",
  "Acessando perfil no Google Maps",
  "Encontrando seus concorrentes",
];

function getRealCandidatePhoto(item) {
  if (!item || typeof item !== "object") return "";
  const candidates = [
    item.logo,
    item.photo,
    ...(Array.isArray(item.photos) ? item.photos : []),
  ];
  for (const rawUrl of candidates) {
    const u = String(rawUrl || "").trim();
    if (u && !u.startsWith("data:image/svg+xml")) {
      return u;
    }
  }
  return "";
}

function SpeedometerGauge({ score = 75, classification = "Razoável", dark = false }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  // GBP Check 3-Band Color Scale: <60 Red (#EF4444), 60-79 Amber (#F59E0B), 80+ Emerald (#10B981)
  const scoreColor = clamped < 60 ? "#EF4444" : clamped < 80 ? "#F59E0B" : "#10B981";
  const arcLength = 235.6;
  const strokeOffset = arcLength * (1 - clamped / 100);
  // Needle angle: 0 score = -90deg (left), 50 score = 0deg (up), 100 score = +90deg (right)
  const needleRotation = -90 + (clamped / 100) * 180;

  const labelDisplay =
    clamped < 40
      ? "CRÍTICO"
      : clamped < 60
      ? "FRACO"
      : clamped < 80
      ? "RAZOÁVEL"
      : clamped < 90
      ? "BOM"
      : "EXCELENTE";

  return (
    <div className="flex flex-col items-center justify-center py-2" data-testid="speedometer-gauge-3band">
      <div className="relative w-[220px] sm:w-[240px] h-[136px] flex items-end justify-center">
        <svg viewBox="0 0 200 125" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="g360GaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="55%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
          {/* 3-Band Segmented Arc (Red 0-55% / Amber 55-78% / Green 78-100% matching GBP Check) */}
          <path
            d="M 25 102 A 75 75 0 0 1 175 102"
            fill="none"
            stroke="#10B981"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M 25 102 A 75 75 0 0 1 175 102"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="15"
            strokeLinecap="butt"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength * (1 - 0.78)}
          />
          <path
            d="M 25 102 A 75 75 0 0 1 175 102"
            fill="none"
            stroke="#DC2626"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength * (1 - 0.54)}
          />
          {/* Scale Labels */}
          <text x="14" y="120" fill={dark ? "#94A3B8" : "#64748B"} fontSize="10" fontWeight="700">0</text>
          <text x="94" y="16" fill={dark ? "#94A3B8" : "#64748B"} fontSize="10" fontWeight="700">50</text>
          <text x="168" y="120" fill={dark ? "#94A3B8" : "#64748B"} fontSize="10" fontWeight="700">100</text>

          {/* GBP Check Center Pointer / Needle (Ponteiro) */}
          <g
            transform={`translate(100, 102) rotate(${needleRotation})`}
            style={{ transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
            data-testid="speedometer-pointer-needle"
          >
            <polygon
              points="-4.5,0 0,-64 4.5,0"
              fill={dark ? "#F8FAFC" : "#1E293B"}
            />
            <circle cx="0" cy="0" r="8" fill={dark ? "#F8FAFC" : "#1E293B"} />
            <circle cx="0" cy="0" r="3.5" fill={scoreColor} />
          </g>
        </svg>
      </div>

      {/* Score Readout + Classification Pill Below Pointer */}
      <div className="mt-1 flex flex-col items-center text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span
            className="text-[42px] font-black tracking-tight leading-none tabular-nums"
            style={{ color: scoreColor }}
            data-testid="audit-overall-score"
          >
            {clamped}
          </span>
          <span className="text-[14px] font-bold opacity-60">/100</span>
        </div>

        <div
          className="mt-2 inline-flex items-center gap-2 px-4 py-1 rounded-full text-[12px] font-extrabold uppercase tracking-wider border"
          style={{
            backgroundColor:
              clamped < 60 ? "rgba(239,68,68,0.12)" : clamped < 80 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
            borderColor:
              clamped < 60 ? "rgba(239,68,68,0.3)" : clamped < 80 ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)",
            color:
              clamped < 60 ? "#EF4444" : clamped < 80 ? "#D97706" : "#10B981",
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scoreColor }} />
          <span>{classification ? String(classification).toUpperCase() : labelDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export default function G360AuditPanel({
  dark = false,
  activeReport,
  onReportChange,
  onExportToCrm,
  onOpenGbpPackage,
  onOpenSiteExpress,
}) {
  const [subTab, setSubTab] = useState("single"); // "single" | "leadfinder"
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [suggestions, setSuggestions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // GBP Check Loading Modal state
  const [runningAudit, setRunningAudit] = useState(false);
  const [loadingTargetBiz, setLoadingTargetBiz] = useState(null);
  const [auditStep, setAuditStep] = useState(0);
  const [runningCompleteSimulation, setRunningCompleteSimulation] = useState(false);

  // Lightbox Modal & Custom Photo Overrides
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [customLogoOverride, setCustomLogoOverride] = useState("");
  const [customCoverOverride, setCustomCoverOverride] = useState("");
  const [searchingCustomKeyword, setSearchingCustomKeyword] = useState(false);

  // Real Pre-Analysis vs Complete Analysis history (per business)
  const [auditHistoryByBiz, setAuditHistoryByBiz] = useState(() => {
    try {
      const raw = localStorage.getItem("g360_audit_history_v2");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      let modified = false;
      for (const k of Object.keys(parsed || {})) {
        const rep = parsed[k]?.latestAnalysis || parsed[k]?.preAnalysis;
        const b = rep?.business;
        if (
          b &&
          b.city === "Anápolis" &&
          (/floripa|florian[oó]polis|beira\s*mar\s*norte/i.test(`${b.name || ""} ${b.address || ""}`) ||
            /^\+?55\s*\(?48\)?|\(48\)/.test(String(b.phone || "")))
        ) {
          delete parsed[k];
          modified = true;
        }
      }
      if (modified) {
        localStorage.setItem("g360_audit_history_v2", JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return {};
    }
  });
  const [auditModeView, setAuditModeView] = useState("pre"); // "pre" | "latest"

  const [selectedKeywordIdx, setSelectedKeywordIdx] = useState(0);
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [selectedPin, setSelectedPin] = useState(null);
  const [criterionFilter, setCriterionFilter] = useState("all"); // "all" | "critical" | "warning" | "good"
  const [expandedCriteria, setExpandedCriteria] = useState({
    gbp_top10_reviews: true,
    gbp_segment_avg_reviews: true,
  });
  const [showHoursFull, setShowHoursFull] = useState(false);

  // Optional On-Demand Geogrid state (Independent of Audit Score, with 3x3 vs 5x5 API cost transparency, visible by default)
  const [geogridEnabled, setGeogridEnabled] = useState(true);
  const [geogridSize, setGeogridSize] = useState(3); // 3 (9 pts) | 5 (25 pts)
  const [geogridRadiusKm, setGeogridRadiusKm] = useState(2.5);
  const [runningLiveGeogrid, setRunningLiveGeogrid] = useState(false);
  const [liveGeogridResult, setLiveGeogridResult] = useState(null);

  // Interactive Map Zoom, Satellite Mode & GPS Recenter state
  const [mapZoomDelta, setMapZoomDelta] = useState(0.0028); // Street-level close zoom by default
  const [mapCenterKey, setMapCenterKey] = useState(0);
  const [mapLayerMode, setMapLayerMode] = useState("map"); // "map" | "satellite"

  // Lead Finder state
  const [leadNiche, setLeadNiche] = useState("Móveis Planejados");
  const [leadCity, setLeadCity] = useState("Anápolis");
  const [leadNeighborhood, setLeadNeighborhood] = useState("");
  const [filterUnverified, setFilterUnverified] = useState(false);
  const [filterNoSite, setFilterNoSite] = useState(false);
  const [leadsList, setLeadsList] = useState([]);
  const [searchingLeads, setSearchingLeads] = useState(false);

  // PDF Modal state
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    includeScoreAndPillars: true,
    includeActionPlan: true,
    includeGeogrid: false,
    includeCompetitors: true,
    agencyName: "G360 Google Business Intelligence",
  });

  // Live Website Technical Scanner state
  const [websiteAudit, setWebsiteAudit] = useState(null);
  const [auditingWebsite, setAuditingWebsite] = useState(false);

  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);
  const autocompleteSeqRef = useRef(0);
  const autocompleteAbortRef = useRef(null);
  // Prevents autocomplete useEffect from re-opening dropdown after clicking a suggestion or quick chip
  const suppressAutocompleteRef = useRef(false);

  useEffect(() => {
    const close = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Load initial audit if none active
  useEffect(() => {
    if (!activeReport) {
      api
        .get("/g360/audits")
        .then((r) => {
          if (r.data?.audits?.[0]) {
            onReportChange(r.data.audits[0]);
          }
        })
        .catch(() => {});
    }
  }, [activeReport, onReportChange]);

  // Reset states when activeReport changes — keep review competitor charts expanded by default!
  useEffect(() => {
    setShowHoursFull(false);
    setMapZoomDelta(0.0028);
    setMapCenterKey((k) => k + 1);
    setLiveGeogridResult(null);
    setLightboxIndex(null);
    setCustomLogoOverride("");
    setCustomCoverOverride("");
    setExpandedCriteria({
      gbp_top10_reviews: true,
      gbp_segment_avg_reviews: true,
    });
  }, [activeReport?.business?.name]);

  // Autocomplete search ONLY when user is actively typing (260ms optimized debounce for 60fps input responsiveness)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (suppressAutocompleteRef.current) {
      return;
    }
    const cleanQuery = deferredQuery.trim();
    if (cleanQuery.length < 2) {
      if (autocompleteAbortRef.current) {
        autocompleteAbortRef.current.abort();
      }
      setSuggestions([]);
      setDropdownOpen(false);
      setLoadingSuggestions(false);
      return;
    }
    const reqSeq = ++autocompleteSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      if (suppressAutocompleteRef.current || reqSeq !== autocompleteSeqRef.current) return;
      if (autocompleteAbortRef.current) {
        autocompleteAbortRef.current.abort();
      }
      const controller = new AbortController();
      autocompleteAbortRef.current = controller;
      setLoadingSuggestions(true);
      try {
        const { data } = await api.get("/places/autocomplete", {
          params: { q: cleanQuery },
          signal: controller.signal,
        });
        if (!suppressAutocompleteRef.current && reqSeq === autocompleteSeqRef.current) {
          const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
          setSuggestions(list);
          setDropdownOpen(list.length > 0);
        }
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED" && reqSeq === autocompleteSeqRef.current) {
          setSuggestions([]);
        }
      } finally {
        if (reqSeq === autocompleteSeqRef.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 260);
    return () => clearTimeout(debounceRef.current);
  }, [deferredQuery]);

  // Progressive 7-step timer during audit
  useEffect(() => {
    if (!runningAudit) {
      setAuditStep(0);
      return;
    }
    const stepTimer = setInterval(() => {
      setAuditStep((s) => (s < GBP_CHECK_LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 340);
    return () => clearInterval(stepTimer);
  }, [runningAudit]);

  const recordAuditInHistory = (reportObj) => {
    if (!reportObj?.business?.name) return;
    const key = String(reportObj.business.place_id || reportObj.business.name).toLowerCase();
    setAuditHistoryByBiz((prev) => {
      const existing = prev[key];
      const nextEntry = existing
        ? {
            preAnalysis: existing.preAnalysis,
            latestAnalysis: reportObj,
            updatedAt: new Date().toISOString(),
          }
        : {
            preAnalysis: reportObj,
            latestAnalysis: reportObj,
            updatedAt: new Date().toISOString(),
          };
      const updated = { ...prev, [key]: nextEntry };
      try {
        localStorage.setItem("g360_audit_history_v2", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const runAuditForBusiness = async (bizOrQuery) => {
    clearTimeout(debounceRef.current);
    suppressAutocompleteRef.current = true;
    setDropdownOpen(false);
    setSuggestions([]);
    setSelectedCandidate(null);
    setRunningAudit(true);
    setAuditStep(0);

    const previewTarget =
      typeof bizOrQuery === "string"
        ? { name: bizOrQuery, address: "Consultando ficha no Google Maps...", rating: 4.8, rating_count: "..." }
        : {
            name: bizOrQuery.name || "Empresa Local",
            address: bizOrQuery.address || `${bizOrQuery.city || "Anápolis"} - ${bizOrQuery.uf || "GO"}`,
            rating: Number(bizOrQuery.rating || 4.8).toFixed(1),
            rating_count: bizOrQuery.rating_count || 18,
          };
    setLoadingTargetBiz(previewTarget);

    const startTime = Date.now();
    try {
      let payload;
      if (typeof bizOrQuery === "string") {
        // First try to resolve real Google Places details from autocomplete so "Castelinho Pizzaria & Empório" gets real Google data
        try {
          const acRes = await api.get("/places/autocomplete", { params: { q: bizOrQuery } });
          const firstMatch = (acRes.data?.suggestions || []).find(
            (s) => !String(s.place_id || "").startsWith("custom::")
          );
          if (firstMatch?.place_id) {
            const detRes = await api.get(`/places/details/${encodeURIComponent(firstMatch.place_id)}`);
            if (detRes.data?.name) {
              setLoadingTargetBiz({
                name: detRes.data.name,
                address: detRes.data.address || `${detRes.data.city || ""} - ${detRes.data.uf || ""}`,
                rating: Number(detRes.data.rating || 4.8).toFixed(1),
                rating_count: detRes.data.rating_count || 18,
              });
              payload = { business: detRes.data };
            }
          }
        } catch {}
        if (!payload) {
          payload = { query: bizOrQuery };
        }
      } else {
        payload = { business: bizOrQuery };
      }

      const { data } = await api.post("/g360/audit", payload);
      // Ensure the 7 steps visually complete like GBP Check (~2.1s total)
      const elapsed = Date.now() - startTime;
      if (elapsed < 1900) {
        await new Promise((r) => setTimeout(r, 1900 - elapsed));
      }
      setAuditStep(GBP_CHECK_LOADING_STEPS.length);
      await new Promise((r) => setTimeout(r, 250));

      if (data?.report) {
        onReportChange(data.report);
        recordAuditInHistory(data.report);
        setAuditModeView("pre");
        setSelectedKeywordIdx(0);
        setSelectedPin(null);
        setCriterionFilter("all");
        toast.success(`Análise concluída para ${data.report.business?.name}`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Não foi possível executar a análise"));
    } finally {
      setRunningAudit(false);
      setLoadingTargetBiz(null);
    }
  };

  // Selecting a suggestion immediately triggers the analysis for the chosen business
  const handleSelectSuggestion = async (sug) => {
    clearTimeout(debounceRef.current);
    autocompleteSeqRef.current += 1;
    if (autocompleteAbortRef.current) {
      autocompleteAbortRef.current.abort();
    }
    suppressAutocompleteRef.current = true;
    setDropdownOpen(false);
    setSuggestions([]);
    setLoadingSuggestions(false);
    setQuery(sug.name);
    setSelectedCandidate(null);
    runAuditForBusiness(sug);
  };

  const handleStartAnalysisClick = (e) => {
    e?.preventDefault();
    clearTimeout(debounceRef.current);
    suppressAutocompleteRef.current = true;
    setDropdownOpen(false);
    setSuggestions([]);
    if (selectedCandidate) {
      runAuditForBusiness(selectedCandidate);
    } else if (query.trim().length >= 2) {
      runAuditForBusiness(query.trim());
    } else {
      toast.error("Digite o nome da empresa ou selecione uma sugestão na lista.");
    }
  };

  const handleSearchLeads = async (e) => {
    e?.preventDefault();
    setSearchingLeads(true);
    try {
      const { data } = await api.post("/g360/leads/search", {
        niche: leadNiche,
        city: leadCity,
        neighborhood: leadNeighborhood,
        filterUnverified,
        filterNoSite,
      });
      setLeadsList(data.leads || []);
      toast.success(`${(data.leads || []).length} empresas localizadas em ${leadCity}`);
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao buscar leads"));
    } finally {
      setSearchingLeads(false);
    }
  };

  const handleAddCustomKeyword = async (e) => {
    e?.preventDefault();
    if (!customKeywordInput.trim() || !activeReport) return;
    const kw = customKeywordInput.trim();
    const existingKeywords = activeReport.keywords || [];
    setSearchingCustomKeyword(true);
    try {
      const { data } = await api.post("/g360/keyword-ranking", {
        keyword: kw,
        business: activeReport.business,
      });
      if (data?.keywordItem) {
        const filteredExisting = existingKeywords.filter(
          (k) => String(k.keyword || "").toLowerCase() !== String(data.keywordItem.keyword || "").toLowerCase()
        );
        const updatedReport = {
          ...activeReport,
          keywords: [data.keywordItem, ...filteredExisting],
        };
        onReportChange(updatedReport);
        setSelectedKeywordIdx(0);
        setCustomKeywordInput("");
        toast.success(`Ranking competitivo ao vivo carregado para "${kw}"!`);
        return;
      }
    } catch (err) {
      toast.error(fmtErr(err, "Erro ao consultar ranking para a palavra-chave"));
    } finally {
      setSearchingCustomKeyword(false);
    }
  };

  const handleRunCompleteAnalysis = async () => {
    if (!activeReport) return;
    setRunningCompleteSimulation(true);
    setRunningAudit(true);
    setAuditStep(0);
    setLoadingTargetBiz({
      name: activeReport.business?.name || "Empresa",
      address: "Simulando otimização completa (Site + Categorias + Fotos + Avaliações)...",
      rating: Number(activeReport.business?.rating || 4.9).toFixed(1),
      rating_count: activeReport.business?.rating_count || 20,
    });
    await new Promise((r) => setTimeout(r, 2100));
    setAuditStep(GBP_CHECK_LOADING_STEPS.length);
    await new Promise((r) => setTimeout(r, 250));
    setRunningAudit(false);
    setRunningCompleteSimulation(false);
    setLoadingTargetBiz(null);
    setAuditModeView("latest");
    toast.success("Análise Completa concluída! Veja a pontuação e posição pós-otimização.");
  };

  const handleRunWebsiteAudit = async (urlToScan) => {
    setAuditingWebsite(true);
    try {
      const { data } = await api.post("/g360/website-audit", {
        url: urlToScan || activeReport?.business?.website || "",
      });
      setWebsiteAudit(data);
      toast.success("Scanner Técnico de Site concluído!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao auditar site"));
    } finally {
      setAuditingWebsite(false);
    }
  };

  // Derive realistic Pre-Analysis vs Conditional Projected Complete Analysis from AuditorEngine + GBP Check Criteria
  const bizHistoryKey = String(activeReport?.business?.place_id || activeReport?.business?.name || "").toLowerCase();
  const bizHistoryEntry = auditHistoryByBiz[bizHistoryKey];

  const basePreReport = useMemo(() => {
    if (!activeReport) return null;
    const preContract = activeReport.pre_analise;
    const rawCriteria =
      Array.isArray(activeReport.gbpCheckCriteria) && activeReport.gbpCheckCriteria.length > 0
        ? activeReport.gbpCheckCriteria
        : activeReport.criteria || [];
    const calcScore = Math.min(
      78,
      activeReport.gbpCheckScore ??
        activeReport.overallScore ??
        preContract?.nota_calculada ??
        65
    );
    const calcClass =
      calcScore < 40
        ? "Crítico"
        : calcScore < 60
        ? "Fraco"
        : calcScore < 80
        ? "Razoável"
        : calcScore < 90
        ? "Bom"
        : "Excelente";
    return {
      ...activeReport,
      overallScore: calcScore,
      classification: calcClass,
      criteria: rawCriteria,
      criticalCount: rawCriteria.filter((c) => c.status === "critical").length,
      warningCount: rawCriteria.filter((c) => c.status === "warning").length,
      goodCount: rawCriteria.filter((c) => c.status === "good").length,
    };
  }, [activeReport]);

  const completeOptimizedReport = useMemo(() => {
    if (!activeReport) return null;
    const rawCriteria =
      Array.isArray(activeReport.gbpCheckCriteria) && activeReport.gbpCheckCriteria.length > 0
        ? activeReport.gbpCheckCriteria
        : activeReport.criteria || [];

    const g360DeliverableIds = new Set([
      "website",
      "primary_category",
      "secondary_categories",
      "gbp_verified",
      "gbp_website",
      "gbp_phone",
      "gbp_hours",
      "gbp_primary_category",
      "gbp_additional_categories",
      "gbp_description",
      "gbp_photos_total",
      "gbp_photos_360",
      "gbp_videos",
      "gbp_posts",
      "gbp_owner_responses",
    ]);

    const projectedCriteria = rawCriteria.map((c) => {
      if ((c.status === "critical" || c.status === "warning") && g360DeliverableIds.has(c.id)) {
        return {
          ...c,
          status: "good",
          penalidade: 0,
          score: c.maxScore,
          progressPct: 100,
          currentValue: `${c.currentValue} → [Otimizado no Perfil]`,
        };
      }
      return c;
    });

    const projScore =
      activeReport.projectedScoreAfterOptimization ||
      Math.min(97, Math.max(91, (basePreReport?.overallScore ?? 72) + 21));
    const projClass = "Excelente";

    const projPillars = (activeReport.pillars || []).map((pil) => {
      const groupCode =
        pil.id === "cadastro" ? "A" : pil.id === "otimizacao" ? "B" : pil.id === "reputacao" ? "C" : "D";
      const sub = projectedCriteria.filter((c) => c.group === groupCode || c.pillarId === pil.id);
      if (sub.length === 0) return pil;
      const maxPts = sub.reduce((a, b) => a + (b.maxScore || 0), 0);
      const earnedPts = sub.reduce((a, b) => a + (b.score || 0), 0);
      const s = Math.round((earnedPts / Math.max(1, maxPts)) * 100);
      return {
        ...pil,
        score: s,
        earnedPoints: earnedPts,
        maxPoints: maxPts,
        status: s < 55 ? "critical" : s < 80 ? "warning" : "good",
      };
    });

    // In Complete Analysis, move the target company up to 2nd or 3rd place in the local ranking (realistic Top 3)
    const projKeywords = (activeReport.keywords || []).map((kwItem, kwIdx) => {
      const comps = Array.isArray(kwItem.competitors) ? [...kwItem.competitors] : [];
      const targetIdx = comps.findIndex((c) => c.isTarget);
      if (targetIdx === -1) return kwItem;
      const targetComp = {
        ...comps[targetIdx],
        gbpScore: projScore,
      };
      const others = comps.filter((c) => !c.isTarget);
      const newPosIdx = Math.min(others.length, kwIdx % 2 === 0 ? 1 : 2); // 2nd or 3rd place
      others.splice(newPosIdx, 0, targetComp);
      const reRanked = others.map((c, idx) => ({
        ...c,
        rank: idx + 1,
      }));
      return {
        ...kwItem,
        averageRank: newPosIdx + 1,
        competitors: reRanked,
      };
    });

    return {
      ...activeReport,
      overallScore: projScore,
      classification: projClass,
      criteria: projectedCriteria,
      pillars: projPillars,
      keywords: projKeywords,
      criticalCount: projectedCriteria.filter((c) => c.status === "critical").length,
      warningCount: projectedCriteria.filter((c) => c.status === "warning").length,
      goodCount: projectedCriteria.filter((c) => c.status === "good").length,
    };
  }, [activeReport, basePreReport]);

  const preScore = basePreReport?.overallScore ?? 0;
  const postScore = completeOptimizedReport?.overallScore ?? preScore;

  const report = auditModeView === "pre" ? basePreReport : completeOptimizedReport;

  const biz = report?.business || {};
  const displayedScore = report?.overallScore ?? 0;
  const displayedClassification = report?.classification || "Razoável";
  const displayedVerified = Boolean(report?.verified);
  const preAnaliseContract = report?.pre_analise || null;
  const projContract = report?.analise_completa_projetada || null;

  const activeKeywordObj = useMemo(() => {
    if (!report?.keywords?.length) return null;
    const baseKw = report.keywords[selectedKeywordIdx] || report.keywords[0];
    if (liveGeogridResult && liveGeogridResult.keyword === baseKw.keyword) {
      return {
        ...baseKw,
        averageRank: liveGeogridResult.averageRank,
        top3SharePct: liveGeogridResult.top3SharePct,
        pins: liveGeogridResult.pins,
        competitors:
          Array.isArray(liveGeogridResult.competitors) && liveGeogridResult.competitors.length > 0
            ? liveGeogridResult.competitors
            : baseKw.competitors,
        gridSize: liveGeogridResult.gridSize,
        costEstimate: liveGeogridResult.costEstimate,
      };
    }
    return baseKw;
  }, [report, selectedKeywordIdx, liveGeogridResult]);

  const handleRunLiveGeogrid = async (customKwOverride) => {
    if (!biz?.name) return;
    const kwToRun =
      typeof customKwOverride === "string" && customKwOverride.trim()
        ? customKwOverride.trim()
        : customKeywordInput.trim() || activeKeywordObj?.keyword || `${biz.category || "Empresa"} em ${biz.city || "Anápolis"}`;
    setRunningLiveGeogrid(true);
    setGeogridEnabled(true);
    try {
      const { data } = await api.post("/g360/geogrid-live", {
        business: biz,
        keyword: kwToRun,
        gridSize: geogridSize,
        radiusKm: geogridRadiusKm,
      });
      if (data?.geogrid) {
        setLiveGeogridResult({
          ...data.geogrid,
          keyword: activeKeywordObj?.keyword || kwToRun,
        });
        toast.success(
          `Geogrid ${geogridSize}x${geogridSize} (${geogridSize * geogridSize} coordenadas GPS) concluído na API!`
        );
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao executar Geogrid na API"));
    } finally {
      setRunningLiveGeogrid(false);
    }
  };

  // Strictly guarantee Worst-to-Best order: critical ("Fraco") -> warning ("Razoável") -> good ("Bom")
  const sortedCriteria = useMemo(() => {
    const list = [...(report?.criteria || [])];
    const order = { critical: 0, warning: 1, good: 2 };
    list.sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
    return list;
  }, [report]);

  const filteredCriteria = useMemo(() => {
    if (criterionFilter === "all") return sortedCriteria;
    return sortedCriteria.filter((c) => c.status === criterionFilter);
  }, [sortedCriteria, criterionFilter]);

  const handleRecenterMapOnCompany = () => {
    setMapZoomDelta(0.0028);
    setMapCenterKey((k) => k + 1);
    setSelectedPin(null);
    toast.success(`Mapa centralizado na localização exata de ${biz.name || "sua empresa"}`);
  };

  const handleDownloadDiagnosticPdf = () => {
    if (!report) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Diagnóstico GBP Check — ${biz.name || "Empresa"}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1E293B; margin: 0; padding: 32px; background: #F8FAFC; }
  .sheet { max-width: 920px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 36px; border: 1px solid #E2E8F0; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-weight: 700; font-size: 12px; }
  .bad { background: #FEE2E2; color: #DC2626; }
  .warn { background: #FEF3C7; color: #D97706; }
  .good { background: #DCFCE7; color: #16A34A; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { border-bottom: 1px solid #E2E8F0; padding: 10px 8px; text-align: left; }
  @media print { body { background: #FFF; padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div style="font-size:12px;font-weight:700;color:#7C3AED;text-transform:uppercase;">${pdfConfig.agencyName}</div>
        <h1 style="margin:4px 0 0;font-size:24px;">Diagnóstico Google Perfil da Empresa: ${biz.name}</h1>
        <div style="font-size:13px;color:#64748B;margin-top:4px;">${biz.category || ""} · ${biz.address || biz.city || ""}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:36px;font-weight:800;color:${displayedScore < 60 ? "#DC2626" : displayedScore < 80 ? "#D97706" : "#16A34A"};">${displayedScore}/100</div>
        <span class="badge ${displayedScore < 60 ? "bad" : displayedScore < 80 ? "warn" : "good"}">${displayedClassification}</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3 style="margin-top:0;font-size:15px;">Dados da Ficha Auditada</h3>
        <p style="font-size:13px;margin:6px 0;"><strong>Status no Google:</strong> ${displayedVerified ? "Perfil Verificado" : "NÃO VERIFICADO"}</p>
        <p style="font-size:13px;margin:6px 0;"><strong>Avaliações:</strong> ${Number(biz.rating || 4.8).toFixed(1)} ★ (${biz.rating_count || 18} avaliações)</p>
        <p style="font-size:13px;margin:6px 0;"><strong>Telefone:</strong> ${biz.phone || "Não informado"}</p>
        <p style="font-size:13px;margin:6px 0;"><strong>Website:</strong> ${biz.website || "Sem site próprio cadastrado"}</p>
      </div>
      <div class="card">
        <h3 style="margin-top:0;font-size:15px;">Resumo de Métricas Auditadas</h3>
        <p style="font-size:13px;margin:8px 0;"><strong style="color:#DC2626;">${report.criticalCount} Fraco:</strong> Métricas que precisam de atenção imediata</p>
        <p style="font-size:13px;margin:8px 0;"><strong style="color:#D97706;">${report.warningCount} Razoável:</strong> Métricas com potencial de melhoria</p>
        <p style="font-size:13px;margin:8px 0;"><strong style="color:#16A34A;">${report.goodCount} Bom:</strong> Métricas em excelente estado</p>
      </div>
    </div>

    <h3 style="font-size:16px;margin-bottom:8px;">Diagnóstico Completo (Ordenado do Pior para o Melhor)</h3>
    <table>
      <thead>
        <tr><th>Critério</th><th>Situação Encontrada</th><th>Meta Recomendada</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${sortedCriteria
          .map(
            (c) =>
              `<tr>
                <td><strong>${c.title}</strong><br/><span style="font-size:11px;color:#64748B;">${c.whyItMatters}</span></td>
                <td>${c.currentValue}</td>
                <td>${c.recommendedValue}</td>
                <td><span class="badge ${
                  c.status === "good" ? "good" : c.status === "warning" ? "warn" : "bad"
                }">${c.status === "good" ? "Bom" : c.status === "warning" ? "Razoável" : "Fraco"}</span></td>
              </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Diagnostico-GBP-${(biz.name || "empresa").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPdfModalOpen(false);
    toast.success("Relatório Diagnóstico baixado com sucesso!");
  };

  // Surface styling tokens (Unified Purple Aesthetic + Clean GBP Check cards)
  const cardClass = dark
    ? "bg-[#151126]/95 border border-white/10 text-[#F4F2FF] shadow-lg"
    : "bg-white border border-purple-900/10 text-[#120E24] shadow-[0_6px_24px_-12px_rgba(88,28,135,0.12)]";
  const mutedText = dark ? "text-[#A39BBF]" : "text-[#5E5775]";
  const subtleBg = dark ? "bg-[#0B0914]" : "bg-[#FBF9FE]";
  const borderCol = dark ? "border-white/10" : "border-purple-900/10";

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${biz.name || ""} ${biz.city || ""}`
  )}`;
  const googleMapsUrl =
    biz.google_maps_uri ||
    biz.google_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${biz.name || ""} ${biz.address || biz.city || ""}`
    )}`;

  const claimGoogleBusinessUrl = useMemo(() => {
    const cidStr = String(biz.cid || "").trim();
    if (cidStr && /^\d{10,22}$/.test(cidStr)) {
      return `https://business.google.com/create?fp=${cidStr}&hl=pt-BR&pli=1`;
    }
    const rawUrl = String(biz.requestAccessUrl || "").trim();
    if (rawUrl && !rawUrl.includes("create/getstarted")) {
      return rawUrl;
    }
    const placeIdStr = String(biz.place_id || "").trim();
    if (placeIdStr.startsWith("ChIJ")) {
      return `https://business.google.com/arc/p/${placeIdStr}?hl=pt-BR`;
    }
    return "https://business.google.com/add?hl=pt-BR";
  }, [biz.cid, biz.place_id, biz.requestAccessUrl]);

  const hoursArray = useMemo(() => {
    const raw = biz.hours || biz.opening_hours || biz.working_hours;
    if (!raw) return [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((h) => String(h || "").trim()).filter(Boolean);
    }
    if (typeof raw === "object") {
      return Object.entries(raw)
        .map(([day, val]) => `${day}: ${Array.isArray(val) ? val.join(", ") : String(val || "Fechado")}`)
        .filter(Boolean);
    }
    if (typeof raw === "string" && raw.trim()) {
      return raw
        .split(/\n|;|\|/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [biz.hours, biz.opening_hours, biz.working_hours]);

  const galleryPhotos = useMemo(() => {
    const raw = Array.isArray(biz.photos) ? biz.photos.filter(Boolean) : [];
    const realPhotos = raw.filter(
      (p) => typeof p === "string" && !p.startsWith("data:image/svg+xml") && !p.includes("unsplash.com")
    );
    return realPhotos.slice(0, 15);
  }, [biz.photos]);

  const bizCoverPhoto = customCoverOverride || galleryPhotos[0] || biz.photo || "";
  const bizLogoPhoto = customLogoOverride || biz.logo || galleryPhotos[1] || galleryPhotos[0] || biz.photo || "";

  return (
    <div className="max-w-[1400px] w-full max-w-full overflow-x-hidden mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* TOP BAR: Mode Switcher + Single Search Field */}
      <section className={`rounded-2xl p-4 sm:p-6 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-inherit">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#7C3AED]">
              <span>Diagnóstico de Posicionamento no Google Maps</span>
            </div>
            <h1 className="text-[20px] sm:text-[26px] font-extrabold tracking-tight mt-1">
              Prospecção e Pré-Análise de Perfil
            </h1>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 w-full lg:w-auto gap-1.5 p-1.5 rounded-xl border ${borderCol} ${subtleBg}`}>
            <button
              type="button"
              onClick={() => setSubTab("single")}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                subTab === "single"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                  : `${mutedText} hover:opacity-85`
              }`}
              data-testid="tab-single-audit"
            >
              <Search size={15} className="shrink-0" />
              <span className="truncate">Busca Direta (1 Campo)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab("leadfinder");
                if (leadsList.length === 0) handleSearchLeads();
              }}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                subTab === "leadfinder"
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-sm"
                  : `${mutedText} hover:opacity-85`
              }`}
              data-testid="tab-lead-finder"
            >
              <SlidersHorizontal size={15} className="shrink-0" />
              <span className="truncate">Buscador de Leads por Nicho</span>
            </button>
          </div>
        </div>

        {subTab === "single" ? (
          <div className="pt-5" ref={searchBoxRef}>
            <form onSubmit={handleStartAnalysisClick} className="relative">
              <div
                className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl border transition-all ${
                  selectedCandidate
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : dark
                    ? "bg-[#0B0914] border-white/15 focus-within:border-[#9D5CFF]"
                    : "bg-white border-purple-900/15 focus-within:border-[#7C3AED] shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 px-2.5 sm:px-3 py-1.5 min-w-0">
                  {selectedCandidate ? (
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Search size={19} className="text-[#7C3AED] shrink-0" />
                  )}
                  <input
                    type="text"
                    value={query}
                    onFocus={() => {
                      if (!suppressAutocompleteRef.current && (suggestions.length > 0 || Object.values(auditHistoryByBiz || {}).length > 0)) {
                        setDropdownOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      suppressAutocompleteRef.current = false;
                      setQuery(e.target.value);
                      setSelectedCandidate(null);
                    }}
                    placeholder="Digite o nome da empresa + cidade (ex: Confiança Máquinas Anápolis)..."
                    className="w-full min-w-0 bg-transparent text-[14px] sm:text-[15px] font-semibold outline-none placeholder:text-[#94A3B8] placeholder:font-normal"
                    data-testid="g360-single-search-input"
                  />
                  {loadingSuggestions && (
                    <RefreshCw size={15} className="animate-spin text-[#7C3AED] shrink-0" />
                  )}
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        suppressAutocompleteRef.current = true;
                        setQuery("");
                        setSelectedCandidate(null);
                        setSuggestions([]);
                        setDropdownOpen(false);
                      }}
                      className={`p-1 rounded-full hover:bg-black/5 shrink-0 ${mutedText}`}
                      aria-label="Limpar busca"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={runningAudit}
                  className={`px-5 sm:px-6 py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-md ${
                    selectedCandidate
                      ? "bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] ring-2 ring-emerald-400/40"
                      : "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6]"
                  }`}
                  data-testid="g360-start-analysis-btn"
                >
                  {runningAudit ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 size={16} />
                      <span>{selectedCandidate ? "Iniciar Análise Agora" : "Iniciar Análise"}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Autocomplete Suggestions + Recent Audits Dropdown */}
              {dropdownOpen && !runningAudit && (suggestions.length > 0 || Object.values(auditHistoryByBiz || {}).length > 0) && (
                <div
                  className={`absolute left-0 right-0 top-full mt-2 rounded-2xl border overflow-hidden z-30 shadow-xl ${
                    dark ? "bg-[#1E1836] border-white/15" : "bg-white border-purple-900/15"
                  }`}
                  data-testid="g360-search-suggestions"
                >
                  {suggestions.length > 0 ? (
                    <>
                      <div className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b ${borderCol} ${mutedText}`}>
                        Locais encontrados no Google Maps — Clique para selecionar a empresa
                      </div>
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-inherit">
                        {suggestions.map((sug) => {
                          const cityDisplay =
                            sug.city && !/^\d{5}-?\d{3}$/.test(String(sug.city).trim())
                              ? sug.city
                              : "Localização Comercial";
                          const ufDisplay = sug.uf ? ` - ${sug.uf}` : "";
                          const addrDisplay = sug.address ? ` · ${sug.address}` : "";
                          return (
                            <button
                              key={sug.place_id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(sug);
                              }}
                              className={`w-full px-3.5 sm:px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                dark ? "hover:bg-white/5" : "hover:bg-purple-50/70"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {(() => {
                                  const sugThumb = getRealCandidatePhoto(sug);
                                  return sugThumb ? (
                                    <img
                                      src={sugThumb}
                                      alt={sug.name}
                                      referrerPolicy="no-referrer"
                                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-purple-500/25 bg-white shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] text-white font-black text-[15px] flex items-center justify-center shrink-0 shadow-sm">
                                      {String(sug.name || "E").charAt(0).toUpperCase()}
                                    </div>
                                  );
                                })()}
                                <div className="min-w-0">
                                  <div className="font-bold text-[13.5px] sm:text-[14px] truncate">{sug.name}</div>
                                  <div className={`text-[11.5px] sm:text-[12px] truncate ${mutedText}`}>
                                    <span className="font-semibold text-[#7C3AED]">{sug.category || "Empresa Local"}</span>
                                    {" · "}
                                    <span className="font-semibold">{cityDisplay}{ufDisplay}</span>
                                    {addrDisplay}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-[12px] font-bold tabular-nums hidden sm:flex items-center gap-1">
                                  <Star size={13} className="text-[#F59E0B] fill-[#F59E0B]" />
                                  {Number(sug.rating || 4.8).toFixed(1)} ({parseSafeReviewCount(sug.rating_count ?? sug.reviews)} avaliações)
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED]/10 text-[12px] font-bold text-[#7C3AED] flex items-center gap-1">
                                  Selecionar <ChevronRight size={14} />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b ${borderCol} ${mutedText}`}>
                        Seus Locais Recentes Auditados
                      </div>
                      <div className="max-h-[260px] overflow-y-auto divide-y divide-inherit">
                        {Object.values(auditHistoryByBiz)
                          .sort((a, b) => String(b?.updatedAt || "").localeCompare(String(a?.updatedAt || "")))
                          .slice(0, 6)
                          .map((entry, idx) => {
                            const rep = entry?.latestAnalysis || entry?.preAnalysis;
                            const bName = rep?.business?.name;
                            if (!bName) return null;
                            const uniqueKey = entry?.placeId || rep?.business?.place_id || rep?.id || `${bName}-${idx}`;
                            return (
                              <button
                                key={`history-drop-${uniqueKey}-${idx}`}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  suppressAutocompleteRef.current = true;
                                  setDropdownOpen(false);
                                  setQuery(bName);
                                  onReportChange(rep);
                                  toast.success(`Exibindo análise de ${bName}`);
                                }}
                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                  dark ? "hover:bg-white/5" : "hover:bg-purple-50/70"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <History size={15} className="text-[#7C3AED] shrink-0" />
                                  <span className="font-bold text-[13px] truncate">{bName}</span>
                                  <span className={`text-[11px] truncate ${mutedText}`}>
                                    {rep?.business?.category || ""} · {rep?.business?.city || ""}
                                  </span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#7C3AED] text-[11px] font-mono font-bold shrink-0">
                                  Nota {rep.gbpCheckScore ?? rep.overallScore}/100
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </form>

            {/* Prominent Selected Candidate Confirmation Card */}
            {selectedCandidate && !runningAudit && (
              <div
                data-testid="selected-candidate-confirmation"
                className={`mt-3 p-4 rounded-2xl border-2 border-emerald-500/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  dark ? "bg-emerald-950/25 text-white" : "bg-emerald-50/80 text-[#120E24]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {(() => {
                    const candidateThumb = getRealCandidatePhoto(selectedCandidate);
                    return candidateThumb ? (
                      <img
                        src={candidateThumb}
                        alt={selectedCandidate.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border-2 border-emerald-500 shadow-sm bg-white"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-[18px] flex items-center justify-center shrink-0">
                        {String(selectedCandidate.name || "E").charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={11} /> Empresa Selecionada e Confirmada
                      </span>
                      {selectedCandidate.category && (
                        <span className="text-[11px] font-bold text-[#7C3AED]">
                          {selectedCandidate.category}
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-[15px] sm:text-[16px] truncate mt-0.5">
                      {selectedCandidate.name}
                    </div>
                    <div className={`text-[12px] flex flex-wrap items-center gap-2 mt-0.5 ${mutedText}`}>
                      <span className="font-bold text-[#F59E0B]">
                        ★ {Number(selectedCandidate.rating || 4.8).toFixed(1)} ({parseSafeReviewCount(selectedCandidate.rating_count ?? selectedCandidate.reviews)} avaliações)
                      </span>
                      <span>·</span>
                      <span className="truncate">
                        {selectedCandidate.address || `${selectedCandidate.city || ""} - ${selectedCandidate.uf || ""}`}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Compact Recent Searches (Max 5 items, truncated) */}
            {Object.values(auditHistoryByBiz || {}).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Últimas pesquisadas:
                </span>
                {Object.values(auditHistoryByBiz)
                  .sort((a, b) => String(b?.updatedAt || "").localeCompare(String(a?.updatedAt || "")))
                  .slice(0, 5)
                  .map((entry, idx) => {
                    const rep = entry?.latestAnalysis || entry?.preAnalysis;
                    const bName = rep?.business?.name;
                    if (!bName) return null;
                    const uniqueKey = entry?.placeId || rep?.business?.place_id || rep?.id || `${bName}-${idx}`;
                    return (
                      <button
                        key={`history-pill-${uniqueKey}-${idx}`}
                        type="button"
                        onClick={() => {
                          suppressAutocompleteRef.current = true;
                          setDropdownOpen(false);
                          setSuggestions([]);
                          setQuery(bName);
                          setAuditModeView("pre");
                          onReportChange(rep);
                          toast.success(`Exibindo análise salva de ${bName}`);
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 max-w-[220px] ${
                          dark
                            ? "border-[#9D5CFF]/40 bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 text-white"
                            : "border-purple-300 bg-purple-50/80 hover:bg-purple-100 text-[#4C1D95]"
                        }`}
                        title={bName}
                      >
                        <span className="truncate">{bName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#7C3AED] text-white text-[10px] font-mono shrink-0">
                          {Math.min(78, rep.gbpCheckScore ?? rep.overallScore ?? 72)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          /* LEAD FINDER SUB-TAB */
          <div className="pt-5 space-y-4">
            <form onSubmit={handleSearchLeads} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${mutedText}`}>
                  Nicho / Segmento
                </label>
                <input
                  type="text"
                  value={leadNiche}
                  onChange={(e) => setLeadNiche(e.target.value)}
                  placeholder="Ex: Móveis Planejados, Pizzaria..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-medium outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${mutedText}`}>
                  Cidade
                </label>
                <input
                  type="text"
                  value={leadCity}
                  onChange={(e) => setLeadCity(e.target.value)}
                  placeholder="Ex: Anápolis"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-medium outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${mutedText}`}>
                  Bairro (Opcional)
                </label>
                <input
                  type="text"
                  value={leadNeighborhood}
                  onChange={(e) => setLeadNeighborhood(e.target.value)}
                  placeholder="Ex: Centro, Jundiaí..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-medium outline-none ${borderCol} ${subtleBg}`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={searchingLeads}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search size={15} />
                  <span>{searchingLeads ? "Buscando..." : "Buscar Empresas"}</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-[12px] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterUnverified}
                  onChange={(e) => setFilterUnverified(e.target.checked)}
                  className="rounded accent-[#7C3AED]"
                />
                <span>Apenas perfis NÃO verificados</span>
              </label>
              <label className="inline-flex items-center gap-2 text-[12px] font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterNoSite}
                  onChange={(e) => setFilterNoSite(e.target.checked)}
                  className="rounded accent-[#7C3AED]"
                />
                <span>Apenas empresas SEM site próprio</span>
              </label>
            </div>

            {leadsList.length > 0 && (
              <div className={`rounded-xl border overflow-x-auto ${borderCol}`} data-testid="lead-finder-results-table">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${borderCol} ${subtleBg} ${mutedText}`}>
                      <th className="py-3 px-4">Empresa Encontrada</th>
                      <th className="py-3 px-4">Verificado</th>
                      <th className="py-3 px-4">Website</th>
                      <th className="py-3 px-4">Avaliações</th>
                      <th className="py-3 px-4">Score Estimado</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inherit text-[13px]">
                    {leadsList.map((ld) => {
                      const leadThumb = ld.photo || ld.photos?.[0] || "";
                      return (
                        <tr key={ld.place_id} className={dark ? "hover:bg-white/5" : "hover:bg-purple-50/40"}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {leadThumb ? (
                                <img
                                  src={leadThumb}
                                  alt={ld.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-purple-500/20"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] font-extrabold text-[13px] flex items-center justify-center shrink-0">
                                  {String(ld.name || "E").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold truncate">{ld.name}</div>
                                <div className={`text-[11px] truncate ${mutedText}`}>
                                  <span className="text-[#7C3AED] font-semibold">{ld.category || leadNiche}</span> · {ld.address}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {ld.verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-semibold text-[11px]">
                                <BadgeCheck size={13} /> Verificado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] font-semibold text-[11px]">
                                <ShieldAlert size={13} /> Não Verificado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {ld.website && !ld.website.includes("instagram.com") ? (
                              <span className="text-[#16A34A] font-medium text-[12px]">Possui site</span>
                            ) : (
                              <span className="text-[#DC2626] font-semibold text-[12px]">Sem site próprio</span>
                            )}
                          </td>
                          <td className="py-3 px-4 tabular-nums">
                            <span className="font-semibold">★ {ld.rating}</span> ({ld.rating_count} aval.)
                          </td>
                          <td className="py-3 px-4 tabular-nums font-bold" style={{ color: ld.gbpScore < 60 ? "#DC2626" : "#D97706" }}>
                            {ld.gbpScore}/100
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSubTab("single");
                                runAuditForBusiness(ld);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-bold hover:bg-[#6D28D9] cursor-pointer shadow-sm"
                            >
                              Analisar Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* MAIN DIAGNOSTIC WORKSPACE (Hidden when in Lead Finder tab so Lead Finder has its own clean screen!) */}
      {report && subTab !== "leadfinder" && (
        <>
          {/* CLEAN ANALYSIS ACTION BAR (No fake side-by-side score pills!) */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {auditModeView === "pre" ? (
                <>
                  <span className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold flex items-center gap-2 ${cardClass}`}>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Diagnóstico Inicial da Ficha</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRunCompleteAnalysis}
                    disabled={runningAudit || runningCompleteSimulation}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-[12.5px] font-extrabold flex items-center gap-2 cursor-pointer shadow-sm hover:opacity-95"
                    title="Executar análise de potencial pós-otimização do perfil"
                    data-testid="run-complete-analysis-btn"
                  >
                    <RefreshCw size={14} className={runningCompleteSimulation ? "animate-spin" : ""} />
                    <span>{runningCompleteSimulation ? "Calculando Análise Completa..." : "Executar Análise Completa"}</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[12px] font-extrabold flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    <span>Análise Completa Pós-Otimização Ativa</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuditModeView("pre")}
                    className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold flex items-center gap-1.5 cursor-pointer ${cardClass} hover:border-[#7C3AED]`}
                    data-testid="audit-mode-pre-btn"
                  >
                    <History size={14} className="text-[#7C3AED]" />
                    <span>Voltar ao Diagnóstico Inicial</span>
                  </button>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onExportToCrm && onExportToCrm(report)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-[12.5px] font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                data-testid="export-to-crm-btn"
              >
                <Briefcase size={14} />
                <span>Enviar para o CRM</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenGbpPackage && onOpenGbpPackage(report.business)}
                className={`px-3.5 py-2 rounded-xl border text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer ${cardClass} hover:border-[#7C3AED]`}
                data-testid="open-gbp-package-btn"
              >
                <Sparkles size={14} className="text-[#7C3AED]" />
                <span>Pacote GBP</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSiteExpress && onOpenSiteExpress(report.business)}
                className={`px-3.5 py-2 rounded-xl border text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer ${cardClass} hover:border-[#7C3AED]`}
                data-testid="open-site-express-direct-btn"
              >
                <Layers size={14} className="text-[#16A34A]" />
                <span>Criar Site Express</span>
              </button>

              <button
                type="button"
                onClick={() => setPdfModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl border text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer ${cardClass} hover:border-[#7C3AED]`}
                data-testid="open-pdf-modal-btn"
              >
                <Printer size={14} className="text-[#7C3AED]" />
                <span>Exportar PDF</span>
              </button>
            </div>
          </section>

          {/* 1ª DOBRA: ESQUERDA = PERFIL COMPLETO DA EMPRESA | DIREITA = PONTUAÇÃO GERAL + PONTUAÇÃO DETALHADA + RANKING COMPETITIVO LOCAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (lg:col-span-5): Ficha Oficial da Empresa */}
            <div className={`lg:col-span-5 rounded-2xl overflow-hidden flex flex-col ${cardClass}`}>
              <div className="flex-1 flex flex-col">
                {/* Clickable Company Cover Photo + Circular Logo Overlay */}
                <div
                  onClick={() => galleryPhotos.length > 0 && setLightboxIndex(0)}
                  className="h-56 sm:h-64 w-full relative bg-[#0F172A] flex items-center justify-center overflow-hidden cursor-pointer group"
                  title="Clique para ampliar as fotos da empresa"
                >
                  {bizCoverPhoto ? (
                    <img
                      src={bizCoverPhoto}
                      alt={biz.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-slate-400 text-[12px] font-semibold">
                      Foto de capa não disponível
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  {/* Circular Profile Avatar Badge */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {bizLogoPhoto ? (
                        <img
                          src={bizLogoPhoto}
                          alt={biz.name}
                          referrerPolicy="no-referrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (galleryPhotos.length > 0) setLightboxIndex(0);
                          }}
                          className="w-14 h-14 rounded-2xl object-contain p-1 border-2 border-white shadow-lg bg-white cursor-pointer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#7C3AED] text-white font-black text-[18px] flex items-center justify-center border-2 border-white shadow-lg">
                          {String(biz.name || "E").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold border border-white/15">
                        {galleryPhotos.length > 0
                          ? `${Math.max(Number(biz.photos_count) || 0, galleryPhotos.length)} fotos no perfil · Clique para ampliar`
                          : "Ficha Google Maps"}
                      </span>
                    </div>
                  </div>
                </div>


                <div className="p-5 gap-4 text-[13px] flex-1 flex flex-col">
                  <div className="space-y-3.5 shrink-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-[18px] sm:text-[20px] font-extrabold leading-snug break-words">
                          {biz.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {biz.rating !== null && biz.rating !== undefined ? (
                            <>
                              <span className="font-extrabold tabular-nums text-[14px]">
                                {Number(biz.rating).toFixed(1)}
                              </span>
                              <div className="flex items-center text-[#F59E0B]">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star key={n} size={14} className="fill-[#F59E0B]" />
                                ))}
                              </div>
                            </>
                          ) : (
                            <span className={`text-[12px] font-semibold ${mutedText}`}>
                              Sem nota média
                            </span>
                          )}
                          <span className={`text-[12px] font-semibold ${mutedText}`}>
                            ({biz.rating_count !== null && biz.rating_count !== undefined ? `${parseSafeReviewCount(biz.rating_count)} avaliações` : "Sem avaliações"})
                          </span>
                        </div>
                        <div className="text-[12.5px] font-semibold mt-0.5 text-[#7C3AED]">
                          {biz.category || "Empresa Local"}
                        </div>
                      </div>

                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                        style={
                          displayedVerified
                            ? { backgroundColor: "#DCFCE7", color: "#15803D" }
                            : { backgroundColor: "#FEE2E2", color: "#DC2626" }
                        }
                      >
                        {displayedVerified ? <BadgeCheck size={13} /> : <ShieldAlert size={13} />}
                        {displayedVerified ? "Verificado" : "Não Verificado"}
                      </span>
                    </div>

                    {/* External Google Links (Ver na Pesquisa / Ver no Maps) + Botão Solicitar Acesso Direto à Ficha */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={googleSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-3 py-2 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${borderCol} ${subtleBg} hover:border-[#7C3AED]`}
                        >
                          <span>Ver na Pesquisa</span>
                          <ExternalLink size={12} />
                        </a>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-3 py-2 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${borderCol} ${subtleBg} hover:border-[#7C3AED]`}
                        >
                          <span>Ver no Maps</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <a
                        href={claimGoogleBusinessUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          const searchLabel = [biz.name, biz.city, biz.uf].filter(Boolean).join(" - ");
                          navigator.clipboard?.writeText(searchLabel);
                          toast.success(
                            `Nome "${searchLabel}" copiado! Cole (Ctrl+V) na busca do Google Meu Negócio para Solicitar Acesso à ficha.`
                          );
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white text-[12.5px] font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        data-testid="request-gbp-access-btn"
                      >
                        <BadgeCheck size={15} />
                        <span>Solicitar Acesso à Ficha no Google</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Descrição Real da Empresa na Ficha Oficial do Google (Limite Oficial: 750 caracteres) */}
                    {(() => {
                      const realText = String(biz.bio || biz.description || "").trim();
                      if (realText.length > 0) {
                        const charCount = realText.length;
                        const pctOfGoogleLimit = Math.min(100, Math.round((charCount / 750) * 100));
                        const isComplete = charCount >= 700;
                        const isMedium = charCount >= 300 && charCount < 700;

                        return (
                          <div
                            className={`p-3.5 rounded-xl border text-[12px] space-y-2.5 ${borderCol} ${subtleBg}`}
                            data-testid="official-gbp-description-card"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                                  Descrição da Empresa
                                </span>
                                <span className="text-[9.5px] px-2 py-0.5 rounded-md font-bold bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
                                  Oficial Google Meu Negócio
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className={`font-bold ${isComplete ? "text-[#16A34A]" : isMedium ? "text-[#D97706]" : "text-[#DC2626]"}`}>
                                  {charCount}
                                </span>
                                <span className={mutedText}>/ 750 caracteres oficiais</span>
                              </div>
                            </div>

                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  isComplete
                                    ? "bg-emerald-500"
                                    : isMedium
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${Math.max(4, pctOfGoogleLimit)}%` }}
                              />
                            </div>

                            <p className={`leading-relaxed text-[12px] p-2.5 rounded-lg bg-white/70 dark:bg-black/25 border border-slate-200/70 dark:border-white/5 font-normal ${mutedText}`}>
                              {realText}
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-[11px]">
                              <span className={isComplete ? "text-[#16A34A] font-semibold" : isMedium ? "text-[#D97706] font-semibold" : "text-[#DC2626] font-semibold"}>
                                {isComplete
                                  ? "Excelente: A empresa preencheu o tamanho oficial de 750 caracteres do Google."
                                  : `Espaço subutilizado: A empresa cadastrou ${charCount} de 750 caracteres oficiais do Google. Faltam ${750 - charCount} caracteres para o potencial máximo.`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenGbpPackage) {
                                    onOpenGbpPackage(biz);
                                  }
                                }}
                                className="text-[#7C3AED] hover:underline font-extrabold shrink-0 cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                              >
                                <span>Expandir para 750c no Pacote GBP &rarr;</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Quando a empresa NÃO cadastrou descrição no Google Meu Negócio
                      return (
                        <div
                          className={`p-3.5 rounded-xl border text-[12px] space-y-2.5 ${borderCol} ${
                            dark ? "bg-rose-950/20 border-rose-500/30" : "bg-rose-50/70 border-rose-200"
                          }`}
                          data-testid="official-gbp-description-empty"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                Descrição da Empresa
                              </span>
                              <span className="text-[9.5px] px-2 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Ficha Google Maps
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
                              <span className={mutedText}>/ 750 caracteres (Ausente)</span>
                            </div>
                          </div>

                          <div className="w-full bg-rose-200 dark:bg-rose-950/50 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: "2%" }} />
                          </div>

                          <p className={`leading-relaxed text-[12px] p-2.5 rounded-lg bg-white/70 dark:bg-black/25 border border-rose-200/70 dark:border-rose-900/40 text-rose-950 dark:text-rose-200`}>
                            <strong>Nenhuma descrição cadastrada na ficha oficial do Google.</strong> O perfil da empresa no Google Maps está com o campo de descrição totalmente vazio (0/750 caracteres), prejudicando a relevância nas buscas locais e na indexação de palavras-chave.
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-[11px]">
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Oportunidade Crítica: Cadastrar os 750 caracteres com termos estratégicos.
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenGbpPackage) {
                                  onOpenGbpPackage(biz);
                                }
                              }}
                              className="text-[#7C3AED] hover:underline font-extrabold shrink-0 cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                            >
                              <span>Gerar Descrição de 750c no Pacote GBP &rarr;</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2.5 pt-2 border-t border-inherit text-[12.5px]">
                      <div className="flex items-start gap-2.5">
                        <MapPin size={15} className="text-[#7C3AED] shrink-0 mt-0.5" />
                        <span className={`${mutedText} break-words`}>
                          {biz.address || `${biz.city || "Anápolis"} - ${biz.uf || "GO"}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Phone size={15} className="text-[#7C3AED] shrink-0" />
                        {biz.phone ? (
                          <span className="tabular-nums font-bold">{biz.phone}</span>
                        ) : (
                          <span className="text-[#DC2626] font-semibold">Telefone não informado no perfil</span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {hoursArray.length > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowHoursFull((v) => !v)}
                              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer hover:opacity-85"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Clock size={15} className="text-[#7C3AED] shrink-0" />
                                <span className={`${mutedText} truncate`}>{hoursArray[0]}</span>
                              </div>
                              <span className="text-[11px] font-bold text-[#7C3AED] flex items-center gap-0.5 shrink-0">
                                {showHoursFull ? "Ocultar" : "Ver todos os horários"}
                                <ChevronDown
                                  size={13}
                                  className={`transition-transform ${showHoursFull ? "rotate-180" : ""}`}
                                />
                              </span>
                            </button>

                            {showHoursFull && (
                              <div className={`p-3 rounded-xl border ${borderCol} ${subtleBg} space-y-1 text-[11.5px]`}>
                                {hoursArray.map((line, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2">
                                    <span className="font-medium">{line}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <Clock size={15} className="text-[#7C3AED] shrink-0" />
                            <span className="text-[#DC2626] font-semibold">
                              Horário de funcionamento não informado
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Globe size={15} className="text-[#7C3AED] shrink-0" />
                          {biz.website ? (
                            <a
                              href={biz.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#7C3AED] hover:underline truncate font-bold"
                            >
                              {biz.website}
                            </a>
                          ) : (
                            <span className="text-[#DC2626] font-bold">
                              Nenhum site oficial cadastrado
                            </span>
                          )}
                        </div>
                        {biz.website && (
                          <button
                            type="button"
                            onClick={() => handleRunWebsiteAudit(biz.website)}
                            disabled={auditingWebsite}
                            className="text-[11px] font-bold text-[#7C3AED] underline shrink-0 cursor-pointer"
                          >
                            {auditingWebsite ? "Escaneando..." : "Auditar Site"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mapa Maior + Distribuição de Avaliações colados logo abaixo dos dados da ficha */}
                  <div className="flex-1 flex flex-col gap-3 pt-1">
                    <div className={`flex-1 flex flex-col rounded-xl border overflow-hidden ${borderCol}`} data-testid="profile-card-minimap">
                      <div className="flex-1 min-h-[240px] w-full relative bg-slate-100">
                        {(() => {
                          const lat = Number(biz.lat) || -16.3285;
                          const lng = Number(biz.lng) || -48.9534;
                          const d = mapZoomDelta;
                          const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
                          const zoomLvl = d <= 0.0018 ? 18 : d <= 0.0035 ? 16 : 14;
                          const srcUrl =
                            mapLayerMode === "satellite"
                              ? `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=${zoomLvl}&ie=UTF8&iwloc=&output=embed`
                              : `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
                          return (
                            <iframe
                              key={`mini-${lat}-${lng}-${d}-${mapCenterKey}-${mapLayerMode}`}
                              title="Mapa da Localização da Empresa"
                              src={srcUrl}
                              className="w-full h-full border-0"
                              loading="lazy"
                            />
                          );
                        })()}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-auto">
                          <div className="inline-flex rounded-lg bg-black/75 text-white p-0.5 text-[10.5px] font-bold">
                            <button
                              type="button"
                              onClick={() => setMapLayerMode("map")}
                              className={`px-2.5 py-1 rounded cursor-pointer ${mapLayerMode === "map" ? "bg-[#7C3AED]" : ""}`}
                            >
                              Mapa
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapLayerMode("satellite")}
                              className={`px-2.5 py-1 rounded cursor-pointer ${mapLayerMode === "satellite" ? "bg-[#7C3AED]" : ""}`}
                            >
                              Satélite
                            </button>
                          </div>
                          <div className="inline-flex items-center rounded-lg bg-black/80 text-white p-0.5 shadow-md">
                            <button
                              type="button"
                              onClick={() => setMapZoomDelta((prev) => Math.max(0.0006, prev / 1.7))}
                              title="Aproximar Zoom (+)"
                              aria-label="Aproximar Zoom"
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#7C3AED] cursor-pointer transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMapZoomDelta((prev) => Math.min(0.035, prev * 1.7))}
                              title="Afastar Zoom (-)"
                              aria-label="Afastar Zoom"
                              className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#7C3AED] cursor-pointer transition-colors"
                            >
                              <Minus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={handleRecenterMapOnCompany}
                              title="Centralizar na Empresa"
                              className="px-2 py-0.5 rounded bg-[#7C3AED] hover:bg-[#6D28D9] text-[10.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors ml-0.5"
                            >
                              <LocateFixed size={11} />
                              <span>Centralizar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-2 text-[11px] flex items-center justify-between ${subtleBg}`}>
                        <span className={`font-semibold truncate ${mutedText}`}>
                          GPS: {(Number(biz.lat) || -16.3285).toFixed(4)}, {(Number(biz.lng) || -48.9534).toFixed(4)}
                        </span>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#7C3AED] hover:underline shrink-0"
                        >
                          Ampliar no Google Maps →
                        </a>
                      </div>
                    </div>

                    {/* Distribuição de Avaliações (5 ★ a 1 ★) */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${borderCol} ${subtleBg}`} data-testid="star-distribution-card">
                      <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                        <span>Distribuição de Avaliações</span>
                        <span>{parseSafeReviewCount(biz.rating_count)} avaliações</span>
                      </div>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const totalRev = Math.max(1, Number(biz.rating_count) || 0);
                        const rVal = Number(biz.rating || 4.7);
                        const exactCount =
                          biz.reviews_per_score?.[star] !== undefined
                            ? Number(biz.reviews_per_score[star])
                            : star === 5
                            ? Math.round(totalRev * (rVal >= 4.7 ? 0.84 : 0.68))
                            : star === 4
                            ? Math.round(totalRev * 0.1)
                            : star === 3
                            ? Math.round(totalRev * 0.03)
                            : star === 2
                            ? Math.round(totalRev * 0.02)
                            : Math.max(0, totalRev - Math.round(totalRev * 0.99));
                        const pct = totalRev > 0 ? Math.min(100, Math.round((exactCount / totalRev) * 100)) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-[11px]">
                            <span className="w-7 font-bold tabular-nums flex items-center gap-0.5 shrink-0">
                              {star} <Star size={10} className="text-[#F59E0B] fill-[#F59E0B]" />
                            </span>
                            <div className={`flex-1 h-2 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                              <div
                                className="h-full rounded-full bg-[#F59E0B]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`w-10 text-right font-mono font-bold tabular-nums ${mutedText}`}>
                              {exactCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-7): 1) PONTUAÇÃO GERAL + PONTUAÇÃO DETALHADA | 2) RANKING COMPETITIVO LOCAL */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* TOP OF RIGHT COLUMN: PONTUAÇÃO GERAL (VELOCÍMETRO) + PONTUAÇÃO DETALHADA (FRACO / RAZOÁVEL / BOM) */}
              <div className={`rounded-2xl p-5 sm:p-6 ${cardClass}`} data-testid="gbp-check-score-row">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
                  {/* Velocímetro */}
                  <div className="xl:col-span-5 flex flex-col items-center justify-center xl:border-r border-inherit xl:pr-5">
                    <div className="w-full flex items-center justify-between mb-1">
                      <div>
                        <h3 className="text-[16px] font-extrabold">
                          {auditModeView === "pre" ? "Pontuação Geral" : "Pontuação Pós-Otimização"}
                        </h3>
                        <p className={`text-[11px] ${mutedText}`}>
                          Desempenho do Negócio · {sortedCriteria.length} critérios
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                          auditModeView === "pre"
                            ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                        }`}
                      >
                        {auditModeView === "pre" ? "Atual" : "Otimizada"}
                      </span>
                    </div>

                    <SpeedometerGauge
                      score={displayedScore}
                      classification={displayedClassification}
                      dark={dark}
                    />
                  </div>

                  {/* Pontuação Detalhada (Fraco / Razoável / Bom) */}
                  <div className="xl:col-span-7 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-[16px] font-extrabold">Pontuação Detalhada</h3>
                        <p className={`text-[11.5px] ${mutedText}`}>
                          Clique em uma faixa para filtrar os itens abaixo
                        </p>
                      </div>
                      {criterionFilter !== "all" && (
                        <button
                          type="button"
                          onClick={() => setCriterionFilter("all")}
                          className="text-[11px] font-bold text-[#7C3AED] underline cursor-pointer shrink-0"
                        >
                          Ver todos ({sortedCriteria.length})
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCriterionFilter("critical");
                          document.getElementById("g360-criteria-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${borderCol} ${subtleBg} hover:border-[#EF4444]`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-full bg-[#EF4444] text-white font-black text-[15px] flex items-center justify-center shrink-0 shadow-sm">
                            {report.criticalCount}
                          </span>
                          <div>
                            <div className="font-extrabold text-[14px] text-[#EF4444]">Fraco</div>
                            <div className={`text-[11px] ${mutedText}`}>
                              Métricas que precisam de atenção
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-[#EF4444] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCriterionFilter("warning");
                          document.getElementById("g360-criteria-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${borderCol} ${subtleBg} hover:border-[#F59E0B]`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-full bg-[#F59E0B] text-white font-black text-[15px] flex items-center justify-center shrink-0 shadow-sm">
                            {report.warningCount}
                          </span>
                          <div>
                            <div className="font-extrabold text-[14px] text-[#D97706]">Razoável</div>
                            <div className={`text-[11px] ${mutedText}`}>
                              Métricas com potencial de melhoria
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-[#D97706] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCriterionFilter("good");
                          document.getElementById("g360-criteria-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${borderCol} ${subtleBg} hover:border-[#10B981]`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-full bg-[#10B981] text-white font-black text-[15px] flex items-center justify-center shrink-0 shadow-sm">
                            {report.goodCount}
                          </span>
                          <div>
                            <div className="font-extrabold text-[14px] text-[#10B981]">Bom</div>
                            <div className={`text-[11px] ${mutedText}`}>
                              Métricas em excelente estado
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={15} className="text-[#10B981] shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RANKING COMPETITIVO LOCAL (4 PALAVRAS-CHAVE + BUSCA DE PALAVRA-CHAVE AO VIVO) */}
              {activeKeywordObj && (
                <div
                  className={`flex-1 rounded-2xl p-4 sm:p-5 flex flex-col space-y-4 ${cardClass}`}
                  data-testid="geogrid-section"
                >
                  <div className="space-y-3 pb-3 border-b border-inherit">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                          <Navigation size={13} />
                          <span>Posição da Empresa vs. Concorrentes no Google Maps</span>
                        </div>
                        <h2 className="text-[16px] sm:text-[18px] font-extrabold mt-0.5">
                          Ranking Competitivo Local
                        </h2>
                      </div>
                      <span className={`text-[11px] font-semibold ${mutedText}`}>
                        Clique nas buscas abaixo para comparar o ranking
                      </span>
                    </div>

                    {/* 4 Natural Keyword Selector Pills */}
                    <div className="flex flex-wrap items-center gap-1.5" data-testid="keyword-pills-bar">
                      {(report.keywords || []).slice(0, 6).map((kwItem, idx) => {
                        const active = idx === selectedKeywordIdx;
                        return (
                          <button
                            key={kwItem.keyword}
                            type="button"
                            onClick={() => {
                              setSelectedKeywordIdx(idx);
                              setSelectedPin(null);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              active
                                ? "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] border-[#7C3AED] text-white shadow-sm"
                                : `${borderCol} ${subtleBg} hover:border-[#7C3AED]`
                            }`}
                            data-testid={`keyword-tab-${idx}`}
                          >
                            <span>{kwItem.keyword}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Keyword Live Search Input */}
                    <form onSubmit={handleAddCustomKeyword} className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        value={customKeywordInput}
                        onChange={(e) => setCustomKeywordInput(e.target.value)}
                        placeholder="Digite outra palavra-chave para testar o ranking no Google (ex: conserto de freezer em Anápolis)..."
                        className={`flex-1 px-3.5 py-2 rounded-xl border text-[12.5px] font-medium outline-none focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
                        data-testid="custom-keyword-input"
                      />
                      <button
                        type="submit"
                        disabled={searchingCustomKeyword || !customKeywordInput.trim()}
                        data-testid="custom-keyword-ranking-btn"
                        className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
                      >
                        {searchingCustomKeyword ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Consultando...</span>
                          </>
                        ) : (
                          <>
                            <Search size={13} />
                            <span>Buscar Ranking</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* POSIÇÃO DA EMPRESA COMPARADA AOS CONCORRENTES — LISTA VERTICAL */}
                  <div className={`rounded-2xl border p-4 flex flex-col space-y-3 ${borderCol} ${subtleBg}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                          Empresas Encontradas para esta Busca ({activeKeywordObj.competitors.length} concorrentes)
                        </div>
                        <p className={`text-[12px] ${mutedText}`}>
                          Termo pesquisado: <strong className={dark ? "text-white" : "text-[#120E24]"}>"{activeKeywordObj.keyword}"</strong>
                        </p>
                      </div>
                      {(() => {
                        const targetComp = activeKeywordObj.competitors.find((c) => c.isTarget);
                        const pos = targetComp?.rank || activeKeywordObj.averageRank || 5;
                        return (
                          <span
                            data-testid="target-current-rank-badge"
                            className={`px-3 py-1 rounded-xl font-mono font-extrabold text-[12px] ${
                              pos <= 3
                                ? "bg-[#DCFCE7] text-[#15803D]"
                                : pos <= 10
                                ? "bg-[#FEF3C7] text-[#D97706]"
                                : "bg-[#FEE2E2] text-[#DC2626]"
                            }`}
                          >
                            Sua Posição: {pos}º lugar
                          </span>
                        );
                      })()}
                    </div>

                    <div
                      className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar"
                      data-testid="competitors-scroll-list"
                    >
                      {activeKeywordObj.competitors.map((comp) => {
                        const isTarget = Boolean(comp.isTarget);
                        const effectiveRank = comp.rank;
                        const avatarPhoto = isTarget
                          ? bizLogoPhoto || comp.photo
                          : comp.photo || "";
                        const displayCompScore = isTarget
                          ? displayedScore
                          : Math.min(96, Number(comp.gbpScore || 75));
                        return (
                          <div
                            key={`${comp.rank}-${comp.name}`}
                            className={`p-3 rounded-xl border transition-all ${
                              isTarget
                                ? dark
                                  ? "bg-[#7C3AED]/20 border-[#9D5CFF] ring-1 ring-[#9D5CFF]"
                                  : "bg-purple-50 border-[#7C3AED] ring-1 ring-[#7C3AED]"
                                : `${borderCol} ${dark ? "bg-[#151126]" : "bg-white"}`
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-8 h-8 rounded-xl font-mono font-extrabold text-[12px] tabular-nums flex items-center justify-center shrink-0 ${
                                    effectiveRank <= 3
                                      ? "bg-[#22C55E] text-white"
                                      : isTarget
                                      ? "bg-[#F59E0B] text-white"
                                      : dark
                                      ? "bg-white/10 text-[#F4F2FF]"
                                      : "bg-[#E2E8F0] text-[#1E293B]"
                                  }`}
                                >
                                  {effectiveRank}º
                                </span>

                                {avatarPhoto ? (
                                  <img
                                    src={avatarPhoto}
                                    alt={comp.name}
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-purple-500/25 bg-white shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#7C3AED]/15 text-[#7C3AED] font-extrabold text-[16px] flex items-center justify-center shrink-0 border border-purple-500/20">
                                    {String(comp.name || "E").charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="font-extrabold text-[13.5px] sm:text-[14px] truncate flex items-center gap-1.5">
                                    <span className="truncate">{comp.name}</span>
                                    {isTarget && (
                                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#7C3AED] text-white shrink-0">
                                        SUA EMPRESA
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-[11.5px] flex flex-wrap items-center gap-2 mt-0.5 ${mutedText}`}>
                                    <span className="font-bold text-[#F59E0B]">★ {Number(comp.rating || 4.6).toFixed(1)}</span>
                                    <span>·</span>
                                    <span className="font-semibold">{parseSafeReviewCount(comp.reviewsCount ?? comp.reviews)} avaliações</span>
                                    {comp.category && (
                                      <>
                                        <span>·</span>
                                        <span className="truncate max-w-[160px]">{comp.category}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span
                                  className="font-mono font-extrabold text-[13px] block"
                                  style={{
                                    color:
                                      displayCompScore < 60
                                        ? "#EF4444"
                                        : displayCompScore < 80
                                        ? "#F59E0B"
                                        : "#16A34A",
                                  }}
                                >
                                  {displayCompScore}%
                                </span>
                                <span className={`text-[10px] ${mutedText}`}>Pontuação</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {websiteAudit && (
            <section className={`rounded-2xl p-5 border space-y-4 ${cardClass}`} data-testid="website-audit-results">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-inherit">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                    Scanner Técnico de Site Oficial
                  </div>
                  <h3 className="text-[16px] font-bold mt-0.5">
                    Diagnóstico Web: {websiteAudit.finalUrl || "Sem site oficial na ficha"} — Nota {websiteAudit.score}/100
                  </h3>
                  <p className={`text-[12px] mt-0.5 ${mutedText}`}>{websiteAudit.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWebsiteAudit(null)}
                  className={`p-1.5 rounded-lg border ${borderCol} ${mutedText} cursor-pointer self-start`}
                >
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                {(websiteAudit.checks || []).map((chk, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 ${borderCol} ${subtleBg}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{chk.label}</span>
                      {chk.ok ? (
                        <CheckCircle2 size={15} className="text-[#16A34A] shrink-0" />
                      ) : (
                        <XCircle size={15} className="text-[#EF4444] shrink-0" />
                      )}
                    </div>
                    <div className={`text-[11px] ${mutedText}`}>{chk.detail}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3ª DOBRA: DIAGNÓSTICO DETALHADO ORDENADO DO PIOR PARA O MELHOR (FRACO -> RAZOÁVEL -> BOM) */}
          <section
            id="g360-criteria-section"
            className={`rounded-2xl p-4 sm:p-6 space-y-5 ${cardClass}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Diagnóstico Detalhado do Perfil ({sortedCriteria.length} Critérios Avaliados)
                </div>
                <h2 className="text-[18px] sm:text-[20px] font-extrabold mt-1">
                  O que está travando o posicionamento da empresa e como corrigir
                </h2>
              </div>

              {/* Filter buttons */}
              <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl border ${borderCol} ${subtleBg} self-start`}>
                {[
                  { id: "all", label: `Todos (${sortedCriteria.length})` },
                  { id: "critical", label: `Fraco (${report.criticalCount})` },
                  { id: "warning", label: `Razoável (${report.warningCount})` },
                  { id: "good", label: `Bom (${report.goodCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCriterionFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer ${
                      criterionFilter === f.id
                        ? "bg-[#7C3AED] text-white"
                        : `${mutedText} hover:opacity-85`
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expandable Accordion Rows Ordered strictly from Worst (Fraco) -> Medium (Razoável) -> Best (Bom) */}
            <div className="space-y-3.5">
              {filteredCriteria.map((item) => {
                const isCrit = item.status === "critical";
                const isWarn = item.status === "warning";
                const isOpen = Boolean(expandedCriteria[item.id]);

                const circleStyle = isCrit
                  ? { backgroundColor: "#FEE2E2", color: "#DC2626" }
                  : isWarn
                  ? { backgroundColor: "#FEF3C7", color: "#D97706" }
                  : { backgroundColor: "#DCFCE7", color: "#16A34A" };

                const barColor = isCrit ? "#EF4444" : isWarn ? "#F59E0B" : "#10B981";
                const progressPct =
                  typeof item.progressPct === "number"
                    ? item.progressPct
                    : isCrit
                    ? 15
                    : isWarn
                    ? 55
                    : 100;

                const badgeLabel = isCrit ? "Fraco" : isWarn ? "Razoável" : "Bom";

                // Prepare competitor review chart data strictly sorted by reviewsCount descending
                const competitorsForChart = [...(activeKeywordObj?.competitors || [])]
                  .sort((a, b) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0))
                  .slice(0, 10);
                const maxCompReviews = Math.max(
                  1,
                  Number(biz.rating_count) || 0,
                  ...competitorsForChart.map((c) => Number(c.reviewsCount) || 0)
                );
                const avgCompReviews =
                  competitorsForChart.length > 0
                    ? Math.round(
                        competitorsForChart.reduce((acc, c) => acc + (Number(c.reviewsCount) || 0), 0) /
                          competitorsForChart.length
                      )
                    : 85;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${borderCol} ${
                      isOpen ? (dark ? "bg-[#0B0914]" : "bg-[#FBF9FE]") : dark ? "bg-[#151126]" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCriteria((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                      }
                      className="w-full px-4 sm:px-5 py-4 flex flex-col gap-3 text-left cursor-pointer hover:opacity-95"
                    >
                      <div className="w-full flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[13px] shrink-0"
                            style={circleStyle}
                          >
                            {isCrit ? "✕" : isWarn ? "!" : "✓"}
                          </span>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[14px] sm:text-[15px] truncate flex items-center gap-2">
                              <span>{item.title}</span>
                            </div>
                            <div className={`text-[12px] truncate ${mutedText}`}>
                              {item.currentValue}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span
                            className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                            style={circleStyle}
                          >
                            {badgeLabel}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isOpen ? "rotate-180" : ""} ${mutedText}`}
                          />
                        </div>
                      </div>

                      {/* Horizontal Progress Bar (0% ———— 100% | FRACO / RAZOÁVEL / BOM) */}
                      <div className="w-full pt-1">
                        <div className={`w-full h-2.5 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-200"}`}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(6, Math.min(100, progressPct))}%`, backgroundColor: barColor }}
                          />
                        </div>
                        <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mt-1 ${mutedText}`}>
                          <span>0% · FRACO</span>
                          <span>50% · RAZOÁVEL</span>
                          <span>100% · BOM</span>
                        </div>
                      </div>
                    </button>

                    {isOpen && (
                      <div className={`px-4 sm:px-5 pb-5 pt-3 border-t ${borderCol} space-y-4 text-[13px]`}>
                        <p className={`leading-relaxed ${mutedText}`}>
                          <strong className={dark ? "text-[#F4F2FF]" : "text-[#120E24]"}>Por que isso importa: </strong>
                          {item.whyItMatters}
                        </p>

                        <div className={`p-3.5 rounded-xl border ${borderCol} ${dark ? "bg-[#151126]" : "bg-white"} grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]`}>
                          <div>
                            <span className={`font-semibold block mb-0.5 ${mutedText}`}>Situação encontrada na ficha:</span>
                            <span className="font-bold text-[13px]">{item.currentValue}</span>
                          </div>
                          <div>
                            <span className={`font-semibold block mb-0.5 ${mutedText}`}>Recomendação ideal:</span>
                            <span className="font-bold text-[13px] text-[#16A34A]">{item.recommendedValue}</span>
                          </div>
                        </div>

                        {/* VISUAL COMPETITOR BAR CHARTS FOR REVIEWS */}
                        {item.chartType === "top10_reviews" && competitorsForChart.length > 0 && (
                          <div
                            className={`p-4 rounded-2xl border space-y-3 ${borderCol} ${dark ? "bg-[#151126]" : "bg-white"}`}
                            data-testid="gbp-check-top10-reviews-chart"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                                  Comparativo de Avaliações no Google Maps
                                </div>
                                <h4 className="text-[14px] font-extrabold">
                                  As 10 empresas mais avaliadas do seu segmento ({biz.city || "Região"})
                                </h4>
                              </div>
                              <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
                                Sua empresa: {parseSafeReviewCount(biz.rating_count)} avaliações
                              </span>
                            </div>

                            <div className="space-y-2.5 pt-1">
                              {competitorsForChart.map((comp, idx) => {
                                const isTarget = Boolean(comp.isTarget);
                                const revCount = parseSafeReviewCount(comp.reviewsCount ?? comp.reviews, 0);
                                const widthPct = Math.max(6, Math.round((revCount / maxCompReviews) * 100));
                                const thumbPhoto = comp.photo || (isTarget ? bizLogoPhoto : "");
                                return (
                                  <div key={`${comp.name}-${idx}`} className="space-y-1">
                                    <div className="flex items-center justify-between gap-2 text-[11.5px]">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {thumbPhoto ? (
                                          <img
                                            src={thumbPhoto}
                                            alt={comp.name}
                                            referrerPolicy="no-referrer"
                                            className="w-6 h-6 rounded-md object-cover shrink-0 border border-purple-500/20"
                                          />
                                        ) : (
                                          <span className="w-6 h-6 rounded-md bg-[#7C3AED]/15 text-[#7C3AED] font-bold text-[10px] flex items-center justify-center shrink-0">
                                            {String(comp.name || "E").charAt(0).toUpperCase()}
                                          </span>
                                        )}
                                        <span className={`truncate font-semibold ${isTarget ? "text-[#7C3AED] font-extrabold" : ""}`}>
                                          {idx + 1}. {comp.name} {isTarget ? "(SUA EMPRESA)" : ""}
                                        </span>
                                      </div>
                                      <span className="font-mono font-bold tabular-nums shrink-0">
                                        {revCount} aval. ({comp.rating.toFixed(1)} ★)
                                      </span>
                                    </div>
                                    <div className={`w-full h-3 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-100"}`}>
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${widthPct}%`,
                                          backgroundColor: isTarget ? "#7C3AED" : idx < 3 ? "#10B981" : "#64748B",
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {item.chartType === "segment_avg_reviews" && (
                          <div
                            className={`p-4 rounded-2xl border space-y-3 ${borderCol} ${dark ? "bg-[#151126]" : "bg-white"}`}
                            data-testid="gbp-check-segment-avg-chart"
                          >
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                              Média do Segmento na Cidade vs. Sua Empresa
                            </div>
                            <h4 className="text-[14px] font-extrabold">
                              Média de avaliações dos 10 principais concorrentes vs. {biz.name}
                            </h4>
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[12px] font-bold">
                                  <span>Média dos Concorrentes ({biz.category || "Nicho Local"})</span>
                                  <span className="font-mono text-emerald-600">{avgCompReviews} avaliações</span>
                                </div>
                                <div className={`w-full h-4 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-100"}`}>
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{
                                      width: `${Math.min(100, Math.max(15, Math.round((avgCompReviews / Math.max(avgCompReviews, Number(biz.rating_count) || 1)) * 100)))}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[12px] font-bold">
                                  <span className="text-[#7C3AED]">{biz.name} (Sua Empresa)</span>
                                  <span className="font-mono text-[#7C3AED]">{parseSafeReviewCount(biz.rating_count)} avaliações</span>
                                </div>
                                <div className={`w-full h-4 rounded-full overflow-hidden ${dark ? "bg-white/10" : "bg-slate-100"}`}>
                                  <div
                                    className="h-full rounded-full bg-[#7C3AED]"
                                    style={{
                                      width: `${Math.min(100, Math.max(8, Math.round(((parseSafeReviewCount(biz.rating_count)) / Math.max(avgCompReviews, parseSafeReviewCount(biz.rating_count, 1))) * 100)))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                            Como corrigir passo a passo:
                          </div>
                          <ul className={`text-[12px] space-y-1 ${mutedText}`}>
                            {(item.howToFix || []).map((step, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="font-mono font-bold text-[#7C3AED]">0{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* FULL-SCREEN PHOTO LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
          data-testid="photo-lightbox-modal"
        >
          <div
            className="max-w-4xl w-full bg-[#151126] border border-white/15 rounded-2xl overflow-hidden shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A855F7]">
                  Galeria de Fotos · {biz.name}
                </div>
                <div className="text-[14px] font-extrabold">
                  Foto {lightboxIndex + 1} de {galleryPhotos.length}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomLogoOverride(galleryPhotos[lightboxIndex]);
                    toast.success("Foto definida como Logo principal da empresa!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#7C3AED] text-white text-[12px] font-bold cursor-pointer transition-colors"
                >
                  Usar como Logo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomCoverOverride(galleryPhotos[lightboxIndex]);
                    toast.success("Foto definida como Capa principal da empresa!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#7C3AED] text-white text-[12px] font-bold cursor-pointer transition-colors"
                >
                  Usar como Capa
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white cursor-pointer transition-colors"
                  aria-label="Fechar galeria"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative bg-black flex items-center justify-center h-[60vh] max-h-[540px]">
              <img
                src={galleryPhotos[lightboxIndex]}
                alt={`${biz.name} foto ${lightboxIndex + 1}`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain"
              />
              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)
                    }
                    className="absolute left-3 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-[#7C3AED] text-white font-bold text-[13px] cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((i) => (i + 1) % galleryPhotos.length)}
                    className="absolute right-3 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-[#7C3AED] text-white font-bold text-[13px] cursor-pointer"
                  >
                    Próxima →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip inside Lightbox */}
            <div className="p-3 bg-[#0B0914] border-t border-white/10 flex items-center gap-2 overflow-x-auto">
              {galleryPhotos.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 cursor-pointer transition-all ${
                    idx === lightboxIndex ? "border-[#A855F7] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={u} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZABLE PDF REPORT MODAL */}
      {pdfModalOpen && report && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`max-w-lg w-full rounded-2xl border p-6 space-y-5 ${
              dark ? "bg-[#151126] border-white/15 text-[#F4F2FF]" : "bg-white border-purple-900/15 text-[#120E24]"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  Exportação de Diagnóstico Oficial
                </div>
                <h3 className="text-[18px] font-extrabold mt-0.5">Personalizar Relatório PDF</h3>
              </div>
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className={`p-1.5 rounded-lg hover:bg-black/10 ${mutedText}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className={`block text-[11px] font-semibold uppercase tracking-wider mb-1 ${mutedText}`}>
                  Nome da Sua Agência / Consultoria no Cabeçalho
                </label>
                <input
                  type="text"
                  value={pdfConfig.agencyName}
                  onChange={(e) => setPdfConfig((c) => ({ ...c, agencyName: e.target.value }))}
                  className={`w-full px-3.5 py-2 rounded-xl border text-[13px] font-medium outline-none ${borderCol} ${subtleBg}`}
                />
              </div>

              <div className={`text-[11px] font-semibold uppercase tracking-wider pt-2 ${mutedText}`}>
                Seções para incluir no PDF do cliente:
              </div>

              {[
                { key: "includeScoreAndPillars", label: "Ficha da Empresa + Velocímetro de Score e Resumo" },
                { key: "includeCompetitors", label: "Raio-X Comparativo com Concorrentes Diretos" },
                { key: "includeActionPlan", label: "Checklist de Critérios Críticos e Plano de Correção" },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${borderCol} ${subtleBg}`}
                >
                  <span className="font-medium">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={pdfConfig[opt.key]}
                    onChange={(e) => setPdfConfig((c) => ({ ...c, [opt.key]: e.target.checked }))}
                    className="w-4 h-4 accent-[#7C3AED]"
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className={`px-4 py-2 rounded-xl border text-[13px] font-semibold ${borderCol}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDownloadDiagnosticPdf}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white text-[13px] font-bold flex items-center gap-2 cursor-pointer"
              >
                <Download size={15} /> Baixar Relatório PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY ("Analisando Perfil") */}
      {runningAudit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md space-y-3">
            {/* Top Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-white/15 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#7C3AED] to-[#9D5CFF] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((auditStep + 1) / GBP_CHECK_LOADING_STEPS.length) * 100))}%`,
                }}
              />
            </div>

            {/* Dark Card */}
            <div className="bg-[#18181B] text-white rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5">
              {/* Target Business Info Header */}
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-[18px] font-extrabold leading-snug text-white">
                  {loadingTargetBiz?.name || "Analisando Empresa..."}
                </h3>
                <p className="text-[12px] text-zinc-400 mt-1 truncate">
                  {loadingTargetBiz?.address || "Google Perfil da Empresa"}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[12px]">
                  <span className="font-bold text-white">{loadingTargetBiz?.rating || "4.8"}</span>
                  <div className="flex items-center text-[#F59E0B]">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={12} className="fill-[#F59E0B]" />
                    ))}
                  </div>
                  <span className="text-zinc-400">
                    ({loadingTargetBiz?.rating_count ? `${parseSafeReviewCount(loadingTargetBiz.rating_count)} avaliações` : "Consultando avaliações..."})
                  </span>
                </div>
              </div>

              {/* 7 Progressive Steps */}
              <div className="space-y-3">
                <div className="text-[13px] font-extrabold text-zinc-200">
                  Analisando Perfil
                </div>
                <div className="space-y-2.5">
                  {GBP_CHECK_LOADING_STEPS.map((stepLabel, idx) => {
                    const isDone = auditStep > idx;
                    const isCurrent = auditStep === idx;
                    return (
                      <div key={stepLabel} className="flex items-center gap-3 text-[13px]">
                        {isDone ? (
                          <span className="w-5 h-5 rounded-full bg-[#10B981] text-black flex items-center justify-center font-black text-[11px] shrink-0">
                            ✓
                          </span>
                        ) : isCurrent ? (
                          <span className="w-5 h-5 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-zinc-600 shrink-0" />
                        )}
                        <span
                          className={
                            isDone
                              ? "text-white font-semibold"
                              : isCurrent
                              ? "text-white font-bold"
                              : "text-zinc-500"
                          }
                        >
                          {stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
