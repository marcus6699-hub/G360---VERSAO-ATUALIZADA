// Catálogo de 28+ ramos, gerador instantâneo por ramo/cidade, calculadora financeira e roteiros de venda Zycron Prospect.

export const ZYCRON_RAMOS = [
  "Barbearia",
  "Padaria",
  "Confeitaria",
  "Loja de roupas",
  "Costura & Ateliê",
  "Pizzaria",
  "Hamburgueria",
  "Restaurante",
  "Churrascaria",
  "Açaí",
  "Lanchonete",
  "Salão de beleza",
  "Manicure",
  "Clínica de estética",
  "Dentista",
  "Clínica médica",
  "Fisioterapia",
  "Psicólogo",
  "Nutricionista",
  "Academia",
  "Pet shop",
  "Veterinária",
  "Oficina mecânica",
  "Imobiliária",
  "Advocacia",
  "Contabilidade",
  "Energia solar",
  "Farmácia",
];

export const ALL_TEMPLATE_IDS = [
  "zycron-barbearia",
  "zycron-padaria",
  "zycron-moda",
  "simprao",
  "atelie-val",
  "modelo-premium",
  "vitrine-express",
];

const NICHE_PRESETS = {
  Barbearia: {
    archetype: "servicos",
    templateId: "zycron-barbearia",
    paletteId: "zycron-barber-blue",
    fontId: "bebas-vietnam",
    suggestedSetup: 900,
    suggestedMonthly: 150,
    heroTitle: (nome, cidade) => `Corte e barba sem fila em ${cidade}`,
    heroSub: (nome) =>
      `${nome} atende com horário pelo WhatsApp: você senta na cadeira na hora certa e sai com o degradê alinhado e a barba desenhada na navalha.`,
    ctaLabel: "Agendar meu corte",
    cta2Label: "Ver cortes e barba",
    photos: [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80",
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80",
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&q=80",
      "https://images.unsplash.com/photo-1517832607067-4db24a2ae47c?w=1200&q=80",
    ],
    items: [
      {
        name: "Corte masculino",
        category: "Cortes",
        price: "R$ 45,00",
        badge: "Mais pedido",
        description: "Corte na máquina e na tesoura, do social ao moderno, com pezinho e acabamento na navalha.",
        image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
      },
      {
        name: "Barba na toalha quente",
        category: "Barba",
        price: "R$ 35,00",
        badge: "",
        description: "Barba aparada e desenhada na navalha, com toalha quente e linha que acompanha o seu rosto.",
        image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80",
      },
      {
        name: "Corte + barba",
        category: "Combos",
        price: "R$ 70,00",
        badge: "Combo",
        description: "O combo na mesma cadeira: corte, barba desenhada e acabamento no mesmo horário.",
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
      },
      {
        name: "Degradê navalhado",
        category: "Cortes",
        price: "R$ 50,00",
        badge: "",
        description: "Degradê baixo, médio ou alto, com transição suave na máquina e contorno limpo na navalha.",
        image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80",
      },
      {
        name: "Pigmentação & Sobrancelha",
        category: "Acabamento",
        price: "R$ 30,00",
        badge: "",
        description: "Pigmentação para disfarçar falhas e limpeza da sobrancelha na navalha mantendo o visual natural.",
        image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80",
      },
      {
        name: "Hidratação de barba",
        category: "Tratamento",
        price: "R$ 35,00",
        badge: "",
        description: "Hidratação com óleo e balm para os fios da barba ficarem macios e alinhados.",
        image: "https://images.unsplash.com/photo-1517832607067-4db24a2ae47c?w=800&q=80",
      },
    ],
    steps: [
      { t: "Chame no WhatsApp", d: "Diga se é corte, barba ou os dois e o dia que você prefere." },
      { t: "Reserve a cadeira", d: "A gente confirma o horário e deixa a cadeira separada para você." },
      { t: "Mostre o estilo", d: "Na cadeira, você mostra a foto ou explica o corte e o barbeiro ajusta ao seu cabelo." },
      { t: "Navalha no final", d: "Pezinho, contorno e barba fechados na navalha. Aí é só marcar o próximo." },
    ],
    faqs: [
      { q: "Quanto custa corte e barba?", a: "Os valores mudam conforme o serviço (corte, barba ou combo). Chame no WhatsApp que mandamos a tabela atualizada na hora." },
      { q: "Precisa agendar ou atende por ordem de chegada?", a: "Trabalhamos com horário agendado pelo WhatsApp para você não perder tempo na fila, e também encaixamos horários vagos do dia." },
      { q: "Cortam cabelo de criança?", a: "Sim! Atendemos crianças com toda paciência e cuidado para o corte ficar alinhado." },
      { q: "Quais formas de pagamento aceitam?", a: "Aceitamos Pix, dinheiro e cartões de débito e crédito." },
    ],
  },
  Padaria: {
    archetype: "gastronomia",
    templateId: "zycron-padaria",
    paletteId: "zycron-plum-bakery",
    fontId: "yeseva-lato",
    suggestedSetup: 900,
    suggestedMonthly: 150,
    heroTitle: () => `Encomende salgados e bolo para a festa pelo WhatsApp`,
    heroSub: (nome) =>
      `Pão francês das fornadas do dia, frios fatiados na hora e bolo caseiro no balcão. Na ${nome}, dá para levar rapidinho ou sentar para o café.`,
    ctaLabel: "Encomendar pelo WhatsApp",
    cta2Label: "Ver cardápio",
    photos: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&q=80",
      "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=1200&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80",
      "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80",
      "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=1200&q=80",
    ],
    items: [
      {
        name: "Pão francês quentinho",
        category: "Fornadas",
        price: "Forno do dia",
        badge: "Toda hora",
        description: "Pão francês das fornadas do dia, casquinha crocante, para levar quentinho do balcão.",
        image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80",
      },
      {
        name: "Pães artesanais & baguetes",
        category: "Fornadas",
        price: "Sob consulta",
        badge: "Receita da casa",
        description: "Pão de forma, integral, de leite e outras receitas da casa, conforme a produção de cada dia.",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
      },
      {
        name: "Bolos caseiros & de festa",
        category: "Confeitaria",
        price: "Sob encomenda",
        badge: "Mais pedido",
        description: "Bolo de fubá, cenoura, chocolate e bolos recheados de festa inteiros ou em fatia para o café.",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
      },
      {
        name: "Cento de salgados para festa",
        category: "Encomendas",
        price: "Kit Festa",
        badge: "Encomenda",
        description: "Coxinha, bolinha de queijo, quibe, risoles e empadas fritos ou assados na hora da sua retirada.",
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80",
      },
    ],
    steps: [
      { t: "Mande a lista", d: "No WhatsApp, diga quantos salgados, que bolo, quantos pães e para qual dia." },
      { t: "Confira valor e data", d: "A gente vê o que dá para fazer na data pedida e passa o valor antes de anotar." },
      { t: "Confirme a encomenda", d: "Com tudo certo, o pedido fica anotado e a hora de retirada fica combinada." },
      { t: "Retire tudo fresquinho", d: "Retire no balcão na hora marcada ou receba em casa, se o seu bairro estiver na entrega." },
    ],
    faqs: [
      { q: "Com quanta antecedência encomendo para festa?", a: "Depende da quantidade e do que vai no pedido. Mande a lista e a data no WhatsApp que a gente diz até quando dá para encomendar e se o dia está livre." },
      { q: "Vendem salgado por cento?", a: "Sim! Os sabores e a quantidade mínima variam conforme a produção. Diga no WhatsApp quantas pessoas vão que a gente sugere quanto pedir." },
      { q: "Fazem entrega de encomenda?", a: "Encomendas podem ir até você conforme o bairro e o tamanho do pedido. Diga onde mora pelo WhatsApp e a gente avisa se entrega e qual a taxa." },
      { q: "Dá para pedir salgado ou bolo para o mesmo dia?", a: "Pão e frios saem do balcão na hora. Para salgado e bolo no mesmo dia, chame no WhatsApp que a gente diz o que temos pronto na vitrine." },
    ],
  },
  "Loja de roupas": {
    archetype: "produtos",
    templateId: "zycron-moda",
    paletteId: "zycron-editorial-ink",
    fontId: "bodoni-figtree",
    suggestedSetup: 1200,
    suggestedMonthly: 150,
    heroTitle: () => `Roupa nova para o trabalho, o passeio e a festa`,
    heroSub: (nome) =>
      `${nome} mostra as peças por foto e vídeo no WhatsApp, separa o seu tamanho e você retira na loja ou pergunta sobre entrega.`,
    ctaLabel: "Comprar pelo WhatsApp",
    cta2Label: "Ver coleção",
    photos: [
      "https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=1200&q=80",
      "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=1200&q=80",
      "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=1200&q=80",
      "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=1200&q=80",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    ],
    items: [
      {
        name: "Moda feminina",
        category: "Coleção",
        price: "Novidades",
        badge: "Destaque",
        description: "Vestidos, blusas, calças e conjuntos para o dia a dia, o trabalho e as ocasiões especiais.",
        image: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80",
      },
      {
        name: "Alfaiataria & Social",
        category: "Coleção",
        price: "Sob consulta",
        badge: "",
        description: "Camisas, blazers e calças de corte impecável com ajuda para acertar o tamanho e o caimento.",
        image: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&q=80",
      },
      {
        name: "Looks de Festa & Eventos",
        category: "Festa",
        price: "Exclusivo",
        badge: "Novo",
        description: "Peças selecionadas com tecidos nobres e caimento elegante para você se destacar.",
        image: "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=800&q=80",
      },
      {
        name: "Acessórios & Bolsas",
        category: "Acessórios",
        price: "A partir de R$ 69",
        badge: "",
        description: "Bolsas, cintos e complementos que fecham o visual com sofisticação.",
        image: "https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=800&q=80",
      },
    ],
    steps: [
      { t: "Peças separadas antes da visita", d: "Diga o que procura e o seu tamanho: a gente separa as opções para você provar quando chegar." },
      { t: "Medidas reais na conversa", d: "Informamos comprimento, busto e cintura da peça quando a etiqueta não basta para decidir." },
      { t: "Atendimento sem pressão", d: "Você prova com calma, recebe sugestão sincera de combinação e só leva o que vestir bem." },
      { t: "Compra pelo WhatsApp", d: "Mande o estilo, reserve a peça e combine retirada na loja ou entrega na sua região." },
    ],
    faqs: [
      { q: "Vocês mandam foto das peças no WhatsApp?", a: "Sim! Diga seu tamanho e o que procura que enviamos fotos e vídeos reais das peças disponíveis na loja." },
      { q: "Posso trocar se não servir?", a: "Claro! Peças com etiqueta podem ser trocadas dentro do prazo combinado na compra." },
      { q: "Fazem entrega por motoboy?", a: "Sim, entregamos na região com taxa conforme o bairro. Consulte no WhatsApp!" },
    ],
  },
};

