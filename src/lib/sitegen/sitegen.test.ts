import test from "node:test";
import assert from "node:assert/strict";
import { createProjectData, slugify } from "./projectFactory.js";
import { generateSiteHtml, defaultSections, ARCH_SECTIONS } from "./generateSiteHtml.js";
import { SITE_TEMPLATES } from "./theme.js";
import {
  ZYCRON_RAMOS,
  buildBusinessFromRamo,
  calculateZycronEarnings,
  buildWhatsappScripts,
  generateContractHtml,
} from "./zycronCatalog.js";

test("slugify normalizes accents and special characters", () => {
  assert.equal(slugify("Farmácia Anápolis - DrogaLu!"), "farmacia-anapolis-drogalu");
  assert.equal(slugify("Clínica Dr. Samuel"), "clinica-dr-samuel");
});

test("ARCH_SECTIONS and defaultSections keep all sections unlocked (fixed: false)", () => {
  for (const archKey of Object.keys(ARCH_SECTIONS)) {
    const archDefs = ARCH_SECTIONS[archKey as keyof typeof ARCH_SECTIONS];
    assert.ok(archDefs.length > 0, `Expected section definitions for archetype ${archKey}`);
    const heroDef = archDefs.find((s: { id: string; fixed: boolean }) => s.id === "hero");
    assert.ok(heroDef, `Expected hero section in ${archKey}`);
    assert.equal(heroDef.fixed, false, `Hero section in ${archKey} must be unlocked`);
    for (const s of archDefs) {
      assert.equal(s.fixed, false, `Section ${s.id} in ${archKey} must have fixed: false`);
    }
    const sections = defaultSections(archKey);
    assert.ok(sections.some((s: { id: string; on: boolean }) => s.id === "hero" && s.on === true));
  }
});

test("SITE_TEMPLATES includes all 7 layout designs (including Zycron templates) and createProjectData honors templateId", () => {
  const ids = SITE_TEMPLATES.map((t: { id: string }) => t.id);
  assert.deepEqual(ids, [
    "zycron-barbearia",
    "zycron-padaria",
    "zycron-moda",
    "simprao",
    "atelie-val",
    "modelo-premium",
    "vitrine-express",
  ]);

  const place = {
    place_id: "demo_atelie_val",
    name: "Ateliê da Val - Costureira e Reparos de Roupas",
    category: "Ateliê de Costura e Reparos",
    address: "Rua Barão do Rio Branco, 512 - Centro, Anápolis - GO",
    city: "Anápolis",
    uf: "GO",
    phone: "(62) 3321-8899",
    whatsapp: "5562994443322",
    rating: 5.0,
    rating_count: 112,
    bio: "Ajustes de alta precisão e reparos invisíveis.",
    photos: ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>"],
    hours: ["Seg a Sex: 08:30 às 18:00"],
    hours_text: "Seg a Sex das 08h30 às 18h",
    open_now: true,
    features: ["Barra Original", "Ajuste de Ternos"],
    items: [
      {
        name: "Ajuste & Conserto Sob Medida",
        description: "Barras originais e ajustes com acabamento invisível.",
        price: "Sob consulta",
        category: "Costura",
        badge: "Especialidade",
        image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
      },
    ],
    faqs: [{ q: "Faz barra de calça jeans?", a: "Sim, preservando a barra original." }],
    reviews: [{ author: "Fernanda", rating: 5, text: "Acabamento impecável!", time: "há 1 dia" }],
  };

  const atelieData = createProjectData(place, "servicos", "atelie-val");
  assert.equal(atelieData.templateId, "atelie-val");
  assert.equal(atelieData.paletteId, "atelie-terracota");
  const atelieHtml = generateSiteHtml(atelieData, { editor: true });
  assert.ok(atelieHtml.includes("tpl-atelie-val"), "Should render tpl-atelie-val body class");
  assert.ok(atelieHtml.includes('data-img="item_0"'), "Should include data-img attribute on item card photo");

  const premiumData = createProjectData(place, "servicos", "modelo-premium");
  assert.equal(premiumData.templateId, "modelo-premium");
  assert.equal(premiumData.paletteId, "emerald-executive");
  const premiumHtml = generateSiteHtml(premiumData, { editor: true });
  assert.ok(premiumHtml.includes("tpl-modelo-premium"), "Should render tpl-modelo-premium body class");
  assert.ok(premiumHtml.includes("DESTAQUE 01"), "Should render numbered DESTAQUE cards in modelo-premium");
});

