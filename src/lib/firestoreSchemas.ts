/**
 * Pure schema sanitization and validation helpers for Firestore persistence.
 * Synchronized verbatim with firebase-blueprint.json and firestore.rules.
 */

export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export const USER_PROFILE_PLANS = ["g360_full", "site_express_only"] as const;
export type UserProfilePlan = (typeof USER_PROFILE_PLANS)[number];

export const LANDING_PAGE_ARCHETYPES = ["produtos", "servicos", "gastronomia"] as const;
export type LandingPageArchetype = (typeof LANDING_PAGE_ARCHETYPES)[number];

export const LANDING_PAGE_STATUSES = ["draft", "published", "suspended"] as const;
export type LandingPageStatus = (typeof LANDING_PAGE_STATUSES)[number];

export interface UserProfileInput {
  uid?: string;
  name?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  agencyName?: string | null;
  phone?: string | null;
  plan?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UserProfileDocument {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  agencyName: string;
  phone: string;
  plan: UserProfilePlan;
  createdAt: string;
  updatedAt: string;
}

export interface LandingPageDocument {
  id: string;
  ownerUid: string;
  slug: string;
  name: string;
  businessName: string;
  category: string;
  city: string;
  phone: string;
  whatsapp: string;
  archetype: LandingPageArchetype;
  templateId: string;
  paletteId: string;
  fontId: string;
  status: LandingPageStatus;
  deployedUrl: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  sections: string[];
  siteData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function sanitizeDocumentId(rawId: unknown, maxLen = 120): string {
  const cleaned = String(rawId || "")
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
  return cleaned.length > 0 ? cleaned : `doc-${Date.now()}`;
}

export function sanitizeString(val: unknown, maxLen: number, fallback = ""): string {
  const str = typeof val === "string" ? val.trim() : val != null ? String(val).trim() : "";
  const resolved = str.length > 0 ? str : fallback;
  return resolved.slice(0, maxLen);
}

export function buildUserProfilePayload(
  input: UserProfileInput,
  authUid: string,
  existingCreatedAt?: string
): UserProfileDocument {
  const safeUid = sanitizeDocumentId(authUid || input.uid, 128);
  const nowIso = new Date().toISOString().slice(0, 60);
  const createdIso = sanitizeString(existingCreatedAt || input.createdAt, 60, nowIso);
  const updatedIso = sanitizeString(input.updatedAt, 60, nowIso);

  const rawPlan = String(input.plan || "g360_full");
  const plan: UserProfilePlan = (USER_PROFILE_PLANS as readonly string[]).includes(rawPlan)
    ? (rawPlan as UserProfilePlan)
    : "g360_full";

  const email = sanitizeString(input.email, 180, "usuario@g360studio.com.br");
  const defaultName = email.split("@")[0] || "Consultor G360";
  const name = sanitizeString(input.name, 120, defaultName);

  return {
    uid: safeUid,
    name: name.length >= 1 ? name : "Consultor G360",
    email: email.length >= 3 ? email : "usuario@g360studio.com.br",
    photoUrl: sanitizeString(input.photoUrl, 500, ""),
    agencyName: sanitizeString(input.agencyName, 160, "G360 Google Business Intelligence"),
    phone: sanitizeString(input.phone, 40, ""),
    plan,
    createdAt: createdIso,
    updatedAt: updatedIso,
  };
}

export function validateUserProfilePayload(
  data: unknown,
  expectedUid?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["Payload must be a non-null object"] };
  }

  const d = data as Record<string, unknown>;
  const allowedKeys = new Set([
    "uid",
    "name",
    "email",
    "photoUrl",
    "agencyName",
    "phone",
    "plan",
    "createdAt",
    "updatedAt",
  ]);
  const requiredKeys = ["uid", "name", "email", "plan", "createdAt", "updatedAt"];

  for (const req of requiredKeys) {
    if (!(req in d)) errors.push(`Missing required field: ${req}`);
  }
  for (const key of Object.keys(d)) {
    if (!allowedKeys.has(key)) errors.push(`Unexpected shadow field: ${key}`);
  }

