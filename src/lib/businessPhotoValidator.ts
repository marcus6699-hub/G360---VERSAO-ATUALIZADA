/**
 * Business Photo Validator, Canonical Deduplicator & Resolution Upgrader
 * Ensures only real, renderable photos belonging to the target business are used,
 * preventing broken crawler URLs (Instagram/Facebook 302 redirects), map tiles (Waze/Moovit),
 * duplicate resolution variants (=w800 vs =w1600), and competitor chain contamination (e.g. Drogasil).
 */

const COMPETITOR_CHAINS = [
  "drogasil",
  "droga raia",
  "drogaraia",
  "raia drogasil",
  "pague menos",
  "paguemenos",
  "drogaria sp",
  "drogaria sao paulo",
  "drogarias pacheco",
  "drogaria pacheco",
  "panvel",
  "drogaria araujo",
  "extrafarma",
  "ultrafarma",
  "farmacia sao joao",
  "drogaria nissei",
  "drogaria venancio",
  "drogaria rosario",
  "farmacia permanente",
  "drogaria indiana",
  "drogaria globo",
  "farmacia pague menos",
];

const GENERIC_BUSINESS_STOPWORDS = new Set([
  "farmacia",
  "farmacias",
  "drogaria",
  "drogarias",
  "clinica",
  "clinicas",
  "consultorio",
  "laboratorio",
  "hospital",
  "restaurante",
  "lanchonete",
  "pizzaria",
  "padaria",
  "confeitaria",
  "supermercado",
  "mercado",
  "mercearia",
  "empório",
  "emporio",
  "loja",
  "lojas",
  "comercio",
  "servicos",
  "servico",
  "distribuidora",
  "fornecedor",
  "oficina",
  "estetica",
  "salao",
  "barbearia",
  "centro",
  "norte",
  "sul",
  "leste",
  "oeste",
  "asa",
  "quadra",
  "bloco",
  "setor",
  "vila",
  "jardim",
  "parque",
  "avenida",
  "rua",
  "brasil",
  "brasilia",
  "anapolis",
  "goiania",
  "aparecida",
  "campo",
  "grande",
  "florianopolis",
  "sao",
  "paulo",
  "rio",
  "janeiro",
  "belo",
  "horizonte",
  "curitiba",
  "ltda",
  "me",
  "eireli",
  "popular",
  "horas",
  "24h",
  "delivery",
  "express",
]);

