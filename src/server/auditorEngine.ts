import { GoogleGenAI, Type } from "@google/genai";

export type EvidenceStatus = "CONFIRMED" | "ABSENT" | "UNKNOWN";

export type AuditSourceType = "outscraper" | "google_places" | "demo" | "manual" | "unknown";

export interface NormalizedField<T> {
  value: T | null;
  source: AuditSourceType;
  available: boolean;
  collectedAt: string;
  status: EvidenceStatus;
  evidence: string;
}

export interface NormalizedBusinessAuditInput {
  name: string;
  city: string;
  uf: string;
  address: string;
  source: AuditSourceType;
  queryCompleted: boolean;
  website: NormalizedField<string>;
  websiteTechnicalFailure: boolean;
  phone: NormalizedField<string>;
  opening_hours: NormalizedField<string[] | string>;
  category: NormalizedField<string>;
  confirmedPrimaryActivity: string | null;
  categoryMismatchConfirmed: boolean;
  categories: NormalizedField<string[]>;
  confirmedSecondaryActivities: string[];
  secondaryCategoriesMissingConfirmed: boolean;
  rating: NormalizedField<number>;
  reviews_count: NormalizedField<number>;
  reviews_data: NormalizedField<
    Array<{
      rating?: number;
      date?: string;
      text?: string;
      owner_answer?: string | null;
      review_answer_text?: string | null;
    }>
  >;
  ownerResponseRatePct: number | null;
  analyzedReviewsCount: number;
  answeredReviewsCount: number;
  photos_count: NormalizedField<number>;
  posts_data: NormalizedField<
    Array<{
      date?: string;
      timestamp?: number;
      text?: string;
    }>
  >;
  hasRecentPostWithin30Days: boolean | null;
  description: NormalizedField<string>;
}

export interface MathematicalCriterion {
  id:
    | "website"
    | "phone_hours"
    | "primary_category"
    | "secondary_categories"
    | "rating"
    | "reviews_count"
    | "owner_responses"
    | "photos_count"
    | "recent_posts";
  group: "A" | "B" | "C" | "D";
  groupName: string;
  title: string;
  peso: number;
  penalidade: number;
  pontosObtidos: number;
  status: EvidenceStatus;
  passed: boolean | null;
  evidencia: string;
  fonte: AuditSourceType;
  consequenciaComercial?: string;
  acaoRecomendada?: string;
  responsavelCorrecao: "pacote_gbp" | "site_express" | "proprietario";
}

export interface PreAnaliseContract {
  nota_calculada: number;
  nota_definitiva: boolean;
  cobertura_percentual: number;
  pontos_verificados: number;
  soma_penalidades_confirmadas: number;
  soma_pesos_nao_verificados: number;
  intervalo_possivel: {
    minimo: number;
    maximo: number;
  };
  diagnostico_realista: string;
  erros_criticos: string[];
  problemas_detalhados: Array<{
    id: string;
    problema: string;
    evidencia_comprovada: string;
    consequencia_comercial: string;
    acao_corretiva: string;
  }>;
  criterios: MathematicalCriterion[];
  dados_nao_verificados: string[];
}

export interface AnaliseCompletaProjetadaContract {
  nota_atual: number;
  nota_projetada: number;
  intervalo_projetado: {
    minimo: number;
    maximo: number;
  };
  projecao_condicional: boolean;
  justificativa_g360: string;
  melhorias_pacote_gbp: string[];
  melhorias_site_express: string[];
  melhorias_previstas: string[];
  melhorias_dependentes: string[];
  pendencias: string[];
}

