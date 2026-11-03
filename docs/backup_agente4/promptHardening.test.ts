import test from "node:test";
import assert from "node:assert";
import { buildHardenedGbpPrompt, generateNeutralFallbackText, validateBusinessInputData, detectDataContradictions, BusinessInput } from "./promptHardening.ts";
import { compileCompleteGbpPackage, generateBrandIdentityProposal } from "./g360AiPipeline.ts";


test("Scenario 1: Complete Data", () => {
  const biz: BusinessInput = {
    name: "Restaurante Sabor da Terra",
    category: "Gastronomia",
    city: "Anápolis",
    uf: "GO",
    phone: "(62) 3322-1122",
    services: ["Almoço executivo", "Marmitex"],
  };
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("Restaurante Sabor da Terra"));
  assert.ok(prompt.includes("Almoço executivo"));
  const fallback = generateNeutralFallbackText(biz);
  assert.ok(fallback.includes("(62) 3322-1122"));
});

test("Scenario 2: Incomplete Data", () => {
  const biz: BusinessInput = {
    name: "Empresa Incompleta",
  };
  const val = validateBusinessInputData(biz);
  assert.equal(val.isValid, false);
  assert.ok(val.missingFields.includes("city"));
  assert.ok(val.missingFields.includes("phone/whatsapp"));
  const fallback = generateNeutralFallbackText(biz);
  assert.ok(fallback.includes("Empresa Incompleta"));
});

test("Scenario 3: Missing Phone", () => {
  const biz: BusinessInput = {
    name: "Loja Sem Telefone",
    category: "Varejo",
    city: "Anápolis",
    services: ["Venda de calçados"],
  };
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("Nenhum telefone informado"));
});

test("Scenario 4: Missing Services", () => {
  const biz: BusinessInput = {
    name: "Prestadora Genérica",
    category: "Serviços",
    city: "Anápolis",
    phone: "(62) 9999-8888",
  };
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("Nenhum serviço específico foi previamente cadastrado"));
});

test("Scenario 5: Missing Prices", () => {
  const biz: BusinessInput = {
    name: "Mercado Local",
    category: "Supermercado",
    city: "Anápolis",
    services: ["Mercearia"],
  };
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("NÃO invente características"));
});

test("Scenario 6: Missing Reviews", () => {
  const biz: BusinessInput = {
    name: "Consultoria Nova",
    category: "Negócios",
    city: "Anápolis",
    services: ["Planejamento"],
  };
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("NÃO invente características"));
});

test("Scenario 7: Contradictory Info", () => {
  const biz: BusinessInput = {
    name: "Auto Posto Rodovia",
    category: "Farmácia",
    city: "Anápolis",
    services: ["Combustível"],
  };
  const contradiction = detectDataContradictions(biz);
  assert.equal(contradiction.hasContradiction, true);
  const prompt = buildHardenedGbpPrompt(biz);
  assert.ok(prompt.includes("ALERTA DE CONTRADIÇÃO"));
  const fallback = generateNeutralFallbackText(biz);
  assert.ok(fallback.includes("dados cadastrais divergentes"));
});

test("Scenario 8: Insufficient Data", () => {
  const biz: BusinessInput = {
    name: "Fulano",
  };
  const val = validateBusinessInputData(biz);
  assert.equal(val.isValid, false);
  const fallback = generateNeutralFallbackText(biz);
  assert.ok(fallback.length > 10);
});

test("Scenario 9: Restaurant Segment GBP Package & Brand Identity", () => {
  const biz: BusinessInput = {
    name: "Cantina Bella Italia",
    category: "Restaurante Italiano",
    city: "Anápolis",
    uf: "GO",
    phone: "(62) 3311-4455",
    items: [
      { name: "Lasanha Bolonhesa Tradicional", description: "Massa artesanal com molho de tomate fresco", price: "R$ 48,00" },
      { name: "Pizzas no Forno a Lenha", description: "Mais de 20 sabores com borda recheada", price: "R$ 55,00" },
    ],
  };
  const identity = generateBrandIdentityProposal(biz);
  assert.equal(identity.colorPalettes[0].id, "warm-food");
  
  const pkg = compileCompleteGbpPackage(biz);
  assert.equal(pkg.products6.length, 6);
  assert.equal(pkg.products6[0].name, "Lasanha Bolonhesa Tradicional");
  assert.equal(pkg.products6[1].name, "Pizzas no Forno a Lenha");
  assert.equal(pkg.products6[2].isPending, true); // Flagged pending, no generic fillers!
  assert.equal(pkg.keywords20.length, 20);
  assert.equal(pkg.posts11.length, 11);
  assert.equal(pkg.imageSeoNames20.length, 20);
});

test("Scenario 10: Medical Clinic Segment GBP Package & Brand Identity", () => {
  const biz: BusinessInput = {
    name: "Clínica Saúde & Sorriso",
    category: "Odontologia & Saúde",
    city: "Goiânia",
    uf: "GO",
    phone: "(62) 3200-9000",
    services: ["Implantes Dentários", "Alinhadores Invisíveis", "Clareamento a Laser"],
  };
  const identity = generateBrandIdentityProposal(biz);
  assert.equal(identity.colorPalettes[0].id, "clinical-blue");

  const pkg = compileCompleteGbpPackage(biz);
  assert.equal(pkg.products6[0].name, "Implantes Dentários");
  assert.equal(pkg.products6[1].name, "Alinhadores Invisíveis");
  assert.equal(pkg.products6[2].name, "Clareamento a Laser");
  assert.equal(pkg.products6[3].isPending, true); // Flagged pending
});

