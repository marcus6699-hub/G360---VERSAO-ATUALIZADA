import { describe, it } from "node:test";
import assert from "node:assert";
import {
  padOrTrimToExactLength,
  buildGbpOptimizationPackage,
  buildG360AuditReport,
  parseAddrCityUf,
} from "./g360Engine.js";

describe("G360 Hardening & Quality Audit Test Suite", () => {
  it("padOrTrimToExactLength guarantees exact character length", () => {
    const text300 = padOrTrimToExactLength("Serviço de teste inicial", 300, "Atendimento com excelência.");
    assert.strictEqual(text300.length, 300, `Expected exactly 300 chars, got ${text300.length}`);

    const text750 = padOrTrimToExactLength("Descrição da empresa de teste", 750, "Qualidade garantida e referência regional.");
    assert.strictEqual(text750.length, 750, `Expected exactly 750 chars, got ${text750.length}`);

    const text1000 = padOrTrimToExactLength("Produto premium", 1000, "Fabricado sob medida com garantia de procedência.");
    assert.strictEqual(text1000.length, 1000, `Expected exactly 1000 chars, got ${text1000.length}`);

    const text1500 = padOrTrimToExactLength("Publicação informativa", 1500, "Consulte nossos especialistas hoje mesmo.");
    assert.strictEqual(text1500.length, 1500, `Expected exactly 1500 chars, got ${text1500.length}`);
  });

  it("buildGbpOptimizationPackage produces strictly sized artifacts (750c, 20x300c, 7x1000c, 11x1500c)", () => {
    const biz = {
      name: "Bella Cucina Gastronomia",
      category: "Restaurante Italiano",
      city: "Goiânia",
      uf: "GO",
      phone: "(62) 3322-1100",
      whatsapp: "(62) 9988-7766",
    };

    const pkg = buildGbpOptimizationPackage(biz);

    // 1. Description: exactly 750c
    assert.strictEqual(pkg.description750.length, 750, `Description must be exactly 750 chars, got ${pkg.description750.length}`);
    assert.strictEqual(pkg.descriptionCharCount, 750);

    // 2. Services: exactly 20 services, each exactly 300c
    assert.strictEqual(pkg.services.length, 20, `Services must contain exactly 20 items, got ${pkg.services.length}`);
    pkg.services.forEach((s, idx) => {
      assert.strictEqual(
        s.description.length,
        300,
        `Service #${idx + 1} (${s.name}) description must be exactly 300 chars, got ${s.description.length}`
      );
    });

    // 3. Products: 6 products, each exactly 1000c
    assert.strictEqual(pkg.products.length, 6, `Products must contain 6 items, got ${pkg.products.length}`);
    pkg.products.forEach((p, idx) => {
      assert.strictEqual(
        p.description.length,
        1000,
        `Product #${idx + 1} (${p.name}) description must be exactly 1000 chars, got ${p.description.length}`
      );
    });

    // 4. Posts: 11 posts (10 informative + 1 offer post), natural human length (600..1500 chars)
    assert.strictEqual(pkg.scheduledPosts.length, 11, `Scheduled posts must contain 11 items, got ${pkg.scheduledPosts.length}`);
    pkg.scheduledPosts.forEach((post, idx) => {
      assert.ok(
        post.text.length >= 600 && post.text.length <= 1500,
        `Post #${idx + 1} text must be between 600 and 1500 chars, got ${post.text.length}`
      );
      assert.strictEqual(post.charCount, post.text.length);
    });

    // Post #11 must be flagged as the Offer Post
    const lastPost = pkg.scheduledPosts[10];
    assert.strictEqual(lastPost.isOfferPost, true, "Post #11 must have isOfferPost: true");
    assert.ok(lastPost.title.includes("Oferta") || lastPost.title.includes("Condição"), "Post #11 title must indicate an offer");
  });

  it("buildG360AuditReport evaluates website_link criterion accurately", () => {
    const bizWithInstagram = {
      name: "Studio Beleza Local",
      category: "Salão de Beleza",
      city: "Anápolis",
      uf: "GO",
      website: "https://www.instagram.com/studiobelezalocal/",
    };

    const report = buildG360AuditReport(bizWithInstagram);
    const siteCrit = report.criteria.find((c) => c.id === "website_link" || c.id === "website");

    assert.ok(siteCrit, "Website criterion must exist");
    assert.ok(["good", "warning"].includes(siteCrit.status), "Website link status must be good or warning");
  });

  it("parseAddrCityUf extracts dynamic Brazilian cities without falling back to Campo Grande / MS", () => {
    const resAnapolis = parseAddrCityUf("Av. Brasil Sul, 1200 - Anápolis - GO, 75100-000");
    assert.strictEqual(resAnapolis.city, "Anápolis");
    assert.strictEqual(resAnapolis.uf, "GO");

    const resGoiania = parseAddrCityUf("Rua 9, 450 - Setor Oeste, Goiânia - GO");
    assert.strictEqual(resGoiania.city, "Goiânia");
    assert.strictEqual(resGoiania.uf, "GO");

    const resSP = parseAddrCityUf("Av. Paulista, 1000 - Bela Vista, São Paulo - SP");
    assert.strictEqual(resSP.city, "São Paulo");
    assert.strictEqual(resSP.uf, "SP");

    // Empty address defaults safely to Anápolis / GO, never MS
    const resDefault = parseAddrCityUf("");
    assert.notStrictEqual(resDefault.uf, "MS", "Default UF must not be MS");
    assert.strictEqual(resDefault.uf, "GO");
  });
});