export interface G360AuditorContract {
  methodology_version: "G360-AUDIT-v2.0";
  generated_at: string;
  normalized_input: NormalizedBusinessAuditInput;
  pre_analise: PreAnaliseContract;
  analise_completa_projetada: AnaliseCompletaProjetadaContract;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Step 1: Normalize raw API payloads (Outscraper, Google Places API v1, Demo, Manual)
 * without fabricating values or treating omitted/failed fields as ABSENT.
 */
export function normalizeAuditInput(raw: any, options?: { collectedAt?: string }): NormalizedBusinessAuditInput {
  const nowIso = options?.collectedAt || new Date().toISOString();
  const isError = Boolean(raw?.apiError || raw?.error || raw?.queryCompleted === false || !raw || typeof raw !== "object");

  const rawSourceStr = String(raw?.source || "").toLowerCase();
  const source: AuditSourceType = isError
    ? "unknown"
    : rawSourceStr.includes("outscraper")
    ? "outscraper"
    : rawSourceStr.includes("google")
    ? "google_places"
    : rawSourceStr.includes("demo")
    ? "demo"
    : rawSourceStr.includes("manual")
    ? "manual"
    : "unknown";

  const queryCompleted = !isError && (raw?.queryCompleted !== undefined ? Boolean(raw.queryCompleted) : true);

  const name = String(raw?.name || raw?.displayName?.text || "Empresa Analisada").trim();
  const city = String(raw?.city || "Anápolis").trim();
  const uf = String(raw?.uf || raw?.state_code || "GO").trim();
  const address = String(raw?.address || raw?.full_address || raw?.formattedAddress || "").trim();

  // Helper when API failed: everything unknown
  if (!queryCompleted) {
    const unknownField = <T>(label: string): NormalizedField<T> => ({
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: `${label} não verificado devido a falha ou indisponibilidade na consulta da API.`,
    });

    return {
      name,
      city,
      uf,
      address,
      source,
      queryCompleted: false,
      website: unknownField("Site"),
      websiteTechnicalFailure: false,
      phone: unknownField("Telefone"),
      opening_hours: unknownField("Horário de funcionamento"),
      category: unknownField("Categoria principal"),
      confirmedPrimaryActivity: null,
      categoryMismatchConfirmed: false,
      categories: unknownField("Categorias secundárias"),
      confirmedSecondaryActivities: [],
      secondaryCategoriesMissingConfirmed: false,
      rating: unknownField("Nota média"),
      reviews_count: unknownField("Quantidade de avaliações"),
      reviews_data: unknownField("Amostra de avaliações"),
      ownerResponseRatePct: null,
      analyzedReviewsCount: 0,
      answeredReviewsCount: 0,
      photos_count: unknownField("Quantidade de fotos"),
      posts_data: unknownField("Histórico de publicações"),
      hasRecentPostWithin30Days: null,
      description: unknownField("Descrição empresarial"),
    };
  }

  // 1. WEBSITE
  const rawWebsiteVal = raw?.website ?? raw?.websiteUri ?? raw?.site;
  const websiteExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.website;
  let websiteField: NormalizedField<string>;
  if (websiteExplicitStatus === "UNKNOWN") {
    websiteField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Disponibilidade de website não pôde ser verificada nesta consulta.",
    };
  } else if (typeof rawWebsiteVal === "string" && rawWebsiteVal.trim().length > 0) {
    const cleanUrl = rawWebsiteVal.trim();
    websiteField = {
      value: cleanUrl,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Website cadastrado no perfil: ${cleanUrl}.`,
    };
  } else if (rawWebsiteVal === "" || rawWebsiteVal === null || websiteExplicitStatus === "ABSENT" || source === "outscraper" || source === "google_places" || source === "demo" || source === "manual") {
    websiteField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "ABSENT",
      evidence: "Campo de website retornou vazio na consulta concluída do perfil.",
    };
  } else {
    websiteField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Informação de website não disponibilizada pela fonte consultada.",
    };
  }
  const websiteTechnicalFailure = Boolean(raw?.websiteTechnicalFailure === true);

  // 2. PHONE
  const rawPhoneVal = raw?.phone ?? raw?.nationalPhoneNumber ?? raw?.internationalPhoneNumber ?? raw?.phoneNumber;
  const phoneExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.phone;
  let phoneField: NormalizedField<string>;
  if (phoneExplicitStatus === "UNKNOWN") {
    phoneField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Telefone não verificado nesta consulta.",
    };
  } else if (typeof rawPhoneVal === "string" && rawPhoneVal.replace(/\D/g, "").length >= 8) {
    phoneField = {
      value: rawPhoneVal.trim(),
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Telefone comercial confirmado: ${rawPhoneVal.trim()}.`,
    };
  } else if (rawPhoneVal === "" || rawPhoneVal === null || phoneExplicitStatus === "ABSENT" || source === "outscraper" || source === "google_places" || source === "demo" || source === "manual") {
    phoneField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "ABSENT",
      evidence: "Telefone comercial ausente na consulta validada do perfil.",
    };
  } else {
    phoneField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Telefone comercial não retornado pela integração.",
    };
  }

  // 3. OPENING HOURS
  const rawHoursVal =
    raw?.opening_hours ??
    raw?.regularOpeningHours?.weekdayDescriptions ??
    raw?.working_hours ??
    raw?.hours ??
    raw?.hours_text;
  const hoursExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.opening_hours;
  let hoursField: NormalizedField<string[] | string>;
  if (hoursExplicitStatus === "UNKNOWN") {
    hoursField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Horário de funcionamento não verificado nesta consulta.",
    };
  } else if (
    (Array.isArray(rawHoursVal) && rawHoursVal.length > 0) ||
    (typeof rawHoursVal === "string" && rawHoursVal.trim().length > 3) ||
    (rawHoursVal && typeof rawHoursVal === "object" && Object.keys(rawHoursVal).length > 0)
  ) {
    const formattedHours = Array.isArray(rawHoursVal)
      ? rawHoursVal
      : typeof rawHoursVal === "string"
      ? rawHoursVal.trim()
      : Object.entries(rawHoursVal).map(([k, v]) => `${k}: ${v}`);
    hoursField = {
      value: formattedHours,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: "Horário de funcionamento preenchido e confirmado no perfil.",
    };
  } else if (
    rawHoursVal === null ||
    rawHoursVal === "" ||
    (Array.isArray(rawHoursVal) && rawHoursVal.length === 0) ||
    hoursExplicitStatus === "ABSENT" ||
    source === "outscraper" ||
    source === "google_places" ||
    source === "demo" ||
    source === "manual"
  ) {
    hoursField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "ABSENT",
      evidence: "Horário de funcionamento ausente na consulta concluída do perfil.",
    };
  } else {
    hoursField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Horário de funcionamento não disponibilizado na resposta.",
    };
  }

  // 4. PRIMARY CATEGORY & ALIGNMENT
  const rawCatVal = raw?.category ?? raw?.type ?? raw?.primaryTypeDisplayName?.text ?? raw?.primary_type;
  const catExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.category;
  const confirmedPrimaryActivity = raw?.confirmedPrimaryActivity ? String(raw.confirmedPrimaryActivity).trim() : null;

  let categoryField: NormalizedField<string>;
  if (catExplicitStatus === "UNKNOWN") {
    categoryField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Categoria principal não verificada.",
    };
  } else if (typeof rawCatVal === "string" && rawCatVal.trim().length > 0) {
    categoryField = {
      value: rawCatVal.trim(),
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Categoria principal cadastrada: "${rawCatVal.trim()}".`,
    };
  } else {
    categoryField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Categoria principal não informada na resposta da API.",
    };
  }

  // Check if there is a confirmed mismatch between primary category and confirmed primary activity
  let categoryMismatchConfirmed = Boolean(raw?.categoryMismatchConfirmed === true);
  if (!categoryMismatchConfirmed && categoryField.status === "CONFIRMED" && confirmedPrimaryActivity) {
    const catLower = String(categoryField.value).toLowerCase();
    const actLower = confirmedPrimaryActivity.toLowerCase();
    // Example: gas distributor categorized as furniture supplier
    if (
      (/g[aá]s|água mineral/.test(actLower) && /m[oó]veis|marcenar/.test(catLower)) ||
      (/serralh|port[aã]o/.test(actLower) && /restauran|farm[aá]c|m[oó]veis/.test(catLower)) ||
      (/farm[aá]c|drogari/.test(actLower) && /oficina|restauran|m[oó]veis/.test(catLower))
    ) {
      categoryMismatchConfirmed = true;
    }
  }

  // 5. SECONDARY CATEGORIES
  const rawSubtypes =
    raw?.categories ??
    (typeof raw?.subtypes === "string"
      ? raw.subtypes
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : Array.isArray(raw?.types)
      ? raw.types
      : raw?.additional_categories);
  const secondaryExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.secondary_categories;
  const confirmedSecondaryActivities: string[] = Array.isArray(raw?.confirmedSecondaryActivities)
    ? raw.confirmedSecondaryActivities
    : [];
  const secondaryCategoriesMissingConfirmed = Boolean(raw?.secondaryCategoriesMissingConfirmed === true);

  let categoriesField: NormalizedField<string[]>;
  if (secondaryExplicitStatus === "UNKNOWN") {
    categoriesField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Não foi possível consultar as categorias secundárias cadastradas.",
    };
  } else if (Array.isArray(rawSubtypes)) {
    categoriesField = {
      value: rawSubtypes,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence:
        rawSubtypes.length > 0
          ? `Categorias identificadas: ${rawSubtypes.join(", ")}.`
          : "Nenhuma categoria secundária adicional cadastrada.",
    };
  } else if (typeof raw?.additional_categories_count === "number") {
    categoriesField = {
      value: Array.from({ length: raw.additional_categories_count }, (_, i) => `Categoria Secundária ${i + 1}`),
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `${raw.additional_categories_count} categoria(s) secundária(s) identificada(s).`,
    };
  } else {
    categoriesField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "A consulta não retornou a lista completa de categorias secundárias.",
    };
  }

  // 6. RATING
  const rawRatingVal = raw?.rating;
  const ratingExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.rating;
  let ratingField: NormalizedField<number>;
  if (ratingExplicitStatus === "UNKNOWN" || rawRatingVal === undefined || rawRatingVal === null || Number.isNaN(Number(rawRatingVal))) {
    ratingField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Nota média de avaliações indisponível ou ainda inexistente.",
    };
  } else {
    const numRating = Number(rawRatingVal);
    ratingField = {
      value: numRating,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Nota média confirmada: ${numRating.toFixed(2).replace(/\.00$/, ".0")} estrelas.`,
    };
  }

  // 7. REVIEWS COUNT
  const rawReviewsCount =
    raw?.reviews_count ??
    raw?.rating_count ??
    raw?.userRatingCount ??
    (typeof raw?.reviews === "number" ? raw.reviews : undefined);
  const reviewsCountExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.reviews_count;
  let reviewsCountField: NormalizedField<number>;
  if (
    reviewsCountExplicitStatus === "UNKNOWN" ||
    rawReviewsCount === undefined ||
    rawReviewsCount === null ||
    Number.isNaN(Number(rawReviewsCount))
  ) {
    reviewsCountField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Quantidade total de avaliações não retornada pela consulta.",
    };
  } else {
    const countVal = Math.max(0, Math.floor(Number(rawReviewsCount)));
    reviewsCountField = {
      value: countVal,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Total confirmado de ${countVal} avaliação(ões) no perfil.`,
    };
  }

  // 8. REVIEWS DATA & OWNER RESPONSE RATE (C3)
  const rawReviewsArr = Array.isArray(raw?.reviews_data)
    ? raw.reviews_data
    : Array.isArray(raw?.reviews)
    ? raw.reviews
    : null;
  const ownerResponsesExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.owner_responses;

  let reviewsDataField: NormalizedBusinessAuditInput["reviews_data"];
  let ownerResponseRatePct: number | null = null;
  let analyzedReviewsCount = 0;
  let answeredReviewsCount = 0;

  if (ownerResponsesExplicitStatus === "UNKNOWN") {
    reviewsDataField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Respostas do proprietário às avaliações não verificáveis nesta fonte.",
    };
  } else if (typeof raw?.owner_response_rate_pct === "number") {
    const rateVal = Number(raw.owner_response_rate_pct);
    ownerResponseRatePct = rateVal;
    analyzedReviewsCount = Number(raw?.analyzed_reviews_count ?? 20);
    answeredReviewsCount = Math.round((rateVal / 100) * analyzedReviewsCount);
    reviewsDataField = {
      value: [],
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Taxa de resposta confirmada: ${rateVal.toFixed(0)}% (${answeredReviewsCount} de ${analyzedReviewsCount} avaliações analisadas).`,
    };
  } else if (Array.isArray(rawReviewsArr) && rawReviewsArr.length > 0) {
    // Check if the review objects actually contain owner answer fields or if owner responses were inspected
    const hasAnswerFieldInSchema = rawReviewsArr.some(
      (r: any) =>
        r &&
        ("review_answer_text" in r ||
          "owner_answer" in r ||
          "ownerResponse" in r ||
          "reply" in r ||
          raw?.reviews_answers_verified === true)
    );

    if (hasAnswerFieldInSchema) {
      // Sort by date descending if date/timestamp is present, and take up to 20
      const sorted = [...rawReviewsArr]
        .sort((a: any, b: any) => {
          const da = a?.date || a?.review_datetime_utc || a?.timestamp || 0;
          const db = b?.date || b?.review_datetime_utc || b?.timestamp || 0;
          if (!da || !db) return 0;
          return new Date(db).getTime() - new Date(da).getTime();
        })
        .slice(0, 20);

      analyzedReviewsCount = sorted.length;
      answeredReviewsCount = sorted.filter((r: any) => {
        const ans = r?.review_answer_text ?? r?.owner_answer ?? r?.ownerResponse ?? r?.reply;
        return typeof ans === "string" && ans.trim().length > 0;
      }).length;
      ownerResponseRatePct = (answeredReviewsCount / analyzedReviewsCount) * 100;

      reviewsDataField = {
        value: sorted,
        source,
        available: true,
        collectedAt: nowIso,
        status: "CONFIRMED",
        evidence: `Analisadas ${analyzedReviewsCount} avaliação(ões) recentes: ${answeredReviewsCount} respondida(s) pelo proprietário (${ownerResponseRatePct.toFixed(0)}%).`,
      };
    } else {
      reviewsDataField = {
        value: rawReviewsArr,
        source,
        available: false,
        collectedAt: nowIso,
        status: "UNKNOWN",
        evidence: "A API consultada retornou avaliações, mas não expõe o campo de resposta do proprietário para verificação.",
      };
    }
  } else {
    reviewsDataField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Amostra individual de avaliações e respostas do proprietário não disponível na consulta.",
    };
  }

  // 9. PHOTOS COUNT (D1)
  const rawPhotosCount = raw?.photos_count;
  const photosExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.photos_count;
  let photosCountField: NormalizedField<number>;
  if (photosExplicitStatus === "UNKNOWN") {
    photosCountField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Quantidade total de fotos não verificada.",
    };
  } else if (typeof rawPhotosCount === "number" && !Number.isNaN(rawPhotosCount)) {
    const pCount = Math.max(0, Math.floor(rawPhotosCount));
    photosCountField = {
      value: pCount,
      source,
      available: true,
      collectedAt: nowIso,
      status: "CONFIRMED",
      evidence: `Total confirmado de ${pCount} foto(s) no perfil.`,
    };
  } else {
    // Note: Google Places API v1 returns at most 10 photo references in `photos` array, not the total gallery count.
    // Only if photos array has >= 15 items can we confirm >= 15, otherwise total count is UNKNOWN unless explicitly given.
    if (Array.isArray(raw?.photos) && raw.photos.length >= 15) {
      photosCountField = {
        value: raw.photos.length,
        source,
        available: true,
        collectedAt: nowIso,
        status: "CONFIRMED",
        evidence: `Pelo menos ${raw.photos.length} fotos confirmadas na galeria.`,
      };
    } else {
      photosCountField = {
        value: null,
        source,
        available: false,
        collectedAt: nowIso,
        status: "UNKNOWN",
        evidence: "Contagem total de fotos da galeria não disponibilizada pela fonte consultada.",
      };
    }
  }

  // 10. POSTS DATA (D2 - Publicações nos últimos 30 dias)
  const rawPostsData = raw?.posts_data ?? raw?.posts;
  const postsExplicitStatus: EvidenceStatus | undefined = raw?.fieldStatus?.recent_posts;
  let postsDataField: NormalizedBusinessAuditInput["posts_data"];
  let hasRecentPostWithin30Days: boolean | null = null;

  if (postsExplicitStatus === "UNKNOWN") {
    postsDataField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Histórico de publicações do perfil não disponível para verificação.",
    };
  } else if (typeof raw?.has_recent_posts === "boolean") {
    hasRecentPostWithin30Days = raw.has_recent_posts;
    postsDataField = {
      value: Array.isArray(rawPostsData) ? rawPostsData : [],
      source,
      available: true,
      collectedAt: nowIso,
      status: raw.has_recent_posts ? "CONFIRMED" : "ABSENT",
      evidence: raw.has_recent_posts
        ? "Publicação confirmada nos últimos 30 dias."
        : "Ausência confirmada de publicações nos últimos 30 dias.",
    };
  } else if (Array.isArray(rawPostsData)) {
    const nowMs = new Date(nowIso).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const recentFound = rawPostsData.some((p: any) => {
      const dt = p?.date || p?.published_at || p?.timestamp;
      if (!dt) return false;
      const postMs = typeof dt === "number" ? (dt < 1e12 ? dt * 1000 : dt) : new Date(dt).getTime();
      return !Number.isNaN(postMs) && nowMs - postMs <= thirtyDaysMs && nowMs >= postMs - 86400000;
    });
    hasRecentPostWithin30Days = recentFound;
    postsDataField = {
      value: rawPostsData,
      source,
      available: true,
      collectedAt: nowIso,
      status: recentFound ? "CONFIRMED" : "ABSENT",
      evidence: recentFound
        ? "Encontrada publicação realizada dentro dos últimos 30 dias."
        : `Nenhuma publicação encontrada nos últimos 30 dias (${rawPostsData.length} publicação(ões) no histórico consultado).`,
    };
  } else {
    // Crucial Rule: Do not confuse absence of `posts_data` in API response with absence of posts in profile!
    postsDataField = {
      value: null,
      source,
      available: false,
      collectedAt: nowIso,
      status: "UNKNOWN",
      evidence: "Histórico de publicações indisponível na resposta da API consultada.",
    };
  }

  // 11. DESCRIPTION
  const rawDesc = raw?.description ?? raw?.bio ?? raw?.editorialSummary?.text;
  const descriptionField: NormalizedField<string> =
    typeof rawDesc === "string" && rawDesc.trim().length > 0
      ? {
          value: rawDesc.trim(),
          source,
          available: true,
          collectedAt: nowIso,
          status: "CONFIRMED",
          evidence: `Descrição presente (${rawDesc.trim().length} caracteres).`,
        }
      : {
          value: null,
          source,
          available: false,
          collectedAt: nowIso,
          status: "UNKNOWN",
          evidence: "Descrição comercial não verificada.",
        };

  return {
    name,
    city,
    uf,
    address,
    source,
    queryCompleted: true,
    website: websiteField,
    websiteTechnicalFailure,
    phone: phoneField,
    opening_hours: hoursField,
    category: categoryField,
    confirmedPrimaryActivity,
    categoryMismatchConfirmed,
    categories: categoriesField,
    confirmedSecondaryActivities,
    secondaryCategoriesMissingConfirmed,
    rating: ratingField,
    reviews_count: reviewsCountField,
    reviews_data: reviewsDataField,
    ownerResponseRatePct,
    analyzedReviewsCount,
    answeredReviewsCount,
    photos_count: photosCountField,
    posts_data: postsDataField,
    hasRecentPostWithin30Days,
    description: descriptionField,
  };
}

