// PROMPT MESTRE — GERAÇÃO DE IMAGENS PARA SITES (Site Express — Direção Oficial de Arte e Fotografia Comercial)
import { PALETTES } from "./theme";

export interface CompanyImageServiceOrProduct {
  nome: string;
  descricao: string;
  preco?: string;
}

export interface CompanyImageDataJson {
  empresa: string;
  cidade: string;
  atividade: string;
  apresentacao: string;
  modelo: string;
  cores: [string, string, string];
  servicos: CompanyImageServiceOrProduct[];
  produtos: CompanyImageServiceOrProduct[];
  direcaoDaGaleria: string[];
  promocao: {
    titulo: string;
    subtitulo?: string;
    precoAntigo?: string;
    precoNovo?: string;
  } | null;
  logoEnviada: boolean;
  arquivosDeReferencia: string[];
  video: {
    incluir: boolean;
    local: string;
  };
}

export interface SiteImagePlanRow {
  index: number;
  slotKey: string;
  filename: string;
  sectionName: string;
  aspectRatio: "16:9" | "1:1" | "4:3" | "3:4" | "9:16";
  dimensions: string;
  visualObjective: string;
  realPhotoUsage: string;
  individualPrompt: string;
  siteField: string;
}

export interface MasterCompanyInput {
  empresa: string;
  cidade: string;
  atividade: string;
  apresentacao: string;
  modelo: string;
  cores: [string, string, string];
  servicos: string[];
  produtos: string[];
  direcaoDaGaleria: string[];
  promocao: string | null;
  logoEnviada: boolean;
  arquivosDeReferencia: string[];
  video: {
    incluir: boolean;
    local: string;
  };
}

export interface MasterImageSlot {
  slotNumber: number;
  id: "hero" | "sobre" | "destaque_1" | "destaque_2" | "destaque_3" | "ambiente";
  title: string;
  section: string;
  aspectRatio: "16:9" | "4:3" | "1:1";
  dimensions: string;
  width: number;
  height: number;
  fileName: string;
  objective: string;
  visualDirection: string;
  promptPt: string;
  promptEn: string;
  imageUrl: string;
  isRealGooglePhoto: boolean;
}

export interface NicheVisualGuide {
  nicheKey: "costura" | "alimentacao" | "saude" | "beleza" | "comercio" | "automotivo" | "moveis" | "servicos_gerais";
  nicheLabel: string;
  defaultColors: [string, string, string];
  styleSummary: string;
  lightingDirection: string;
  environmentDetails: string;
  curatedPhotos: {
    hero: string;
    sobre: string;
    destaque1: string;
    destaque2: string;
    destaque3: string;
    ambiente: string;
  };
}

