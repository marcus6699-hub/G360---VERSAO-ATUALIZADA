import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  BadgeCheck,
  Phone,
  MapPin,
  Clock,
  Star,
  Sparkles,
  Loader2,
  Rocket,
  UtensilsCrossed,
  Stethoscope,
  ShoppingBag,
  Layers,
  Check,
} from "lucide-react";
import { API } from "@/lib/api";
import { PALETTES, SITE_TEMPLATES } from "@/lib/sitegen/theme";

const ARCHS = [
  { id: "gastronomia", name: "Gastronomia", desc: "Cardápio, fotos apetitosas e pedidos", icon: UtensilsCrossed },
  { id: "servicos", name: "Serviços & Autoridade", desc: "Ateliês, clínicas e agendamentos", icon: Stethoscope },
  { id: "produtos", name: "Produtos & Vitrine", desc: "Comércio local com foco em conversão", icon: ShoppingBag },
];

export default function GmbModal({ business, onClose, onConfirm, onOpenTemplates }) {
  const [b, setB] = useState(business);
  const initialArch = business.segment || "servicos";
  const initialTpl =
    business.recommended_template ||
    (initialArch === "gastronomia" ? "simprao" : initialArch === "servicos" ? "atelie-val" : "vitrine-express");
  const [arch, setArch] = useState(initialArch);
  const [templateId, setTemplateId] = useState(initialTpl);
  const [aiBusy, setAiBusy] = useState(false);
  const [transformingPhotos, setTransformingPhotos] = useState(false);
  const [transformedInfo, setTransformedInfo] = useState(null);
  const [cover, setCover] = useState(0);

  // Filtra automaticamente para exibir apenas avaliações de 4 e 5 estrelas
  const goodReviews = useMemo(
    () => (b.reviews || []).filter((r) => r.rating >= 4).sort((x, y) => y.rating - x.rating).slice(0, 10),
    [b.reviews]
  );

  const selectArch = (newArch) => {
    setArch(newArch);
    const matchingTpl = SITE_TEMPLATES.find((t) => t.archetype === newArch);
    if (matchingTpl) setTemplateId(matchingTpl.id);
  };

  const selectTemplate = (tpl) => {
    setTemplateId(tpl.id);
    setArch(tpl.archetype);
  };

  const selectCover = (index) => {
    setCover(index);
    setB((prev) => {
      const photos = [...(prev.photos || [])];
      if (!photos[index]) return prev;
      const chosen = photos[index];
      const reordered = [chosen, ...photos.filter((_, idx) => idx !== index)];
      return { ...prev, photos: reordered };
    });
    setCover(0);
  };

  const handleTransformProfilePhotos = async () => {
    setTransformingPhotos(true);
    try {
      const res = await fetch(`${API}/ai/transform-profile-photos`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: b, maxPhotos: 4, imageSize: "1K" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.detail || "Falha ao transformar fotos do perfil com Nano Banana 2.1");
      }
      setB((prev) => ({
        ...prev,
        photos: data.photos || prev.photos,
        nanoBananaSlotImages: data.slotImages || prev.nanoBananaSlotImages,
      }));
      setTransformedInfo({
        count: data.transformedCount || 4,
        modelUsed: data.modelUsed || "gemini-nano-banana-2.1",
        slotsReport: data.slotsReport || [],
      });
      setCover(0);
      toast.success(
        `${data.transformedCount || 4} fotos do perfil coletadas e transformadas para o site via ${data.modelUsed || "Nano Banana 2.1"}!`
      );
    } catch (e) {
      toast.error(e.message || "Falha ao transformar fotos com Nano Banana 2.1");
    } finally {
      setTransformingPhotos(false);
    }
  };

  const improveBio = async () => {
    const previousBio = b.bio;
    setAiBusy(true);
    try {
      const res = await fetch(`${API}/ai/improve-bio`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: b.bio, businessName: b.name, segment: arch, city: b.city, category: b.category }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.detail || "Falha na IA");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "",
        acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const payload = ln.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const j = JSON.parse(payload);
            if (j.error) throw new Error(j.error);
            if (j.delta) {
              acc += j.delta;
              setB((p) => ({ ...p, bio: acc }));
            }
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }
      if (!acc.trim()) {
        setB((p) => ({ ...p, bio: previousBio }));
      } else {
        toast.success("Bio aprimorada com IA!");
      }
    } catch (e) {
      toast.error(e.message || "IA indisponível");
      setB((p) => ({ ...p, bio: previousBio }));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
      onClick={onClose}
      data-testid="gmb-modal"
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-[760px] sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto studio-scroll shadow-2xl"
      >
        <div className="relative h-52 sm:h-60">
          <img
            src={b.photos?.[cover] || ""}
            alt={b.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            data-testid="gmb-cover-photo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            data-testid="gmb-close-button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 grid place-items-center hover:bg-white transition-colors"
          >
            <X size={17} />
          </button>
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-white bg-blue-600 rounded-full px-3 py-1 mb-2">
                <BadgeCheck size={12} /> Perfil verificado no Google
              </span>
              <h2 className="text-white text-2xl font-extrabold tracking-tight drop-shadow" data-testid="gmb-business-name">
                {b.name}
              </h2>
            </div>
            <span className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-[13px] font-extrabold text-slate-900 flex-none">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {String(b.rating ?? "5,0").replace(".", ",")}
              <span className="font-medium text-slate-400 text-[11.5px]">({b.rating_count || 0})</span>
            </span>
          </div>
        </div>

        <div className="flex gap-2 px-5 pt-4 overflow-x-auto studio-scroll" data-lenis-prevent="true">
          {(b.photos || []).slice(0, 6).map((p, i) => (
            <button
              key={i}
              data-testid={`gmb-thumb-${i}`}
              aria-label={`Selecionar foto de capa ${i + 1}`}
              onClick={() => selectCover(i)}
              className={`flex-none w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                cover === i ? "border-slate-900 ring-2 ring-slate-900/15" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={p} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="px-5 pt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleTransformProfilePhotos}
            disabled={transformingPhotos}
            data-testid="gmb-nano-banana-transform-btn"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white text-[12px] font-extrabold shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer transition-all"
          >
            {transformingPhotos ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>
              {transformingPhotos
                ? "Coletando fotos do perfil e transformando com Nano Banana 2.1..."
                : "Coletar Fotos do Perfil & Transformar para o Site (Nano Banana 2.1)"}
            </span>
          </button>
          {transformedInfo && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check size={12} />
              <span>
                {transformedInfo.count} slots remasterizados (Hero 16:9 · Sobre 4:3 · Vitrine 1:1 · Ambiente 16:9)
              </span>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3 text-[13.5px]">
            <div className="flex items-center gap-3 panel !rounded-xl px-4 py-3">
              <Phone size={16} className="text-slate-500" />
              <div>
                <div className="font-bold text-slate-900" data-testid="gmb-phone">
                  {b.phone || "Não informado"}
                </div>
                <div className="text-slate-500 text-[11.5px]">Telefone / WhatsApp</div>
              </div>
            </div>
            <div className="flex items-center gap-3 panel !rounded-xl px-4 py-3">
              <Clock size={16} className="text-slate-500" />
              <div>
                <div className={`font-bold ${b.open_now ? "text-emerald-600" : "text-amber-600"}`} data-testid="gmb-open-status">
                  {b.open_now ? "Aberto agora" : "Fechado no momento"}
                </div>
                <div className="text-slate-500 text-[11.5px]">{b.hours_text || "Consulte os horários"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 panel !rounded-xl px-4 py-3 sm:col-span-2">
              <MapPin size={16} className="text-slate-500 flex-none" />
              <div>
                <div className="font-bold text-slate-900" data-testid="gmb-address">
                  {b.address}
                </div>
                <div className="text-slate-500 text-[11.5px]">
                  {b.category}
                  {b.neighborhood ? ` · ${b.neighborhood}` : ""}
                </div>
              </div>
            </div>
          </div>

          {(b.features || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" data-testid="gmb-features">
              {b.features.slice(0, 10).map((f) => (
                <span key={f} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {f}
                </span>
              ))}
              {b.price_level && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  Faixa de preço {b.price_level}
                </span>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0" htmlFor="gmb-bio-textarea">
                Mini-bio / apresentação
              </label>
              <button
                onClick={improveBio}
                disabled={aiBusy}
                data-testid="ai-improve-bio-button"
                className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 bg-amber-300/80 hover:bg-amber-300 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-60"
              >
                {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Melhorar com IA
              </button>
            </div>
            <textarea
              id="gmb-bio-textarea"
              data-testid="gmb-bio-input"
              rows={3}
              value={b.bio}
              onChange={(e) => setB((p) => ({ ...p, bio: e.target.value }))}
              className="field resize-none !leading-relaxed"
              placeholder="Apresentação comercial da empresa"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="field-label !mb-0">
                Avaliações que entram no site <span className="text-emerald-600">(somente 4 e 5 estrelas)</span>
              </label>
              <span className="text-[11px] font-bold text-slate-400" data-testid="gmb-reviews-count">
                {goodReviews.length} aprovadas
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto studio-scroll pb-1" data-lenis-prevent="true">
              {goodReviews.map((r, i) => (
                <div key={i} data-testid={`gmb-review-${i}`} className="flex-none w-60 panel !rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-amber-300 text-[10px] font-extrabold grid place-items-center">
                      {r.author
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <b className="text-[12.5px] text-slate-900 truncate">{r.author}</b>
                  </div>
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: r.rating }).map((_, s) => (
                      <Star key={s} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed line-clamp-3">“{r.text}”</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">Avaliações com 3 estrelas ou menos são bloqueadas automaticamente.</p>
          </div>

          <div>
            <label className="field-label">Arquétipo visual do site</label>
            <div className="grid sm:grid-cols-3 gap-3">
              {ARCHS.map((a) => (
                <button
                  key={a.id}
                  data-testid={`archetype-select-${a.id}`}
                  onClick={() => selectArch(a.id)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    arch === a.id ? "border-slate-900 bg-slate-50" : "border-[#E4E4E7] hover:border-slate-300"
                  }`}
                >
                  <a.icon size={18} className="text-slate-900 mb-2" strokeWidth={1.75} />
                  <b className="block text-[13px] text-slate-900">{a.name}</b>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{a.desc}</span>
                  <span className="flex gap-1 mt-2.5">
                    {PALETTES[a.id].slice(0, 3).map((p) => (
                      <i key={p.id} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: p.vars.sec }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de Modelo de Layout (Template) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="field-label !mb-0 flex items-center gap-1.5">
                <Layers size={13} className="text-amber-600" /> Modelo de Layout (Template)
              </label>
              {onOpenTemplates && (
                <button
                  type="button"
                  data-testid="gmb-choose-template-button"
                  onClick={() => onOpenTemplates(b, templateId)}
                  className="text-[12px] font-extrabold text-amber-700 hover:text-amber-800 underline underline-offset-2"
                >
                  Ver prévias ao vivo em tela cheia →
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SITE_TEMPLATES.map((tpl) => {
                const active = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`gmb-template-${tpl.id}`}
                    onClick={() => selectTemplate(tpl)}
                    className={`text-left rounded-xl border-2 p-3.5 transition-all flex items-start justify-between gap-3 ${
                      active ? "border-slate-900 bg-amber-50/40" : "border-[#E4E4E7] hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <b className="text-[13px] text-slate-900 truncate">{tpl.name}</b>
                        {active && (
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-amber-300 grid place-items-center flex-none">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">{tpl.subtitle}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-none pt-1">
                      {tpl.colors.map((c, idx) => (
                        <i key={idx} className="w-3 h-3 rounded-full border border-black/15" style={{ background: c }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {onOpenTemplates && (
              <button
                type="button"
                onClick={() => onOpenTemplates(b, templateId)}
                className="sm:w-auto px-5 py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-extrabold text-[14px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Layers size={16} /> Comparar Modelos
              </button>
            )}
            <button
              onClick={() => onConfirm(b, arch, templateId)}
              data-testid="gmb-confirm-generate-button"
              className="btn-primary-dark flex-1 !py-4 !text-[15px] !rounded-xl"
            >
              <Rocket size={17} /> Confirmar e Gerar Site Oficial
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