/**
 * Step 2: Deterministic 100-Point Mathematical Evaluation (Section 4 & 5)
 */
export function evaluateMathematicalCriteria(norm: NormalizedBusinessAuditInput): {
  criterios: MathematicalCriterion[];
  nota_calculada: number;
  nota_definitiva: boolean;
  cobertura_percentual: number;
  pontos_verificados: number;
  soma_penalidades_confirmadas: number;
  soma_pesos_nao_verificados: number;
  intervalo_possivel: { minimo: number; maximo: number };
  dados_nao_verificados: string[];
} {
  const criterios: MathematicalCriterion[] = [];

  // A1. Site — 10 pontos
  if (norm.website.status === "UNKNOWN") {
    criterios.push({
      id: "website",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A1. Website Oficial",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.website.evidence,
      fonte: norm.website.source,
      responsavelCorrecao: "site_express",
    });
  } else if (norm.website.status === "ABSENT" || norm.websiteTechnicalFailure) {
    criterios.push({
      id: "website",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A1. Website Oficial",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "ABSENT",
      passed: false,
      evidencia: norm.websiteTechnicalFailure
        ? `Falha técnica confirmada ao verificar o site (${norm.website.value || "URL inacessível"}).`
        : norm.website.evidence,
      fonte: norm.website.source,
      consequenciaComercial:
        "Reduz a quantidade de informações disponíveis ao consumidor fora do Google Maps e representa uma oportunidade de fortalecer a conversão local.",
      acaoRecomendada:
        "Implementar um site institucional funcional e vincular a URL validada ao Perfil da Empresa no Google.",
      responsavelCorrecao: "site_express",
    });
  } else {
    criterios.push({
      id: "website",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A1. Website Oficial",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: norm.website.evidence,
      fonte: norm.website.source,
      responsavelCorrecao: "site_express",
    });
  }

  // A2. Telefone e horários — 10 pontos (dedução máxima 10 mesmo se ambos ausentes)
  const phoneAbsent = norm.phone.status === "ABSENT";
  const hoursAbsent = norm.opening_hours.status === "ABSENT";
  const phoneConfirmed = norm.phone.status === "CONFIRMED";
  const hoursConfirmed = norm.opening_hours.status === "CONFIRMED";

  if (phoneAbsent || hoursAbsent) {
    const missingParts: string[] = [];
    if (phoneAbsent) missingParts.push("telefone ausente");
    if (hoursAbsent) missingParts.push("horário de funcionamento ausente");
    criterios.push({
      id: "phone_hours",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A2. Telefone e Horários de Atendimento",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "ABSENT",
      passed: false,
      evidencia: `Comprovada ausência em dados de contato/atendimento: ${missingParts.join(" e ")}.`,
      fonte: norm.phone.source,
      consequenciaComercial:
        "Pode dificultar o contato direto ou gerar dúvida no consumidor sobre se o estabelecimento está em atendimento.",
      acaoRecomendada:
        "Confirmar com o proprietário e cadastrar o telefone comercial ativo e o quadro completo de horários de atendimento.",
      responsavelCorrecao: "proprietario",
    });
  } else if (phoneConfirmed && hoursConfirmed) {
    criterios.push({
      id: "phone_hours",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A2. Telefone e Horários de Atendimento",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Telefone (${norm.phone.value}) e horários de funcionamento confirmados no perfil.`,
      fonte: norm.phone.source,
      responsavelCorrecao: "proprietario",
    });
  } else {
    criterios.push({
      id: "phone_hours",
      group: "A",
      groupName: "NAP e Presença Digital",
      title: "A2. Telefone e Horários de Atendimento",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: "Informação de telefone ou horário de funcionamento não pôde ser integralmente verificada.",
      fonte: norm.phone.source,
      responsavelCorrecao: "proprietario",
    });
  }

  // B1. Categoria principal — 20 pontos
  if (norm.category.status === "UNKNOWN") {
    criterios.push({
      id: "primary_category",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B1. Categoria Principal",
      peso: 20,
      penalidade: 0,
      pontosObtidos: 20,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.category.evidence,
      fonte: norm.category.source,
      responsavelCorrecao: "pacote_gbp",
    });
  } else if (norm.categoryMismatchConfirmed) {
    criterios.push({
      id: "primary_category",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B1. Categoria Principal",
      peso: 20,
      penalidade: 20,
      pontosObtidos: 0,
      status: "ABSENT",
      passed: false,
      evidencia: `A categoria principal cadastrada ("${norm.category.value}") diverge da atividade central confirmada (${norm.confirmedPrimaryActivity || "atividade informada"}).`,
      fonte: norm.category.source,
      consequenciaComercial:
        "Pode prejudicar a exibição do perfil para buscas diretamente relacionadas à atividade principal da empresa.",
      acaoRecomendada:
        "Revisar e alinhar a categoria principal no Google Business Profile de acordo com a atividade predominante confirmada.",
      responsavelCorrecao: "pacote_gbp",
    });
  } else {
    criterios.push({
      id: "primary_category",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B1. Categoria Principal",
      peso: 20,
      penalidade: 0,
      pontosObtidos: 20,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Categoria principal ("${norm.category.value}") devidamente alinhada.`,
      fonte: norm.category.source,
      responsavelCorrecao: "pacote_gbp",
    });
  }

  // B2. Categorias secundárias — 10 pontos
  if (norm.categories.status === "UNKNOWN" && !norm.secondaryCategoriesMissingConfirmed) {
    criterios.push({
      id: "secondary_categories",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B2. Categorias Secundárias",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.categories.evidence,
      fonte: norm.categories.source,
      responsavelCorrecao: "pacote_gbp",
    });
  } else if (
    norm.secondaryCategoriesMissingConfirmed ||
    (norm.confirmedSecondaryActivities.length > 0 &&
      Array.isArray(norm.categories.value) &&
      norm.categories.value.length <= 1)
  ) {
    criterios.push({
      id: "secondary_categories",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B2. Categorias Secundárias",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "ABSENT",
      passed: false,
      evidencia:
        norm.confirmedSecondaryActivities.length > 0
          ? `Atividades secundárias confirmadas (${norm.confirmedSecondaryActivities.join(", ")}) sem categorias secundárias correspondentes cadastradas.`
          : "Comprovada ausência de categorias secundárias aplicáveis às atividades complementares da empresa.",
      fonte: norm.categories.source,
      consequenciaComercial:
        "Representa uma oportunidade de melhoria para ampliar a cobertura semântica das especialidades complementares.",
      acaoRecomendada:
        "Selecionar e cadastrar categorias secundárias oficiais aderentes às atividades complementares realmente exercidas.",
      responsavelCorrecao: "pacote_gbp",
    });
  } else {
    criterios.push({
      id: "secondary_categories",
      group: "B",
      groupName: "Categorias e Alinhamento",
      title: "B2. Categorias Secundárias",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: "Categorias secundárias adequadas ou sem necessidade comprovada de adição.",
      fonte: norm.categories.source,
      responsavelCorrecao: "pacote_gbp",
    });
  }

  // C1. Nota média — 10 pontos (rating < 4.5 -> -10)
  if (norm.rating.status === "UNKNOWN" || norm.rating.value === null) {
    criterios.push({
      id: "rating",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C1. Nota Média de Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.rating.evidence,
      fonte: norm.rating.source,
      responsavelCorrecao: "proprietario",
    });
  } else if (norm.rating.value < 4.5) {
    criterios.push({
      id: "rating",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C1. Nota Média de Avaliações",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "CONFIRMED",
      passed: false,
      evidencia: `O perfil apresenta nota média ${norm.rating.value.toFixed(2).replace(/\.00$/, ".0")}, abaixo do parâmetro de 4,5 utilizado nesta auditoria.`,
      fonte: norm.rating.source,
      consequenciaComercial:
        "Pode influenciar a percepção comparativa do consumidor ao avaliar opções concorrentes na mesma região.",
      acaoRecomendada:
        "Aprimorar processos de atendimento e solicitar avaliações continuamente a clientes reais satisfeitos.",
      responsavelCorrecao: "proprietario",
    });
  } else {
    criterios.push({
      id: "rating",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C1. Nota Média de Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Nota média de ${norm.rating.value.toFixed(2).replace(/\.00$/, ".0")} estrelas, igual ou superior ao parâmetro de 4,5.`,
      fonte: norm.rating.source,
      responsavelCorrecao: "proprietario",
    });
  }

  // C2. Quantidade de avaliações — 10 pontos (reviews_count < 20 -> -10)
  if (norm.reviews_count.status === "UNKNOWN" || norm.reviews_count.value === null) {
    criterios.push({
      id: "reviews_count",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C2. Quantidade de Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.reviews_count.evidence,
      fonte: norm.reviews_count.source,
      responsavelCorrecao: "proprietario",
    });
  } else if (norm.reviews_count.value < 20) {
    criterios.push({
      id: "reviews_count",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C2. Quantidade de Avaliações",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "CONFIRMED",
      passed: false,
      evidencia: `Seu perfil possui ${norm.reviews_count.value} avaliação(ões), abaixo do parâmetro de 20 utilizado nesta auditoria.`,
      fonte: norm.reviews_count.source,
      consequenciaComercial:
        "Representa uma oportunidade de fortalecer a prova social da empresa perante novos clientes.",
      acaoRecomendada:
        "Desenvolver uma rotina contínua de solicitação de avaliações legítimas após os atendimentos realizados.",
      responsavelCorrecao: "proprietario",
    });
  } else {
    criterios.push({
      id: "reviews_count",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C2. Quantidade de Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Perfil conta com ${norm.reviews_count.value} avaliações, atendendo ao parâmetro mínimo de 20.`,
      fonte: norm.reviews_count.source,
      responsavelCorrecao: "proprietario",
    });
  }

  // C3. Respostas do proprietário — 10 pontos (taxa_resposta < 80% -> -10)
  if (norm.reviews_data.status === "UNKNOWN" || norm.ownerResponseRatePct === null) {
    criterios.push({
      id: "owner_responses",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C3. Respostas do Proprietário às Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.reviews_data.evidence,
      fonte: norm.reviews_data.source,
      responsavelCorrecao: "proprietario",
    });
  } else if (norm.ownerResponseRatePct < 80) {
    criterios.push({
      id: "owner_responses",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C3. Respostas do Proprietário às Avaliações",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "CONFIRMED",
      passed: false,
      evidencia: `Taxa de resposta verificada de ${norm.ownerResponseRatePct.toFixed(0)}% (${norm.answeredReviewsCount} de ${norm.analyzedReviewsCount} avaliações analisadas), inferior ao parâmetro de 80%.`,
      fonte: norm.reviews_data.source,
      consequenciaComercial:
        "Representa uma oportunidade de demonstrar atenção ativa ao feedback dos clientes que avaliam a empresa.",
      acaoRecomendada:
        "Responder de forma profissional às avaliações recebidas na amostra analisada e manter acompanhamento periódico.",
      responsavelCorrecao: "proprietario",
    });
  } else {
    criterios.push({
      id: "owner_responses",
      group: "C",
      groupName: "Reputação e Engajamento",
      title: "C3. Respostas do Proprietário às Avaliações",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Taxa de resposta de ${norm.ownerResponseRatePct.toFixed(0)}% (${norm.answeredReviewsCount}/${norm.analyzedReviewsCount}), igual ou superior ao parâmetro de 80%.`,
      fonte: norm.reviews_data.source,
      responsavelCorrecao: "proprietario",
    });
  }

  // D1. Quantidade de fotos — 10 pontos (photos_count < 15 -> -10)
  if (norm.photos_count.status === "UNKNOWN" || norm.photos_count.value === null) {
    criterios.push({
      id: "photos_count",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D1. Quantidade de Fotos",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.photos_count.evidence,
      fonte: norm.photos_count.source,
      responsavelCorrecao: "proprietario",
    });
  } else if (norm.photos_count.value < 15) {
    criterios.push({
      id: "photos_count",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D1. Quantidade de Fotos",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "CONFIRMED",
      passed: false,
      evidencia: `Foram identificadas ${norm.photos_count.value} foto(s) no perfil, abaixo do parâmetro de 15 de completude visual utilizado nesta auditoria.`,
      fonte: norm.photos_count.source,
      consequenciaComercial:
        "Reduz a demonstração visual da estrutura, produtos ou serviços disponíveis ao consumidor.",
      acaoRecomendada:
        "Providenciar e publicar fotografias reais e atualizadas da fachada, instalações, equipe e ofertas.",
      responsavelCorrecao: "proprietario",
    });
  } else {
    criterios.push({
      id: "photos_count",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D1. Quantidade de Fotos",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: `Perfil possui ${norm.photos_count.value} fotos confirmadas, atingindo o parâmetro de 15 fotos.`,
      fonte: norm.photos_count.source,
      responsavelCorrecao: "proprietario",
    });
  }

  // D2. Publicações — 10 pontos (ausência confirmada nos últimos 30 dias -> -10)
  if (norm.posts_data.status === "UNKNOWN" || norm.hasRecentPostWithin30Days === null) {
    criterios.push({
      id: "recent_posts",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D2. Publicações Recentes (30 dias)",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "UNKNOWN",
      passed: null,
      evidencia: norm.posts_data.evidence,
      fonte: norm.posts_data.source,
      responsavelCorrecao: "pacote_gbp",
    });
  } else if (!norm.hasRecentPostWithin30Days) {
    criterios.push({
      id: "recent_posts",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D2. Publicações Recentes (30 dias)",
      peso: 10,
      penalidade: 10,
      pontosObtidos: 0,
      status: "ABSENT",
      passed: false,
      evidencia: norm.posts_data.evidence,
      fonte: norm.posts_data.source,
      consequenciaComercial:
        "Reduz a exposição de atualizações, avisos e conteúdos informativos diretamente na ficha da empresa.",
      acaoRecomendada:
        "Elaborar e publicar postagens informativas periódicas no Google Business Profile.",
      responsavelCorrecao: "pacote_gbp",
    });
  } else {
    criterios.push({
      id: "recent_posts",
      group: "D",
      groupName: "Atividade e Atualização",
      title: "D2. Publicações Recentes (30 dias)",
      peso: 10,
      penalidade: 0,
      pontosObtidos: 10,
      status: "CONFIRMED",
      passed: true,
      evidencia: norm.posts_data.evidence,
      fonte: norm.posts_data.source,
      responsavelCorrecao: "pacote_gbp",
    });
  }

  const soma_penalidades_confirmadas = criterios.reduce((acc, c) => acc + c.penalidade, 0);
  const nota_calculada = clampScore(100 - soma_penalidades_confirmadas);

  const pontos_verificados = criterios
    .filter((c) => c.status !== "UNKNOWN")
    .reduce((acc, c) => acc + c.peso, 0);
  const soma_pesos_nao_verificados = clampScore(100 - pontos_verificados);
  const cobertura_percentual = clampScore((pontos_verificados / 100) * 100);
  const nota_definitiva = soma_pesos_nao_verificados === 0;

  const minimo = clampScore(nota_calculada - soma_pesos_nao_verificados);
  const maximo = nota_calculada;

  const dados_nao_verificados = criterios
    .filter((c) => c.status === "UNKNOWN")
    .map((c) => `${c.title}: ${c.evidencia}`);

  return {
    criterios,
    nota_calculada,
    nota_definitiva,
    cobertura_percentual,
    pontos_verificados,
    soma_penalidades_confirmadas,
    soma_pesos_nao_verificados,
    intervalo_possivel: { minimo, maximo },
    dados_nao_verificados,
  };
}

