import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  MapPin,
  Globe,
  ImagePlus,
  Film,
  CopyPlus,
  Loader2,
  ExternalLink,
  Check,
  Upload,
  Wand2,
  Play,
  Copy,
  Download,
  FileText,
  FolderArchive,
} from "lucide-react";
import JSZip from "jszip";
import { api, fmtErr } from "@/lib/api";
import {
  buildCompanyImageDataJson,
  buildSiteImagePlanningTable,
  buildMasterImagePromptMarkdown,
  mapUploadedFilenameToSlot,
} from "@/lib/sitegen/masterImagePrompt";

// Renderiza um vídeo WebM real no navegador (16:9 ou 9:16) animando a foto enviada com efeito Ken Burns + iluminação + legenda
async function renderClientMotionVideo({ imageSrc, headline, caption, badge, aspectRatio }) {
  const width = aspectRatio === "9:16" ? 540 : 960;
  const height = aspectRatio === "9:16" ? 960 : 540;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
    img.src = imageSrc;
  });

  const stream = canvas.captureStream ? canvas.captureStream(30) : null;
  if (!stream || typeof MediaRecorder === "undefined") {
    return null;
  }

  let mimeType = "video/webm;codecs=vp9";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm;codecs=vp8";
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
  }

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopPromise = new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    };
  });

  recorder.start();

  const totalFrames = 90; // 3 segundos a 30fps
  const particles = Array.from({ length: 18 }, (_, i) => ({
    x: ((i * 97) % 100) / 100,
    y: ((i * 53) % 100) / 100,
    r: 2 + (i % 4),
    s: 0.002 + (i % 3) * 0.001,
  }));

  for (let f = 0; f < totalFrames; f++) {
    const p = f / totalFrames;
    ctx.fillStyle = "#0B1324";
    ctx.fillRect(0, 0, width, height);

    if (img.complete && img.naturalWidth > 0) {
      const scale = 1.02 + p * 0.14;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      if (imgAspect > canvasAspect) {
        drawH = height * scale;
        drawW = drawH * imgAspect;
      } else {
        drawW = width * scale;
        drawH = drawW / imgAspect;
      }
      const dx = (width - drawW) / 2 + Math.sin(p * Math.PI) * 14;
      const dy = (height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    }

    // Gradiente cinematográfico
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(9,13,22,0.25)");
    grad.addColorStop(0.5, "rgba(9,13,22,0.18)");
    grad.addColorStop(1, "rgba(9,13,22,0.88)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Partículas de luz suaves
    for (const pt of particles) {
      const py = ((pt.y - p * pt.s * 30 + 1) % 1) * height;
      const px = pt.x * width + Math.sin(p * 6 + pt.r) * 12;
      ctx.beginPath();
      ctx.arc(px, py, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,191,36,0.32)";
      ctx.fill();
    }

    // Selo superior
    const padX = aspectRatio === "9:16" ? 36 : 56;
    const baseBottom = height - (aspectRatio === "9:16" ? 90 : 54);

    ctx.fillStyle = "rgba(251,191,36,0.95)";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText(String(badge || "VÍDEO OFICIAL").toUpperCase(), padX, baseBottom - 68);

    // Título principal
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${aspectRatio === "9:16" ? "30px" : "36px"} Georgia, serif`;
    ctx.fillText(String(headline || "").slice(0, 32), padX, baseBottom - 32);

    // Subtítulo
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `500 ${aspectRatio === "9:16" ? "15px" : "17px"} Inter, sans-serif`;
    ctx.fillText(String(caption || "").slice(0, 56), padX, baseBottom);

    await new Promise((r) => setTimeout(r, 22));
  }

  recorder.stop();
  return stopPromise;
}

export default function AiStudioPanel({ data, onChange }) {
  const b = data.business || {};
  const [subTab, setSubTab] = useState("kit"); // kit | maps | search | image | video | clone
  const [busy, setBusy] = useState(false);

  // Maps Grounding state
  const [mapsQuery, setMapsQuery] = useState("");
  const [mapsResult, setMapsResult] = useState(null);

  // Search Grounding state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Image Studio state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgAspect, setImgAspect] = useState("16:9");
  const [imgUpload, setImgUpload] = useState(null); // { dataUrl, mimeType }
  const [generatedImg, setGeneratedImg] = useState(null);

  // Video Studio state
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidAspect, setVidAspect] = useState("16:9");
  const [vidPhoto, setVidPhoto] = useState(null); // { dataUrl, mimeType }
  const [generatedVideo, setGeneratedVideo] = useState(null); // { url, aspectRatio }

  // Clone Site state
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneHtml, setCloneHtml] = useState("");

  const handleFileToDataUrl = (file, cb) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      cb({ dataUrl: String(reader.result), mimeType: file.type || "image/png" });
    };
    reader.readAsDataURL(file);
  };

  // 1. Gerar Kit Completo (Copy + Catálogo + FAQ)
  const runGenerateKit = async () => {
    setBusy(true);
    try {
      const { data: res } = await api.post("/ai/generate-kit", {
        businessName: b.name,
        category: b.category,
        city: b.city,
        segment: data.archetype,
      });
      onChange((d) => {
        const nextTexts = {
          ...(d.texts || {}),
          "hero.title": res.heroTitle || d.texts?.["hero.title"],
          "hero.accent": res.heroAccent || d.texts?.["hero.accent"],
          "hero.subtitle": res.heroSubtitle || d.texts?.["hero.subtitle"],
          "about.body": res.heroSubtitle || d.texts?.["about.body"],
        };
        if (Array.isArray(res.items)) {
          res.items.forEach((it, idx) => {
            if (it?.name) nextTexts[`item.${idx}.name`] = it.name;
            if (it?.description) nextTexts[`item.${idx}.description`] = it.description;
            if (it?.price) nextTexts[`item.${idx}.price`] = it.price;
            if (it?.badge) nextTexts[`item.${idx}.badge`] = it.badge;
          });
        }
        if (Array.isArray(res.faqs)) {
          res.faqs.forEach((fq, idx) => {
            if (fq?.q) nextTexts[`faq.${idx}.q`] = fq.q;
            if (fq?.a) nextTexts[`faq.${idx}.a`] = fq.a;
          });
        }
        const existingItems = d.business?.items || [];
        const mergedItems = res.items?.length
          ? res.items.map((it, idx) => ({
              ...existingItems[idx],
              ...it,
              image: it.image || existingItems[idx]?.image || b.photos?.[idx % Math.max(1, (b.photos || []).length)] || "",
            }))
          : existingItems;
        return {
          ...d,
          texts: nextTexts,
          business: {
            ...d.business,
            bio: res.heroSubtitle || d.business.bio,
            items: mergedItems,
            faqs: res.faqs?.length ? res.faqs : d.business.faqs,
          },
        };
      });
      toast.success("Textos, catálogo e FAQs gerados e aplicados ao site!");
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao gerar kit com IA"));
    } finally {
      setBusy(false);
    }
  };

  // 2. Google Maps Grounding
  const runMapsGrounding = async () => {
    setBusy(true);
    try {
      let coords = { lat: b.lat, lng: b.lng };
      if (!coords.lat && typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500 })
          );
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // ignore geolocation error
        }
      }
      const { data: res } = await api.post("/ai/maps-grounding", {
        query: mapsQuery,
        businessName: b.name,
        city: b.city,
        category: b.category,
        lat: coords.lat,
        lng: coords.lng,
      });
      setMapsResult(res);
      toast.success("Dados do Google Maps consultados com IA!");
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao consultar Google Maps IA"));
    } finally {
      setBusy(false);
    }
  };

  // 3. Google Search Grounding
  const runSearchGrounding = async () => {
    setBusy(true);
    try {
      const { data: res } = await api.post("/ai/search-grounding", {
        query: searchQuery,
        businessName: b.name,
        city: b.city,
        category: b.category,
      });
      setSearchResult(res);
      toast.success("Pesquisa Google Search concluída com IA!");
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao pesquisar no Google Search IA"));
    } finally {
      setBusy(false);
    }
  };

  // 4. Criar / Editar Imagem + Direção Oficial PROMPT MESTRE
  const companyImageJson = buildCompanyImageDataJson(data);
  const planningTable = buildSiteImagePlanningTable(data);
  const masterPromptMarkdown = buildMasterImagePromptMarkdown(data);
  const [showMasterJson, setShowMasterJson] = useState(false);

  const copyMasterPrompt = () => {
    navigator.clipboard.writeText(masterPromptMarkdown);
    toast.success("PROMPT MESTRE completo (11 seções + JSON + Tabela) copiado!");
  };

  const downloadMasterPrompt = () => {
    const blob = new Blob([masterPromptMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-mestre-imagens-${(b.name || "site").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo .MD do Prompt Mestre baixado!");
  };

  const applyUrlToSlot = (slotKey, imageUrl, customLabel = "") => {
    if (!imageUrl) return;
    const itemMatch = String(slotKey || "").match(/^item_(\d+)$/);
    if (itemMatch) {
      const idx = Number(itemMatch[1]);
      onChange((d) => ({
        ...d,
        images: {
          ...(d.images || {}),
          [slotKey]: { url: imageUrl, fit: "cover" },
        },
        business: {
          ...d.business,
          items: (d.business?.items || []).map((it, i) => (i === idx ? { ...it, image: imageUrl } : it)),
        },
      }));
      toast.success(`Imagem aplicada em ${customLabel || `Card #${idx + 1}`}!`);
      return;
    }

    onChange((d) => ({
      ...d,
      images: {
        ...(d.images || {}),
        [slotKey]: { url: imageUrl, fit: "cover" },
      },
    }));
    toast.success(`Imagem aplicada em ${customLabel || slotKey}!`);
  };

  const handleBatchStandardizedUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let mappedCount = 0;
    files.forEach((file) => {
      const match = mapUploadedFilenameToSlot(file.name, b.items || []);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (match) {
          mappedCount++;
          applyUrlToSlot(match.slotKey, dataUrl, `${match.label} (${file.name})`);
        } else {
          setImgUpload({ dataUrl, mimeType: file.type || "image/webp" });
          toast.info(`Foto "${file.name}" carregada para edição ou aplicação manual.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const runSlotImageGeneration = async (row) => {
    setImgPrompt(row.individualPrompt);
    setImgAspect(row.aspectRatio);
    setBusy(true);
    try {
      const { data: res } = await api.post("/ai/image", {
        prompt: row.individualPrompt,
        aspectRatio: row.aspectRatio,
        base64Image: imgUpload?.dataUrl || null,
        mimeType: imgUpload?.mimeType || null,
        businessName: b.name,
        city: b.city,
        slotKey: row.slotKey,
      });
      if (res.imageUrl) {
        setGeneratedImg(res.imageUrl);
        applyUrlToSlot(row.slotKey, res.imageUrl, `${row.sectionName} (${row.filename})`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao gerar imagem para o slot"));
    } finally {
      setBusy(false);
    }
  };

  const runImageAi = async () => {
    setBusy(true);
    try {
      const defaultMasterHero = planningTable[0]?.individualPrompt || `Fotografia comercial realista para ${b.name}`;
      const { data: res } = await api.post("/ai/image", {
        prompt: imgPrompt || defaultMasterHero,
        aspectRatio: imgAspect,
        base64Image: imgUpload?.dataUrl || null,
        mimeType: imgUpload?.mimeType || null,
        businessName: b.name,
        city: b.city,
      });
      if (res.imageUrl) {
        setGeneratedImg(res.imageUrl);
        toast.success(
          imgUpload
            ? "Foto aprimorada com Direção de Arte Comercial (sem textos sobrepostos)!"
            : "Fotografia comercial gerada com IA!"
        );
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao gerar imagem"));
    } finally {
      setBusy(false);
    }
  };

  const applyImageTo = (target) => {
    if (!generatedImg) return;
    if (
      target === "hero" ||
      target === "hero_mobile" ||
      target === "about" ||
      target === "about_mobile" ||
      target === "spotlight0" ||
      target.startsWith("gallery_")
    ) {
      applyUrlToSlot(target, generatedImg, target);
    } else if (target === "item") {
      onChange((d) => ({
        ...d,
        business: {
          ...d.business,
          items: [
            {
              name: imgPrompt ? imgPrompt.slice(0, 38) : "Novo Destaque IA",
              description: `Criado sob medida para ${b.name}. Peça agora pelo WhatsApp.`,
              price: "Consulte",
              category: "Destaques",
              badge: "Destaque",
              image: generatedImg,
            },
            ...(d.business.items || []),
          ],
        },
      }));
      toast.success("Adicionado como novo item no catálogo!");
    }
  };

  // 5. Animar Foto em Vídeo (16:9 ou 9:16)
  const runVideoAi = async () => {
    setBusy(true);
    try {
      const sourceImg = vidPhoto?.dataUrl || b.photos?.[0] || "";
      const { data: res } = await api.post("/ai/video", {
        prompt: vidPrompt || `Animação suave destacando ${b.name}`,
        aspectRatio: vidAspect,
        base64Image: sourceImg.startsWith("data:") ? sourceImg : null,
        mimeType: vidPhoto?.mimeType || "image/png",
        businessName: b.name,
        city: b.city,
      });

      if (res.videoUrl) {
        setGeneratedVideo({ url: res.videoUrl, aspectRatio: res.aspectRatio || vidAspect });
        toast.success("Vídeo gerado com Gemini Omni Flash!");
      } else if (res.fallbackAnimation) {
        const webmDataUrl = await renderClientMotionVideo({
          imageSrc: sourceImg,
          headline: res.headline || b.name,
          caption: res.caption || vidPrompt || b.bio,
          badge: res.badge || "Vídeo Oficial",
          aspectRatio: res.aspectRatio || vidAspect,
        });
        if (webmDataUrl) {
          setGeneratedVideo({ url: webmDataUrl, aspectRatio: res.aspectRatio || vidAspect });
          toast.success(`Vídeo ${vidAspect} gerado a partir da foto!`);
        } else {
          toast.error("Seu navegador não suporta gravação WebM em canvas.");
        }
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao animar foto em vídeo"));
    } finally {
      setBusy(false);
    }
  };

  const applyVideoToSite = () => {
    if (!generatedVideo?.url) return;
    onChange((d) => ({
      ...d,
      video: {
        url: generatedVideo.url,
        aspectRatio: generatedVideo.aspectRatio,
      },
      sections: (d.sections || []).map((s) => (s.id === "video" ? { ...s, on: true } : s)),
    }));
    toast.success("Vídeo publicado e seção 'Vídeo Institucional' ativada no site!");
  };

  // 6. Clonar / Replicar Site por URL, HTML ou Pasta ZIP do Computador
  const [cloneUploadedFileName, setCloneUploadedFileName] = useState("");

  const runCloneSite = async (overrideHtml = null) => {
    const htmlPayload = typeof overrideHtml === "string" ? overrideHtml : cloneHtml;
    if (!cloneUrl.trim() && !htmlPayload.trim()) {
      toast.error("Informe a URL do site, envie um arquivo .ZIP/.HTML ou cole o código HTML para replicar.");
      return;
    }
    setBusy(true);
    try {
      const { data: res } = await api.post("/ai/clone-site", {
        url: cloneUrl,
        rawHtml: htmlPayload,
      });
      if (res.business) {
        onChange((d) => {
          const nextTexts = {
            ...(d.texts || {}),
            "brand.name": res.business.name || d.texts?.["brand.name"],
            "hero.title": res.heroTitle || res.business.name || d.texts?.["hero.title"],
            "hero.accent": res.heroAccent || "",
            "hero.subtitle": res.business.bio || d.texts?.["hero.subtitle"],
            "about.body": res.business.bio || d.texts?.["about.body"],
          };
          const existingItems = d.business?.items || [];
          const clonedItems = Array.isArray(res.business.items) && res.business.items.length > 0
            ? res.business.items.map((it, idx) => ({
                ...existingItems[idx],
                ...it,
                image: it.image || existingItems[idx]?.image || b.photos?.[idx % Math.max(1, (b.photos || []).length)] || "",
              }))
            : existingItems;
          clonedItems.forEach((it, idx) => {
            if (it?.name) nextTexts[`item.${idx}.name`] = it.name;
            if (it?.description) nextTexts[`item.${idx}.description`] = it.description;
            if (it?.price) nextTexts[`item.${idx}.price`] = it.price;
            if (it?.badge) nextTexts[`item.${idx}.badge`] = it.badge;
          });
          return {
            ...d,
            archetype: res.business.segment || d.archetype,
            paletteId: res.palette_id || d.paletteId,
            texts: nextTexts,
            business: {
              ...d.business,
              ...res.business,
              items: clonedItems,
              photos: res.business.photos?.length ? res.business.photos : d.business?.photos,
            },
          };
        });
        toast.success(`Site "${res.business.name || "Referência"}" replicado com sucesso no canvas!`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao replicar site"));
    } finally {
      setBusy(false);
    }
  };

  const handleCloneFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCloneUploadedFileName(file.name);
    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const htmlEntries = Object.keys(zip.files).filter(
          (k) => !zip.files[k].dir && (k.toLowerCase().endsWith(".html") || k.toLowerCase().endsWith(".htm"))
        );
        const mainEntry =
          htmlEntries.find((k) => k.toLowerCase().endsWith("index.html")) || htmlEntries[0];
        if (!mainEntry) {
          toast.error("Nenhum arquivo .html encontrado dentro do pacote .ZIP.");
          return;
        }
        const extractedHtml = await zip.files[mainEntry].async("string");
        setCloneHtml(extractedHtml);
        toast.info(`Arquivo "${mainEntry}" extraído do ZIP! Replicando estrutura no canvas...`);
        await runCloneSite(extractedHtml);
      } else {
        const text = await file.text();
        setCloneHtml(text);
        toast.info(`Arquivo "${file.name}" carregado! Replicando estrutura no canvas...`);
        await runCloneSite(text);
      }
    } catch (err) {
      toast.error("Não foi possível ler o arquivo enviado: " + (err?.message || "Erro desconhecido"));
    } finally {
      e.target.value = "";
    }
  };

  const SUBTABS = [
    { id: "kit", label: "Kit IA", icon: Wand2 },
    { id: "maps", label: "Maps", icon: MapPin },
    { id: "search", label: "Search", icon: Globe },
    { id: "image", label: "Imagens", icon: ImagePlus },
    { id: "video", label: "Vídeo", icon: Film },
    { id: "clone", label: "Clonar", icon: CopyPlus },
  ];

  return (
    <div className="space-y-4" data-testid="ai-studio-panel">
      <div className="rounded-xl bg-slate-900 text-white p-3.5">
        <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
          <Sparkles size={13} /> Estúdio IA Gratuito Ativo
        </div>
        <p className="text-[11.5px] text-slate-300 mt-1 leading-relaxed">
          Gere textos, consulte Google Maps e Google Search ao vivo, crie/edite imagens, anime fotos em vídeo e replique sites.
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            data-testid={`ai-subtab-${t.id}`}
            onClick={() => setSubTab(t.id)}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
              subTab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* 1. KIT IA GRATUITO */}
      {subTab === "kit" && (
        <div className="panel !rounded-xl p-4 space-y-3" data-testid="ai-panel-kit">
          <b className="block text-[13px] text-slate-900">Gerador Completo de Alta Conversão</b>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Usa o <b>gemini-3.8-flash</b> para reescrever a Headline do Hero, criar itens persuasivos no catálogo e gerar perguntas frequentes (FAQ) específicas para <b>{b.name}</b>.
          </p>
          <button
            data-testid="ai-generate-kit-btn"
            onClick={runGenerateKit}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12.5px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gerar Textos + Catálogo + FAQ
          </button>
        </div>
      )}

      {/* 2. GOOGLE MAPS GROUNDING */}
      {subTab === "maps" && (
        <div className="panel !rounded-xl p-4 space-y-3" data-testid="ai-panel-maps">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-emerald-600" />
            <b className="text-[13px] text-slate-900">Google Maps Grounding</b>
          </div>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Consulta dados geográficos atualizados e referências reais no Google Maps com <code>gemini-3.8-flash</code> + ferramenta <code>googleMaps</code>.
          </p>
          <input
            data-testid="ai-maps-query-input"
            value={mapsQuery}
            onChange={(e) => setMapsQuery(e.target.value)}
            placeholder={`Ex: diferenciais de ${b.category || "empresas"} em ${b.city || "sua cidade"}`}
            className="field !text-[12px]"
          />
          <button
            data-testid="ai-maps-run-btn"
            onClick={runMapsGrounding}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Consultar Google Maps IA
          </button>

          {mapsResult && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100" data-testid="ai-maps-result">
              <div className="text-[11.5px] text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg leading-relaxed max-h-48 overflow-y-auto studio-scroll">
                {mapsResult.text}
              </div>
              {mapsResult.places?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                    Links Verificados do Google Maps
                  </span>
                  {mapsResult.places.map((pl, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-[#E4E4E7] bg-white space-y-1">
                      <a
                        href={pl.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`ai-maps-link-${idx}`}
                        className="flex items-center justify-between gap-2 text-[12px] font-bold text-blue-600 hover:underline"
                      >
                        <span className="truncate">{pl.title}</span>
                        <ExternalLink size={12} className="flex-none" />
                      </a>
                      {pl.snippets?.map((sn, sIdx) => (
                        <p key={sIdx} className="text-[11px] text-slate-500 italic">
                          “{sn}”
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. GOOGLE SEARCH GROUNDING */}
      {subTab === "search" && (
        <div className="panel !rounded-xl p-4 space-y-3" data-testid="ai-panel-search">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-blue-600" />
            <b className="text-[13px] text-slate-900">Google Search Grounding</b>
          </div>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Pesquisa em tempo real no Google Search (<code>gemini-3.8-flash</code> + <code>googleSearch</code>) para descobrir palavras-chave e otimizar o SEO.
          </p>
          <input
            data-testid="ai-search-query-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Ex: termos mais buscados para ${b.category || "negócios"} em ${b.city || "sua cidade"}`}
            className="field !text-[12px]"
          />
          <button
            data-testid="ai-search-run-btn"
            onClick={runSearchGrounding}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Pesquisar no Google Search IA
          </button>

          {searchResult && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100" data-testid="ai-search-result">
              <div className="text-[11.5px] text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-lg leading-relaxed max-h-48 overflow-y-auto studio-scroll">
                {searchResult.text}
              </div>
              {searchResult.seoTitle && (
                <button
                  data-testid="ai-search-apply-seo-btn"
                  onClick={() => {
                    onChange((d) => ({
                      ...d,
                      marketing: {
                        ...(d.marketing || {}),
                        seoTitle: searchResult.seoTitle,
                        seoDesc: searchResult.seoDesc,
                      },
                    }));
                    toast.success("Título e Descrição SEO aplicados na aba Marketing!");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white text-[11.5px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Check size={13} /> Aplicar SEO Gerado no Site
                </button>
              )}
              {searchResult.sources?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                    Fontes Web Verificadas
                  </span>
                  {searchResult.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`ai-search-source-${idx}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E4E4E7] text-[11.5px] font-semibold text-blue-600 hover:bg-slate-50"
                    >
                      <span className="truncate">{src.title}</span>
                      <ExternalLink size={11} className="flex-none" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. CRIAR & EDITAR IMAGENS + DIREÇÃO OFICIAL PROMPT MESTRE */}
      {subTab === "image" && (
        <div className="panel !rounded-xl p-4 space-y-3.5" data-testid="ai-panel-image">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ImagePlus size={15} className="text-purple-600" />
              <b className="text-[13px] text-slate-900">Direção de Criação de Imagens (Prompt Mestre)</b>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Zero Textos Sobrepostos
            </span>
          </div>

          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Direção oficial de fotografia comercial do <b>Site Express</b> preenchida automaticamente com os dados confirmados de <b>{b.name}</b> ({companyImageJson.modelo}).
          </p>

          {/* Master Prompt Action Bar */}
          <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2.5" data-testid="master-image-prompt-box">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <FileText size={13} /> PROMPT MESTRE — {planningTable.length} Imagens Planejadas
              </span>
              <button
                type="button"
                data-testid="toggle-master-prompt-json-btn"
                onClick={() => setShowMasterJson((v) => !v)}
                className="text-[10.5px] font-semibold text-slate-300 hover:text-white underline cursor-pointer"
              >
                {showMasterJson ? "Ocultar JSON/Tabela" : "Ver Dados & Tabela"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="copy-master-image-prompt-btn"
                onClick={copyMasterPrompt}
                className="py-2 px-2.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-extrabold flex items-center justify-center gap-1.5 hover:bg-amber-300 cursor-pointer"
              >
                <Copy size={12} /> Copiar Prompt Mestre
              </button>
              <button
                type="button"
                data-testid="download-master-image-prompt-btn"
                onClick={downloadMasterPrompt}
                className="py-2 px-2.5 rounded-lg bg-slate-800 text-white border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-700 cursor-pointer"
              >
                <Download size={12} /> Baixar Prompt (.MD)
              </button>
            </div>

            {showMasterJson && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded-lg max-h-40 overflow-y-auto studio-scroll whitespace-pre">
                  {JSON.stringify(companyImageJson, null, 2)}
                </div>
              </div>
            )}
          </div>

          {/* Upload de Arquivos Padronizados (capa-desktop.webp, item-01..., galeria-01...) */}
          <div className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-1.5">
            <label className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 hover:border-slate-900 cursor-pointer">
              <Upload size={13} className="text-purple-600" />
              <span>Subir Imagens Padronizadas (Auto-Encaixe nos Slots)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                data-testid="ai-standardized-batch-upload"
                onChange={handleBatchStandardizedUpload}
              />
            </label>
            <p className="text-[10.5px] text-slate-500 leading-snug text-center">
              Aceita <code>capa-desktop.webp</code>, <code>capa-mobile.webp</code>, <code>sobre-desktop.webp</code>, <code>item-01...</code> e <code>galeria-01...</code>
            </p>
          </div>

          {/* Interactive Planning Table Slots */}
          <div className="space-y-1.5">
            <label className="field-label">
              Tabela de Planejamento ({planningTable.length} arquivos padronizados)
            </label>
            <div className="max-h-56 overflow-y-auto studio-scroll space-y-1.5 pr-1" data-testid="master-planning-slots-list">
              {planningTable.map((row) => (
                <div
                  key={row.filename}
                  className="p-2.5 rounded-lg border border-[#E4E4E7] bg-slate-50/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold text-slate-900 truncate">
                        {row.index}. {row.sectionName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        {row.filename} · {row.aspectRatio} ({row.dimensions})
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`use-slot-prompt-${row.slotKey}`}
                        onClick={() => {
                          setImgPrompt(row.individualPrompt);
                          setImgAspect(row.aspectRatio);
                          toast.info(`Prompt de "${row.filename}" carregado abaixo!`);
                        }}
                        className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 hover:border-slate-900 cursor-pointer"
                      >
                        Prompt
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        data-testid={`generate-slot-ai-${row.slotKey}`}
                        onClick={() => runSlotImageGeneration(row)}
                        className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        Gerar IA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Foto real de referência p/ melhorar iluminação (opcional)</label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-slate-300 text-[11.5px] font-semibold text-slate-600 hover:border-slate-900 cursor-pointer">
                <Upload size={13} /> {imgUpload ? "Trocar foto real enviada" : "Enviar foto real do cliente"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  data-testid="ai-image-upload-input"
                  onChange={(e) => handleFileToDataUrl(e.target.files?.[0], setImgUpload)}
                />
              </label>
              {imgUpload && (
                <button
                  onClick={() => setImgUpload(null)}
                  className="text-[11px] font-bold text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="field-label">Proporção da Imagem</label>
            <div className="grid grid-cols-5 gap-1">
              {["16:9", "1:1", "9:16", "4:3", "3:4"].map((ar) => (
                <button
                  key={ar}
                  type="button"
                  data-testid={`ai-image-aspect-${ar}`}
                  onClick={() => setImgAspect(ar)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                    imgAspect === ar ? "bg-slate-900 text-white border-slate-900" : "border-[#E4E4E7] text-slate-600"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Prompt Individual / Direção Fotográfica</label>
            <textarea
              rows={3}
              data-testid="ai-image-prompt-input"
              value={imgPrompt}
              onChange={(e) => setImgPrompt(e.target.value)}
              placeholder={
                planningTable[0]?.individualPrompt ||
                "Fotografia publicitária realista, iluminação natural, sem textos ou selos sobrepostos..."
              }
              className="field resize-none !text-[11.5px]"
            />
          </div>

          <button
            data-testid="ai-image-generate-btn"
            onClick={runImageAi}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{" "}
            {imgUpload ? "Aprimorar Foto Real (Padrão Prompt Mestre)" : "Gerar Fotografia Comercial IA"}
          </button>

          {generatedImg && (
            <div className="space-y-2 pt-2 border-t border-slate-100" data-testid="ai-image-result">
              <img src={generatedImg} alt="Gerada por IA" referrerPolicy="no-referrer" className="w-full h-36 object-cover rounded-lg border border-[#E4E4E7]" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                Aplicar nos slots padronizados do site:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  data-testid="ai-image-apply-hero"
                  onClick={() => applyImageTo("hero")}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 text-white text-[10.5px] font-bold hover:bg-slate-800"
                >
                  capa-desktop (16:9)
                </button>
                <button
                  data-testid="ai-image-apply-hero-mobile"
                  onClick={() => applyImageTo("hero_mobile")}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 text-white text-[10.5px] font-bold hover:bg-slate-700"
                >
                  capa-mobile (1:1)
                </button>
                <button
                  data-testid="ai-image-apply-about"
                  onClick={() => applyImageTo("about")}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 text-[10.5px] font-bold hover:bg-slate-200"
                >
                  sobre-desktop (4:3)
                </button>
                <button
                  data-testid="ai-image-apply-about-mobile"
                  onClick={() => applyImageTo("about_mobile")}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 text-[10.5px] font-bold hover:bg-slate-200"
                >
                  sobre-mobile (3:4)
                </button>
                <button
                  data-testid="ai-image-apply-spot"
                  onClick={() => applyImageTo("gallery_0")}
                  className="py-1.5 px-2 rounded-lg bg-slate-100 text-slate-800 text-[10.5px] font-bold hover:bg-slate-200"
                >
                  galeria-01 (4:3)
                </button>
                <button
                  data-testid="ai-image-apply-item"
                  onClick={() => applyImageTo("item")}
                  className="py-1.5 px-2 rounded-lg bg-emerald-600 text-white text-[10.5px] font-bold hover:bg-emerald-700"
                >
                  + Card de Serviço
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ANIMAR FOTO EM VÍDEO (16:9 ou 9:16) */}
      {subTab === "video" && (
        <div className="panel !rounded-xl p-4 space-y-3" data-testid="ai-panel-video">
          <div className="flex items-center gap-2">
            <Film size={15} className="text-rose-600" />
            <b className="text-[13px] text-slate-900">Animar Foto em Vídeo</b>
          </div>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Envie uma foto e gere um vídeo animado em <b>16:9 (Paisagem)</b> ou <b>9:16 (Retrato/Reels)</b> via Interactions API (<code>gemini-omni-1.1-flash</code>) + Motor Motion Gratuito.
          </p>

          <div>
            <label className="field-label">Foto para animar</label>
            <label className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-dashed border-slate-300 text-[11.5px] font-semibold text-slate-600 hover:border-slate-900 cursor-pointer">
              <Upload size={13} /> {vidPhoto ? "Foto carregada (Trocar)" : "Enviar foto (ou usar capa atual)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                data-testid="ai-video-upload-input"
                onChange={(e) => handleFileToDataUrl(e.target.files?.[0], setVidPhoto)}
              />
            </label>
          </div>

          <div>
            <label className="field-label">Formato do Vídeo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "16:9", label: "16:9 Paisagem" },
                { id: "9:16", label: "9:16 Retrato" },
              ].map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  data-testid={`ai-video-aspect-${ar.id}`}
                  onClick={() => setVidAspect(ar.id)}
                  className={`py-2 rounded-lg text-[11.5px] font-bold border ${
                    vidAspect === ar.id ? "bg-slate-900 text-white border-slate-900" : "border-[#E4E4E7] text-slate-600"
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Comando de Movimento</label>
            <input
              data-testid="ai-video-prompt-input"
              value={vidPrompt}
              onChange={(e) => setVidPrompt(e.target.value)}
              placeholder="Ex: Zoom cinematográfico suave com brilho dourado"
              className="field !text-[12px]"
            />
          </div>

          <button
            data-testid="ai-video-generate-btn"
            onClick={runVideoAi}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Gerar Vídeo Animado ({vidAspect})
          </button>

          {generatedVideo && (
            <div className="space-y-2 pt-2 border-t border-slate-100" data-testid="ai-video-result">
              <video
                src={generatedVideo.url}
                controls
                autoPlay
                muted
                loop
                playsInline
                className={`w-full rounded-lg border border-[#E4E4E7] bg-slate-950 ${
                  generatedVideo.aspectRatio === "9:16" ? "max-h-64 object-contain" : "aspect-video object-cover"
                }`}
              />
              <button
                data-testid="ai-video-apply-site-btn"
                onClick={applyVideoToSite}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white text-[11.5px] font-bold hover:bg-emerald-700 transition-colors"
              >
                <Check size={13} /> Publicar Vídeo na Seção do Site
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. CLONAR / REPLICAR SITE POR URL, ARQUIVO ZIP/HTML OU CÓDIGO */}
      {subTab === "clone" && (
        <div className="panel !rounded-xl p-4 space-y-3" data-testid="ai-panel-clone">
          <div className="flex items-center gap-2">
            <CopyPlus size={15} className="text-indigo-600" />
            <b className="text-[13px] text-slate-900">Replicar Site por URL, ZIP ou HTML</b>
          </div>
          <p className="text-[11.5px] text-slate-500 leading-relaxed">
            Informe o link de qualquer site de referência, envie uma pasta <b>.ZIP / .HTML</b> do seu computador ou cole o código para extrair textos, cores e catálogo com <code>gemini-3.8-flash</code>.
          </p>

          <div>
            <label className="field-label">1. Subir Arquivo do Computador (.ZIP ou .HTML)</label>
            <label
              data-testid="ai-clone-file-upload-label"
              className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold text-[12px] cursor-pointer transition-colors"
            >
              <FolderArchive size={15} />
              <span>{cloneUploadedFileName ? `Arquivo: ${cloneUploadedFileName}` : "Escolher arquivo .ZIP ou .HTML do PC"}</span>
              <input
                type="file"
                accept=".zip,.html,.htm"
                data-testid="ai-clone-file-upload"
                onChange={handleCloneFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="field-label">2. Ou informe a URL do Site de Referência</label>
            <input
              data-testid="ai-clone-url-input"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="https://exemplo.com.br"
              className="field !text-[12px]"
            />
          </div>
          <div>
            <label className="field-label">3. Ou cole o código HTML (opcional)</label>
            <textarea
              rows={3}
              data-testid="ai-clone-html-input"
              value={cloneHtml}
              onChange={(e) => setCloneHtml(e.target.value)}
              placeholder="<html>...</html>"
              className="field resize-none !text-[11.5px] font-mono"
            />
          </div>
          <button
            data-testid="ai-clone-run-btn"
            onClick={() => runCloneSite()}
            disabled={busy}
            className="btn-primary-dark w-full !py-2.5 !text-[12px]"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CopyPlus size={14} />} Replicar Estrutura no Canvas
          </button>
        </div>
      )}
    </div>
  );
}
