/**
 * G360 Business — Anti-Hallucination Prompt Hardening & Neutral Fallback Engine
 * Google AI Studio Agent — Isolated Module
 */

export interface BusinessInput {
  name: string;
  category?: string;
  city?: string;
  uf?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  services?: string[];
  products?: string[];
  rating?: number;
  ratingCount?: number;
  prices?: string[];
  reviews?: Array<{ author: string; rating: number; text: string }>;
  verified?: boolean;
}

function normalizeStr(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function detectDataContradictions(business: BusinessInput): { hasContradiction: boolean; details: string[] } {
  const details: string[] = [];
  const name = normalizeStr(business.name || "");
  const category = normalizeStr(business.category || "");

  if ((name.includes("posto") || name.includes("combustivel")) && (category.includes("farmacia") || category.includes("odonto"))) {
    details.push("Contradição entre nome (posto/combustível) e categoria (farmácia/saúde).");
  }
  if (name.includes("restaurante") && category.includes("bateria")) {
    details.push("Contradição entre nome (restaurante) e categoria (bateria automotiva).");
  }

  return {
    hasContradiction: details.length > 0,
    details,
  };
}

export function buildHardenedGbpPrompt(business: BusinessInput): string {
  const contradiction = detectDataContradictions(business);
  const name = business.name || "Empresa Local";
  const category = business.category || "Comércio ou Serviço";
  const city = business.city || "Localidade";
  const uf = business.uf || "";
  const locationStr = `${city}${uf ? " - " + uf : ""}`;
  
  const confirmedServices = Array.isArray(business.services) && business.services.length > 0
    ? `Serviços confirmados: ${business.services.join(", ")}.`
    : "Nenhum serviço específico foi previamente cadastrado. Não invente lista de serviços.";

  const confirmedPhone = business.phone || business.whatsapp
    ? `Contato oficial: ${business.phone || business.whatsapp}.`
    : "Nenhum telefone informado. Não invente números de contato.";

  const contradictionWarning = contradiction.hasContradiction
    ? `ALERTA DE CONTRADIÇÃO NOS DADOS: ${contradiction.details.join(" ")} Evite afirmar dados inconclusivos até confirmação humana.`
    : "";

  return `Você é um assistente sênior de SEO local e redação comercial para o Google Business Profile (GBP).
Sua missão é gerar uma descrição factual, estritamente baseada nos dados confirmados abaixo.

DADOS CONFIRMADOS DA EMPRESA:
- Nome: ${name}
- Segmento: ${category}
- Localização: ${locationStr}
- ${confirmedServices}
- ${confirmedPhone}
${contradictionWarning ? `- ${contradictionWarning}` : ""}

REGRAS ABSOLUTAS DE PROTEÇÃO CONTRA ALUCINAÇÃO:
1. NÃO invente características que não estejam nos dados acima (ex: proíbe-se afirmar "ambiente acolhedor", "atendimento humanizado", "tradição de anos", "entrega rápida", "melhor preço", "equipe especializada", a menos que explicitamente presente nos dados).
2. Se houver contradição nos dados, adote tom neutro e solicite confirmação dos dados antes de afirmar serviços específicos.
3. Se faltarem dados (como preços, avaliações ou serviços), omita-os completamente ou utilize termos neutros.
4. O texto deve ter entre 500 e 745 caracteres, sem emojis, com tom profissional e objetivo.
5. Retorne apenas o texto final puro.`;
}

export function generateNeutralFallbackText(business: BusinessInput): string {
  const contradiction = detectDataContradictions(business);
  if (contradiction.hasContradiction) {
    return `${business.name || "Empresa"} possui dados cadastrais divergentes (${contradiction.details[0]}). Por favor, confirme as informações junto ao estabelecimento antes de divulgar serviços.`;
  }

  const name = business.name || "Empresa Local";
  const category = business.category || "Atividade Comercial";
  const city = business.city || "sua região";
  const contact = business.phone || business.whatsapp ? ` Entre em contato pelo telefone ${business.phone || business.whatsapp}.` : "";
  
  return `${name} atua no segmento de ${category} em ${city}.${contact} Para mais informações sobre atendimento, consulte os canais oficiais de comunicação.`;
}

export function validateBusinessInputData(business: BusinessInput): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];
  if (!business.name || business.name.trim().length === 0) missing.push("name");
  if (!business.city || business.city.trim().length === 0) missing.push("city");
  if (!business.phone && !business.whatsapp) missing.push("phone/whatsapp");
  if (!business.services || business.services.length === 0) missing.push("services");
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}