const NICHE_GUIDES: Record<NicheVisualGuide["nicheKey"], NicheVisualGuide> = {
  costura: {
    nicheKey: "costura",
    nicheLabel: "Costura / Ateliê / Roupas / Ajustes",
    defaultColors: ["#373B32", "#A57258", "#F7F3EE"],
    styleSummary:
      "Tecidos reais, linhas, fita métrica, máquina de costura, agulha, tesoura profissional, roupas bem ajustadas, detalhes de acabamento e barra de calça ou troca de zíper. Ambiente organizado, acolhedor, artesanal e elegante.",
    lightingDirection: "Luz natural suave de janela lateral, tons quentes terrosos e creme, profundidade de campo cinematográfica.",
    environmentDetails: "Bancada de madeira clara, carretéis de linha organizados por cor, manequim de alfaiataria ao fundo desfocado.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1605289355680-75fb41239154?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=85",
    },
  },
  alimentacao: {
    nicheKey: "alimentacao",
    nicheLabel: "Alimentação / Pamonharia / Restaurante / Lanchonete / Sorveteria",
    defaultColors: ["#153E23", "#D97706", "#FEF3C7"],
    styleSummary:
      "Alimentos frescos, textura real, aparência apetitosa, iluminação quente, mesa ou bancada limpa, ingredientes naturais e apresentação artesanal.",
    lightingDirection: "Iluminação quente lateral realçando o frescor e a textura artesanal dos alimentos recém-preparados.",
    environmentDetails: "Bancada gastronômica limpa em madeira e pedra natural, louças artesanais brasileiras, ambiente acolhedor.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85",
    },
  },
  saude: {
    nicheKey: "saude",
    nicheLabel: "Saúde / Clínica / Consultório / Farmácia",
    defaultColors: ["#0C2926", "#0D9488", "#F0FDFA"],
    styleSummary:
      "Ambiente limpo, claro, organizado, moderno, acolhedor, transmitindo higiene, segurança, ética e confiança.",
    lightingDirection: "Luz diurna clara e difusa, tons brancos e verde-água suaves, nitidez editorial.",
    environmentDetails: "Consultório ou recepção moderna brasileira, prateleiras ou equipamentos impecavelmente higienizados.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1920&q=85",
    },
  },
  beleza: {
    nicheKey: "beleza",
    nicheLabel: "Beleza / Estética / Salão / Barbearia",
    defaultColors: ["#292524", "#C28E6E", "#FAF8F5"],
    styleSummary:
      "Ambiente sofisticado, iluminação suave, espelhos, bancada organizada, produtos bem posicionados e detalhes de cuidado pessoal.",
    lightingDirection: "Iluminação quente de camarim e luz natural indireta, reflexos suaves e atmosfera de bem-estar.",
    environmentDetails: "Espelhos amplos iluminados, poltronas confortáveis, frascos de cosméticos premium alinhados.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1920&q=85",
    },
  },
  automotivo: {
    nicheKey: "automotivo",
    nicheLabel: "Lava-Jato / Estética Automotiva / Oficina / Baterias",
    defaultColors: ["#0F172A", "#2563EB", "#FACC15"],
    styleSummary:
      "Box de estética automotiva e lavagem detalhada, veículo recebendo acabamento com espuma snow foam ou polimento técnico, ferramentas organizadas, piso limpo e iluminação profissional.",
    lightingDirection: "Iluminação de estúdio automotivo em LED refletindo na pintura limpa e brilhante do veículo, nitidez comercial.",
    environmentDetails: "Centro de estética automotiva e lava-jato brasileiro organizado, equipamentos de alta pressão e microfibra profissional.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1632823471565-1ecdf5c6da46?auto=format&fit=crop&w=1920&q=85",
    },
  },
  moveis: {
    nicheKey: "moveis",
    nicheLabel: "Móveis Planejados / Marcenaria / Arquitetura de Interiores",
    defaultColors: ["#1C1917", "#B45309", "#FAF8F5"],
    styleSummary:
      "Ambientes residenciais e corporativos com marcenaria sob medida de alto padrão, cozinhas planejadas, painéis ripados, iluminação em fita LED quente e ferragens modernas.",
    lightingDirection: "Luz arquitetônica quente valorizando os veios da madeira e o acabamento milimétrico dos armários.",
    environmentDetails: "Cozinha e sala planejada contemporânea brasileira, bancada em quartzo claro, marcenaria impecável.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1920&q=85",
    },
  },
  comercio: {
    nicheKey: "comercio",
    nicheLabel: "Comércio / Loja / Produtos / Pet Shop / Distribuidora",
    defaultColors: ["#0F172A", "#059669", "#F8FAFC"],
    styleSummary:
      "Produtos bem iluminados, vitrine organizada, fundo limpo, foco em qualidade, variedade e apresentação comercial.",
    lightingDirection: "Iluminação comercial limpa e uniforme destacando as cores e embalagens reais sem sombras duras.",
    environmentDetails: "Interior de loja moderna e organizada no Brasil, prateleiras alinhadas, balcão de atendimento receptivo.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1920&q=85",
    },
  },
  servicos_gerais: {
    nicheKey: "servicos_gerais",
    nicheLabel: "Serviços Gerais / Consultoria / Assistência Técnica",
    defaultColors: ["#0F172A", "#2563EB", "#F8FAFC"],
    styleSummary:
      "Profissional em atendimento ou execução real do serviço, ferramentas organizadas, ambiente limpo e postura confiável.",
    lightingDirection: "Luz natural equilibrada com iluminação interna comercial moderna.",
    environmentDetails: "Ambiente empresarial brasileiro organizado, bancada técnica limpa, atendimento cordial.",
    curatedPhotos: {
      hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=85",
      sobre: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=85",
      destaque1: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1080&q=85",
      destaque2: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=85",
      destaque3: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1080&q=85",
      ambiente: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1920&q=85",
    },
  },
};

export function slugifyFilenamePart(str: string): string {
  return (
    String(str || "item")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "item"
  );
}