test("Zycron templates render authentic Dom Bigode, Padaria da Marlene, and Lookbook layouts with floating dock", () => {
  assert.ok(ZYCRON_RAMOS.length >= 28, "Expected at least 28 business niches in ZYCRON_RAMOS");

  const barberBiz = buildBusinessFromRamo({
    nome: "Barbearia Dom Bigode",
    ramo: "Barbearia",
    cidade: "Campinas, SP",
  });
  assert.equal(barberBiz.recommended_template, "zycron-barbearia");
  const barberData = createProjectData(barberBiz, "servicos", "zycron-barbearia");
  const barberHtml = generateSiteHtml(barberData, { editor: false });
  assert.ok(barberHtml.includes("tpl-zycron-barbearia"), "Should render tpl-zycron-barbearia class");
  assert.ok(barberHtml.includes("zycron-dark-grid"), "Should render dark split services grid");
  assert.ok(barberHtml.includes("Por dentro"), "Should render Por dentro horizontal photo rail");
  assert.ok(barberHtml.includes("zycron-dock"), "Should render floating PilulaContato dock");

  const bakeryBiz = buildBusinessFromRamo({
    nome: "Padaria da Marlene",
    ramo: "Padaria e confeitaria",
    cidade: "Campinas, SP",
  });
  assert.equal(bakeryBiz.recommended_template, "zycron-padaria");
  const bakeryData = createProjectData(bakeryBiz, "gastronomia", "zycron-padaria");
  const bakeryHtml = generateSiteHtml(bakeryData, { editor: false });
  assert.ok(bakeryHtml.includes("tpl-zycron-padaria"), "Should render tpl-zycron-padaria class");
  assert.ok(bakeryHtml.includes("Perguntas que sempre chegam"), "Should render chat-bubble FAQ");

  const fashionBiz = buildBusinessFromRamo({
    nome: "Ateliê da Val",
    ramo: "Loja de roupas",
    cidade: "Campinas, SP",
  });
  const fashionData = createProjectData(fashionBiz, "produtos", "zycron-moda");
  const fashionHtml = generateSiteHtml(fashionData, { editor: false });
  assert.ok(fashionHtml.includes("tpl-zycron-moda"), "Should render tpl-zycron-moda class");
  assert.ok(fashionHtml.includes("zycron-lookbook-grid"), "Should render lookbook grid");
});

test("calculateZycronEarnings, buildWhatsappScripts, and generateContractHtml compute accurate sales math and copy", () => {
  const res = calculateZycronEarnings({
    sitePrice: 900,
    monthlyFee: 150,
    sitesPerMonth: 3,
  });
  assert.equal(res.totalSitesYear, 36);
  assert.equal(res.annualSales, 32400);
  // Sum of 1..12 * 3 * 150 = 78 * 450 = 35100
  assert.equal(res.annualRecurring, 35100);
  assert.equal(res.annualGross, 67500);
  assert.equal(res.month12.salesRevenue, 2700);
  assert.equal(res.month12.recurringRevenue, 5400);

  const scripts = buildWhatsappScripts({ name: "Padaria Pão Quente", city: "Campinas", category: "Padaria" }, "https://exemplo.com", 900, 150);
  assert.ok(scripts.length >= 5);
  assert.ok(scripts[0].reply.includes("Padaria Pão Quente"));

  const contract = generateContractHtml({
    providerName: "Agência Teste",
    clientName: "Padaria Pão Quente",
    clientCity: "Campinas",
    clientPhone: "11999999999",
    sitePrice: 900,
    monthlyFee: 150,
  });
  assert.ok(contract.includes("CONTRATO DE PRESTAÇÃO DE SERVIÇOS"));
  assert.ok(contract.includes("Padaria Pão Quente"));
});

test("createProjectData builds complete project data and generateSiteHtml produces standalone HTML with 4-5 star review filtering", () => {
  const place = {
    place_id: "demo_farmacia_anapolis",
    name: "Farmácia Anápolis - DrogaLu",
    category: "Farmácia e Drogaria",
    address: "Av. Brasil Norte, 1420 - Cidade Jardim, Anápolis - GO",
    city: "Anápolis",
    uf: "GO",
    phone: "(62) 3311-4455",
    whatsapp: "5562992345566",
    rating: 4.9,
    rating_count: 412,
    bio: "Bio persuasiva de teste",
    photos: ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>"],
    hours: ["Seg a Dom: 07:00 às 23:00"],
    hours_text: "Aberto todos os dias das 07h às 23h",
    open_now: true,
    features: ["Entrega Rápida", "Estacionamento"],
    items: [
      {
        name: "Kit Vitaminas",
        description: "Suplemento completo",
        price: "R$ 49,90",
        category: "Saúde",
        badge: "Mais pedido",
        image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
      },
    ],
    faqs: [{ q: "Faz entrega?", a: "Sim, em toda Anápolis." }],
    reviews: [
      { author: "Maria Clara", rating: 5, text: "Excelente atendimento!", time: "há 2 dias" },
      { author: "Cliente Insatisfeito", rating: 2, text: "Demorou na entrega", time: "há 1 mês" },
    ],
  };

  const data = createProjectData(place, "produtos");
  assert.equal(data.archetype, "produtos");
  assert.equal(data.business.name, "Farmácia Anápolis - DrogaLu");
  assert.equal(data.business.bio, "Bio persuasiva de teste");

  const html = generateSiteHtml(data, { editor: true });
  assert.ok(html.includes("<!DOCTYPE html>"), "Should generate full HTML document");
  assert.ok(html.includes("Farmácia Anápolis - DrogaLu"), "Should render business name");
  assert.ok(html.includes("Maria Clara"), "Should include 5-star review");
  assert.ok(!html.includes("Cliente Insatisfeito"), "Should filter out reviews below 4 stars");
  assert.ok(html.includes("application/ld+json"), "Should include Schema.org JSON-LD");
  assert.ok(html.includes("inspect-button"), "Should include inspect-button in editor mode");
});