export function getPresetForRamo(ramo) {
  if (NICHE_PRESETS[ramo]) return NICHE_PRESETS[ramo];
  const r = String(ramo || "").toLowerCase();
  if (/padaria|confeitaria|bolo|doce|açaí|acai|sorvete|cafeteria/i.test(r)) {
    return { ...NICHE_PRESETS.Padaria, templateId: "zycron-padaria" };
  }
  if (/pizzaria|hamburgueria|restaurante|churrascaria|lanchonete|marmita|pamonha/i.test(r)) {
    return {
      ...NICHE_PRESETS.Padaria,
      archetype: "gastronomia",
      templateId: "simprao",
      paletteId: "artesanal",
      fontId: "playfair",
      heroTitle: (nome, cidade) => `Sabor artesanal feito na hora em ${cidade}`,
      heroSub: (nome) => `Na ${nome}, cada pedido é preparado com ingredientes frescos selecionados todos os dias. Peça pelo WhatsApp ou venha conhecer nosso espaço.`,
    };
  }
  if (/roupa|moda|boutique|calçado|ótica|joia|acessório/i.test(r)) {
    return NICHE_PRESETS["Loja de roupas"];
  }
  if (/costura|ateliê|atelie|noiva|bordado|reparo/i.test(r)) {
    return {
      ...NICHE_PRESETS["Loja de roupas"],
      archetype: "servicos",
      templateId: "atelie-val",
      paletteId: "atelie-terracota",
      fontId: "playfair-dm",
      heroTitle: () => `Sua peça favorita merece um novo caimento.`,
      heroSub: (nome, cidade) => `${nome} oferece ajustes, reformas, bainhas e costura sob medida em ${cidade} com acabamento artesanal impecável.`,
    };
  }
  if (/dentista|clínica|médic|fisioterapia|psicólog|nutricion|advocacia|contabilidade|imobiliária|energia/i.test(r)) {
    return {
      ...NICHE_PRESETS.Barbearia,
      archetype: "servicos",
      templateId: "modelo-premium",
      paletteId: "emerald-executive",
      fontId: "manrope-dm",
      suggestedSetup: 1500,
      suggestedMonthly: 200,
      heroTitle: (nome, cidade) => `Atendimento especializado em ${ramo.toLowerCase()} em ${cidade}`,
      heroSub: (nome, cidade) => `${nome} une experiência comprovada, estrutura moderna e atendimento ágil pelo WhatsApp em ${cidade}.`,
      ctaLabel: "Agendar atendimento",
      cta2Label: "Conhecer especialidades",
    };
  }
  if (/farmácia|pet|mercado|autopeça|construção/i.test(r)) {
    return {
      ...NICHE_PRESETS["Loja de roupas"],
      archetype: "produtos",
      templateId: "vitrine-express",
      paletteId: "vitrine-azul",
      fontId: "outfit",
      heroTitle: (nome, cidade) => `Atendimento rápido e entrega na sua região em ${cidade}`,
      heroSub: (nome) => `Peça pelo WhatsApp na ${nome}: tiramos dúvidas, confirmamos o estoque na hora e enviamos até você.`,
    };
  }
  return NICHE_PRESETS.Barbearia;
}