export function normalizeTextForMatch(str: string): string {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Upgrades Google Business Profile / Maps photo URLs to high-res JPEG (1200x900)
 * and converts video stream suffixes (=m18, =m22) into valid static JPEG URLs.
 */
export function upgradeGooglePhotoUrl(rawUrl: string): string {
  const url = String(rawUrl || "").trim();
  if (!url) return "";

  if (
    url.includes("googleusercontent.com/gps-cs-s/") ||
    url.includes("googleusercontent.com/gps-proxy/") ||
    url.includes("googleusercontent.com/grass-cs/") ||
    /googleusercontent\.com\/p\/AF1Qip/i.test(url)
  ) {
    const base = url.replace(/=([ws]\d+[^&?\s]*|m\d+[^&?\s]*)$/i, "");
    return `${base}=w1200-h900-k-no`;
  }

  return url;
}

/**
 * Detects URLs that fail in browser <img> tags (302 HTML redirects, map tiles, tiny 44px avatars, or video streams).
 */
export function isBrokenOrGarbagePhotoUrl(rawUrl: string): boolean {
  const u = String(rawUrl || "").trim();
  if (!u) return true;

  if (u.startsWith("data:image/svg+xml") && !u.includes("studioGrade")) {
    return true;
  }

  if (
    !u.startsWith("http://") &&
    !u.startsWith("https://") &&
    !u.startsWith("/api/places/photo") &&
    !u.startsWith("data:image/")
  ) {
    return true;
  }

  const lower = u.toLowerCase();

  // Social media HTML crawler redirect links (return HTTP 302 to text/html login pages, breaking <img>)
  if (
    lower.includes("lookaside.instagram.com") ||
    lower.includes("lookaside.fbsbx.com") ||
    lower.includes("instagram.com/p/") ||
    lower.includes("instagram.com/reel/") ||
    lower.includes("instagram.com/tv/") ||
    lower.includes("facebook.com/photo") ||
    lower.includes("facebook.com/permalink") ||
    lower.includes("tiktok.com/") ||
    lower.includes("media.licdn.com/")
  ) {
    return true;
  }

  // Navigation map tiles & vector icons (Waze, Moovit, OpenStreetMap tiles)
  if (
    lower.includes("waze.com/row-tiles") ||
    lower.includes("waze.com/tiles") ||
    lower.includes("appassets.mvtdev.com") ||
    lower.includes("mvtdev.com/map") ||
    lower.includes("maps.gstatic.com/mapfiles") ||
    lower.includes("maps.googleapis.com/maps/vt") ||
    lower.includes("tile.openstreetmap.org")
  ) {
    return true;
  }

  // Tiny 44x44 or 64x64 Google account profile avatars (/AAAAAAAAAAI/.../s44-p-k-no-ns-nd/photo.jpg)
  if (
    lower.includes("/aaaaaaaaaai/") ||
    /\/s(32|44|50|64)-p-k-no/i.test(lower)
  ) {
    return true;
  }

  return false;
}

/**
 * Computes a canonical deduplication key so identical photos with different size suffixes
 * (e.g., =w800-h500-k-no vs =w1600-h1000-k-no) are recognized as the exact same image.
 */
export function getCanonicalPhotoKey(rawUrl: string): string {
  const u = String(rawUrl || "").trim();
  if (!u) return "";

  if (u.includes("googleusercontent.com/")) {
    return u
      .replace(/^https?:\/\/lh\d*\.googleusercontent\.com\//i, "googleusercontent/")
      .replace(/=([ws]\d+[^&?\s]*|m\d+[^&?\s]*)$/i, "")
      .replace(/\?.*$/, "");
  }

  if (u.includes("images.unsplash.com/")) {
    return u.split("?")[0].toLowerCase();
  }

  return u.replace(/#.*$/, "");
}

/**
 * Checks whether a photo URL is an automated Street View capture rather than an uploaded business photo.
 */
export function isStreetViewCaptureUrl(rawUrl: string): boolean {
  const lower = String(rawUrl || "").toLowerCase();
  return (
    lower.includes("streetviewpixels-pa.googleapis.com") ||
    lower.includes("googleusercontent.com/grass-cs/")
  );
}

/**
 * Checks whether a photo URL is a genuine Google Business Profile gallery photo.
 */
export function isOfficialGbpGalleryPhoto(rawUrl: string): boolean {
  const lower = String(rawUrl || "").toLowerCase();
  return (
    lower.includes("googleusercontent.com/gps-cs-s/") ||
    lower.includes("googleusercontent.com/gps-proxy/") ||
    lower.includes("googleusercontent.com/p/") ||
    lower.startsWith("/api/places/photo")
  );
}

/**
 * Sanitizes, upgrades resolution, and deduplicates an array of business photo URLs.
 * If real GBP gallery photos exist, Street View road captures (which often show neighbor signs like Drogasil)
 * are automatically excluded so only authentic business photos remain.
 */
export function sanitizeAndDedupeBusinessPhotos(
  rawPhotos: unknown[],
  options: { dropStreetViewIfGalleryExists?: boolean; maxPhotos?: number } = {}
): string[] {
  const { dropStreetViewIfGalleryExists = true, maxPhotos = 12 } = options;
  if (!Array.isArray(rawPhotos)) return [];

  const validUpgraded: string[] = [];
  const seenKeys = new Set<string>();

  for (const item of rawPhotos) {
    const rawStr = typeof item === "string" ? item : (item as any)?.url || "";
    if (isBrokenOrGarbagePhotoUrl(rawStr)) continue;

    const upgraded = upgradeGooglePhotoUrl(rawStr);
    const key = getCanonicalPhotoKey(upgraded);
    if (!key || seenKeys.has(key)) continue;

    seenKeys.add(key);
    validUpgraded.push(upgraded);
  }

  // If we have genuine GBP gallery photos (gps-cs-s / gps-proxy / /p/), exclude streetview captures
  // that often show neighboring stores on the street block
  if (dropStreetViewIfGalleryExists) {
    const nonStreetView = validUpgraded.filter((u) => !isStreetViewCaptureUrl(u));
    if (nonStreetView.length >= 1) {
      return nonStreetView.slice(0, maxPhotos);
    }
  }

  return validUpgraded.slice(0, maxPhotos);
}

/**
 * Checks if a Serper Image search result is contaminated by a competitor chain or unrelated company.
 */
export function isCompetitorOrUnrelatedSerperImage(
  imgItem: { title?: string; source?: string; link?: string; imageUrl?: string },
  targetBusinessName: string
): boolean {
  const targetNorm = normalizeTextForMatch(targetBusinessName);
  const metaNorm = normalizeTextForMatch(
    `${imgItem?.title || ""} ${imgItem?.source || ""} ${imgItem?.link || ""} ${imgItem?.imageUrl || ""}`
  );

  // 1. Block known national competitor chains unless the target business IS that chain
  for (const chain of COMPETITOR_CHAINS) {
    if (metaNorm.includes(chain) && !targetNorm.includes(chain)) {
      return true;
    }
  }

  // 2. Require distinctive brand token match if the business has distinctive tokens
  const targetTokens = targetNorm
    .split(" ")
    .filter((w) => w.length >= 3 && !GENERIC_BUSINESS_STOPWORDS.has(w));

  if (targetTokens.length > 0) {
    const titleAndLinkNorm = normalizeTextForMatch(`${imgItem?.title || ""} ${imgItem?.link || ""}`);
    const hasBrandMatch = targetTokens.some((token) => titleAndLinkNorm.includes(token));
    if (!hasBrandMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts a safe, browser-renderable image URL from a Serper Image item.
 * If imageUrl is a social media page or broken crawler redirect, falls back to Google's gstatic thumbnailUrl.
 */
export function extractSafeSerperImageUrl(
  imgItem: { imageUrl?: string; thumbnailUrl?: string; title?: string; source?: string; link?: string },
  targetBusinessName?: string
): string {
  if (!imgItem) return "";
  if (targetBusinessName && isCompetitorOrUnrelatedSerperImage(imgItem, targetBusinessName)) {
    return "";
  }

  const directUrl = String(imgItem.imageUrl || "").trim();
  const thumbUrl = String(imgItem.thumbnailUrl || "").trim();

  // Reject map tiles even on thumbnails if title/link is Waze or Moovit
  const metaLower = `${directUrl} ${imgItem.link || ""} ${imgItem.source || ""}`.toLowerCase();
  if (
    metaLower.includes("waze.com") ||
    metaLower.includes("mvtdev.com") ||
    metaLower.includes("moovitapp.com") ||
    metaLower.includes("sindilegis.org.br")
  ) {
    return "";
  }

  // If directUrl is valid and not a social media crawler or LinkedIn hotlink-blocked asset, use it
  if (directUrl && !isBrokenOrGarbagePhotoUrl(directUrl)) {
    return upgradeGooglePhotoUrl(directUrl);
  }

  // Otherwise use Google's gstatic proxy thumbnail which is always a valid HTTP 200 JPEG
  if (thumbUrl && !isBrokenOrGarbagePhotoUrl(thumbUrl)) {
    return thumbUrl;
  }

  return "";
}