export function detectNicheVisualDirection(business: any): NicheVisualGuide {
  const hay = `${business?.name || ""} ${business?.category || ""} ${business?.segment || ""} ${business?.bio || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/ateli|costur|reparo|alfaiat|bordad|roupa|vestido|noiva|ajust|reforma|ziper|barra/.test(hay)) {
    return NICHE_GUIDES.costura;
  }
  if (/pamonh|restaur|lanch|burger|hamburg|pizz|padar|confeit|acai|bar\b|cafe|churrasc|espet|doces|comida|pastel|sorvet|gelat/.test(hay)) {
    return NICHE_GUIDES.alimentacao;
  }
  if (/lavajat|lava-jat|lava jato|estetica automot|polimento|oficina|mecan|auto eletric|bateria|pneu|funilaria|guincho/.test(hay)) {
    return NICHE_GUIDES.automotivo;
  }
  if (/moveis|planejad|marcenar|cozinha|armario|interiores/.test(hay)) {
    return NICHE_GUIDES.moveis;
  }
  if (/clinic|medic|dr\b|dra\b|odonto|dentist|psicol|fisioter|nutric|farmac|drogari|hospital|laborat/.test(hay)) {
    return NICHE_GUIDES.saude;
  }
  if (/salao|beleza|estetic|barbear|cabel|manicur|unha|cilios|sobrancelh|spa|make|maquiag/.test(hay)) {
    return NICHE_GUIDES.beleza;
  }
  if (/loja|comercio|pet\b|banho e tosa|mercado|distribuidor|gas\b|agua|papelaria|presente|vitrine/.test(hay)) {
    return NICHE_GUIDES.comercio;
  }
  return NICHE_GUIDES.servicos_gerais;
}

function resolveProjectColors(projectData: any): [string, string, string] {
  const arch = projectData?.archetype || projectData?.business?.segment || "servicos";
  const paletteList = (PALETTES as any)?.[arch] || (PALETTES as any)?.servicos || [];
  const found = paletteList.find((p: any) => p.id === projectData?.paletteId) || paletteList[0];
  if (found?.vars) {
    return [
      found.vars["--pri"] || "#0F172A",
      found.vars["--acc"] || "#2563EB",
      found.vars["--bg"] || "#F8FAFC",
    ];
  }
  const guide = detectNicheVisualDirection(projectData?.business || projectData);
  return guide.defaultColors;
}

/**
 * 1. DADOS DA EMPRESA (Formato oficial do PROMPT MESTRE — Seção 1)
 */
export function buildCompanyImageDataJson(projectDataOrBiz: any): CompanyImageDataJson {
  const isProjectWrapper = Boolean(projectDataOrBiz?.business);
  const b = isProjectWrapper ? projectDataOrBiz.business || {} : projectDataOrBiz || {};
  const arch = projectDataOrBiz?.archetype || b.segment || "servicos";
  const guide = detectNicheVisualDirection(b);

  const empresa = String(b.name || "Empresa Local").trim();
  const cityRaw = String(b.city || "Anápolis").trim();
  const ufRaw = String(b.uf || "GO").trim();
  const cidade = ufRaw && !cityRaw.includes(ufRaw) ? `${cityRaw} - ${ufRaw}` : cityRaw;
  const atividade = String(b.category || guide.nicheLabel).trim();
  const apresentacao = String(
    b.bio ||
      `${empresa} atua com ${atividade} em ${cidade}, oferecendo atendimento profissional, qualidade comprovada e contato direto pelo WhatsApp.`
  ).trim();

  const modelo =
    arch === "gastronomia" || guide.nicheKey === "alimentacao"
      ? "RESTAURANTE E GASTRONOMIA"
      : arch === "produtos" || guide.nicheKey === "comercio"
      ? "LOJA E COMÉRCIO"
      : "SERVIÇOS PROFISSIONAIS";

  const cores = isProjectWrapper ? resolveProjectColors(projectDataOrBiz) : guide.defaultColors;

  const rawItems = Array.isArray(b.items) ? b.items : [];
  const mappedItems: CompanyImageServiceOrProduct[] = rawItems
    .filter((it: any) => it && String(it.name || "").trim())
    .map((it: any) => ({
      nome: String(it.name).trim(),
      descricao: String(it.description || "").trim(),
      ...(it.price ? { preco: String(it.price).trim() } : {}),
    }));

  const isServiceModel = modelo === "SERVIÇOS PROFISSIONAIS";
  const servicos = isServiceModel ? mappedItems : [];
  const produtos = !isServiceModel ? mappedItems : [];

  const realPhotos = (Array.isArray(b.photos) ? b.photos : []).filter(
    (p: any) =>
      typeof p === "string" &&
      p.trim() &&
      (!p.startsWith("data:image/svg+xml") || p.includes("studioGrade"))
  );

  const promoSectionOn = Array.isArray(projectDataOrBiz?.sections)
    ? projectDataOrBiz.sections.some((s: any) => s.id === "promo" && s.on)
    : false;
  const promoObj = projectDataOrBiz?.promo;
  const promocao =
    promoSectionOn && promoObj?.title
      ? {
          titulo: String(promoObj.title),
          subtitulo: promoObj.subtitle ? String(promoObj.subtitle) : undefined,
          precoAntigo: promoObj.oldPrice ? String(promoObj.oldPrice) : undefined,
          precoNovo: promoObj.newPrice ? String(promoObj.newPrice) : undefined,
        }
      : null;

  const videoSectionOn = Array.isArray(projectDataOrBiz?.sections)
    ? projectDataOrBiz.sections.some((s: any) => s.id === "video" && s.on)
    : false;
  const hasVideo = Boolean(projectDataOrBiz?.video?.url) || videoSectionOn;

  return {
    empresa,
    cidade,
    atividade,
    apresentacao,
    modelo,
    cores,
    servicos,
    produtos,
    direcaoDaGaleria: [
      `Ambiente e estrutura real de ${empresa} (${atividade})`,
      guide.styleSummary,
      guide.environmentDetails,
      "Acabamento, atendimento e detalhes reais sem textos sobrepostos",
    ],
    promocao,
    logoEnviada: Boolean(projectDataOrBiz?.logo?.url || b.logoUrl),
    arquivosDeReferencia: realPhotos,
    video: {
      incluir: hasVideo,
      local: "Sobre nós",
    },
  };
}

/**
 * 4. TABELA DE PLANEJAMENTO DE IMAGENS DO SITE (9 Colunas Oficiais do PROMPT MESTRE)
 */
export function buildSiteImagePlanningTable(projectDataOrBiz: any): SiteImagePlanRow[] {
  const json = buildCompanyImageDataJson(projectDataOrBiz);
  const b = projectDataOrBiz?.business || projectDataOrBiz || {};
  const guide = detectNicheVisualDirection(b);
  const hasRefs = json.arquivosDeReferencia.length > 0;
  const colorStr = json.cores.join(", ");

  const itemsList = json.servicos.length > 0 ? json.servicos : json.produtos;
  const rows: SiteImagePlanRow[] = [];

  const noTextRule =
    "Proibido incluir textos, títulos, preços, telefones, logotipos inventados, selos ou marcas d'água na imagem.";

  // 1. capa-desktop.webp
  rows.push({
    index: rows.length + 1,
    slotKey: "hero",
    filename: "capa-desktop.webp",
    sectionName: "Capa Hero (Desktop)",
    aspectRatio: "16:9",
    dimensions: "1920x1080",
    visualObjective: `Impacto visual imediato apresentando ${json.empresa} (${json.atividade} em ${json.cidade}) com área de respiro para leitura da headline.`,
    realPhotoUsage: hasRefs
      ? "Usar foto principal enviada como base fiel da fachada/ambiente, melhorando iluminação e nitidez."
      : "Criar fotografia publicitária realista compatível com a atividade confirmada.",
    individualPrompt: `Fotografia comercial publicitária horizontal 16:9 (1920x1080) para a capa desktop do site da empresa "${json.empresa}" (${json.atividade} em ${json.cidade}). Cena principal: ${guide.styleSummary}. Iluminação realista (${guide.lightingDirection}), cores harmonizadas (${colorStr}), área lateral limpa para leitura do título. ${noTextRule}`,
    siteField: "images.hero",
  });

  // 2. capa-mobile.webp
  rows.push({
    index: rows.length + 1,
    slotKey: "hero_mobile",
    filename: "capa-mobile.webp",
    sectionName: "Capa Hero (Mobile)",
    aspectRatio: "1:1",
    dimensions: "1080x1080",
    visualObjective: `Versão mobile equilibrada da capa de ${json.empresa} com assunto centralizado para telas verticais.`,
    realPhotoUsage: hasRefs
      ? "Reenquadrar foto real principal em proporção 1:1 preservando fidelidade."
      : "Criar versão 1:1 harmonizada com a capa desktop.",
    individualPrompt: `Fotografia comercial 1:1 (1080x1080) otimizada para o topo mobile do site da empresa "${json.empresa}" (${json.atividade} em ${json.cidade}). Enquadramento centralizado destacando ${guide.environmentDetails}, iluminação natural realista e cores ${colorStr}. ${noTextRule}`,
    siteField: "images.hero_mobile",
  });

  // 3. sobre-desktop.webp
  rows.push({
    index: rows.length + 1,
    slotKey: "about",
    filename: "sobre-desktop.webp",
    sectionName: "Sobre Nós (Desktop)",
    aspectRatio: "4:3",
    dimensions: "1200x900",
    visualObjective: "Transmitir confiança, estrutura organizada, cuidado técnico e autoridade local.",
    realPhotoUsage:
      json.arquivosDeReferencia.length > 1
        ? "Usar 2ª foto real da empresa preservando o espaço físico e identidade."
        : "Fotografia realista de bastidores e bancada/ambiente de trabalho.",
    individualPrompt: `Fotografia comercial 4:3 (1200x900) para a seção "Sobre Nós" da empresa "${json.empresa}" (${json.atividade} em ${json.cidade}). Mostrar ambiente organizado, bastidores reais e cuidado nos detalhes: ${guide.environmentDetails}. ${noTextRule}`,
    siteField: "images.about",
  });

  // 4. sobre-mobile.webp
  rows.push({
    index: rows.length + 1,
    slotKey: "about_mobile",
    filename: "sobre-mobile.webp",
    sectionName: "Sobre Nós (Mobile)",
    aspectRatio: "3:4",
    dimensions: "900x1200",
    visualObjective: "Apresentar os bastidores e atendimento em enquadramento vertical 3:4 para leitura no celular.",
    realPhotoUsage:
      json.arquivosDeReferencia.length > 1
        ? "Adaptação vertical 3:4 da foto institucional real."
        : "Fotografia vertical 3:4 do ambiente de trabalho e atendimento.",
    individualPrompt: `Fotografia comercial vertical 3:4 (900x1200) para a seção "Sobre Nós" mobile da empresa "${json.empresa}" (${json.atividade} em ${json.cidade}). Ambiente acolhedor, organizado e autêntico (${guide.lightingDirection}). ${noTextRule}`,
    siteField: "images.about_mobile",
  });

  // 5. Cards de Serviços ou Produtos (1 imagem por item cadastrado)
  itemsList.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const slug = slugifyFilenamePart(item.nome);
    rows.push({
      index: rows.length + 1,
      slotKey: `item_${idx}`,
      filename: `item-${num}-${slug}.webp`,
      sectionName: `Card #${num}: ${item.nome}`,
      aspectRatio: "1:1",
      dimensions: "1080x1080",
      visualObjective: `Representar visualmente "${item.nome}" (${item.descricao || json.atividade}) com nitidez comercial.`,
      realPhotoUsage:
        json.arquivosDeReferencia[idx + 2]
          ? `Usar foto real de referência #${idx + 3} preservando o produto/serviço original.`
          : "Fotografia comercial 1:1 realista focada exclusivamente no item confirmado.",
      individualPrompt: `Fotografia comercial quadrada 1:1 (1080x1080) representando exclusivamente "${item.nome}" (${item.descricao || json.atividade}) da empresa "${json.empresa}" em ${json.cidade}. Foco nítido em textura real, acabamento profissional e iluminação limpa (${colorStr}). ${noTextRule}`,
      siteField: `business.items[${idx}].image`,
    });
  });

  // 6. Galeria (4 imagens 4:3 — 1200x900)
  const galleryThemes = [
    `Visão geral do espaço e estrutura de atendimento da ${json.empresa}`,
    `Detalhe técnico de execução e materiais utilizados em ${json.atividade}`,
    `Acabamento final e padrão de qualidade entregue pela ${json.empresa}`,
    `Ambiente organizado, recepção ou vitrine principal em ${json.cidade}`,
  ];

  for (let g = 0; g < 4; g++) {
    const num = String(g + 1).padStart(2, "0");
    rows.push({
      index: rows.length + 1,
      slotKey: `gallery_${g}`,
      filename: `galeria-${num}.webp`,
      sectionName: `Galeria #${num}`,
      aspectRatio: "4:3",
      dimensions: "1200x900",
      visualObjective: galleryThemes[g],
      realPhotoUsage: json.arquivosDeReferencia[g]
        ? `Baseada na foto real #${g + 1} do Perfil da Empresa no Google.`
        : "Fotografia editorial 4:3 complementar coerente com o nicho.",
      individualPrompt: `Fotografia comercial 4:3 (1200x900) para a Galeria (#${num}) do site da empresa "${json.empresa}" (${json.atividade} em ${json.cidade}). Foco visual: ${galleryThemes[g]}. Estilo: ${guide.styleSummary}. ${noTextRule}`,
      siteField: `images.gallery_${g}`,
    });
  }

  return rows;
}