export function buildBusinessFromRamo({ nome, ramo = "Barbearia", cidade = "Sua Cidade - SP", variantIndex = 0 }) {
  const cleanName = String(nome || `${ramo} Modelo`).trim();
  const cleanCity = String(cidade || "Centro").trim();
  const preset = getPresetForRamo(ramo);
  const rotatedTemplateId =
    variantIndex === 0
      ? preset.templateId
      : ALL_TEMPLATE_IDS[(ALL_TEMPLATE_IDS.indexOf(preset.templateId) + variantIndex) % ALL_TEMPLATE_IDS.length];

  return {
    place_id: `zycron-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${variantIndex}`,
    name: cleanName,
    category: ramo,
    archetype: preset.archetype,
    recommended_template: rotatedTemplateId,
    city: cleanCity,
    uf: "",
    address: `Centro, ${cleanCity}`,
    phone: "(11) 99000-2389",
    whatsapp: "5511990002389",
    rating: 4.9,
    rating_count: 184,
    open_now: true,
    hours_text: "Segunda a sábado · 09h às 19h",
    hours: [
      "Segunda-feira: 09:00 – 19:00",
      "Terça-feira: 09:00 – 19:00",
      "Quarta-feira: 09:00 – 19:00",
      "Quinta-feira: 09:00 – 19:00",
      "Sexta-feira: 09:00 – 20:00",
      "Sábado: 09:00 – 18:00",
      "Domingo: Fechado",
    ],
    bio: preset.heroSub(cleanName, cleanCity),
    hero_title_override: preset.heroTitle(cleanName, cleanCity),
    photos: preset.photos,
    items: preset.items,
    steps_override: preset.steps,
    faqs: preset.faqs,
    features: ["Atendimento rápido no WhatsApp", "Avaliação 4,9 no Google", "Localização de fácil acesso", "Pagamento via Pix e Cartão"],
    reviews: [
      {
        author: "Rafaela M.",
        rating: 5,
        time: "há 1 semana",
        text: "Marquei pelo WhatsApp, cheguei e fui atendida na hora. Saiu exatamente do jeito que eu tinha pedido!",
      },
      {
        author: "Diogo F.",
        rating: 5,
        time: "há 2 semanas",
        text: "Capricho em cada detalhe e preço justo. O atendimento pelo WhatsApp já resolve tudo rapidinho.",
      },
      {
        author: "Camila S.",
        rating: 5,
        time: "há 3 semanas",
        text: "Melhor experiência da cidade! Sempre recomendo para toda a família.",
      },
    ],
  };
}