  if (typeof d.uid !== "string" || d.uid.length < 1 || d.uid.length > 128 || !ID_REGEX.test(d.uid)) {
    errors.push("Invalid uid format or length");
  }
  if (expectedUid && d.uid !== expectedUid) {
    errors.push("uid does not match authenticated user UID");
  }
  if (typeof d.name !== "string" || d.name.length < 1 || d.name.length > 120) {
    errors.push("Invalid name length (1..120)");
  }
  if (typeof d.email !== "string" || d.email.length < 3 || d.email.length > 180 || !d.email.includes("@")) {
    errors.push("Invalid email format or length (3..180)");
  }
  if ("photoUrl" in d && (typeof d.photoUrl !== "string" || d.photoUrl.length > 500)) {
    errors.push("Invalid photoUrl length (<=500)");
  }
  if ("agencyName" in d && (typeof d.agencyName !== "string" || d.agencyName.length > 160)) {
    errors.push("Invalid agencyName length (<=160)");
  }
  if ("phone" in d && (typeof d.phone !== "string" || d.phone.length > 40)) {
    errors.push("Invalid phone length (<=40)");
  }
  if (typeof d.plan !== "string" || !(USER_PROFILE_PLANS as readonly string[]).includes(d.plan)) {
    errors.push("Invalid plan enum value");
  }
  if (typeof d.createdAt !== "string" || d.createdAt.length < 1 || d.createdAt.length > 60) {
    errors.push("Invalid createdAt timestamp string");
  }
  if (typeof d.updatedAt !== "string" || d.updatedAt.length < 1 || d.updatedAt.length > 60) {
    errors.push("Invalid updatedAt timestamp string");
  }

  return { valid: errors.length === 0, errors };
}