/**
 * Mapeia automaticamente arquivos enviados com nomes padronizados (ex: capa-desktop.webp, item-01-..., galeria-02.webp)
 * para o slot exato do Site Express.
 */
export function mapUploadedFilenameToSlot(
  filename: string,
  items: Array<{ name?: string; nome?: string }> = []
): {
  slotKey: string;
  label: string;
  itemIndex?: number;
  galleryIndex?: number;
} | null {
  const clean = String(filename || "")
    .toLowerCase()
    .trim()
    .replace(/^.*[\\/]/, "");

  if (/^capa[-_]?desktop\b/.test(clean) || /^hero[-_]?desktop\b/.test(clean) || /^hero[-_]?banner\b/.test(clean)) {
    return { slotKey: "hero", label: "Capa Hero (Desktop)" };
  }
  if (/^capa[-_]?mobile\b/.test(clean) || /^hero[-_]?mobile\b/.test(clean)) {
    return { slotKey: "hero_mobile", label: "Capa Hero (Mobile)" };
  }
  if (/^sobre[-_]?desktop\b/.test(clean) || /^sobre[-_]?empresa\b/.test(clean) || /^about[-_]?desktop\b/.test(clean)) {
    return { slotKey: "about", label: "Sobre Nós (Desktop)" };
  }
  if (/^sobre[-_]?mobile\b/.test(clean) || /^about[-_]?mobile\b/.test(clean)) {
    return { slotKey: "about_mobile", label: "Sobre Nós (Mobile)" };
  }

  const itemMatch = clean.match(/^(?:item|destaque)[-_]?0*(\d+)\b/);
  if (itemMatch) {
    const idx = Math.max(0, parseInt(itemMatch[1], 10) - 1);
    const matchedItem = items[idx];
    const itemName = matchedItem?.name || matchedItem?.nome || `Item #${idx + 1}`;
    return {
      slotKey: `item_${idx}`,
      itemIndex: idx,
      label: `Card: ${itemName}`,
    };
  }

  const galMatch = clean.match(/^galeria[-_]?0*(\d+)\b/);
  if (galMatch) {
    const gIdx = Math.max(0, Math.min(3, parseInt(galMatch[1], 10) - 1));
    return {
      slotKey: `gallery_${gIdx}`,
      galleryIndex: gIdx,
      label: `Galeria #0${gIdx + 1}`,
    };
  }

  return null;
}

