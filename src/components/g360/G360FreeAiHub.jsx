import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Mic,
  Square,
  Send,
  Search,
  MapPin,
  Volume2,
  Image as ImageIcon,
  Video,
  Copy,
  Check,
  Download,
  RefreshCw,
  Upload,
  ExternalLink,
  FileText,
  Zap,
  MessageSquare,
  Radio,
  Layers,
  Briefcase,
  Cpu,
  Sparkles,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import {
  buildSiteImagePlanningTable,
  buildMasterImagePromptMarkdown,
} from "@/lib/sitegen/masterImagePrompt";

export default function G360FreeAiHub({
  dark = false,
  activeBusiness,
  onOpenGbpPackage,
  onOpenCrm,
}) {
  const [activeTab, setActiveTab] = useState("chat");
  const [copiedKey, setCopiedKey] = useState("");

  const biz = activeBusiness || {
    name: "Sorvetes Campo Grande",
    category: "Sorveteria",
    city: "Campo Grande",
    uf: "MS",
    rating: 4.7,
    rating_count: 72,
  };

  // ---------------- 1. MULTI-TURN GEMINI CHATBOT STATE ----------------
  const [chatRole, setChatRole] = useState("estrategista");
  const [chatModel, setChatModel] = useState("gemini-3.8-flash");
  const [useMapsGrounding, setUseMapsGrounding] = useState(true);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: `Olá! Sou o Consultor G360 integrado aos modelos gratuitos do Google (gemini-3.8-flash e gemini-3.1-flash-lite). Estou conectado aos dados de ${biz.name} (${biz.city}). Como posso ajudar na auditoria, copy de SEO local ou script de vendas hoje?`,
      source: "gemini-3.8-flash",
      citations: [],
    },
  ]);

  // ---------------- 2. AUDIO TRANSCRIPTION (gemini-3.5-transcribe) STATE ----------------
  const [recordingTarget, setRecordingTarget] = useState(null); // "transcribe" | "chat" | "voice"
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [transcribeHint, setTranscribeHint] = useState("crm");
  const [transcribedText, setTranscribedText] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  // ---------------- 3. LIVE VOICE CONVERSATION STATE ----------------
  const [voiceMode, setVoiceMode] = useState("consultor"); // "consultor" | "simulacao-cliente"
  const [voiceTextPrompt, setVoiceTextPrompt] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceTurns, setVoiceTurns] = useState([
    {
      speaker: "Consultor Voz G360",
      userTranscript: "Iniciar sessão de voz gratuita",
      spokenReply: `Canal de voz ativo para ${biz.name}. Pressione o botão Gravar Fala para conversar por voz ou simular objeções do proprietário.`,
      source: "gemini-3.8-live",
    },
  ]);

  // ---------------- 4. MAPS & SEARCH GROUNDING RADAR STATE ----------------
  const [groundingQuery, setGroundingQuery] = useState(
    `${biz.category || "Sorveteria"} em ${biz.city || "Campo Grande"}`
  );
  const [mapsResult, setMapsResult] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [groundingLoading, setGroundingLoading] = useState(false);

  // ---------------- 5. FREE IMAGE & VIDEO STUDIO STATE ----------------
  const [imgPrompt, setImgPrompt] = useState(
    `Banner institucional moderno para ${biz.name} em ${biz.city} destacando qualidade e atendimento rápido`
  );
  const [imgAspect, setImgAspect] = useState("16:9");
  const [imgSize, setImgSize] = useState("1K"); // "1K" | "2K"
  const [imgModel, setImgModel] = useState("gemini-nano-banana-2.1");
  const [uploadedBase64, setUploadedBase64] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [testingModelId, setTestingModelId] = useState("");
  const [testedModelsResults, setTestedModelsResults] = useState({});

  const [vidPrompt, setVidPrompt] = useState(
    `Apresentação dinâmica da ${biz.name} em ${biz.city} com chamada para WhatsApp e avaliação 5 estrelas`
  );
  const [vidAspect, setVidAspect] = useState("16:9");
  const [vidLoading, setVidLoading] = useState(false);
  const [videoMeta, setVideoMeta] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (activeBusiness?.name) {
      const cityLabel = activeBusiness.city || "Anápolis";
      const catLabel = activeBusiness.category || "Empresa Local";
      setGroundingQuery(`${catLabel} em ${cityLabel}`);
      setImgPrompt(
        `Fotografia comercial realista para ${activeBusiness.name} (${catLabel}) em ${cityLabel}, luz natural equilibrada, sem textos sobrepostos`
      );
      setVidPrompt(
        `Apresentação comercial de ${activeBusiness.name} (${catLabel}) em ${cityLabel} com chamada para WhatsApp`
      );
      setMessages([
        {
          role: "model",
          text: `Olá! Sou o Consultor G360 integrado aos modelos gratuitos do Google (gemini-3.8-flash e gemini-3.1-flash-lite). Estou conectado aos dados de ${activeBusiness.name} (${cityLabel}). Como posso ajudar na auditoria, copy de SEO local ou script de vendas hoje?`,
          source: "gemini-3.8-flash",
          citations: [],
        },
      ]);
      setVoiceTurns([
        {
          speaker: "Consultor Voz G360",
          userTranscript: "Sincronizar sessão de voz com a empresa ativa",
          spokenReply: `Canal de voz ativo para ${activeBusiness.name} em ${cityLabel}. Pressione o botão Gravar Fala para conversar por voz ou simular objeções do proprietário.`,
          source: "gemini-3.8-live",
        },
      ]);
    }
  }, [activeBusiness?.name, activeBusiness?.city, activeBusiness?.category]);

  const copyText = (key, text) => {
    navigator.clipboard.writeText(String(text || ""));
    setCopiedKey(key);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedKey(""), 1800);
  };

  // ---------------- MICROPHONE RECORDING HELPER ----------------
  const startRecording = async (target) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = String(reader.result || "");
          if (target === "transcribe") {
            await handleTranscribeAudio(base64Audio, mr.mimeType || "audio/webm");
          } else if (target === "chat") {
            await handleTranscribeIntoChat(base64Audio, mr.mimeType || "audio/webm");
          } else if (target === "voice") {
            await handleVoiceConversationTurn(base64Audio, mr.mimeType || "audio/webm", "");
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecordingTarget(target);
      toast.info("Microfone gravando... Clique em Parar quando terminar de falar.");
    } catch {
      // Fallback simulation if browser blocks mic in iframe preview
      toast.info("Simulando captura de áudio inteligente no ambiente de pré-visualização...");
      if (target === "transcribe") {
        await handleTranscribeAudio("", "audio/webm");
      } else if (target === "chat") {
        setChatInput(
          `Quais são os 3 argumentos mais fortes para fechar a otimização do Google Meu Negócio com ${biz.name}?`
        );
      } else if (target === "voice") {
        await handleVoiceConversationTurn("", "audio/webm", "");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecordingTarget(null);
  };

  // ---------------- 1. CHAT HANDLER ----------------
  const handleSendChat = async (customText) => {
    const textToSend = String(customText ?? chatInput).trim();
    if (!textToSend) return;

    const nextHistory = [...messages, { role: "user", text: textToSend }];
    setMessages(nextHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data } = await api.post("/ai/chat", {
        message: textToSend,
        history: messages.map((m) => ({ role: m.role, text: m.text })),
        role: chatRole,
        model: chatModel,
        useSearch: useSearchGrounding,
        useMaps: useMapsGrounding,
        businessContext: biz,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.reply || "Resposta processada.",
          source: data.source || chatModel,
          citations: data.citations || [],
        },
      ]);
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao consultar o assistente Gemini"));
    } finally {
      setChatLoading(false);
    }
  };

  const handleTranscribeIntoChat = async (audioBase64, mimeType) => {
    setTranscribing(true);
    try {
      const { data } = await api.post("/ai/transcribe", {
        audioBase64,
        mimeType,
        contextHint: "chat",
      });
      if (data.transcript) {
        setChatInput(data.transcript);
        toast.success("Fala transcrita com gemini-3.5-transcribe!");
      }
    } catch (e) {
      toast.error(fmtErr(e, "Falha ao transcrever áudio"));
    } finally {
      setTranscribing(false);
    }
  };

  // ---------------- 2. AUDIO TRANSCRIPTION HANDLER ----------------
  const handleTranscribeAudio = async (audioBase64, mimeType) => {
    setTranscribing(true);
    try {
      const { data } = await api.post("/ai/transcribe", {
        audioBase64,
        mimeType,
        contextHint: transcribeHint,
      });
      setTranscribedText(data.transcript || "");
      toast.success("Áudio transcrito gratuitamente via gemini-3.5-transcribe!");
    } catch (e) {
      toast.error(fmtErr(e, "Falha na transcrição de áudio"));
    } finally {
      setTranscribing(false);
    }
  };

  // ---------------- 3. LIVE VOICE CONVERSATION HANDLER ----------------
  const speakTextInBrowser = (text, audioDataUrl) => {
    if (audioDataUrl) {
      try {
        const audio = new Audio(audioDataUrl);
        audio.play().catch(() => {});
        return;
      } catch {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "pt-BR";
        utter.rate = 1.03;
        window.speechSynthesis.speak(utter);
      } catch {}
    }
  };

  const handleVoiceConversationTurn = async (audioBase64, mimeType, manualText) => {
    setVoiceLoading(true);
    try {
      const { data } = await api.post("/ai/voice-turn", {
        audioBase64,
        mimeType,
        textInput: manualText || voiceTextPrompt,
        businessContext: biz,
        mode: voiceMode,
      });

      const turn = {
        speaker: voiceMode === "simulacao-cliente" ? `Proprietário (${biz.name})` : "Consultor Voz G360",
        userTranscript: data.userTranscript,
        spokenReply: data.spokenReply,
        audioDataUrl: data.audioDataUrl,
        source: data.source || "gemini-3.8-live",
      };

      setVoiceTurns((prev) => [turn, ...prev]);
      setVoiceTextPrompt("");
      speakTextInBrowser(data.spokenReply, data.audioDataUrl);
      toast.success("Resposta de voz gerada!");
    } catch (e) {
      toast.error(fmtErr(e, "Falha na conversa por voz"));
    } finally {
      setVoiceLoading(false);
    }
  };

  // ---------------- 4. MAPS & SEARCH GROUNDING HANDLER ----------------
  const handleRunGrounding = async () => {
    setGroundingLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        api.post("/ai/maps-grounding", {
          query: groundingQuery,
          businessName: biz.name,
          city: biz.city,
          category: biz.category,
          lat: biz.lat,
          lng: biz.lng,
        }),
        api.post("/ai/search-grounding", {
          query: `Tendências de busca e palavras-chave locais para ${groundingQuery}`,
          businessName: biz.name,
          city: biz.city,
          category: biz.category,
        }),
      ]);
      setMapsResult(mRes.data);
      setSearchResult(sRes.data);
      toast.success("Dados do Google Maps e Google Search atualizados!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao consultar Maps e Search Grounding"));
    } finally {
      setGroundingLoading(false);
    }
  };

  // ---------------- 5. FREE IMAGE & VIDEO STUDIO HANDLERS ----------------
  const [selectedProfilePhotoUrl, setSelectedProfilePhotoUrl] = useState("");
  const [batchTransforming, setBatchTransforming] = useState(false);
  const [batchSlotsResult, setBatchSlotsResult] = useState(null);

  const handleUploadRefImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedBase64(String(reader.result || ""));
      setSelectedProfilePhotoUrl("");
      toast.success("Imagem base carregada para edição ou animação!");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEditImage = async () => {
    setImgLoading(true);
    try {
      const { data } = await api.post("/ai/image", {
        prompt: imgPrompt,
        aspectRatio: imgAspect,
        imageSize: imgSize,
        model: imgModel,
        base64Image: uploadedBase64 || undefined,
        sourceImageUrl: !uploadedBase64 && selectedProfilePhotoUrl ? selectedProfilePhotoUrl : undefined,
        businessName: biz.name,
        city: biz.city,
        category: biz.category,
      });
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        toast.success(`Fotografia gerada/transformada com sucesso via ${data.source || imgModel}!`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar imagem"));
    } finally {
      setImgLoading(false);
    }
  };

  const handleBatchTransformProfilePhotos = async () => {
    setBatchTransforming(true);
    try {
      const { data } = await api.post("/ai/transform-profile-photos", {
        business: biz,
        maxPhotos: 4,
        imageSize: imgSize || "1K",
      });
      if (data?.ok) {
        setBatchSlotsResult(data);
        if (data.slotImages?.hero) {
          setGeneratedImageUrl(data.slotImages.hero);
        }
        toast.success(
          `${data.transformedCount || 4} fotos do perfil coletadas e transformadas para os slots do site via ${data.modelUsed || "gemini-nano-banana-2.1"}!`
        );
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao transformar fotos do perfil"));
    } finally {
      setBatchTransforming(false);
    }
  };

  const handleQuickTestModel = async (modelItem) => {
    setTestingModelId(modelItem.id);
    const t0 = Date.now();
    try {
      if (modelItem.type === "image") {
        const { data } = await api.post("/ai/image", {
          prompt: `Fotografia comercial realista de demonstração para ${biz.name} em ${biz.city}`,
          aspectRatio: "1:1",
          imageSize: "1K",
          model: modelItem.modelName || "gemini-nano-banana-2.1",
          businessName: biz.name,
          city: biz.city,
        });
        const latency = Date.now() - t0;
        setTestedModelsResults((prev) => ({
          ...prev,
          [modelItem.id]: { ok: true, latency, output: "Imagem gerada com sucesso", sampleUrl: data.imageUrl },
        }));
        toast.success(`${modelItem.name}: Testado com sucesso em ${latency}ms!`);
      } else if (modelItem.type === "maps") {
        const { data } = await api.post("/ai/maps-grounding", {
          query: `${biz.name} ${biz.city}`,
          businessName: biz.name,
          city: biz.city,
        });
        const latency = Date.now() - t0;
        setTestedModelsResults((prev) => ({
          ...prev,
          [modelItem.id]: { ok: true, latency, output: `Encontrados ${data.places?.length || 0} locais no Maps` },
        }));
        toast.success(`${modelItem.name}: Testado com sucesso em ${latency}ms!`);
      } else if (modelItem.type === "search") {
        const { data } = await api.post("/ai/search-grounding", {
          query: `Pesquisas sobre ${biz.category} em ${biz.city}`,
          businessName: biz.name,
          city: biz.city,
        });
        const latency = Date.now() - t0;
        setTestedModelsResults((prev) => ({
          ...prev,
          [modelItem.id]: { ok: true, latency, output: `Extraídas ${data.sources?.length || 0} fontes do Google Search` },
        }));
        toast.success(`${modelItem.name}: Testado com sucesso em ${latency}ms!`);
      } else {
        const { data } = await api.post("/ai/chat", {
          message: `Teste rápido de conexão com ${modelItem.name}`,
          model: modelItem.modelName || "gemini-3.8-flash",
          role: "estrategista",
          businessContext: biz,
        });
        const latency = Date.now() - t0;
        setTestedModelsResults((prev) => ({
          ...prev,
          [modelItem.id]: { ok: true, latency, output: String(data.reply || "").slice(0, 100) + "..." },
        }));
        toast.success(`${modelItem.name}: Conectado com sucesso em ${latency}ms!`);
      }
    } catch (e) {
      const latency = Date.now() - t0;
      setTestedModelsResults((prev) => ({
        ...prev,
        [modelItem.id]: { ok: false, latency, output: fmtErr(e, "Falha na conexão") },
      }));
      toast.error(`Erro ao testar ${modelItem.name}`);
    } finally {
      setTestingModelId("");
    }
  };

  const renderAnimatedCanvasVideo = (meta, baseImgSrc) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = vidAspect === "9:16" ? 540 : 960;
    const h = vidAspect === "9:16" ? 960 : 540;
    canvas.width = w;
    canvas.height = h;

    const bgImg = new Image();
    const imgToLoad = baseImgSrc || generatedImageUrl || "";
    if (imgToLoad) bgImg.src = imgToLoad;

    let frame = 0;
    const totalFrames = 120; // ~4 seconds at 30fps

    let recorder = null;
    const videoChunks = [];
    try {
      const stream = canvas.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) videoChunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(videoChunks, { type: "video/webm" });
        setRecordedVideoUrl(URL.createObjectURL(blob));
      };
      recorder.start();
    } catch {}

    const drawFrame = () => {
      const progress = frame / totalFrames;
      ctx.clearRect(0, 0, w, h);

      // Google Official Gradient Background with subtle zoom
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(0.55, "#1A73E8");
      grad.addColorStop(1, "#0D47A1");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (bgImg.complete && bgImg.naturalWidth > 0) {
        const scale = 1 + progress * 0.08;
        const sw = w * scale;
        const sh = h * scale;
        ctx.save();
        ctx.globalAlpha = 0.38;
        ctx.drawImage(bgImg, (w - sw) / 2, (h - sh) / 2, sw, sh);
        ctx.restore();
      }

      // Animated Google Glow Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 20, 140 + Math.sin(progress * Math.PI * 2) * 18, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251, 188, 4, 0.35)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Badge
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      const badgeW = 260;
      ctx.fillRect(w / 2 - badgeW / 2, h / 2 - 110, badgeW, 34);
      ctx.fillStyle = "#FBBC04";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(meta.badge || "DESTAQUE GOOGLE").toUpperCase(), w / 2, h / 2 - 88);

      // Headline
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${vidAspect === "9:16" ? 30 : 38}px Inter, sans-serif`;
      ctx.fillText(String(meta.headline || biz.name).slice(0, 32), w / 2, h / 2 - 25);

      // Caption
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = `500 ${vidAspect === "9:16" ? 16 : 20}px Inter, sans-serif`;
      ctx.fillText(String(meta.caption || vidPrompt).slice(0, 58), w / 2, h / 2 + 22);

      // Bottom Google 4-color bar
      const barY = h - 12;
      const quarter = w / 4;
      ctx.fillStyle = "#4285F4";
      ctx.fillRect(0, barY, quarter, 12);
      ctx.fillStyle = "#EA4335";
      ctx.fillRect(quarter, barY, quarter, 12);
      ctx.fillStyle = "#FBBC04";
      ctx.fillRect(quarter * 2, barY, quarter, 12);
      ctx.fillStyle = "#34A853";
      ctx.fillRect(quarter * 3, barY, quarter, 12);

      frame++;
      if (frame <= totalFrames) {
        requestAnimationFrame(drawFrame);
      } else if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };

    drawFrame();
  };

  const handleGenerateOrAnimateVideo = async () => {
    setVidLoading(true);
    try {
      const { data } = await api.post("/ai/video", {
        prompt: vidPrompt,
        aspectRatio: vidAspect,
        base64Image: uploadedBase64 || generatedImageUrl || undefined,
        businessName: biz.name,
        city: biz.city,
      });
      setVideoMeta(data);
      if (data.videoUrl) {
        setRecordedVideoUrl(data.videoUrl);
      } else {
        setTimeout(() => {
          renderAnimatedCanvasVideo(data, uploadedBase64 || generatedImageUrl);
        }, 100);
      }
      toast.success("Vídeo gerado e animado gratuitamente!");
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar vídeo"));
    } finally {
      setVidLoading(false);
    }
  };

  const cardSurface = dark
    ? "bg-[#303134]/85 border-[#3C4043] text-[#E8EAED]"
    : "bg-white/90 border-[#DADCE0] text-[#202124]";
  const subSurface = dark
    ? "bg-[#202124]/90 border-[#3C4043] text-[#E8EAED]"
    : "bg-[#F8F9FA] border-[#DADCE0] text-[#202124]";
  const textMuted = dark ? "text-[#9AA0A6]" : "text-[#5F6368]";

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 space-y-6" data-testid="g360-free-ai-hub">
      {/* HEADER BANNER */}
      <div className={`rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-sm ${cardSurface}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1A73E8]/10 text-[#1A73E8] border border-[#1A73E8]/20">
              <Zap size={13} />
              <span>Suite 100% Gratuita Integrada — Padrao Oficial Google</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Central de Inteligencia Gratuita, Voz, Maps e Criacao Visual
            </h1>
            <p className={`text-xs sm:text-sm ${textMuted}`}>
              Todos os recursos gratuitos ativados para <strong>{biz.name}</strong> ({biz.city}): Chat Multi-Turno,
              Transcricao de Audio por Microfone, Conversa por Voz ao Vivo, Google Maps e Search Grounding, mais Estudio
              Gratuito de Imagens e Videos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all-ias", label: "Catálogo de Todas as IAs", icon: Cpu },
              { id: "media", label: "Imagens (Nano Banana 2.1)", icon: ImageIcon },
              { id: "grounding", label: "Maps & Search Grounding", icon: MapPin },
              { id: "chat", label: "Chatbot Gemini 3.8", icon: MessageSquare },
              { id: "transcribe", label: "Transcrever Áudio", icon: Mic },
              { id: "voice", label: "Conversa por Voz", icon: Radio },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`free-ai-tab-${t.id}`}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#1A73E8] text-white shadow-sm"
                      : dark
                      ? "bg-[#202124] text-[#9AA0A6] hover:text-white border border-[#3C4043]"
                      : "bg-[#F8F9FA] text-[#5F6368] hover:text-[#202124] border border-[#DADCE0]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB 1: MULTI-TURN GEMINI CHATBOT */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 rounded-2xl border p-5 space-y-5 ${cardSurface}`}>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1A73E8]">
                Configuracao do Consultor Gratuito
              </h2>
              <p className={`text-xs mt-1 ${textMuted}`}>
                Alterne entre os modelos gratuitos do Google e ative dados em tempo real do Maps e da Busca.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Especialidade do Consultor</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: "estrategista",
                    title: "Estrategista GBP Check & Geogrid",
                    desc: "Diagnostico de perfil, categorias e ranking 5x5",
                  },
                  {
                    id: "copywriter",
                    title: "Copywriter SEO Local",
                    desc: "Descricoes de 750 caracteres, servicos e posts",
                  },
                  {
                    id: "vendas",
                    title: "Fechador Comercial (Script 30s)",
                    desc: "Argumentos rapidos para fechar contrato na hora",
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setChatRole(r.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      chatRole === r.id
                        ? "border-[#1A73E8] bg-[#1A73E8]/10"
                        : dark
                        ? "border-[#3C4043] bg-[#202124]"
                        : "border-[#DADCE0] bg-[#F8F9FA]"
                    }`}
                  >
                    <div className="text-xs font-bold">{r.title}</div>
                    <div className={`text-[11px] mt-0.5 ${textMuted}`}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Modelo Gemini Gratuito</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChatModel("gemini-3.8-flash")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    chatModel === "gemini-3.8-flash"
                      ? "border-[#1A73E8] bg-[#1A73E8] text-white"
                      : subSurface
                  }`}
                >
                  gemini-3.8-flash (Completo)
                </button>
                <button
                  type="button"
                  onClick={() => setChatModel("gemini-3.1-flash-lite")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    chatModel === "gemini-3.1-flash-lite"
                      ? "border-[#1A73E8] bg-[#1A73E8] text-white"
                      : subSurface
                  }`}
                >
                  gemini-3.1-flash-lite (Ultra Rapido)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Fontes do Google em Tempo Real</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setUseMapsGrounding((v) => !v)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    useMapsGrounding ? "border-[#34A853] bg-[#34A853]/10 text-[#34A853]" : subSurface
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={14} /> Google Maps Grounding
                  </span>
                  <span>{useMapsGrounding ? "ATIVO" : "DESATIVADO"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseSearchGrounding((v) => !v)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    useSearchGrounding ? "border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]" : subSurface
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Search size={14} /> Google Search Grounding
                  </span>
                  <span>{useSearchGrounding ? "ATIVO" : "DESATIVADO"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#DADCE0]/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                Perguntas Rapidas para {biz.name}
              </div>
              {[
                `Crie um argumento de 30 segundos para vender a verificacao e otimizacao para ${biz.name}.`,
                `Quais sao as melhores palavras-chave locais para ${biz.category} em ${biz.city}?`,
                `Escreva uma resposta profissional para uma avaliacao de cliente em ${biz.name}.`,
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(q)}
                  className={`w-full text-left text-xs p-2.5 rounded-xl border hover:border-[#1A73E8] transition-colors cursor-pointer ${subSurface}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-8 rounded-2xl border flex flex-col h-[620px] ${cardSurface}`}>
            <div className="p-4 border-b border-[#DADCE0]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1A73E8] text-white grid place-items-center">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Consultor G360 Multi-Turno</div>
                  <div className={`text-[11px] ${textMuted}`}>
                    Modelo ativo: {chatModel} | Empresa: {biz.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      role: "model",
                      text: `Historico reiniciado. Pronto para analisar ${biz.name} em ${biz.city}.`,
                      source: chatModel,
                      citations: [],
                    },
                  ])
                }
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${subSurface}`}
              >
                <RefreshCw size={13} /> Limpar Conversa
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#1A73E8] text-white"
                        : dark
                        ? "bg-[#202124] border border-[#3C4043] text-[#E8EAED]"
                        : "bg-[#F8F9FA] border border-[#DADCE0] text-[#202124]"
                    }`}
                  >
                    {m.text}

                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#DADCE0]/30 flex flex-wrap gap-1.5">
                        {m.citations.map((c, cIdx) => (
                          <a
                            key={cIdx}
                            href={c.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#1A73E8]/15 text-[#1A73E8] hover:underline"
                          >
                            {c.type === "maps" ? <MapPin size={11} /> : <Search size={11} />}
                            <span>{c.title}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className={`text-[10px] ${textMuted}`}>
                      {m.role === "user" ? "Voce" : `Google ${m.source || chatModel}`}
                    </span>
                    {m.role === "model" && (
                      <button
                        type="button"
                        onClick={() => copyText(`chat-${idx}`, m.text)}
                        className="text-[10px] text-[#1A73E8] font-semibold hover:underline cursor-pointer"
                      >
                        {copiedKey === `chat-${idx}` ? "Copiado" : "Copiar"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className={`text-xs font-medium px-3 py-2 rounded-xl inline-block ${subSurface}`}>
                  Processando estrategia com {chatModel}...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#DADCE0]/40 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  recordingTarget === "chat" ? stopRecording() : startRecording("chat")
                }
                title="Ditar mensagem por voz (gemini-3.5-transcribe)"
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  recordingTarget === "chat"
                    ? "bg-[#EA4335] text-white border-[#EA4335] animate-pulse"
                    : subSurface
                }`}
              >
                {recordingTarget === "chat" ? <Square size={16} /> : <Mic size={16} />}
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendChat();
                }}
                placeholder="Digite sua pergunta ou clique no microfone para falar..."
                data-testid="free-ai-chat-input"
                className={`flex-1 px-4 py-3 rounded-xl border text-xs sm:text-sm outline-none focus:border-[#1A73E8] ${subSurface}`}
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                disabled={chatLoading}
                data-testid="free-ai-chat-send"
                className="px-5 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIO TRANSCRIPTION (gemini-3.5-transcribe) */}
      {activeTab === "transcribe" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 rounded-2xl border p-6 space-y-5 ${cardSurface}`}>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8]">
                Modelo Oficial: gemini-3.5-transcribe
              </span>
              <h2 className="text-lg font-bold">Transcricao de Audio Profissional</h2>
              <p className={`text-xs ${textMuted}`}>
                Ideal para gravar observacoes logo apos visitar um cliente na rua ou ditar os diferenciais da empresa
                para o Pacote GBP sem precisar digitar no celular.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Finalidade da Gravacao</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "crm", label: "Notas p/ CRM" },
                  { id: "gbp", label: "Briefing GBP" },
                  { id: "search", label: "Busca Rapida" },
                ].map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setTranscribeHint(h.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      transcribeHint === h.id
                        ? "border-[#1A73E8] bg-[#1A73E8] text-white"
                        : subSurface
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              {recordingTarget === "transcribe" ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  data-testid="stop-transcribe-btn"
                  className="w-full py-4 rounded-2xl bg-[#EA4335] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
                >
                  <Square size={18} />
                  <span>Parar Gravacao e Transcrever Agora</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRecording("transcribe")}
                  disabled={transcribing}
                  data-testid="start-transcribe-btn"
                  className="w-full py-4 rounded-2xl bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
                >
                  <Mic size={18} />
                  <span>
                    {transcribing
                      ? "Transcrevendo com gemini-3.5-transcribe..."
                      : "Iniciar Gravacao pelo Microfone"}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className={`lg:col-span-7 rounded-2xl border p-6 flex flex-col justify-between space-y-4 ${cardSurface}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Texto Transcrito</h3>
                <button
                  type="button"
                  onClick={() => copyText("transcribed", transcribedText)}
                  disabled={!transcribedText}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${subSurface}`}
                >
                  {copiedKey === "transcribed" ? <Check size={13} /> : <Copy size={13} />}
                  <span>Copiar Texto</span>
                </button>
              </div>
              <textarea
                rows={7}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder="O texto transcrito pelo modelo gratuito gemini-3.5-transcribe aparecera aqui..."
                data-testid="transcribed-textarea"
                className={`w-full p-4 rounded-xl border text-sm leading-relaxed outline-none focus:border-[#1A73E8] ${subSurface}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#DADCE0]/40">
              {onOpenGbpPackage && (
                <button
                  type="button"
                  onClick={() => onOpenGbpPackage(biz)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A73E8] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Layers size={14} />
                  <span>Usar no Pacote GBP</span>
                </button>
              )}
              {onOpenCrm && (
                <button
                  type="button"
                  onClick={onOpenCrm}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${subSurface}`}
                >
                  <Briefcase size={14} />
                  <span>Abrir Funil CRM</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE VOICE CONVERSATION */}
      {activeTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 rounded-2xl border p-6 space-y-5 ${cardSurface}`}>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#34A853]">
                Conversa por Voz e Sintese Neural Gratuita
              </span>
              <h2 className="text-lg font-bold">Treinador e Assistente de Voz G360</h2>
              <p className={`text-xs ${textMuted}`}>
                Converse por voz em tempo real para tirar duvidas estrategicas ou treinar sua abordagem comercial antes
                de entrar no estabelecimento do cliente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVoiceMode("consultor")}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  voiceMode === "consultor"
                    ? "border-[#1A73E8] bg-[#1A73E8]/10"
                    : subSurface
                }`}
              >
                <div className="text-xs font-bold">Modo Consultor G360</div>
                <div className={`text-[11px] mt-0.5 ${textMuted}`}>
                  Tire duvidas sobre o perfil de {biz.name}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVoiceMode("simulacao-cliente")}
                className={`p-3 rounded-xl border text-left cursor-pointer ${
                  voiceMode === "simulacao-cliente"
                    ? "border-[#1A73E8] bg-[#1A73E8]/10"
                    : subSurface
                }`}
              >
                <div className="text-xs font-bold">Simulador de Cliente</div>
                <div className={`text-[11px] mt-0.5 ${textMuted}`}>
                  Treine contornar objecoes por voz
                </div>
              </button>
            </div>

            <div className="space-y-2">
              {recordingTarget === "voice" ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-full py-4 rounded-2xl bg-[#EA4335] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Square size={18} />
                  <span>Parar Fala e Ouvir Resposta</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRecording("voice")}
                  disabled={voiceLoading}
                  data-testid="voice-talk-btn"
                  className="w-full py-4 rounded-2xl bg-[#34A853] hover:bg-[#2D9249] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic size={18} />
                  <span>
                    {voiceLoading ? "Sintetizando resposta..." : "Falar pelo Microfone Agora"}
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#DADCE0]/40">
              <label className="text-xs font-semibold block">
                Ou envie uma fala rapida para ouvir em voz alta:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceTextPrompt}
                  onChange={(e) => setVoiceTextPrompt(e.target.value)}
                  placeholder="Ex: Como explicar ao cliente que o perfil nao verificado perde vendas?"
                  className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none ${subSurface}`}
                />
                <button
                  type="button"
                  onClick={() => handleVoiceConversationTurn("", "audio/webm", voiceTextPrompt)}
                  disabled={voiceLoading}
                  className="px-4 py-2.5 rounded-xl bg-[#1A73E8] text-white text-xs font-semibold cursor-pointer"
                >
                  Ouvir
                </button>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-7 rounded-2xl border p-6 space-y-4 ${cardSurface}`}>
            <h3 className="text-sm font-bold">Historico de Turnos de Voz</h3>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {voiceTurns.map((t, i) => (
                <div key={i} className={`p-4 rounded-xl border space-y-2 ${subSurface}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A73E8]">{t.speaker}</span>
                    <button
                      type="button"
                      onClick={() => speakTextInBrowser(t.spokenReply, t.audioDataUrl)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1A73E8]/10 text-[#1A73E8] text-[11px] font-semibold cursor-pointer"
                    >
                      <Volume2 size={13} /> Repetir Audio
                    </button>
                  </div>
                  <div className={`text-xs italic ${textMuted}`}>Voce disse: "{t.userTranscript}"</div>
                  <div className="text-xs sm:text-sm font-medium leading-relaxed">{t.spokenReply}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE MAPS & GOOGLE SEARCH GROUNDING */}
      {activeTab === "grounding" && (
        <div className="space-y-6">
          <div className={`rounded-2xl border p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${cardSurface}`}>
            <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#DADCE0]/60">
              <Search size={16} className="text-[#1A73E8]" />
              <input
                type="text"
                value={groundingQuery}
                onChange={(e) => setGroundingQuery(e.target.value)}
                placeholder="Ex: Sorveteria em Campo Grande MS"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleRunGrounding}
              disabled={groundingLoading}
              data-testid="run-grounding-btn"
              className="px-6 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <MapPin size={15} />
              <span>
                {groundingLoading
                  ? "Consultando Google Maps e Search..."
                  : "Consultar Dados Oficiais Maps + Search"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-2xl border p-6 space-y-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#34A853]" />
                  <h3 className="text-base font-bold">Google Maps Grounding</h3>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#34A853]/15 text-[#34A853]">
                  Gratuito (gemini-3.8-flash)
                </span>
              </div>

              {mapsResult ? (
                <div className="space-y-4">
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {mapsResult.text}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                      Links Verificados no Google Maps
                    </div>
                    {(mapsResult.places || []).map((pl, idx) => (
                      <a
                        key={idx}
                        href={pl.uri}
                        target="_blank"
                        rel="noreferrer"
                        className={`block p-3 rounded-xl border hover:border-[#1A73E8] transition-colors ${subSurface}`}
                      >
                        <div className="text-xs font-bold text-[#1A73E8] flex items-center justify-between">
                          <span>{pl.title}</span>
                          <ExternalLink size={13} />
                        </div>
                        {pl.snippets?.[0] && (
                          <div className={`text-[11px] mt-1 ${textMuted}`}>{pl.snippets[0]}</div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${textMuted}`}>
                  Clique em "Consultar Dados Oficiais Maps + Search" acima para extrair inteligencia geografica e links
                  diretos do Google Maps para {biz.name}.
                </p>
              )}
            </div>

            <div className={`rounded-2xl border p-6 space-y-4 ${cardSurface}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-[#1A73E8]" />
                  <h3 className="text-base font-bold">Google Search Grounding</h3>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#1A73E8]/15 text-[#1A73E8]">
                  Gratuito (gemini-3.8-flash)
                </span>
              </div>

              {searchResult ? (
                <div className="space-y-4">
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {searchResult.text}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                      Fontes da Pesquisa Google
                    </div>
                    {(searchResult.sources || []).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center justify-between p-3 rounded-xl border hover:border-[#1A73E8] transition-colors text-xs font-semibold text-[#1A73E8] ${subSurface}`}
                      >
                        <span>{src.title}</span>
                        <ExternalLink size={13} />
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${textMuted}`}>
                  Extraia os termos mais pesquisados pelos clientes na regiao de {biz.city} e meta tags SEO prontas para
                  o Site Express.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FREE IMAGE & VIDEO STUDIO */}
      {activeTab === "media" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Generator & Editor */}
          <div className={`rounded-2xl border p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#1A73E8]" />
                <h3 className="text-base font-bold">Criador e Editor de Imagens (Direção Prompt Mestre)</h3>
              </div>
              <button
                type="button"
                data-testid="free-ai-copy-master-prompt-btn"
                onClick={() => {
                  const md = buildMasterImagePromptMarkdown(biz);
                  copyText("master-img-md", md);
                }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#1A73E8]/15 text-[#1A73E8] hover:bg-[#1A73E8] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy size={12} />
                <span>{copiedKey === "master-img-md" ? "Prompt Mestre Copiado!" : "Copiar Prompt Mestre"}</span>
              </button>
            </div>

            {/* Quick Slot Selector from Master Image Planning Table */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block">
                Carregar Direção Oficial por Slot do Site Express ({biz.name})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {buildSiteImagePlanningTable(biz)
                  .slice(0, 6)
                  .map((slot) => (
                    <button
                      key={slot.filename}
                      type="button"
                      onClick={() => {
                        setImgPrompt(slot.individualPrompt);
                        setImgAspect(slot.aspectRatio);
                        toast.info(`Direção carregada: ${slot.filename} (${slot.aspectRatio})`);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold hover:border-[#1A73E8] cursor-pointer ${subSurface}`}
                    >
                      {slot.filename} ({slot.aspectRatio})
                    </button>
                  ))}
              </div>
            </div>

            {/* Coletor de Fotos Reais do Perfil Google -> Transformação Nano Banana 2.1 */}
            <div className={`p-3.5 rounded-xl border space-y-2.5 ${subSurface}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold block text-[#1A73E8]">
                    Coletar Fotos Reais da Ficha Google & Transformar para o Site (Nano Banana 2.1)
                  </span>
                  <span className={`text-[11px] ${textMuted}`}>
                    Clique em uma foto do perfil para usá-la como referência ou transforme todas de uma vez para os 4 slots do site.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleBatchTransformProfilePhotos}
                  disabled={batchTransforming}
                  data-testid="free-ai-batch-transform-profile-photos-btn"
                  className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles size={13} className={batchTransforming ? "animate-spin" : ""} />
                  <span>
                    {batchTransforming
                      ? "Transformando 4 Slots..."
                      : "Coletar & Transformar 4 Slots do Site"}
                  </span>
                </button>
              </div>

              {Array.isArray(biz.photos) && biz.photos.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {biz.photos.slice(0, 6).map((photoUrl, idx) => {
                    const isSelected = selectedProfilePhotoUrl === photoUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedProfilePhotoUrl(isSelected ? "" : photoUrl);
                          setUploadedBase64("");
                          if (!isSelected) {
                            toast.info(`Foto #${idx + 1} da ficha selecionada para transformar com Nano Banana 2.1`);
                          }
                        }}
                        className={`relative flex-none w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected ? "border-[#1A73E8] ring-2 ring-[#1A73E8]/30" : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        title={`Usar foto #${idx + 1} do perfil como base no Nano Banana 2.1`}
                      >
                        <img src={photoUrl} alt={`Foto ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}

              {batchSlotsResult?.slotsReport?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {batchSlotsResult.slotsReport.map((slotItem) => (
                    <button
                      key={slotItem.slot}
                      type="button"
                      onClick={() => setGeneratedImageUrl(slotItem.transformedUrl)}
                      className="text-left p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 transition-all cursor-pointer"
                    >
                      <img
                        src={slotItem.transformedUrl}
                        alt={slotItem.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-14 object-cover rounded mb-1"
                      />
                      <span className="block text-[10px] font-bold truncate">{slotItem.label}</span>
                      <span className="block text-[9.5px] text-emerald-600 font-mono">{slotItem.aspectRatio} · {slotItem.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model & Size Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-[#1A73E8]/30 bg-[#1A73E8]/5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block text-[#1A73E8] mb-1">
                  Modelo de Imagem
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImgModel("gemini-nano-banana-2.1")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      imgModel === "gemini-nano-banana-2.1"
                        ? "bg-[#1A73E8] text-white border-[#1A73E8]"
                        : subSurface
                    }`}
                  >
                    gemini-nano-banana-2.1 (Alta Definição)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgModel("gemini-3.1-flash-lite-image")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      imgModel === "gemini-3.1-flash-lite-image"
                        ? "bg-[#1A73E8] text-white border-[#1A73E8]"
                        : subSurface
                    }`}
                  >
                    flash-lite
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider block text-[#1A73E8] mb-1">
                  Resolução (Nano Banana 2.1)
                </label>
                <div className="flex gap-2">
                  {["1K", "2K"].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setImgSize(sz)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        imgSize === sz ? "bg-[#1A73E8] text-white border-[#1A73E8]" : subSurface
                      }`}
                    >
                      {sz} {sz === "1K" ? "(1080p)" : "(2160p Ultra)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt presets for local businesses */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold block text-slate-500">Ideias Rápidas de Fotografia:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Fachada comercial convidativa com iluminação natural suave",
                  "Vitrine de produtos organizada em espaço moderno e acolhedor",
                  "Equipe atenciosa prestando atendimento de excelência",
                  "Ambiente interno limpo, sofisticado e iluminado com luz solar",
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setImgPrompt(preset)}
                    className="text-[10.5px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#1A73E8] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold block">
                  {uploadedBase64
                    ? "Instrução de Edição da Imagem (Texto + Foto com gemini-nano-banana-2.1)"
                    : "Comando Visual da Fotografia Comercial (Sem Textos Sobrepostos)"}
                </label>
                {uploadedBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedBase64("");
                      toast.info("Foto de referência removida. Modo criação do zero ativo.");
                    }}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Remover Foto (Criar do Zero)
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder={
                  uploadedBase64
                    ? "Ex: Aprimore as cores e iluminação desta foto mantendo a fidelidade real da empresa..."
                    : "Descreva a cena desejada em detalhes..."
                }
                className={`w-full p-3 rounded-xl border text-xs outline-none focus:border-[#1A73E8] ${subSurface}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {["16:9", "1:1", "4:3", "3:4", "9:16"].map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setImgAspect(ar)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      imgAspect === ar ? "bg-[#1A73E8] text-white border-[#1A73E8]" : subSurface
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>

              <label className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${subSurface}`}>
                <Upload size={13} />
                <span>{uploadedBase64 ? "Foto Carregada p/ Edição" : "Subir Foto p/ Editar"}</span>
                <input type="file" accept="image/*" onChange={handleUploadRefImage} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerateOrEditImage}
              disabled={imgLoading}
              data-testid="generate-free-image-btn"
              className="w-full py-3.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Sparkles size={16} />
              <span>
                {imgLoading
                  ? "Processando com gemini-nano-banana-2.1..."
                  : uploadedBase64
                  ? "Editar Foto com gemini-nano-banana-2.1"
                  : "Criar Imagem com gemini-nano-banana-2.1"}
              </span>
            </button>

            {generatedImageUrl && (
              <div className="space-y-2 pt-2">
                <img
                  src={generatedImageUrl}
                  alt="Arte gerada"
                  className="w-full max-h-64 object-cover rounded-xl border border-[#DADCE0]"
                />
                <a
                  href={generatedImageUrl}
                  download={`g360-arte-${biz.name.toLowerCase().replace(/\s+/g, "-")}.svg`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
                >
                  <Download size={13} /> Baixar Imagem para Google Meu Negocio
                </a>
              </div>
            )}
          </div>

          {/* Video Generator & Image Animator */}
          <div className={`rounded-2xl border p-6 space-y-4 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-[#34A853]" />
                <h3 className="text-base font-bold">Gerador de Video e Animacao de Imagens</h3>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#34A853]/15 text-[#34A853]">
                Texto ou Foto p/ Video
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold block">Roteiro / Movimento do Video</label>
              <textarea
                rows={3}
                value={vidPrompt}
                onChange={(e) => setVidPrompt(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none focus:border-[#1A73E8] ${subSurface}`}
              />
            </div>

            <div className="flex items-center gap-2">
              {["16:9", "9:16"].map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setVidAspect(ar)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    vidAspect === ar ? "bg-[#1A73E8] text-white border-[#1A73E8]" : subSurface
                  }`}
                >
                  Formato {ar}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerateOrAnimateVideo}
              disabled={vidLoading}
              data-testid="generate-free-video-btn"
              className="w-full py-3 rounded-xl bg-[#34A853] hover:bg-[#2D9249] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              {vidLoading
                ? "Renderizando Video..."
                : uploadedBase64 || generatedImageUrl
                ? "Animar Imagem em Video Promocional"
                : "Gerar Video a partir do Texto"}
            </button>

            <div className="space-y-2 pt-2">
              <canvas
                ref={canvasRef}
                className={`w-full rounded-xl border border-[#DADCE0] ${videoMeta ? "block" : "hidden"}`}
              />
              {recordedVideoUrl && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-[#34A853]">
                    Video pronto para publicacao!
                  </span>
                  <a
                    href={recordedVideoUrl}
                    download={`g360-video-${biz.name.toLowerCase().replace(/\s+/g, "-")}.webm`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] hover:underline"
                  >
                    <Download size={13} /> Baixar Video (.webm)
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: CATÁLOGO DE TODAS AS IAS GRATUITAS */}
      {activeTab === "all-ias" && (
        <div className="space-y-6">
          <div className={`rounded-2xl border p-5 sm:p-6 ${cardSurface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#1A73E8]" />
                  <h2 className="text-base sm:text-lg font-bold">Catálogo de Todas as Inteligências Artificiais Gratuitas</h2>
                </div>
                <p className={`text-xs sm:text-sm mt-1 ${textMuted}`}>
                  Todas as IAs abaixo estão conectadas, operam a custo zero e podem ser testadas com 1 clique para a empresa <strong>{biz.name}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> 11 Motores de IA Ativos
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {
                id: "gemini-3.8-flash",
                name: "Google Gemini 3.8 Flash",
                modelName: "gemini-3.8-flash",
                badge: "Google Nativo",
                category: "Texto & Raciocínio",
                desc: "Modelo principal para auditoria GBP, copy persuasiva de SEO local, títulos, descrições de serviços e argumentos comerciais.",
                actionTab: "chat",
                type: "chat",
              },
              {
                id: "maps-grounding",
                name: "Google Maps Grounding",
                modelName: "gemini-3.8-flash",
                badge: "Google Maps Tool",
                category: "Inteligência Geográfica",
                desc: "Conecta o Gemini aos dados geográficos reais do Google Maps, extraindo rotas, avaliações de clientes e links oficiais de localização.",
                actionTab: "grounding",
                type: "maps",
              },
              {
                id: "search-grounding",
                name: "Google Search Grounding",
                modelName: "gemini-3.8-flash",
                badge: "Google Search Tool",
                category: "Tendências Web em Tempo Real",
                desc: "Pesquisa na Web ao vivo pelo Google para descobrir termos mais buscados na cidade, meta tags e diferenciais de concorrentes.",
                actionTab: "grounding",
                type: "search",
              },
              {
                id: "gemini-nano-banana-2.1",
                name: "Gemini Nano Banana 2.1",
                modelName: "gemini-nano-banana-2.1",
                badge: "Alta Definição (1K/2K)",
                category: "Criação & Edição de Imagens",
                desc: "Geração e edição de fotografias comerciais realistas a partir de comandos de texto e fotos de referência, sem marcas d'água.",
                actionTab: "media",
                type: "image",
              },
              {
                id: "gemini-3.1-flash-lite",
                name: "Gemini 3.1 Flash-Lite",
                modelName: "gemini-3.1-flash-lite",
                badge: "Ultra Rápido (ms)",
                category: "Síntese Instantânea",
                desc: "Resumos imediatos, extração semântica rápida de formulários e classificação instantânea de intenção de busca.",
                actionTab: "chat",
                type: "chat",
              },
              {
                id: "gemini-3.5-transcribe",
                name: "Gemini 3.5 Transcribe",
                modelName: "gemini-3.5-transcribe",
                badge: "Áudio & Reuniões",
                category: "Transcrição de Voz",
                desc: "Converte gravações de áudio do microfone ou arquivos em texto estruturado para briefings de clientes e notas de CRM.",
                actionTab: "transcribe",
                type: "transcribe",
              },
              {
                id: "gemini-3.8-live",
                name: "Gemini 3.8 Live & Voz",
                modelName: "gemini-3.8-live",
                badge: "Conversação em Tempo Real",
                category: "Canal de Voz & Simulação",
                desc: "Conversação falada por voz para treinar argumentações de fechamento de contrato e simular objeções de clientes.",
                actionTab: "voice",
                type: "voice",
              },
              {
                id: "groq-llama",
                name: "Groq Llama 3.3 70B",
                modelName: "llama-3.3-70b-versatile",
                badge: "500+ Tokens/s",
                category: "Velocidade Extrema Free",
                desc: "Processamento ultra veloz a custo zero via Groq Cloud, excelente para geração de dezenas de variações de posts e serviços.",
                actionTab: "chat",
                type: "chat",
              },
              {
                id: "nvidia-deepseek",
                name: "NVIDIA NIM DeepSeek R1",
                modelName: "deepseek-ai/deepseek-r1",
                badge: "Raciocínio R1 Free",
                category: "Cálculo & Lógica Comercial",
                desc: "Modelo com cadeia de pensamento explícita para precificação de pacotes, metas financeiras e funis de vendas complexos.",
                actionTab: "chat",
                type: "chat",
              },
              {
                id: "openrouter-free",
                name: "OpenRouter Free Tier",
                modelName: "meta-llama/llama-3.3-70b-instruct:free",
                badge: "Open Source Free",
                category: "Diversidade de Modelos",
                desc: "Acesso a modelos de ponta gratuitos da comunidade (Llama 3.3, Qwen 2.5, DeepSeek) com fallback automático.",
                actionTab: "chat",
                type: "chat",
              },
              {
                id: "pollinations-flux",
                name: "Pollinations Flux Realista",
                modelName: "flux",
                badge: "100% Livre & Gratuito",
                category: "Fotografia Comercial",
                desc: "Renderização fotográfica realista de ambientes comerciais, produtos e fachadas sob medida com estilo editorial.",
                actionTab: "media",
                type: "image",
              },
            ].map((item) => {
              const testResult = testedModelsResults[item.id];
              const isTesting = testingModelId === item.id;
              return (
                <div key={item.id} className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${cardSurface}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1A73E8]">
                        {item.category}
                      </span>
                      <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#202124] dark:text-white flex items-center gap-1.5">
                      <Cpu size={14} className="text-[#1A73E8]" />
                      {item.name}
                    </h3>

                    <p className={`text-xs leading-relaxed ${textMuted}`}>{item.desc}</p>
                  </div>

                  {testResult && (
                    <div className={`p-2.5 rounded-xl text-xs space-y-1 ${
                      testResult.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-700 border border-rose-500/30"
                    }`}>
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>{testResult.ok ? "Online & Respondendo" : "Erro no Teste"}</span>
                        <span>{testResult.latency}ms</span>
                      </div>
                      <p className="text-[11px] truncate opacity-85">{testResult.output}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-[#DADCE0]/40">
                    <button
                      type="button"
                      onClick={() => handleQuickTestModel(item)}
                      disabled={isTesting}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Activity size={12} className={isTesting ? "animate-spin" : ""} />
                      <span>{isTesting ? "Testando..." : "Testar Agora"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(item.actionTab)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold hover:border-[#1A73E8] cursor-pointer ${subSurface}`}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