export function buildLandingPagePayload(
  project: any,
  authUid: string,
  existingCreatedAt?: string
): LandingPageDocument {
  const safeOwnerUid = sanitizeDocumentId(authUid, 128);
  const rawData = project?.data && typeof project.data === "object" ? project.data : {};
  const biz = rawData.business && typeof rawData.business === "object" ? rawData.business : {};
  const texts = rawData.texts && typeof rawData.texts === "object" ? rawData.texts : {};

  const businessName = sanitizeString(
    biz.name || project?.businessName || project?.name,
    200,
    "Empresa Local"
  );
  const name = sanitizeString(project?.name || businessName, 200, businessName);
  const slug = sanitizeDocumentId(project?.slug || project?.id || businessName.toLowerCase(), 120);
  const id = sanitizeDocumentId(project?.id || slug, 120);

  const rawArch = String(rawData.archetype || project?.archetype || "servicos");
  const archetype: LandingPageArchetype = (LANDING_PAGE_ARCHETYPES as readonly string[]).includes(rawArch)
    ? (rawArch as LandingPageArchetype)
    : "servicos";

  const rawStatus = String(project?.status || "published");
  const status: LandingPageStatus = (LANDING_PAGE_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as LandingPageStatus)
    : "published";

  const defaultTpl =
    archetype === "gastronomia" ? "simprao" : archetype === "servicos" ? "atelie-val" : "vitrine-express";
  const templateId = sanitizeString(rawData.templateId || project?.templateId, 80, defaultTpl);

  const rawSections = Array.isArray(rawData.sections)
    ? rawData.sections
    : Array.isArray(project?.sections)
    ? project.sections
    : ["hero", "services", "about", "testimonials", "faq", "contact"];
  const sections = rawSections
    .map((s: unknown) => sanitizeString(typeof s === "object" && s !== null && "id" in s ? (s as any).id : s, 60))
    .filter((s: string) => s.length > 0)
    .slice(0, 20);
  if (sections.length === 0) {
    sections.push("hero", "services", "contact");
  }

  const nowIso = new Date().toISOString().slice(0, 60);
  const createdAt = sanitizeString(existingCreatedAt || project?.createdAt || project?.created_at, 60, nowIso);
  const updatedAt = nowIso;

  // Keep siteData compact and structured as a native Firestore map (no JSON strings, bounded sizes)
  const siteData: Record<string, unknown> = {
    archetype,
    templateId,
    paletteId: sanitizeString(rawData.paletteId, 80, ""),
    fontId: sanitizeString(rawData.fontId, 80, ""),
    business: {
      name: businessName,
      category: sanitizeString(biz.category || project?.category, 120, "Negócio Local"),
      city: sanitizeString(biz.city || project?.city, 120, "Anápolis"),
      uf: sanitizeString(biz.uf, 10, "GO"),
      phone: sanitizeString(biz.phone || project?.phone, 60, ""),
      whatsapp: sanitizeString(biz.whatsapp || project?.whatsapp, 60, ""),
      address: sanitizeString(biz.address, 250, ""),
      bio: sanitizeString(biz.bio, 800, ""),
      rating: typeof biz.rating === "number" ? biz.rating : 4.9,
      reviews_count: typeof biz.reviews_count === "number" ? biz.reviews_count : 48,
    },
    texts: {
      headline: sanitizeString(texts["hero.headline"] || texts.headline || project?.headline, 300, businessName),
      subheadline: sanitizeString(
        texts["hero.subheadline"] || texts.subheadline || biz.bio || project?.subheadline,
        600,
        `Atendimento especializado em ${sanitizeString(biz.city || project?.city, 120, "sua região")}.`
      ),
      cta: sanitizeString(texts["hero.cta"] || texts.cta || project?.ctaText, 120, "Falar no WhatsApp"),
    },
  };

  return {
    id,
    ownerUid: safeOwnerUid,
    slug,
    name,
    businessName,
    category: sanitizeString(biz.category || project?.category, 120, "Negócio Local"),
    city: sanitizeString(biz.city || project?.city, 120, "Anápolis"),
    phone: sanitizeString(biz.phone || project?.phone, 60, ""),
    whatsapp: sanitizeString(biz.whatsapp || project?.whatsapp, 60, ""),
    archetype,
    templateId,
    paletteId: sanitizeString(rawData.paletteId || project?.paletteId, 80, ""),
    fontId: sanitizeString(rawData.fontId || project?.fontId, 80, ""),
    status,
    deployedUrl: sanitizeString(project?.deployedUrl || `/site/${slug}`, 500, `/site/${slug}`),
    headline: sanitizeString(texts["hero.headline"] || texts.headline || project?.headline, 300, businessName),
    subheadline: sanitizeString(
      texts["hero.subheadline"] || texts.subheadline || biz.bio || project?.subheadline,
      600,
      ""
    ),
    ctaText: sanitizeString(texts["hero.cta"] || texts.cta || project?.ctaText, 120, "Falar no WhatsApp"),
    sections,
    siteData,
    createdAt,
    updatedAt,
  };
}

