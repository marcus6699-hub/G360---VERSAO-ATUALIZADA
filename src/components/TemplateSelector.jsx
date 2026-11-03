import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Eye,
  Rocket,
  Monitor,
  Smartphone,
  ArrowLeft,
  Layers,
  Palette,
  Type,
  X,
  BadgeCheck,
} from "lucide-react";
import { SITE_TEMPLATES, FONT_PAIRS } from "@/lib/sitegen/theme";
import { createProjectData } from "@/lib/sitegen/projectFactory";
import { generateSiteHtml } from "@/lib/sitegen/generateSiteHtml";

const FALLBACK_PREVIEW_BUSINESS = {
  name: "Ateliê da Val & Alfaiataria",
  category: "Ateliê de Costura & Reparos",
  segment: "servicos",
  recommended_template: "atelie-val",
  city: "Anápolis",
  uf: "GO",
  neighborhood: "Vila São Joaquim",
  address: "R. Vira Copos, Qd. 02 - Vila São Joaquim, Anápolis - GO",
  phone: "(62) 99494-6429",
  whatsapp: "5562994946429",
  rating: 5.0,
  rating_count: 19,
  open_now: true,
  hours_text: "08:00 – 18:00",
  hours: [
    "segunda-feira: 08:00 – 18:00",
    "terça-feira: 08:00 – 18:00",
    "quarta-feira: 08:00 – 18:00",
    "quinta-feira: 08:00 – 18:00",
    "sexta-feira: 08:00 – 18:00",
    "sábado: 08:00 – 12:00",
    "domingo: Fechado",
  ],
  bio: "Cuidado artesanal com cada peça: ajustes sob medida, barras originais, troca de zíper e reformas completas com acabamento impecável e pontualidade.",
  features: ["Acabamento de alto padrão", "Orçamento pelo WhatsApp", "Pagamento por Pix", "Cartão de crédito"],
  photos: [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
  ],
  items: [
    {
      name: "Ajustes de Roupas Sob Medida",
      description: "Ajustes finos em calças, camisas, vestidos e peças sociais para um caimento perfeito.",
      price: "Sob medida",
      category: "Ajustes",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      badge: "Mais procurado",
    },
    {
      name: "Barra Original e Invisível",
      description: "Barras feitas no comprimento exato respeitando o tecido e a linha original da peça.",
      price: "Entrega rápida",
      category: "Barras",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      badge: "Destaque",
    },
    {
      name: "Troca de Zíper e Consertos",
      description: "Substituição de zíper comum, invisível e reforçado em vestidos, calças jeans e jaquetas.",
      price: "Orçamento no WhatsApp",
      category: "Reparos",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      badge: "",
    },
    {
      name: "Reformas e Customização",
      description: "Costuras abertas, pences, botões, elásticos e reformas gerais com carinho artesanal.",
      price: "Peças do dia a dia",
      category: "Reformas",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      badge: "Acabamento fino",
    },
  ],
  reviews: [
    {
      author: "Jaciel Andrade",
      rating: 5,
      time: "recentemente",
      text: "Trabalho muito profissional! Qualidade de excelência em cada ajuste.",
    },
    {
      author: "Pedro Henrique",
      rating: 5,
      time: "recentemente",
      text: "Excelente profissional, recomendo de olhos fechados!",
    },
    {
      author: "Maria Clara",
      rating: 5,
      time: "1 semana atrás",
      text: "Atendimento atencioso e entrega super rápida.",
    },
  ],
  faqs: [
    {
      q: "Como solicitar orçamento pelo WhatsApp?",
      a: "Clique no botão de WhatsApp do site e envie uma mensagem contando o que você precisa.",
    },
    {
      q: "Quais formas de pagamento vocês aceitam?",
      a: "Aceitamos Pix, dinheiro e cartões de débito e crédito.",
    },
  ],
};

const FILTER_TABS = [
  { id: "all", label: `Todos os Modelos (${SITE_TEMPLATES.length})` },
  { id: "servicos", label: "Serviços, Barbearias & Clínicas" },
  { id: "gastronomia", label: "Gastronomia, Padarias & Delivery" },
  { id: "produtos", label: "Comércio, Moda & Pronta-Entrega" },
];