/**
 * Documento completo em Markdown com as 11 seções oficiais do PROMPT MESTRE — GERAÇÃO DE IMAGENS PARA SITES
 */
export function buildMasterImagePromptMarkdown(projectDataOrBiz: any): string {
  const dataJson = buildCompanyImageDataJson(projectDataOrBiz);
  const tableRows = buildSiteImagePlanningTable(projectDataOrBiz);

  const mdTableLines = [
    "| # | Arquivo | Seção do Site | Proporção | Dimensões | Objetivo Visual | Uso de Foto Real | Prompt Individual | Campo no Site |",
    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
    ...tableRows.map(
      (r) =>
        `| ${r.index} | \`${r.filename}\` | ${r.sectionName} | ${r.aspectRatio} | ${r.dimensions} | ${r.visualObjective} | ${r.realPhotoUsage} | ${r.individualPrompt} | \`${r.siteField}\` |`
    ),
  ].join("\n");

  return `# PROMPT MESTRE — GERAÇÃO DE IMAGENS PARA SITES
## Site Express — Geração externa por IA

Atue como diretor de arte, fotógrafo comercial e especialista em identidade visual para sites profissionais.

Sua missão é planejar e gerar todas as imagens necessárias para o site da empresa descrita abaixo, respeitando sua atividade, identidade visual, público e materiais originais.

O objetivo é criar imagens com aparência profissional, realista, moderna e natural, prontas para serem utilizadas em um site premium.

## 1. DADOS DA EMPRESA

Os campos abaixo foram preenchidos automaticamente pelo construtor de sites:

\`\`\`json
${JSON.stringify(dataJson, null, 2)}
\`\`\`

Use exclusivamente as informações confirmadas.
Não invente produtos, serviços, instalações, profissionais, clientes, promoções ou características da empresa.
Se a logo e as fotografias forem fornecidas, utilize-as como referência principal para manter a identidade visual.

## 2. DIREÇÃO DE ARTE

Crie imagens com:
- Fotografia publicitária profissional.
- Iluminação realista e fisicamente coerente.
- Cores harmonizadas com a identidade da empresa (${dataJson.cores.join(", ")}).
- Composição limpa, elegante e comercial.
- Texturas reais e naturais.
- Ambiente compatível com uma empresa real brasileira em ${dataJson.cidade}.
- Aparência autêntica, evitando estética artificial de banco de imagem genérico.

Proibido:
- Inserir textos, títulos, preços, telefones ou botões dentro das imagens.
- Criar logotipos novos ou alterar a escrita da logo original.
- Distorcer embalagens, rótulos, fachadas ou produtos reais enviados.
- Misturar elementos de outro ramo de atividade.
- Criar imagens poluídas ou com aparência artificial.
- Adicionar marcas d'água, molduras ou selos falsos.

## 3. USO DAS FOTOS E LOGO ENVIADAS

Quando o usuário anexar logo ou fotos reais:
1. Analise primeiro todos os arquivos recebidos.
2. Preserve a identidade real da empresa.
3. Nas fotos de produtos, fachada, equipe ou espaço físico, mantenha fidelidade ao material original.
4. Melhore iluminação, nitidez, enquadramento, limpeza visual e acabamento comercial sem descaracterizar o que é real.
5. Só crie imagens totalmente novas quando não houver foto real suficiente para determinada seção do site.

## 4. TABELA DE PLANEJAMENTO DE IMAGENS DO SITE

${mdTableLines}

## 5. ESTRUTURA VISUAL DO SITE

### 5.1. Capa principal (Hero)
- **Desktop:** \`capa-desktop.webp\` — Proporção \`16:9\`, dimensão \`1920x1080\`, composição horizontal com área de respiro para textos e botões do site.
- **Mobile:** \`capa-mobile.webp\` — Proporção \`1:1\` (\`1080x1080\`) ou \`4:5\` (\`1080x1350\`), elemento principal centralizado para leitura vertical.

### 5.2. Seção Sobre Nós
- **Desktop:** \`sobre-desktop.webp\` — Proporção \`4:3\`, dimensão \`1200x900\`.
- **Mobile:** \`sobre-mobile.webp\` — Proporção \`3:4\`, dimensão \`900x1200\`.

### 5.3. Serviços ou Produtos
- Gere 1 imagem para cada item listado nos dados da empresa (\`item-01-[slug].webp\`, \`item-02-[slug].webp\`...), proporção \`1:1\` (\`1080x1080\`).

### 5.4. Galeria
- Gere 4 imagens (\`galeria-01.webp\` a \`galeria-04.webp\`), proporção \`4:3\` (\`1200x900\`), mostrando ângulos, detalhes, processos ou produtos reais.

## 6. ESPECIFICAÇÕES TÉCNICAS DE ENTREGA

- **Formato:** \`.webp\` (ou \`.jpg\` / \`.png\` de alta qualidade)
- **Espaço de cor:** \`sRGB\`
- **Qualidade:** 82% a 90%, nítidas e leves para carregamento rápido no Site Express.

## 7. PADRONIZAÇÃO DOS NOMES DOS ARQUIVOS

- \`capa-desktop.webp\` -> \`images.hero\`
- \`capa-mobile.webp\` -> \`images.hero_mobile\`
- \`sobre-desktop.webp\` -> \`images.about\`
- \`sobre-mobile.webp\` -> \`images.about_mobile\`
- \`item-01-[slug].webp\` -> \`business.items[0].image\`
- \`galeria-01.webp\` a \`galeria-04.webp\` -> \`images.gallery_0\` a \`images.gallery_3\`

## 8. REGRAS PARA VÍDEO (QUANDO SOLICITADO)

Se \`video.incluir\` for \`true\`, planeje um vídeo curto de 5 a 10 segundos para a seção **${dataJson.video.local}**, com movimento de câmera suave e natural, sem textos ou locução, mantendo fidelidade ao ambiente da empresa.

## 9. FORMATO DE RESPOSTA

1. Apresente a **Tabela de Planejamento de Imagens** completa.
2. Gere ou entregue os prompts individuais prontos de cada arquivo padronizado.

## 10. CONTROLE DE QUALIDADE ANTES DE ENTREGAR

- Todas as imagens respeitam o ramo de atividade (${dataJson.atividade})?
- As cores conversam com a paleta (${dataJson.cores.join(", ")})?
- As fotos reais foram preservadas sem textos sobrepostos?
- As proporções desktop e mobile foram respeitadas?

## 11. ORDEM DE EXECUÇÃO

1. Ler os dados confirmados da empresa.
2. Analisar os arquivos anexados (logo e fotos reais do Google Maps).
3. Montar a tabela completa de planejamento.
4. Gerar as imagens seguindo rigorosamente os nomes padronizados para upload automático no Site Express.
`;
}