export const ZYCRON_MAP_PINS = [
  {
    id: "dom-bigode",
    nome: "Barbearia Dom Bigode",
    name: "Barbearia Dom Bigode",
    ramo: "Barbearia",
    cidade: "Porto Alegre - RS",
    city: "Porto Alegre - RS",
    address: "Centro, Porto Alegre - RS",
    nota: "4,9",
    rating: "4,9",
    av: 356,
    reviews: 356,
    semSite: true,
    hasSite: false,
    venda: 900,
    suggestedPrice: 900,
    mensal: 150,
    suggestedMonthly: 150,
    templateId: "zycron-barbearia",
    x: 24,
    y: 42,
  },
  {
    id: "padaria-marlene",
    nome: "Padaria da Marlene",
    name: "Padaria da Marlene",
    ramo: "Padaria e confeitaria",
    cidade: "Botucatu - SP",
    city: "Botucatu - SP",
    address: "Vila Assumpção, Botucatu - SP",
    nota: "4,9",
    rating: "4,9",
    av: 120,
    reviews: 120,
    semSite: true,
    hasSite: false,
    venda: 900,
    suggestedPrice: 900,
    mensal: 150,
    suggestedMonthly: 150,
    templateId: "zycron-padaria",
    x: 56,
    y: 28,
  },
  {
    id: "atelie-val",
    nome: "Ateliê da Val",
    name: "Ateliê da Val",
    ramo: "Costureira e ateliê",
    cidade: "Mesquita - RJ",
    city: "Mesquita - RJ",
    address: "Centro, Mesquita - RJ",
    nota: "5,0",
    rating: "5,0",
    av: 84,
    reviews: 84,
    semSite: true,
    hasSite: false,
    venda: 900,
    suggestedPrice: 900,
    mensal: 150,
    suggestedMonthly: 150,
    templateId: "atelie-val",
    x: 42,
    y: 66,
  },
  {
    id: "morada-alta",
    nome: "Morada Alta Imóveis",
    name: "Morada Alta Imóveis",
    ramo: "Imobiliária",
    cidade: "Florianópolis - SC",
    city: "Florianópolis - SC",
    address: "Centro, Florianópolis - SC",
    nota: "4,8",
    rating: "4,8",
    av: 156,
    reviews: 156,
    semSite: true,
    hasSite: false,
    venda: 1800,
    suggestedPrice: 1800,
    mensal: 200,
    suggestedMonthly: 200,
    templateId: "modelo-premium",
    x: 74,
    y: 36,
  },
  {
    id: "boutique-elegance",
    nome: "Boutique Villa Moda",
    name: "Boutique Villa Moda",
    ramo: "Loja de roupas",
    cidade: "Anápolis - GO",
    city: "Anápolis - GO",
    address: "Jundiaí, Anápolis - GO",
    nota: "4,9",
    rating: "4,9",
    av: 210,
    reviews: 210,
    semSite: true,
    hasSite: false,
    venda: 1200,
    suggestedPrice: 1200,
    mensal: 150,
    suggestedMonthly: 150,
    templateId: "zycron-moda",
    x: 80,
    y: 72,
  },
  {
    id: "pamonharia-simprao",
    nome: "Pamonharia do Simprão",
    name: "Pamonharia do Simprão",
    ramo: "Restaurante",
    cidade: "Goiânia - GO",
    city: "Goiânia - GO",
    address: "Setor Bueno, Goiânia - GO",
    nota: "4,9",
    rating: "4,9",
    av: 640,
    reviews: 640,
    semSite: false,
    hasSite: true,
    venda: 1200,
    suggestedPrice: 1200,
    mensal: 150,
    suggestedMonthly: 150,
    templateId: "simprao",
    x: 18,
    y: 76,
  },
];