export default function TemplateSelector({ business, selectedTemplateId, onSelectTemplate, onBack }) {
  const activeBiz = business || FALLBACK_PREVIEW_BUSINESS;
  const recommendedId =
    selectedTemplateId ||
    activeBiz.recommended_template ||
    (activeBiz.segment === "gastronomia" ? "simprao" : activeBiz.segment === "servicos" ? "atelie-val" : "vitrine-express");

  const [chosenId, setChosenId] = useState(recommendedId);
  const [filter, setFilter] = useState("all");
  const [previewModalTpl, setPreviewModalTpl] = useState(null);
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const filteredTemplates = useMemo(() => {
    if (filter === "all") return SITE_TEMPLATES;
    return SITE_TEMPLATES.filter((t) => t.archetype === filter);
  }, [filter]);

  // Pre-build HTML for each template using the active business
  const htmlByTemplate = useMemo(() => {
    const map = {};
    for (const tpl of SITE_TEMPLATES) {
      const projData = createProjectData(activeBiz, tpl.archetype, tpl.id);
      map[tpl.id] = generateSiteHtml(projData, { editor: false });
    }
    return map;
  }, [activeBiz]);

  const handleConfirm = (tpl) => {
    onSelectTemplate(activeBiz, tpl.archetype, tpl.id);
  };

  return (
    <div className="flex-1 max-w-[1380px] w-full mx-auto px-5 py-8 sm:py-10" data-testid="template-selector-screen">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
        <div>
          {onBack && (
            <div className="mb-3">
              <button
                onClick={onBack}
                data-testid="template-back-button"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft size={14} /> Voltar para busca / ficha da empresa
              </button>
            </div>
          )}
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full mb-3">
            <Layers size={12} /> Biblioteca de Layouts Reais · Prévia ao Vivo
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Escolha o modelo ideal para{" "}
            <span className="underline decoration-amber-400 decoration-4 underline-offset-4">{activeBiz.name}</span>
          </h1>
          <p className="text-slate-500 text-[14.5px] mt-2 max-w-2xl">
            Cada modelo aplica automaticamente a estrutura visual, tipografia, paleta de cores e seções nas fotos e dados reais de{" "}
            <b className="text-slate-700">{activeBiz.name}</b>. Você poderá editar tudo no próximo passo.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-[#E4E4E7] self-start">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`template-filter-${t.id}`}
              onClick={() => setFilter(t.id)}
              className={`px-3.5 py-2 rounded-lg text-[12px] font-bold transition-all ${
                filter === t.id ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-7">
        {filteredTemplates.map((tpl) => {
          const isSelected = chosenId === tpl.id;
          const isRecommended = recommendedId === tpl.id;
          const fontObj = FONT_PAIRS.find((f) => f.id === tpl.fontId) || FONT_PAIRS[0];

          return (
            <motion.div
              key={tpl.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid={`template-card-${tpl.id}`}
              onClick={() => setChosenId(tpl.id)}
              className={`group bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer flex flex-col ${
                isSelected
                  ? "border-slate-900 ring-4 ring-slate-900/10 shadow-xl"
                  : "border-[#E4E4E7] hover:border-slate-400 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Scaled Live Site Iframe Preview */}
              <div className="relative h-[300px] sm:h-[340px] bg-slate-900 overflow-hidden border-b border-[#E4E4E7]">
                <div
                  className="origin-top-left pointer-events-none select-none"
                  style={{
                    width: "200%",
                    height: "680px",
                    transform: "scale(0.5)",
                  }}
                >
                  <iframe
                    title={`Prévia ${tpl.name}`}
                    srcDoc={htmlByTemplate[tpl.id]}
                    className="w-full h-full border-0 bg-white"
                    tabIndex={-1}
                  />
                </div>

                {/* Top Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-950/80 text-white backdrop-blur-md border border-white/15">
                    {tpl.badge}
                  </span>
                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-300 text-slate-950 shadow">
                      <Sparkles size={12} /> Recomendado para {activeBiz.category}
                    </span>
                  )}
                </div>

                {/* Hover Overlay with Full-Screen Interactive Preview Button */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                  <button
                    type="button"
                    data-testid={`template-preview-btn-${tpl.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewModalTpl(tpl);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-[13px] shadow-lg hover:scale-105 transition-transform"
                  >
                    <Eye size={15} /> Espiar Site Interativo
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirm(tpl);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-300 text-slate-950 font-extrabold text-[13px] shadow-lg hover:scale-105 transition-transform"
                  >
                    <Rocket size={15} /> Usar Modelo Agora
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {tpl.subtitle}
                      </span>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        {tpl.name}
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-amber-300 grid place-items-center">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </h2>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-full border border-[#E4E4E7]" title="Paleta do modelo">
                      <Palette size={12} className="text-slate-400 mr-1" />
                      {tpl.colors.map((c, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-black/15"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[13.5px] text-slate-600 leading-relaxed mt-2.5">{tpl.description}</p>

                  {/* Highlights */}
                  <ul className="mt-4 space-y-1.5">
                    {tpl.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12.5px] text-slate-600 font-medium">
                        <BadgeCheck size={14} className="text-emerald-600 flex-none" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Metadata + CTA */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-[11.5px] text-slate-500 font-semibold">
                    <Type size={13} className="text-slate-400" />
                    <span>{fontObj.name}</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewModalTpl(tpl);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] hover:bg-slate-50 text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Eye size={14} /> Ver Prévia
                    </button>
                    <button
                      type="button"
                      data-testid={`template-use-button-${tpl.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirm(tpl);
                      }}
                      className="btn-primary-dark !py-2.5 !px-4 !text-[12.5px] !rounded-xl"
                    >
                      <Rocket size={14} /> Usar este Modelo
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full-Screen Interactive Preview Modal */}
      {previewModalTpl && (
        <div
          data-lenis-prevent="true"
          data-testid="template-preview-modal"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex flex-col p-3 sm:p-6"
          onClick={() => setPreviewModalTpl(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl border border-[#E4E4E7] max-w-[1440px] w-full mx-auto"
          >
            {/* Modal Topbar */}
            <div className="px-5 py-3.5 border-b border-[#E4E4E7] flex items-center justify-between gap-4 flex-wrap bg-white">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 text-amber-300">
                  {previewModalTpl.badge}
                </span>
                <div>
                  <h3 className="text-[15px] font-extrabold text-slate-900">{previewModalTpl.name}</h3>
                  <p className="text-[11.5px] text-slate-500">Prévia ao vivo com os dados de {activeBiz.name}</p>
                </div>
              </div>

              <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                    previewDevice === "desktop" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Monitor size={14} /> Computador
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                    previewDevice === "mobile" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Smartphone size={14} /> Celular
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  data-testid="template-modal-confirm-button"
                  onClick={() => {
                    const tpl = previewModalTpl;
                    setPreviewModalTpl(null);
                    handleConfirm(tpl);
                  }}
                  className="btn-primary-dark !py-2.5 !px-5 !text-[13px] !rounded-xl"
                >
                  <Rocket size={15} /> Escolher este Modelo e Editar
                </button>
                <button
                  onClick={() => setPreviewModalTpl(null)}
                  aria-label="Fechar prévia"
                  className="w-9 h-9 rounded-full border border-[#E4E4E7] grid place-items-center text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Modal Iframe Body */}
            <div className="flex-1 bg-slate-200 overflow-auto flex justify-center p-0 sm:p-4" data-lenis-prevent="true">
              <div
                className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden ${
                  previewDevice === "mobile" ? "w-[390px] h-full rounded-3xl border-4 border-slate-900" : "w-full h-full rounded-xl"
                }`}
              >
                <iframe
                  title={`Prévia interativa ${previewModalTpl.name}`}
                  srcDoc={htmlByTemplate[previewModalTpl.id]}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