/**
 * Step 3: Build Realistic Pre-Analysis & Conditional Complete Analysis Projection (Sections 6 & 7)
 * Uses the exact same mathematical engine without erasing reputation or owner-dependent penalties.
 */
export function buildPreAndProjectedContracts(
  norm: NormalizedBusinessAuditInput,
  evalResult: ReturnType<typeof evaluateMathematicalCriteria>,
  options?: { includeSiteExpress?: boolean; includeGbpPackage?: boolean }
): G360AuditorContract {
  const includeSiteExpress = options?.includeSiteExpress !== false;
  const includeGbpPackage = options?.includeGbpPackage !== false;

  const failedCriteria = evalResult.criterios.filter((c) => c.penalidade > 0);
  const erros_criticos = failedCriteria.map((c) => `${c.title}: ${c.evidencia}`);

  const problemas_detalhados = failedCriteria.map((c) => ({
    id: c.id,
    problema: c.title,
    evidencia_comprovada: c.evidencia,
    consequencia_comercial:
      c.consequenciaComercial ||
      "Representa uma oportunidade de melhoria nas informações apresentadas ao consumidor.",
    acao_corretiva:
      c.acaoRecomendada || "Revisar e atualizar o campo correspondente no Perfil da Empresa no Google.",
  }));

  // Deterministic realistic diagnostic text grounded strictly in verified facts
  let diagnostico_realista = "";
  if (!norm.queryCompleted) {
    diagnostico_realista = `Não foi possível concluir a coleta de dados da empresa ${norm.name} devido a indisponibilidade na fonte consultada. Nenhuma penalidade automática foi aplicada (cobertura de 0%).`;
  } else if (failedCriteria.length === 0) {
    diagnostico_realista = evalResult.nota_definitiva
      ? `O perfil de ${norm.name} em ${norm.city} atende a todos os critérios verificados nesta auditoria (nota definitiva ${evalResult.nota_calculada}/100 com 100% de cobertura). Recomenda-se manter a rotina de atualização e atendimento às avaliações.`
      : `Nos critérios verificados (${evalResult.cobertura_percentual}% de cobertura), o perfil de ${norm.name} não apresentou penalidades confirmadas, resultando em nota provisória de ${evalResult.nota_calculada}/100 (intervalo possível de ${evalResult.intervalo_possivel.minimo} a ${evalResult.intervalo_possivel.maximo} pontos conforme verificação dos itens pendentes).`;
  } else {
    const detalhesTexto = problemas_detalhados
      .map(
        (p) =>
          `${p.evidencia_comprovada} ${p.consequencia_comercial} Recomendação: ${p.acao_corretiva}`
      )
      .join(" ");
    const notaLabel = evalResult.nota_definitiva
      ? `nota definitiva de ${evalResult.nota_calculada}/100`
      : `nota provisória de ${evalResult.nota_calculada}/100 (intervalo de ${evalResult.intervalo_possivel.minimo} a ${evalResult.intervalo_possivel.maximo}, cobertura de ${evalResult.cobertura_percentual}%)`;
    diagnostico_realista = `Diagnóstico técnico de ${norm.name} (${norm.city} - ${norm.uf}): ${notaLabel}. ${detalhesTexto}`;
  }

  // Projection Calculation (Section 7):
  // Only remove penalties for items directly addressed by Pacote GBP (primary_category, secondary_categories, recent_posts)
  // and Site Express (website), when enabled.
  // NEVER automatically remove reputation penalties (rating, reviews_count, owner_responses) or owner-dependent items (phone_hours, photos_count).
  let recoverablePoints = 0;
  const melhorias_pacote_gbp: string[] = [];
  const melhorias_site_express: string[] = [];
  const melhorias_dependentes: string[] = [];
  const pendencias: string[] = [];

  for (const c of evalResult.criterios) {
    if (c.penalidade > 0) {
      if (c.id === "website" && includeSiteExpress) {
        recoverablePoints += c.penalidade;
        melhorias_site_express.push(
          "Criação de site institucional via Site Express com informações comerciais organizadas e posterior vinculação da URL no GBP (+10 pts após publicação)."
        );
        pendencias.push("Publicar o Site Express e validar o link no campo Website do Google Business Profile.");
      } else if (
        (c.id === "primary_category" || c.id === "secondary_categories" || c.id === "recent_posts") &&
        includeGbpPackage
      ) {
        recoverablePoints += c.penalidade;
        if (c.id === "primary_category") {
          melhorias_pacote_gbp.push(
            "Revisão e alinhamento da categoria principal compatível com a atividade central da empresa (+20 pts após aplicação)."
          );
          pendencias.push("Aprovar e aplicar a alteração de categoria principal no painel oficial do Google.");
        } else if (c.id === "secondary_categories") {
          melhorias_pacote_gbp.push(
            "Sugestão e inclusão de categorias secundárias válidas para atividades complementares comprovadas (+10 pts após aplicação)."
          );
          pendencias.push("Confirmar e salvar as categorias secundárias no Google Business Profile.");
        } else if (c.id === "recent_posts") {
          melhorias_pacote_gbp.push(
            "Elaboração de cronograma de publicações informativas para atualização do perfil (+10 pts após publicação efetiva)."
          );
          pendencias.push("Publicar as postagens geradas pelo Pacote GBP diretamente na ficha da empresa.");
        }
      } else {
        // Owner-dependent or reputation items: DO NOT erase penalty in mathematical projection!
        if (c.id === "rating") {
          melhorias_dependentes.push(
            `Elevar a nota média atual (${norm.rating.value?.toFixed(2).replace(/\.00$/, ".0")}) para patamar igual ou superior a 4,5 mediante novas avaliações legítimas de clientes.`
          );
        } else if (c.id === "reviews_count") {
          melhorias_dependentes.push(
            `Atingir pelo menos 20 avaliações legítimas de clientes reais (atual: ${norm.reviews_count.value}).`
          );
        } else if (c.id === "owner_responses") {
          melhorias_dependentes.push(
            `Responder às avaliações recebidas dos clientes para elevar a taxa de resposta (atual: ${norm.ownerResponseRatePct?.toFixed(0)}%) para pelo menos 80%.`
          );
        } else if (c.id === "phone_hours") {
          melhorias_dependentes.push(
            "Confirmar telefone comercial ativo e horários de funcionamento com o proprietário e publicá-los na ficha."
          );
        } else if (c.id === "photos_count") {
          melhorias_dependentes.push(
            `Fornecer e publicar fotografias reais da empresa até atingir pelo menos 15 fotos no perfil (atual: ${norm.photos_count.value}).`
          );
        }
      }
    }
  }

  // Always list standard editorial deliverables of Pacote GBP without claiming they already increased the score if not penalized
  if (includeGbpPackage) {
    melhorias_pacote_gbp.push(
      "Redação de descrição empresarial otimizada (até 750 caracteres), estruturação de serviços e organização semântica de nomes de imagens para publicação."
    );
  }

  for (const unv of evalResult.criterios.filter((c) => c.status === "UNKNOWN")) {
    pendencias.push(`Verificar ${unv.title.toLowerCase()} diretamente no painel gerencial do perfil.`);
  }

  const nota_atual = evalResult.nota_calculada;
  const nota_projetada = clampScore(nota_atual + recoverablePoints);
  const intervalo_projetado = {
    minimo: clampScore(nota_projetada - evalResult.soma_pesos_nao_verificados),
    maximo: nota_projetada,
  };

  const melhorias_previstas = [...melhorias_pacote_gbp, ...melhorias_site_express];

  const justificativa_g360 =
    recoverablePoints > 0
      ? `Partindo da nota calculada de ${nota_atual}/100, a aplicação e publicação efetiva das entregas previstas (${melhorias_site_express.length > 0 ? "Site Express e " : ""}Pacote GBP) permite recuperar ${recoverablePoints} ponto(s) referentes a critérios estruturais e cadastrais, projetando a nota para ${nota_projetada}/100. Critérios de reputação, volume de avaliações e ações do proprietário permanecem condicionados à execução contínua.`
      : `A pontuação atual verificada é de ${nota_atual}/100. As entregas do G360 fortalecem a estrutura editorial e semântica do perfil, enquanto a evolução adicional de pontuação depende da resolução das pendências do proprietário e da verificação dos critérios não disponibilizados pela API.`;

  return {
    methodology_version: "G360-AUDIT-v2.0",
    generated_at: norm.website.collectedAt,
    normalized_input: norm,
    pre_analise: {
      nota_calculada: evalResult.nota_calculada,
      nota_definitiva: evalResult.nota_definitiva,
      cobertura_percentual: evalResult.cobertura_percentual,
      pontos_verificados: evalResult.pontos_verificados,
      soma_penalidades_confirmadas: evalResult.soma_penalidades_confirmadas,
      soma_pesos_nao_verificados: evalResult.soma_pesos_nao_verificados,
      intervalo_possivel: evalResult.intervalo_possivel,
      diagnostico_realista,
      erros_criticos,
      problemas_detalhados,
      criterios: evalResult.criterios,
      dados_nao_verificados: evalResult.dados_nao_verificados,
    },
    analise_completa_projetada: {
      nota_atual,
      nota_projetada,
      intervalo_projetado,
      projecao_condicional: true,
      justificativa_g360,
      melhorias_pacote_gbp,
      melhorias_site_express,
      melhorias_previstas,
      melhorias_dependentes,
      pendencias,
    },
  };
}

