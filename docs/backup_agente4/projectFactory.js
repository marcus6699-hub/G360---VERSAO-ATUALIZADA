// Fábrica do estado inicial de um projeto a partir da ficha da empresa + Motor Oficial PROMPT MESTRE de Imagens.
import { defaultSections } from "./generateSiteHtml";
import { PALETTES, DEFAULT_FONT, SITE_TEMPLATES } from "./theme";
import {
  buildMasterImagePlan,
  buildMasterCompanyInput,
  buildSiteImagePlanningTable,
} from "./masterImagePrompt";

export function createProjectData(business, archetype, templateId = "") {
  const tpl =
    SITE_TEMPLATES.find((t) => t.id === templateId) ||
    SITE_TEMPLATES.find((t) => t.id === business?.recommended_template) ||
    SITE_TEMPLATES.find((t) => t.archetype === archetype) ||
    SITE_TEMPLATES[0];

  const finalArch = archetype || tpl.archetype || "produtos";
  const finalTplId =
    templateId ||
    (tpl.archetype === finalArch
      ? tpl.id
      : finalArch === "gastronomia"
      ? "simprao"
      : finalArch === "servicos"
      ? "atelie-val"
      : "vitrine-express");
  const activeTpl = SITE_TEMPLATES.find((t) => t.id === finalTplId) || tpl;

  // Build the Master Prompt image slots (prioritizing real Google Places photos, falling back to realistic commercial photography without text overlays)
  const masterPlan = buildMasterImagePlan(business || {});
  const masterInput = buildMasterCompanyInput(business || {});

  const slotHero = masterPlan.find((s) => s.id === "hero")?.imageUrl || "";
  const slotSobre = masterPlan.find((s) => s.id === "sobre")?.imageUrl || slotHero;
  const slotDest1 = masterPlan.find((s) => s.id === "destaque_1")?.imageUrl || slotHero;
  const slotDest2 = masterPlan.find((s) => s.id === "destaque_2")?.imageUrl || slotSobre;
  const slotDest3 = masterPlan.find((s) => s.id === "destaque_3")?.imageUrl || slotHero;
  const slotAmb = masterPlan.find((s) => s.id === "ambiente")?.imageUrl || slotSobre;

  const rawPhotos = (Array.isArray(business?.photos) ? business.photos : []).filter(
    (p) => typeof p === "string" && !p.startsWith("data:image/svg+xml")
  );
  const enrichedPhotos =
    rawPhotos.length >= 4
      ? rawPhotos
      : [slotHero, slotSobre, slotDest1, slotDest2, slotDest3, slotAmb].filter(Boolean);

  const destaqueSlots = [slotDest1, slotDest2, slotDest3, slotAmb];
  const rawItems = (Array.isArray(business?.items) ? business.items : []).filter(
    (it) => it && !it.isPending && !String(it.name || "").includes("[PENDENTE]") && !String(it.description || "").includes("[PENDENTE]")
  );
  const enrichedItems = rawItems.map((it, idx) => {
    const hasRealImg =
      it?.image && typeof it.image === "string" && !it.image.startsWith("data:image/svg+xml");
    return {
      ...it,
      image: hasRealImg ? it.image : rawPhotos[idx + 1] || destaqueSlots[idx % destaqueSlots.length],
    };
  });

  const enrichedBusiness = {
    ...(business || {}),
    photos: enrichedPhotos,
    items: enrichedItems.length > 0 ? enrichedItems : business?.items || [],
  };

  const endsAt = new Date(Date.now() + 47 * 3600 * 1000 + 23 * 60 * 1000).toISOString();
  const baseProject = {
    business: enrichedBusiness,
    archetype: finalArch,
    templateId: activeTpl.id,
    paletteId: activeTpl.paletteId || (PALETTES[finalArch] || PALETTES.produtos)[0].id,
    fontId: activeTpl.fontId || DEFAULT_FONT[finalArch],
    texts: {},
    buttons: {},
    images: {
      hero: { url: slotHero, fit: "cover" },
      hero_mobile: { url: slotHero, fit: "cover" },
      about: { url: slotSobre, fit: "cover" },
      about_mobile: { url: slotSobre, fit: "cover" },
      ambient: { url: slotAmb, fit: "cover" },
      gallery_0: { url: enrichedPhotos[0] || slotHero, fit: "cover" },
      gallery_1: { url: enrichedPhotos[1] || slotSobre, fit: "cover" },
      gallery_2: { url: enrichedPhotos[2] || slotDest1, fit: "cover" },
      gallery_3: { url: enrichedPhotos[3] || slotAmb, fit: "cover" },
    },
    masterImagePlan: masterPlan,
    masterCompanyInput: masterInput,
    sections: defaultSections(finalArch),
    promo: {
      title:
        finalArch === "gastronomia"
          ? "Combo da Semana com 20% OFF"
          : finalArch === "servicos"
          ? "Condição especial para agendamento pelo WhatsApp"
          : "Oferta da Semana no WhatsApp",
      oldPrice: "R$ 59,90",
      newPrice: finalArch === "servicos" ? "Consulte" : "R$ 47,90",
      subtitle: "Só até acabar o cronômetro. Chame no WhatsApp e garanta.",
      endsAt,
    },
    video: { url: "" },
    marketing: {
      metaPixelId: "",
      gadsId: "",
      gadsLabel: "",
      gtmId: "",
      ga4Id: "",
      gsc: "",
      seoTitle: "",
      seoDesc: "",
    },
  };
  return {
    ...baseProject,
    masterPlanningTable: buildSiteImagePlanningTable(baseProject),
  };
}

export const slugify = (name) =>
  String(name || "meu-site")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "meu-site";
