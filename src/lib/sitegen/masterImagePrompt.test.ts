import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCompanyImageDataJson,
  buildSiteImagePlanningTable,
  buildMasterImagePromptMarkdown,
  mapUploadedFilenameToSlot,
} from "./masterImagePrompt";

const sampleProject = {
  archetype: "servicos",
  paletteId: "editorial-stone",
  logo: { url: "https://example.com/logo.png" },
  video: { url: "" },
  sections: [
    { id: "hero", on: true },
    { id: "promo", on: true },
    { id: "video", on: false },
  ],
  promo: {
    title: "Lavagem Completa com Cera",
    oldPrice: "R$ 80,00",
    newPrice: "R$ 59,90",
    subtitle: "Válido nesta semana",
  },
  business: {
    name: "Lava-Jato do Saulo",
    city: "Anápolis",
    uf: "GO",
    category: "Estética Automotiva e Lava-Jato",
    bio: "Lavagem detalhada, higienização interna e polimento técnico em Anápolis.",
    photos: ["https://example.com/real-photo-1.jpg", "https://example.com/real-photo-2.jpg"],
    items: [
      {
        name: "Lavagem Detalhada Premium",
        description: "Limpeza externa com snow foam e cera de carnaúba.",
        price: "R$ 60,00",
      },
      {
        name: "Higienização Interna de Bancos",
        description: "Extração profunda de sujeira e odores.",
        price: "R$ 180,00",
      },
    ],
  },
};

test("buildCompanyImageDataJson auto-fills confirmed company fields without inventing items", () => {
  const json = buildCompanyImageDataJson(sampleProject);
  assert.equal(json.empresa, "Lava-Jato do Saulo");
  assert.equal(json.cidade, "Anápolis - GO");
  assert.equal(json.atividade, "Estética Automotiva e Lava-Jato");
  assert.equal(json.modelo, "SERVIÇOS PROFISSIONAIS");
  assert.equal(json.logoEnviada, true);
  assert.equal(json.servicos.length, 2);
  assert.equal(json.produtos.length, 0);
  assert.equal(json.servicos[0].nome, "Lavagem Detalhada Premium");
  assert.equal(json.arquivosDeReferencia.length, 2);
  assert.ok(json.promocao);
  assert.equal(json.promocao?.titulo, "Lavagem Completa com Cera");
});

test("buildSiteImagePlanningTable generates desktop/mobile hero, about, items, and gallery slots", () => {
  const table = buildSiteImagePlanningTable(sampleProject);
  // 4 core (capa-desktop, capa-mobile, sobre-desktop, sobre-mobile) + 2 items + 4 gallery = 10 rows
  assert.equal(table.length, 10);
  assert.equal(table[0].filename, "capa-desktop.webp");
  assert.equal(table[0].aspectRatio, "16:9");
  assert.equal(table[0].siteField, "images.hero");

  assert.equal(table[1].filename, "capa-mobile.webp");
  assert.equal(table[1].aspectRatio, "1:1");
  assert.equal(table[1].siteField, "images.hero_mobile");

  assert.equal(table[2].filename, "sobre-desktop.webp");
  assert.equal(table[2].aspectRatio, "4:3");
  assert.equal(table[2].siteField, "images.about");

  assert.equal(table[3].filename, "sobre-mobile.webp");
  assert.equal(table[3].aspectRatio, "3:4");
  assert.equal(table[3].siteField, "images.about_mobile");

  assert.equal(table[4].filename, "item-01-lavagem-detalhada-premium.webp");
  assert.equal(table[4].aspectRatio, "1:1");
  assert.equal(table[4].slotKey, "item_0");

  assert.equal(table[6].filename, "galeria-01.webp");
  assert.equal(table[6].aspectRatio, "4:3");
  assert.equal(table[6].slotKey, "gallery_0");
});

test("mapUploadedFilenameToSlot maps standardized filenames to exact Site Express slots", () => {
  const items = sampleProject.business.items;
  assert.deepEqual(mapUploadedFilenameToSlot("capa-desktop.webp", items), {
    slotKey: "hero",
    label: "Capa Hero (Desktop)",
  });
  assert.deepEqual(mapUploadedFilenameToSlot("capa-mobile.webp", items), {
    slotKey: "hero_mobile",
    label: "Capa Hero (Mobile)",
  });
  assert.deepEqual(mapUploadedFilenameToSlot("sobre-desktop.webp", items), {
    slotKey: "about",
    label: "Sobre Nós (Desktop)",
  });
  assert.deepEqual(mapUploadedFilenameToSlot("sobre-mobile.webp", items), {
    slotKey: "about_mobile",
    label: "Sobre Nós (Mobile)",
  });
  assert.deepEqual(mapUploadedFilenameToSlot("item-02-higienizacao.webp", items), {
    slotKey: "item_1",
    itemIndex: 1,
    label: "Card: Higienização Interna de Bancos",
  });
  assert.deepEqual(mapUploadedFilenameToSlot("galeria-03.webp", items), {
    slotKey: "gallery_2",
    galleryIndex: 2,
    label: "Galeria #03",
  });
});

test("buildMasterImagePromptMarkdown outputs all 11 sections and embedded JSON", () => {
  const md = buildMasterImagePromptMarkdown(sampleProject);
  assert.ok(md.includes("# PROMPT MESTRE — GERAÇÃO DE IMAGENS PARA SITES"));
  assert.ok(md.includes("## 1. DADOS DA EMPRESA"));
  assert.ok(md.includes('"empresa": "Lava-Jato do Saulo"'));
  assert.ok(md.includes("## 4. TABELA DE PLANEJAMENTO DE IMAGENS DO SITE"));
  assert.ok(md.includes("`capa-desktop.webp`"));
  assert.ok(md.includes("`capa-mobile.webp`"));
  assert.ok(md.includes("`sobre-desktop.webp`"));
  assert.ok(md.includes("`sobre-mobile.webp`"));
  assert.ok(md.includes("## 11. ORDEM DE EXECUÇÃO"));
});