// Calculadora financeira idêntica ao módulo "Faça a conta com os seus números" da Zycron Prospect
export function calculateZycronEarnings({
  sitePrice = 900,
  monthlyFee = 150,
  sitesPerMonth = 3,
  hostingCostPerSite = 0,
  planCost = 0,
} = {}) {
  const price = Math.max(0, Number(sitePrice) || 0);
  const fee = Math.max(0, Number(monthlyFee) || 0);
  const count = Math.max(1, Math.min(30, Number(sitesPerMonth) || 1));
  const netMonthlyPerClient = Math.max(0, fee - hostingCostPerSite);

  const months = Array.from({ length: 12 }, (_, idx) => {
    const monthNumber = idx + 1;
    const activeClients = monthNumber * count;
    const salesRevenue = count * price;
    const recurringRevenue = activeClients * netMonthlyPerClient;
    const grossTotal = salesRevenue + recurringRevenue;
    const netTotal = Math.max(0, grossTotal - planCost);
    return {
      month: monthNumber,
      sites: salesRevenue,
      salesRevenue,
      carteira: recurringRevenue,
      recurringRevenue,
      grossTotal,
      netTotal,
      total: netTotal,
      activeClients,
    };
  });

  const maxMonthTotal = Math.max(...months.map((m) => m.grossTotal), 1);
  const month12 = months[11];
  const annualSales = months.reduce((acc, m) => acc + m.salesRevenue, 0);
  const annualRecurring = months.reduce((acc, m) => acc + m.recurringRevenue, 0);
  const annualGross = annualSales + annualRecurring;
  const annualNet = months.reduce((acc, m) => acc + m.netTotal, 0);

  return {
    months,
    maxMonthTotal,
    totalSitesYear: 12 * count,
    annualSales,
    annualRecurring,
    annualGross,
    annualNet,
    month12,
    month12Total: month12.netTotal,
    month12Recurring: month12.recurringRevenue,
    month12ActiveClients: month12.activeClients,
    total12Months: annualNet,
  };
}