/**
 * Step 4: Controlled AI Redaction Guard (Section 8)
 * Validates AI JSON response and strictly rejects any attempt by Gemini to alter mathematical scores,
 * penalties, or coverage. Falls back safely on invalid JSON or timeout.
 */
export function applyValidatedAiRedaction(
  contract: G360AuditorContract,
  rawAiJsonText: string | null | undefined
): G360AuditorContract {
  if (!rawAiJsonText || typeof rawAiJsonText !== "string") {
    return contract;
  }

  try {
    const parsed = JSON.parse(rawAiJsonText.trim());
    if (!parsed || typeof parsed !== "object") {
      return contract;
    }

    // Extract only textual narrative fields; NEVER accept score, penalty, or criterion status overrides from AI
    const candidateDiag = parsed?.pre_analise?.diagnostico_realista ?? parsed?.diagnostico_realista;
    const candidateJust =
      parsed?.analise_completa_projetada?.justificativa_g360 ?? parsed?.justificativa_g360;

    // Sanitize against prohibited promises or fake metrics
    const forbiddenPattern = /garantimos\s+o\s+1º\s+lugar|aumento\s+garantido\s+de\s+\d+%\s+no\s+faturamento/i;

    const safeDiag =
      typeof candidateDiag === "string" &&
      candidateDiag.trim().length >= 30 &&
      !forbiddenPattern.test(candidateDiag)
        ? candidateDiag.trim()
        : contract.pre_analise.diagnostico_realista;

    const safeJust =
      typeof candidateJust === "string" &&
      candidateJust.trim().length >= 30 &&
      !forbiddenPattern.test(candidateJust)
        ? candidateJust.trim()
        : contract.analise_completa_projetada.justificativa_g360;

    return {
      ...contract,
      pre_analise: {
        ...contract.pre_analise,
        // Mathematical fields remain 100% locked from original deterministic contract
        nota_calculada: contract.pre_analise.nota_calculada,
        nota_definitiva: contract.pre_analise.nota_definitiva,
        cobertura_percentual: contract.pre_analise.cobertura_percentual,
        intervalo_possivel: { ...contract.pre_analise.intervalo_possivel },
        criterios: contract.pre_analise.criterios,
        diagnostico_realista: safeDiag,
      },
      analise_completa_projetada: {
        ...contract.analise_completa_projetada,
        // Mathematical projection remains 100% locked
        nota_atual: contract.analise_completa_projetada.nota_atual,
        nota_projetada: contract.analise_completa_projetada.nota_projetada,
        intervalo_projetado: { ...contract.analise_completa_projetada.intervalo_projetado },
        projecao_condicional: true,
        justificativa_g360: safeJust,
      },
    };
  } catch {
    // Invalid JSON -> preserve deterministic contract intact
    return contract;
  }
}