// ============================================================================
// Funções de compatibilidade com projectFactory.js e geração automática
// ============================================================================

export function buildMasterCompanyInput(business: any): MasterCompanyInput {
  const json = buildCompanyImageDataJson(business);
  return {
    empresa: json.empresa,
    cidade: json.cidade,
    atividade: json.atividade,
    apresentacao: json.apresentacao,
    modelo: json.modelo,
    cores: json.cores,
    servicos: json.servicos.map((s) => s.nome),
    produtos: json.produtos.map((p) => p.nome),
    direcaoDaGaleria: json.direcaoDaGaleria,
    promocao: json.promocao ? json.promocao.titulo : null,
    logoEnviada: json.logoEnviada,
    arquivosDeReferencia: json.arquivosDeReferencia,
    video: json.video,
  };
}

export function buildPollinationsRealisticUrl(promptEn: string, width: number, height: number, seed = 42): string {
  const clean = encodeURIComponent(
    `${promptEn}, professional commercial photography, Canon EOS R5, 35mm lens, natural lighting, authentic Brazilian business environment, photorealistic, high resolution, no text, no watermark, no typography, no logos`
  );
  return `https://image.pollinations.ai/prompt/${clean}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
}

export function buildMasterImagePlan(business: any): MasterImageSlot[] {
  const input = buildMasterCompanyInput(business);
  const guide = detectNicheVisualDirection(business);
  const realPhotos = input.arquivosDeReferencia;

  const destaqueList =
    input.servicos.length > 0
      ? input.servicos
      : input.produtos.length > 0
      ? input.produtos
      : [
          `Serviço Principal — ${input.atividade}`,
          `Atendimento Especializado — ${input.empresa}`,
          `Acabamento e Qualidade — ${input.empresa}`,
        ];

  const d1 = destaqueList[0] || `Destaque Principal ${input.atividade}`;
  const d2 = destaqueList[1] || `Especialidade ${input.atividade}`;
  const d3 = destaqueList[2] || `Atendimento Sob Medida ${input.atividade}`;

  const commonRulesPt =
    "Estilo: Fotografia comercial realista, iluminação natural equilibrada, nitidez profissional, cores harmônicas (" +
    input.cores.join(", ") +
    "), ambiente brasileiro autêntico. REGRA ESTRITA: Sem textos sobrepostos, sem preços, sem selos, sem marcas d'água, sem aparência artificial.";

  return [
    {
      slotNumber: 1,
      id: "hero",
      title: "IMAGEM 1 — HERO / BANNER PRINCIPAL",
      section: "Topo do site (Hero)",
      aspectRatio: "16:9",
      dimensions: "1920x1080",
      width: 1920,
      height: 1080,
      fileName: "capa-desktop.webp",
      objective:
        "Criar impacto visual imediato e mostrar claramente o ramo de atuação da empresa nos primeiros segundos.",
      visualDirection:
        "Cena principal representando a atividade central da empresa com espaço visual mais limpo em um dos lados para leitura de título e botões no site.",
      promptPt: `Fotografia comercial horizontal 16:9 (1920x1080) para o Hero do site da empresa "${input.empresa}" (${input.atividade} em ${input.cidade}). Cena principal: ${guide.styleSummary}. Composição editorial com espaço de respiro lateral para leitura do título do site. ${commonRulesPt}`,
      promptEn: `Wide 16:9 commercial hero photography for ${input.atividade} business in Brazil (${input.empresa}), ${guide.nicheLabel}, ${guide.environmentDetails}, clean negative space on one side for web hero headline`,
      imageUrl: realPhotos[0] || guide.curatedPhotos.hero,
      isRealGooglePhoto: Boolean(realPhotos[0]),
    },
    {
      slotNumber: 2,
      id: "sobre",
      title: "IMAGEM 2 — SOBRE A EMPRESA / QUEM SOMOS",
      section: "Sobre nós",
      aspectRatio: "4:3",
      dimensions: "1200x900",
      width: 1200,
      height: 900,
      fileName: "sobre-desktop.webp",
      objective: "Transmitir proximidade, cuidado, profissionalismo e confiança.",
      visualDirection:
        "Ambiente de trabalho organizado, bastidores reais da atividade, cuidado nos detalhes ou atendimento humanizado.",
      promptPt: `Fotografia comercial 4:3 (1200x900) para a seção "Sobre Nós" da empresa "${input.empresa}" (${input.atividade} em ${input.cidade}). Mostrar o ambiente de trabalho organizado, bastidores reais da atividade e cuidado artesanal nos detalhes: ${guide.environmentDetails}. ${commonRulesPt}`,
      promptEn: `4:3 commercial photography showing organized workspace and behind-the-scenes craftsmanship of ${input.atividade} business in Brazil, warm natural lighting`,
      imageUrl: realPhotos[1] || guide.curatedPhotos.sobre,
      isRealGooglePhoto: Boolean(realPhotos[1]),
    },
    {
      slotNumber: 3,
      id: "destaque_1",
      title: `IMAGEM 3 — DESTAQUE #1 (${d1})`,
      section: "Cards de serviços ou produtos",
      aspectRatio: "1:1",
      dimensions: "1080x1080",
      width: 1080,
      height: 1080,
      fileName: `item-01-${slugifyFilenamePart(d1)}.webp`,
      objective: `Representar o primeiro serviço ou produto principal informado: "${d1}".`,
      visualDirection: `Close-up ou plano médio comercial focado exclusivamente em "${d1}", destacando qualidade, textura real e acabamento profissional.`,
      promptPt: `Fotografia comercial quadrada 1:1 (1080x1080) representando o serviço/produto destaque #1 "${d1}" da empresa "${input.empresa}" (${input.atividade}). Foco nítido em acabamento, materiais reais e execução impecável. ${commonRulesPt}`,
      promptEn: `Square 1:1 close-up commercial photography of ${d1} (${input.atividade}), realistic details, professional lighting`,
      imageUrl: realPhotos[2] || guide.curatedPhotos.destaque1,
      isRealGooglePhoto: Boolean(realPhotos[2]),
    },
    {
      slotNumber: 4,
      id: "destaque_2",
      title: `IMAGEM 4 — DESTAQUE #2 (${d2})`,
      section: "Cards de serviços ou produtos",
      aspectRatio: "1:1",
      dimensions: "1080x1080",
      width: 1080,
      height: 1080,
      fileName: `item-02-${slugifyFilenamePart(d2)}.webp`,
      objective: `Representar o segundo serviço ou produto principal informado: "${d2}".`,
      visualDirection: `Plano comercial focado em "${d2}", mantendo a mesma identidade cromática e iluminação natural da série.`,
      promptPt: `Fotografia comercial quadrada 1:1 (1080x1080) representando o serviço/produto destaque #2 "${d2}" da empresa "${input.empresa}" (${input.atividade}). Apresentação limpa, moderna e autêntica. ${commonRulesPt}`,
      promptEn: `Square 1:1 commercial photography of ${d2} (${input.atividade}), authentic Brazilian commercial studio quality`,
      imageUrl: realPhotos[3] || guide.curatedPhotos.destaque2,
      isRealGooglePhoto: Boolean(realPhotos[3]),
    },
    {
      slotNumber: 5,
      id: "destaque_3",
      title: `IMAGEM 5 — DESTAQUE #3 (${d3})`,
      section: "Cards de serviços ou produtos",
      aspectRatio: "1:1",
      dimensions: "1080x1080",
      width: 1080,
      height: 1080,
      fileName: `item-03-${slugifyFilenamePart(d3)}.webp`,
      objective: `Representar o terceiro serviço ou produto principal informado: "${d3}".`,
      visualDirection: `Enquadramento detalhado de "${d3}", ressaltando profissionalismo e padrão elevado de entrega.`,
      promptPt: `Fotografia comercial quadrada 1:1 (1080x1080) representando o serviço/produto destaque #3 "${d3}" da empresa "${input.empresa}" (${input.atividade}). ${commonRulesPt}`,
      promptEn: `Square 1:1 commercial photography of ${d3} (${input.atividade}), natural warm light, sharp focus`,
      imageUrl: realPhotos[4] || guide.curatedPhotos.destaque3,
      isRealGooglePhoto: Boolean(realPhotos[4]),
    },
    {
      slotNumber: 6,
      id: "ambiente",
      title: "IMAGEM 6 — AMBIENTE / ESTRUTURA / GALERIA",
      section: "Galeria ou seção institucional",
      aspectRatio: "16:9",
      dimensions: "1920x1080",
      width: 1920,
      height: 1080,
      fileName: "galeria-01.webp",
      objective: "Reforçar que a empresa é real, organizada e confiável.",
      visualDirection:
        "Espaço físico limpo, bancada de trabalho, atendimento ou detalhes do ambiente da empresa em plano aberto.",
      promptPt: `Fotografia comercial panorâmica 16:9 (1920x1080) da estrutura e ambiente interno da empresa "${input.empresa}" (${input.atividade} em ${input.cidade}). Espaço físico limpo, organizado, iluminado e pronto para receber clientes. ${commonRulesPt}`,
      promptEn: `Wide 16:9 interior architectural and commercial photography of ${input.atividade} store workspace in Brazil, clean, organized, welcoming`,
      imageUrl: realPhotos[5] || realPhotos[0] || guide.curatedPhotos.ambiente,
      isRealGooglePhoto: Boolean(realPhotos[5]),
    },
  ];
}

export function formatMasterPromptDocument(businessOrProject: any): string {
  return buildMasterImagePromptMarkdown(businessOrProject);
}