// Roteiros de abordagem e quebra de objeções no WhatsApp (Zycron Prospect)
export function buildWhatsappScripts(business = {}, siteUrl = "", sitePrice = 900, monthlyFee = 150) {
  const name = business.name || "Barbearia Dom Bigode";
  const rating = String(business.rating || "4,9").replace(".", ",");
  const reviews = business.rating_count || 180;
  const city = business.city || "sua cidade";
  const url = siteUrl || `https://seusite.com.br/site/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const fmtPrice = `R$ ${Number(sitePrice).toLocaleString("pt-BR")}`;
  const fmtMonthly = `R$ ${Number(monthlyFee).toLocaleString("pt-BR")}`;

  const raw = [
    {
      id: "primeiro-contato",
      label: "1º Contato com Site Pronto",
      badge: "1º Contato · Campeão de Resposta",
      title: "Mandar o site já pronto (Sem perguntar antes)",
      context: "Ao invés de perguntar 'você já pensou em ter um site?', mande o link com o site dele já funcionando com as fotos e a nota do Google.",
      incoming: `Cliente no Google sem site (${name} · Nota ${rating})`,
      reply: `Oi, tudo bem? Vi a ${name} no Google: nota ${rating} (${reviews} avaliações) e ainda sem site oficial.\n\nMontei uma prévia do site de vocês já com as fotos e o botão direto pro WhatsApp, olha como ficou 👇\n${url}\n\nLeva 1 minutinho pra ver no celular. Me diz o que achou!`,
    },
    {
      id: "resposta-preco",
      label: "Quanto custa?",
      badge: "2º Passo · Quando ele diz 'Ficou top, quanto fica?'",
      title: "Apresentar o preço + mensalidade com naturalidade",
      context: "Ele já viu o site pronto com o nome dele. Agora apresente o valor de implantação + manutenção sem rodeios.",
      incoming: "Caramba, ficou muito bom! Quanto fica pra deixar no ar?",
      reply: `Fico feliz que tenha gostado! Pra deixar no ar no domínio oficial da ${name}, fica ${fmtPrice} a criação (pode parcelar ou fazer no Pix).\n\nDepois fica só ${fmtMonthly}/mês já com a hospedagem rápida, certificado de segurança e qualquer atualização de fotos, preços ou horários que você precisar pedir pelo WhatsApp.`,
    },
    {
      id: "objecao-ta-caro",
      label: "“Tá caro”",
      badge: "Quebra de Objeção #01",
      title: "Quando o dono fala: 'Tá caro'",
      context: "Mostre que 1 ou 2 clientes novos que vêm pelo Google já pagam o site inteiro.",
      incoming: "Gostei, mas tá meio puxado agora...",
      reply: `Entendo perfeitamente! Mas pensa assim: hoje quem pesquisa pelo seu serviço em ${city} no Google acha quem tem site primeiro. Um único cliente a mais por semana que chega pelo botão do site já paga o investimento inteiro logo no primeiro mês — e o site continua trazendo cliente o ano todo.\n\nSe ajudar, consigo fazer esses ${fmtPrice} em 2x no Pix (metade agora na publicação e metade em 30 dias). Fechamos assim?`,
    },
    {
      id: "objecao-instagram",
      label: "“Já tenho Instagram”",
      badge: "Quebra de Objeção #02",
      title: "Quando o dono fala: 'Já tenho Instagram'",
      context: "Instagram é vitrine pra quem já segue; site no Google pega quem está procurando pra comprar agora.",
      incoming: "A gente já usa bastante o Instagram por aqui.",
      reply: `O Instagram de vocês é ótimo! A diferença é que no Instagram a pessoa está rolando o feed distraída. No Google e no site, a pessoa digitou exatamente o que vocês vendem em ${city} porque quer comprar ou agendar agora.\n\nAlém disso, você pode colocar esse link do site na bio do Instagram: passa muito mais confiança e já filtra o cliente direto pro seu WhatsApp com o pedido pronto!`,
    },
    {
      id: "objecao-vou-pensar",
      label: "“Vou pensar”",
      badge: "Quebra de Objeção #03",
      title: "Quando o dono fala: 'Vou pensar / falar com meu sócio'",
      context: "Mantenha a prévia ativa por 5 dias e combine o retorno sem pressão.",
      incoming: "Vou mostrar pro meu sócio / esposa e te falo.",
      reply: `Perfeito! Vou deixar esse link (${url}) no ar por 5 dias pra você mostrar com calma no celular.\n\nSe quiserem mudar alguma foto, texto ou item do cardápio/serviços, me avisa aqui que eu ajusto na hora pra vocês verem. Te chamo na quinta-feira pra saber o que decidiram, combinado?`,
    },
  ];
  return raw.map((r) => ({ ...r, clientSays: r.incoming, script: r.reply }));
}

export function generateContractHtml({
  providerName = "Site Express Studio Pro",
  clientName = "Empresa Cliente",
  clientCity = "Sua Cidade",
  clientPhone = "",
  sitePrice = 900,
  monthlyFee = 150,
} = {}) {
  const today = new Date().toLocaleDateString("pt-BR");
  const fmtPrice = `R$ ${Number(sitePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const fmtMonthly = `R$ ${Number(monthlyFee).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>CONTRATO DE PRESTAÇÃO DE SERVIÇOS — ${clientName}</title>
<style>
  body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; color: #18181b; background: #f4f4f5; margin: 0; padding: 32px 16px; line-height: 1.6; }
  .sheet { max-width: 800px; margin: 0 auto; background: #fff; padding: 48px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #18181b; padding-bottom: 20px; margin-bottom: 28px; }
  h1 { font-size: 22px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: -0.02em; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.06em; color: #52525b; margin: 28px 0 10px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; }
  p, li { font-size: 14px; color: #27272a; }
  .box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 18px 22px; margin: 16px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .box b { display: block; font-size: 20px; color: #09090b; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 56px; padding-top: 24px; }
  .sig div { border-top: 1px solid #18181b; padding-top: 8px; text-align: center; font-size: 13px; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="no-print" style="margin-bottom:20px;display:flex;justify-content:flex-end">
      <button onclick="window.print()" style="background:#18181b;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer">Imprimir / Salvar em PDF</button>
    </div>
    <div class="hdr">
      <div>
        <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS — CRIAÇÃO DE SITE</h1>
        <p style="margin:0;color:#71717a">Documento emitido em ${today}</p>
      </div>
      <div style="text-align:right;font-size:13px">
        <strong>${providerName}</strong><br>
        Soluções Digitais & Presença Google
      </div>
    </div>

    <h2>1. Partes Contratantes</h2>
    <p><strong>CONTRATANTE:</strong> ${clientName} (${clientCity}${clientPhone ? " · Tel: " + clientPhone : ""})<br>
    <strong>CONTRATADO(A):</strong> ${providerName}</p>

    <h2>2. Objeto do Serviço</h2>
    <p>Desenvolvimento, configuração e publicação do site institucional/comercial da empresa <strong>${clientName}</strong>, otimizado para celulares e computadores, contendo:</p>
    <ul>
      <li>Apresentação profissional, fotos, catálogo de serviços/produtos e avaliações reais do Google;</li>
      <li>Botões de conversão rápida integrados diretamente ao WhatsApp da empresa;</li>
      <li>Mapa interativo de localização (Google Maps) e horários de funcionamento atualizados;</li>
      <li>Otimização básica de SEO local para buscas no Google em ${clientCity}.</li>
    </ul>

    <h2>3. Investimento e Condições</h2>
    <div class="box">
      <div>
        <span style="font-size:12px;text-transform:uppercase;color:#71717a;font-weight:700">Implantação e Entrega do Site</span>
        <b>${fmtPrice}</b>
        <span style="font-size:12.5px;color:#52525b">Pagamento único na aprovação/publicação</span>
      </div>
      <div>
        <span style="font-size:12px;text-transform:uppercase;color:#71717a;font-weight:700">Hospedagem & Atualizações (Mensal)</span>
        <b>${fmtMonthly}/mês</b>
        <span style="font-size:12.5px;color:#52525b">Inclui servidor, SSL e alterações via WhatsApp</span>
      </div>
    </div>

    <h2>4. Prazo e Cancelamento</h2>
    <p>O site é entregue pronto para publicação imediata. Não há multa de fidelidade: a manutenção mensal pode ser cancelada a qualquer momento mediante aviso prévio de 15 dias.</p>

    <div class="sig">
      <div><strong>${clientName}</strong><br>Contratante</div>
      <div><strong>${providerName}</strong><br>Contratado(a)</div>
    </div>
  </div>
</body>
</html>`;
}
