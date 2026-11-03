import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeDocumentId,
  buildUserProfilePayload,
  validateUserProfilePayload,
  buildLandingPagePayload,
  validateLandingPagePayload,
} from "./firestoreSchemas";

test("sanitizeDocumentId enforces regex and max length", () => {
  const id = sanitizeDocumentId("Farmácia Anápolis / DrogaLu #1!", 120);
  assert.match(id, /^[a-zA-Z0-9_\-]+$/);
  assert.ok(id.length >= 1 && id.length <= 120);
});

test("buildUserProfilePayload produces a valid UserProfileDocument", () => {
  const doc = buildUserProfilePayload(
    {
      name: "Marcus Henrique",
      email: "marcus6699@gmail.com",
      agencyName: "G360 Inteligência Local",
      phone: "(62) 99113-8004",
      plan: "g360_full",
    },
    "user_uid_123"
  );

  const validation = validateUserProfilePayload(doc, "user_uid_123");
  assert.equal(validation.valid, true, `Expected valid profile, got: ${validation.errors.join(", ")}`);
  assert.equal(doc.uid, "user_uid_123");
  assert.equal(doc.plan, "g360_full");
});

test("validateUserProfilePayload rejects shadow fields and UID spoofing", () => {
  const doc = buildUserProfilePayload(
    {
      name: "Marcus",
      email: "marcus6699@gmail.com",
    },
    "user_uid_123"
  );

  // Spoof check
  const spoofCheck = validateUserProfilePayload(doc, "another_user_999");
  assert.equal(spoofCheck.valid, false);

  // Shadow field check
  const withShadow = { ...doc, isAdmin: true };
  const shadowCheck = validateUserProfilePayload(withShadow, "user_uid_123");
  assert.equal(shadowCheck.valid, false);
});

test("buildLandingPagePayload normalizes project data and passes strict validation", () => {
  const sampleProject = {
    id: "proj_sorvetes_cg_01",
    slug: "sorvetes-campo-grande",
    name: "Sorvetes Campo Grande",
    archetype: "gastronomia",
    status: "published",
    data: {
      archetype: "gastronomia",
      templateId: "simprao",
      paletteId: "warm-amber",
      fontId: "modern-sans",
      sections: [{ id: "hero" }, { id: "menu" }, { id: "contact" }],
      business: {
        name: "Sorvetes Campo Grande",
        category: "Sorveteria Artesanal",
        city: "Anápolis - GO",
        phone: "(62) 99113-8004",
        whatsapp: "5562991138004",
      },
      texts: {
        "hero.headline": "O Melhor Sorvete Artesanal da Cidade",
        "hero.subheadline": "Mais de 40 sabores preparados diariamente com frutas frescas.",
        "hero.cta": "Pedir pelo WhatsApp",
      },
    },
  };

  const lpDoc = buildLandingPagePayload(sampleProject, "owner_uid_777");
  const check = validateLandingPagePayload(lpDoc, "owner_uid_777");
  assert.equal(check.valid, true, `Expected valid landing page, got: ${check.errors.join(", ")}`);
  assert.equal(lpDoc.id, "proj_sorvetes_cg_01");
  assert.equal(lpDoc.ownerUid, "owner_uid_777");
  assert.equal(lpDoc.archetype, "gastronomia");
  assert.deepEqual(lpDoc.sections, ["hero", "menu", "contact"]);
});

test("validateLandingPagePayload rejects invalid enums, oversized strings, and shadow fields", () => {
  const validDoc = buildLandingPagePayload(
    { id: "lp-1", name: "Clínica Dr. Samuel", archetype: "servicos" },
    "owner_uid_777"
  );

  const badEnum = { ...validDoc, status: "hacked_status" };
  assert.equal(validateLandingPagePayload(badEnum, "owner_uid_777").valid, false);

  const shadowKey = { ...validDoc, extraGhostField: "ghost" };
  assert.equal(validateLandingPagePayload(shadowKey, "owner_uid_777").valid, false);

  const oversizedName = { ...validDoc, name: "A".repeat(250) };
  assert.equal(validateLandingPagePayload(oversizedName, "owner_uid_777").valid, false);
});