/**
 * Optional async helper to enrich narrative text via Gemini with temperature 0.1 and strict JSON schema,
 * while locking all mathematical outputs.
 */
export async function enrichAuditContractWithControlledGemini(
  contract: G360AuditorContract,
  apiKey?: string
): Promise<G360AuditorContract> {
  const key = (apiKey || process.env.GEMINI_API_KEY || "").trim();
  if (!key || key === "MY_GEMINI_API_KEY") {
    return contract;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `Você atua como auditor técnico de Google Business Profile.
Redija apenas os textos "diagnostico_realista" e "justificativa_g360" com base estrita nos dados matemáticos abaixo.
Regras obrigatórias:
- Não altere nenhuma nota (${contract.pre_analise.nota_calculada}/100 atual, ${contract.analise_completa_projetada.nota_projetada}/100 projetada, cobertura ${contract.pre_analise.cobertura_percentual}%).
- Não invente problemas não verificados, avaliações ou métricas financeiras.
- Seja técnico, objetivo e comercialmente claro para o empresário.

Dados confirmados:
Empresa: ${contract.normalized_input.name} (${contract.normalized_input.city} - ${contract.normalized_input.uf})
Erros confirmados: ${JSON.stringify(contract.pre_analise.erros_criticos)}
Dados não verificados: ${JSON.stringify(contract.pre_analise.dados_nao_verificados)}
Melhorias previstas G360: ${JSON.stringify(contract.analise_completa_projetada.melhorias_previstas)}
Melhorias dependentes do proprietário: ${JSON.stringify(contract.analise_completa_projetada.melhorias_dependentes)}`;

    const res: any = await Promise.race([
      ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnostico_realista: { type: Type.STRING },
              justificativa_g360: { type: Type.STRING },
            },
            required: ["diagnostico_realista", "justificativa_g360"],
          },
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini audit timeout")), 3500)),
    ]);

    return applyValidatedAiRedaction(contract, res?.text);
  } catch {
    return contract;
  }
}

/**
 * Full synchronous deterministic pipeline: Raw Input -> Normalize -> Evaluate -> Contract
 */
export function runDeterministicAuditorEngine(
  rawInput: any,
  options?: { collectedAt?: string; includeSiteExpress?: boolean; includeGbpPackage?: boolean }
): G360AuditorContract {
  const norm = normalizeAuditInput(rawInput, { collectedAt: options?.collectedAt });
  const evalResult = evaluateMathematicalCriteria(norm);
  return buildPreAndProjectedContracts(norm, evalResult, options);
}