export function validateLandingPagePayload(
  data: unknown,
  expectedOwnerUid?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["Payload must be a non-null object"] };
  }

  const d = data as Record<string, unknown>;
  const allowedKeys = new Set([
    "id",
    "ownerUid",
    "slug",
    "name",
    "businessName",
    "category",
    "city",
    "phone",
    "whatsapp",
    "archetype",
    "templateId",
    "paletteId",
    "fontId",
    "status",
    "deployedUrl",
    "headline",
    "subheadline",
    "ctaText",
    "sections",
    "siteData",
    "createdAt",
    "updatedAt",
  ]);
  const requiredKeys = [
    "id",
    "ownerUid",
    "slug",
    "name",
    "businessName",
    "category",
    "city",
    "archetype",
    "templateId",
    "status",
    "createdAt",
    "updatedAt",
  ];

  for (const req of requiredKeys) {
    if (!(req in d)) errors.push(`Missing required field: ${req}`);
  }
  for (const key of Object.keys(d)) {
    if (!allowedKeys.has(key)) errors.push(`Unexpected shadow field: ${key}`);
  }

  if (typeof d.id !== "string" || d.id.length < 1 || d.id.length > 120 || !ID_REGEX.test(d.id)) {
    errors.push("Invalid id format or length (1..120)");
  }
  if (
    typeof d.ownerUid !== "string" ||
    d.ownerUid.length < 1 ||
    d.ownerUid.length > 128 ||
    !ID_REGEX.test(d.ownerUid)
  ) {
    errors.push("Invalid ownerUid format or length (1..128)");
  }
  if (expectedOwnerUid && d.ownerUid !== expectedOwnerUid) {
    errors.push("ownerUid does not match authenticated user UID");
  }
  if (typeof d.slug !== "string" || d.slug.length < 1 || d.slug.length > 120 || !ID_REGEX.test(d.slug)) {
    errors.push("Invalid slug format or length (1..120)");
  }
  if (typeof d.name !== "string" || d.name.length < 1 || d.name.length > 200) {
    errors.push("Invalid name length (1..200)");
  }
  if (typeof d.businessName !== "string" || d.businessName.length < 1 || d.businessName.length > 200) {
    errors.push("Invalid businessName length (1..200)");
  }
  if (typeof d.category !== "string" || d.category.length < 1 || d.category.length > 120) {
    errors.push("Invalid category length (1..120)");
  }
  if (typeof d.city !== "string" || d.city.length < 1 || d.city.length > 120) {
    errors.push("Invalid city length (1..120)");
  }
  if ("phone" in d && (typeof d.phone !== "string" || d.phone.length > 60)) {
    errors.push("Invalid phone length (<=60)");
  }
  if ("whatsapp" in d && (typeof d.whatsapp !== "string" || d.whatsapp.length > 60)) {
    errors.push("Invalid whatsapp length (<=60)");
  }
  if (
    typeof d.archetype !== "string" ||
    !(LANDING_PAGE_ARCHETYPES as readonly string[]).includes(d.archetype)
  ) {
    errors.push("Invalid archetype enum value");
  }
  if (typeof d.templateId !== "string" || d.templateId.length < 1 || d.templateId.length > 80) {
    errors.push("Invalid templateId length (1..80)");
  }
  if ("paletteId" in d && (typeof d.paletteId !== "string" || d.paletteId.length > 80)) {
    errors.push("Invalid paletteId length (<=80)");
  }
  if ("fontId" in d && (typeof d.fontId !== "string" || d.fontId.length > 80)) {
    errors.push("Invalid fontId length (<=80)");
  }
  if (typeof d.status !== "string" || !(LANDING_PAGE_STATUSES as readonly string[]).includes(d.status)) {
    errors.push("Invalid status enum value");
  }
  if ("deployedUrl" in d && (typeof d.deployedUrl !== "string" || d.deployedUrl.length > 500)) {
    errors.push("Invalid deployedUrl length (<=500)");
  }
  if ("headline" in d && (typeof d.headline !== "string" || d.headline.length > 300)) {
    errors.push("Invalid headline length (<=300)");
  }
  if ("subheadline" in d && (typeof d.subheadline !== "string" || d.subheadline.length > 600)) {
    errors.push("Invalid subheadline length (<=600)");
  }
  if ("ctaText" in d && (typeof d.ctaText !== "string" || d.ctaText.length > 120)) {
    errors.push("Invalid ctaText length (<=120)");
  }
  if ("sections" in d) {
    if (
      !Array.isArray(d.sections) ||
      d.sections.length === 0 ||
      d.sections.length > 20 ||
      typeof d.sections[0] !== "string" ||
      d.sections[0].length > 60
    ) {
      errors.push("Invalid sections array (must be 1..20 strings)");
    }
  }
  if ("siteData" in d) {
    if (!d.siteData || typeof d.siteData !== "object" || Array.isArray(d.siteData)) {
      errors.push("Invalid siteData (must be a map/object)");
    }
  }
  if (typeof d.createdAt !== "string" || d.createdAt.length < 1 || d.createdAt.length > 60) {
    errors.push("Invalid createdAt timestamp string");
  }
  if (typeof d.updatedAt !== "string" || d.updatedAt.length < 1 || d.updatedAt.length > 60) {
    errors.push("Invalid updatedAt timestamp string");
  }

  return { valid: errors.length === 0, errors };
}
