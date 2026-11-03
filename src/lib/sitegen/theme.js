// Paletas, fontes, ícones SVG e CSS do motor de geração de sites.

export const PALETTES = {
  gastronomia: [
    {
      id: "artesanal",
      name: "Gastronomia & Restaurantes",
      vars: { pri: "#153E23", sec: "#2D7819", acc: "#F3C94D", bg: "#FAF9F3", ink: "#1B2516", soft: "#EFEAD8" },
    },
    {
      id: "zycron-plum-bakery",
      name: "Padarias, Confeitarias & Cafés",
      vars: { pri: "#3B2342", sec: "#9C3D6E", acc: "#9C3D6E", bg: "#FBF7FB", ink: "#3B2342", soft: "#F1E6F5" },
    },
    {
      id: "brasa",
      name: "Churrascaria & Pizzaria",
      vars: { pri: "#431407", sec: "#B45309", acc: "#FBBF24", bg: "#FDF8F2", ink: "#231209", soft: "#F5E8DA" },
    },
    {
      id: "noturna",
      name: "Hamburgueria & Bistrô",
      vars: { pri: "#0E1B12", sec: "#3F6212", acc: "#E9C46A", bg: "#F6F5EF", ink: "#14201A", soft: "#E8E9DC" },
    },
  ],
  servicos: [
    {
      id: "zycron-barber-blue",
      name: "Barbearia & Estética Urbana",
      vars: { pri: "#16181B", sec: "#2443C2", acc: "#2443C2", bg: "#F5F5F3", ink: "#14171B", soft: "#E8E9E5" },
    },
    {
      id: "atelie-terracota",
      name: "Beleza, Salão & Ateliê",
      vars: { pri: "#373B32", sec: "#A57258", acc: "#AD806E", bg: "#F7F3EE", ink: "#302B28", soft: "#F0E9E2" },
    },
    {
      id: "emerald-executive",
      name: "Clínicas, Saúde & Odontologia",
      vars: { pri: "#0C2926", sec: "#2F6353", acc: "#B5D7B6", bg: "#F8F6F0", ink: "#17302E", soft: "#ECF3EB" },
    },
    {
      id: "marinho",
      name: "Advocacia, Contabilidade & Consultoria",
      vars: { pri: "#0F172A", sec: "#1E3A8A", acc: "#C6A24B", bg: "#FAFAFA", ink: "#0F172A", soft: "#EEF2F7" },
    },
    {
      id: "esmeralda",
      name: "Medicina & Bem-Estar",
      vars: { pri: "#064E3B", sec: "#047857", acc: "#C6A24B", bg: "#F7FAF8", ink: "#0B1F17", soft: "#E4F0EA" },
    },
    {
      id: "royal",
      name: "Oficinas, Engenharia & Serviços Técnicos",
      vars: { pri: "#111827", sec: "#2563EB", acc: "#60A5FA", bg: "#F9FAFB", ink: "#111827", soft: "#EAEFF7" },
    },
  ],
  produtos: [
    {
      id: "zycron-editorial-ink",
      name: "Moda, Boutique & Joalheria",
      vars: { pri: "#151515", sec: "#151515", acc: "#5C5853", bg: "#F6F4F1", ink: "#151515", soft: "#ECE8E2" },
    },
    {
      id: "vitrine-azul",
      name: "Farmácias, Óticas & Comércio",
      vars: { pri: "#111827", sec: "#2563EB", acc: "#2563EB", bg: "#F9FAFB", ink: "#111827", soft: "#EDF1F7" },
    },
    {
      id: "vitrine-laranja",
      name: "Varejo, Gás, Supermercado & Delivery",
      vars: { pri: "#1C1410", sec: "#EA580C", acc: "#EA580C", bg: "#FDF9F4", ink: "#1C1410", soft: "#F7EBDD" },
    },
    {
      id: "vitrine-verde",
      name: "Pet Shop, Agro & Móveis",
      vars: { pri: "#0B1512", sec: "#059669", acc: "#059669", bg: "#F6FBF8", ink: "#0B1512", soft: "#E2F3EB" },
    },
    {
      id: "novolar-red-navy",
      name: "Móveis & Colchões Novo Lar (Navy & Rubro)",
      vars: { pri: "#0F172A", sec: "#DC2626", acc: "#E11D48", bg: "#FFFFFF", ink: "#0F172A", soft: "#F8FAFC" },
    },
  ],
};

export const ALL_PALETTES = [
  ...PALETTES.gastronomia,
  ...PALETTES.servicos,
  ...PALETTES.produtos,
];

export const FONT_PAIRS = [
  {
    id: "bebas-vietnam",
    name: "Bebas Neue + Vietnam (Impacto Urbano)",
    heading: "'Bebas Neue', sans-serif",
    body: "'Be Vietnam Pro', sans-serif",
    google: "Bebas+Neue&family=Be+Vietnam+Pro:wght@400;500;600;700",
  },
  {
    id: "yeseva-lato",
    name: "Yeseva One + Lato (Gastronomia & Confeitaria)",
    heading: "'Yeseva One', Georgia, serif",
    body: "'Lato', sans-serif",
    google: "Yeseva+One&family=Lato:wght@400;700",
  },
  {
    id: "bodoni-figtree",
    name: "Bodoni Moda + Figtree (Boutique & Elegância)",
    heading: "'Bodoni Moda', Georgia, serif",
    body: "'Figtree', sans-serif",
    google: "Bodoni+Moda:ital,wght@0,500;0,600;0,700;1,500&family=Figtree:wght@400;500;600;700",
  },
  {
    id: "playfair",
    name: "Playfair + Jakarta (Restaurantes & Tradição)",
    heading: "'Playfair Display', serif",
    body: "'Plus Jakarta Sans', sans-serif",
    google: "Playfair+Display:ital,wght@0,500;0,700;0,800;1,500;1,600|Plus+Jakarta+Sans:wght@400;500;600;700",
  },
  {
    id: "playfair-dm",
    name: "Playfair + DM Sans (Estética & Ateliê)",
    heading: "'Playfair Display', serif",
    body: "'DM Sans', sans-serif",
    google: "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600|DM+Sans:wght@400;500;600;700",
  },
  {
    id: "manrope-dm",
    name: "Manrope + DM Sans (Clínicas & Advocacia)",
    heading: "'Manrope', sans-serif",
    body: "'DM Sans', sans-serif",
    google: "Manrope:wght@600;700;800|DM+Sans:wght@400;500;600;700",
  },
  {
    id: "cormorant",
    name: "Cormorant Clássico (Direito & Consultoria)",
    heading: "'Cormorant Garamond', serif",
    body: "'Inter', sans-serif",
    google: "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600|Inter:wght@400;500;600;700",
  },
  {
    id: "georgia",
    name: "Georgia Editorial",
    heading: "Georgia, 'Times New Roman', serif",
    body: "'Inter', sans-serif",
    google: "Inter:wght@400;500;600;700",
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    heading: "'Plus Jakarta Sans', sans-serif",
    body: "'Plus Jakarta Sans', sans-serif",
    google: "Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,800;1,600|Inter:wght@400;500;600",
  },
  {
    id: "outfit",
    name: "Outfit Moderno (Comércio & Lojas)",
    heading: "'Outfit', sans-serif",
    body: "'Inter', sans-serif",
    google: "Outfit:wght@500;600;700;800|Inter:wght@400;500;600",
  },
  {
    id: "inter",
    name: "Inter Clean",
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    google: "Inter:ital,wght@0,400;0,600;0,800;1,600",
  },
];

export const DEFAULT_FONT = {
  gastronomia: "playfair",
  servicos: "playfair-dm",
  produtos: "outfit",
};

export const SITE_TEMPLATES = [
  {
    id: "zycron-barbearia",
    name: "Barbearias, Estúdios & Serviços Urbanos",
    subtitle: "Barbearias, Salões Masculinos, Tatuagem & Estética",
    badge: "Modelo #01 · Serviços",
    sourceFile: "barbearia-urbana",
    archetype: "servicos",
    paletteId: "zycron-barber-blue",
    fontId: "bebas-vietnam",
    description:
      "Hero escuro dividido com tipografia de impacto, faixa tripla de informações (Horário, Bairro e Nota Google), cards fotográficos 4:3 com degradê, galeria 'Por dentro', passo a passo 1-2-3-4 e barra flutuante ao vivo.",
    highlights: [
      "Hero Escuro (#16181B) + Faixa Tripla (Horário, Bairro e Nota Google)",
      "Cards de Serviços em foto full-bleed com título sobreposto",
      "Trilho Horizontal 'Por dentro' numerado (1/6..6/6) + Passo a Passo 1-2-3-4",
      "Depoimento em destaque + Barra Flutuante com Status Aberto/Fechado",
    ],
    colors: ["#16181B", "#2443C2", "#E8E9E5", "#F5F5F3"],
  },
  {
    id: "zycron-padaria",
    name: "Padarias, Confeitarias & Cafeterias",
    subtitle: "Padarias, Docerias, Confeitarias, Cafés & Encomendas",
    badge: "Modelo #02 · Gastronomia",
    sourceFile: "padaria-confeitaria",
    archetype: "gastronomia",
    paletteId: "zycron-plum-bakery",
    fontId: "yeseva-lato",
    description:
      "Cabeçalho centralizado elegante, Hero com foto em arco, selo circular sobreposto e botão de encomendas, seção 'Como funciona' em balões de WhatsApp e FAQ interativo estilo conversa.",
    highlights: [
      "Header editorial centralizado + Hero com moldura em Arco e foto dupla",
      "Seção 'Como funciona' simulando balões reais de conversa no WhatsApp",
      "FAQ interativo em formato de perguntas e respostas de Chat com checkmarks ✓✓",
      "Cardápio de 4 colunas + Barra Flutuante de Encomenda e Status Ao Vivo",
    ],
    colors: ["#3B2342", "#9C3D6E", "#F1E6F5", "#FBF7FB"],
  },
  {
    id: "zycron-moda",
    name: "Moda, Boutiques & Lojas de Conceito",
    subtitle: "Lojas de Roupas, Calçados, Joalherias, Móveis & Decoração",
    badge: "Modelo #03 · Vitrine",
    sourceFile: "moda-editorial",
    archetype: "produtos",
    paletteId: "zycron-editorial-ink",
    fontId: "bodoni-figtree",
    description:
      "Estética editorial sofisticada sobre fundo claro (#F6F4F1), Hero com dupla vitrine fotográfica, catálogo vertical 4:5, faixa animada e grade de 4 diferenciais.",
    highlights: [
      "Hero Lookbook com vitrine dupla de fotos + barra tripla de título e prova social",
      "Cards de coleção em proporção vertical 4:5 com degradê editorial",
      "Faixa Letreiro (Marquee) contínua + Seção 'Do jeito que a gente trabalha'",
      "Barra Flutuante com Status Ao Vivo, WhatsApp, Ligação e Rota",
    ],
    colors: ["#151515", "#5C5853", "#ECE8E2", "#F6F4F1"],
  },
  {
    id: "simprao",
    name: "Restaurantes, Pizzarias & Delivery",
    subtitle: "Restaurantes, Lanchonetes, Sorveterias & Gastronomia Local",
    badge: "Modelo #04 · Gastronomia",
    sourceFile: "gastronomia-restaurante",
    archetype: "gastronomia",
    paletteId: "artesanal",
    fontId: "playfair",
    description:
      "Hero fotográfico em tela cheia com degradê artesanal, cards de escolha rápida sobrepostos, cardápio categorizado em abas, destaque giratório e galeria mosaico.",
    highlights: [
      "Hero 100svh com degradê artesanal e selo flutuante do Google",
      "Atalho rápido sobreposto para Cardápio Completo ou Mais Pedidos",
      "Cardápio interativo com filtro de categorias + Destaque giratório",
      "Galeria em abas (Produtos / Nosso Espaço) + Carrossel Google Reviews",
    ],
    colors: ["#153E23", "#2D7819", "#F3C94D", "#FAF9F3"],
  },
  {
    id: "atelie-val",
    name: "Estética, Salões de Beleza & Ateliês",
    subtitle: "Clínicas de Estética, Salões, Design & Serviços Personalizados",
    badge: "Modelo #05 · Beleza",
    sourceFile: "estetica-atelie",
    archetype: "servicos",
    paletteId: "atelie-terracota",
    fontId: "playfair-dm",
    description:
      "Design refinado em creme e terracota com barra de atendimento local, selo monograma circular, Hero split com 3 métricas, vitrine de 4 cards verticais de serviços e seção de história.",
    highlights: [
      "Barra superior editorial + Header creme com selo monograma circular",
      "Hero Split com 3 métricas em destaque e foto emoldurada com legenda",
      "Grade de 4 Cards Verticais de Serviços com botão de agendamento",
      "Seção História & Diferenciais + FAQ em 2 colunas",
    ],
    colors: ["#373B32", "#A57258", "#AD806E", "#F7F3EE"],
  },
  {
    id: "modelo-premium",
    name: "Saúde, Clínicas, Advocacia & Consultoria",
    subtitle: "Clínicas Médicas, Odontologia, Escritórios & Empresas B2B",
    badge: "Modelo #06 · Executivo",
    sourceFile: "clinica-executivo",
    archetype: "servicos",
    paletteId: "emerald-executive",
    fontId: "manrope-dm",
    description:
      "Layout executivo de alta autoridade em verde-esmeralda profundo. Traz Hero escuro com card flutuante de credibilidade, faixa de 3 diferenciais e vitrine numerada de especialidades (01, 02, 03).",
    highlights: [
      "Header e Hero em Verde Esmeralda Profundo (#0C2926) com iluminação suave",
      "Quadro visual com card de autoridade e selo de avaliação 5 estrelas",
      "Faixa executiva de 3 pilares + Vitrine numerada de especialidades",
      "Tipografia Manrope ExtraBold + DM Sans focada em confiança imediata",
    ],
    colors: ["#0C2926", "#2F6353", "#B5D7B6", "#F8F6F0"],
  },
  {
    id: "vitrine-express",
    name: "Lojas, Farmácias, Oficinas & Comércio",
    subtitle: "Farmácias, Autopeças, Móveis Planejados, Gás & Varejo Geral",
    badge: "Modelo #07 · Comércio",
    sourceFile: "comercio-varejo",
    archetype: "produtos",
    paletteId: "vitrine-azul",
    fontId: "outfit",
    description:
      "Estrutura comercial direta com barra de vantagens no topo (Entrega rápida, Pix, Parcelamento, Garantia), Hero vitrine com chamada imediata e catálogo completo de produtos com pedido em 1 clique no WhatsApp.",
    highlights: [
      "Topbar fixa com 4 gatilhos comerciais (Entrega, Pix, Parcelamento, Garantia)",
      "Hero Vitrine escuro com chip de atendimento imediato no WhatsApp",
      "Catálogo de produtos categorizado com botão de orçamento rápido",
      "Destaque de oferta + Mapa e rotas Google Maps / Waze",
    ],
    colors: ["#111827", "#2563EB", "#60A5FA", "#F9FAFB"],
  },
  {
    id: "novolar-moveis",
    name: "Móveis, Colchões & Ambientes (Estilo Novo Lar)",
    subtitle: "Lojas de Móveis, Colchões, Decoração, Planejados & Eletros",
    badge: "Modelo #08 · Mega Vitrine",
    sourceFile: "novolar-moveis",
    archetype: "produtos",
    paletteId: "novolar-red-navy",
    fontId: "outfit",
    description:
      "Design imersivo para grandes lojas de móveis e ambientes. Traz Hero cinematográfico com carrossel full-screen, degradê lateral e chamadas comerciais de alto impacto ('Seu lar com mais conforto e qualidade'), barra de 4 diferenciais (Atendimento, Variedade, Pagamento facilitado, Entrega rápida), vitrine de ambientes e destaque para Colchões & Camas Box.",
    highlights: [
      "Hero Full-Width com Carrossel de Ambientes & Sofás e Degradê Lateral",
      "Barra de 4 Diferenciais Comerciais com ícones elegantes",
      "Vitrine de Ambientes (Sofás, Colchões, Mesas, Cozinhas Planejadas)",
      "Seção 'Conheça a Loja por Dentro' com fotos reais e Mapa Google",
    ],
    colors: ["#0F172A", "#DC2626", "#F87171", "#FFFFFF"],
  },
];

export const BUTTON_EFFECTS = [
  { id: "lift", name: "Elevação Suave" },
  { id: "shimmer", name: "Brilho Shimmer" },
  { id: "pulse", name: "Pulso Discreto" },
  { id: "outline", name: "Contorno" },
];

export const stripEmojis = (s) =>
  String(s ?? "")
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export const esc = (s) =>
  stripEmojis(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const waLink = (b, msg) => `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(msg)}`;

export const initials = (name) =>
  String(name || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const formatRating = (r) => Number(r ?? 5).toFixed(1).replace(".", ",");

const I = (paths, fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICONS = {
  star: I(`<path fill="#F5B301" stroke="none" d="M12 2l2.94 6.36 6.96.8-5.16 4.73 1.4 6.86L12 17.27l-6.14 3.48 1.4-6.86L2.1 9.16l6.96-.8z"/>`, true),
  phone: I(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`),
  mappin: I(`<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`),
  clock: I(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),
  chevL: I(`<path d="m15 18-6-6 6-6"/>`),
  chevR: I(`<path d="m9 18 6-6-6-6"/>`),
  x: I(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),
  check: I(`<path d="M20 6 9 17l-5-5"/>`),
  checkDouble: I(`<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>`),
  truck: I(`<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h-5"/><path d="M15 8h4l3 5v4a1 1 0 0 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>`),
  percent: I(`<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>`),
  shield: I(`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>`),
  sofa: I(`<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/>`),
  card: I(`<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>`),
  sparkles: I(`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>`),
  arrowR: I(`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`),
  arrowUpRight: I(`<path d="M7 17 17 7"/><path d="M7 7h10v10"/>`),
  play: I(`<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>`, true),
  quote: I(`<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>`),
  utensils: I(`<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`),
  calendar: I(`<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>`),
  award: I(`<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>`),
  users: I(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`),
  heart: I(`<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>`),
  search: I(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`),
  navigation: I(`<polygon points="3 11 22 2 13 21 11 13 3 11"/>`),
  verified: I(`<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>`),
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>`,
  google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>`,
};

export function buildCss(v, font, arch, templateId = "") {
  return `
:root{--pri:${v.pri};--sec:${v.sec};--acc:${v.acc};--bg:${v.bg};--ink:${v.ink};--soft:${v.soft};--fh:${font.heading};--fb:${font.body};}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{text-decoration:none;color:inherit}
svg{width:1.15em;height:1.15em;flex:none}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sec)}
.eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--acc);box-shadow:0 0 10px var(--acc)}
body h1,body h2,body h3{font-family:var(--fh);letter-spacing:-.045em;line-height:1.05;font-weight:700}
body h1{font-size:clamp(38px,5.4vw,68px)}
body h2{font-size:clamp(30px,3.6vw,46px)}
body h2 em,body h1 em{font-style:italic;color:var(--acc);letter-spacing:-.02em}
.arch-servicos h2 em,.arch-servicos h1 em{color:var(--sec)}
.sub{font-size:17px;line-height:1.65;color:color-mix(in srgb,var(--ink) 72%,transparent);max-width:560px}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 28px;border-radius:999px;font-weight:700;font-size:15px;font-family:var(--fb);cursor:pointer;border:none;position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s,background-color .25s,color .25s;white-space:nowrap}
.btn svg{width:18px;height:18px}
.btn-pri{background:var(--sec);color:#fff}
.btn-acc{background:var(--acc);color:var(--pri)}
.btn-ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.bfx-lift:hover{transform:translateY(-3px);box-shadow:0 14px 30px -10px rgba(0,0,0,.35)}
.bfx-shimmer::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.45) 50%,transparent 60%);transform:translateX(-120%);animation:shimmer 2.8s infinite}
@keyframes shimmer{60%{transform:translateX(120%)}100%{transform:translateX(120%)}}
.bfx-pulse{animation:pulse 2.4s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sec) 45%,transparent)}55%{box-shadow:0 0 0 12px transparent}}
.bfx-outline{background:transparent!important;color:var(--sec)!important;box-shadow:inset 0 0 0 2px var(--sec)}
.bfx-outline:hover{background:var(--sec)!important;color:#fff!important}
[data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.2,.65,.3,1),transform .8s cubic-bezier(.2,.65,.3,1)}
[data-reveal].in{opacity:1;transform:none}

/* HEADER & TOPBAR (No overlap with long business names) */
.hdr{position:sticky;top:0;left:0;right:0;z-index:60;transition:background .3s,box-shadow .3s}
.arch-gastronomia .hdr{position:fixed;background:color-mix(in srgb,var(--pri) 82%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#F4F1E6}
.arch-servicos .hdr{background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:var(--ink);border-bottom:1px solid rgba(15,23,42,.07)}
.arch-produtos .hdr{background:var(--pri);color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}
.hdr-in{display:flex;align-items:center;justify-content:space-between;min-height:74px;padding-top:10px;padding-bottom:10px;gap:20px}
.brand{font-family:var(--fh);font-weight:800;font-size:18px;letter-spacing:-.03em;display:flex;align-items:center;gap:10px;min-width:0;max-width:340px;line-height:1.2}
.brand span[data-edit]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.brand-dot{width:9px;height:9px;border-radius:50%;background:var(--acc);flex:none}
.brand-logo{height:40px;max-width:170px;width:auto;object-fit:contain;display:block;border-radius:6px;flex:none}
.brand-logo.round{border-radius:50%;width:40px}
.foot-logo{height:48px;max-width:200px;width:auto;object-fit:contain;display:block;margin-bottom:14px}
.hours-list{display:grid;gap:4px;margin-top:4px}
.hours-list span{display:flex;justify-content:space-between;gap:14px;font-size:13px;color:rgba(255,255,255,.72)}
.hours-list span.today{color:#fff;font-weight:700}
.feat-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.feat-chips span{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;background:color-mix(in srgb,var(--sec) 10%,transparent);color:var(--ink)}
.feat-chips span svg{width:13px;height:13px;color:var(--sec)}
.hdr nav{display:flex;gap:22px;font-size:13.5px;font-weight:600;flex-shrink:0}
.hdr nav a{opacity:.85;transition:opacity .2s;white-space:nowrap}
.hdr nav a:hover{opacity:1}
.hdr .btn{padding:11px 22px;font-size:13.5px;flex-shrink:0}
.hdr-city{display:flex;align-items:center;gap:6px;font-size:12px;opacity:.8;font-weight:600;white-space:nowrap}

/* TOPBAR vantagens (produtos) */
.topbar{background:color-mix(in srgb,var(--pri) 88%,#000);color:#fff;font-size:12px;font-weight:600;position:relative;z-index:61;border-bottom:1px solid rgba(255,255,255,.08)}
.topbar-in{display:flex;justify-content:center;gap:28px;padding:8px 16px;flex-wrap:wrap}
.topbar span{display:inline-flex;align-items:center;gap:6px;opacity:.92;white-space:nowrap}

/* HERO gastronomia */
.hero{position:relative;min-height:100svh;display:flex;align-items:center;color:#fff;overflow:hidden}
.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,color-mix(in srgb,var(--pri) 96%,transparent) 0%,color-mix(in srgb,var(--pri) 82%,transparent) 38%,color-mix(in srgb,var(--pri) 45%,transparent) 62%,color-mix(in srgb,var(--pri) 12%,transparent) 88%)}
.hero-in{position:relative;z-index:2;padding-top:110px;padding-bottom:80px;display:flex;flex-direction:column;gap:22px}
.hero-in h1{text-shadow:0 3px 26px rgba(0,0,0,.4)}
.hero-in .sub{text-shadow:0 2px 14px rgba(0,0,0,.4)}
.hero .eyebrow{color:var(--acc)}
.hero p.sub{color:rgba(255,255,255,.82)}
.hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px}
.hero-addr{display:flex;align-items:center;gap:9px;font-size:13.5px;opacity:.85;margin-top:8px}
.hero-badge{position:absolute;right:5vw;bottom:9vh;z-index:2;background:rgba(255,255,255,.1);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.22);border-radius:18px;padding:16px 22px;display:flex;align-items:center;gap:14px;color:#fff}
.hero-badge .n{font-family:var(--fh);font-size:30px;font-weight:800}
.hero-badge small{opacity:.8;font-size:12px;display:block}

/* HERO servicos (split) */
.arch-servicos .hero{background:var(--bg);color:var(--ink);min-height:auto;padding:80px 0 90px}
.arch-servicos .hero::before{display:none}
.arch-servicos .hero-in{display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:center;padding-top:0;padding-bottom:0}
.arch-servicos .hero-in h1,.arch-servicos .hero-in .sub{text-shadow:none}
.arch-servicos .hero p.sub{color:color-mix(in srgb,var(--ink) 70%,transparent)}
.arch-servicos .hero-badge{position:absolute;left:-26px;bottom:-22px;right:auto;background:#fff;color:var(--ink);border:1px solid rgba(15,23,42,.08);box-shadow:0 20px 45px -18px rgba(15,23,42,.25)}
.hero-frame{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:4/4.6;box-shadow:0 40px 80px -30px rgba(15,23,42,.35)}
.hero-frame img{width:100%;height:100%;object-fit:cover}
.hero-trust{display:flex;gap:26px;margin-top:14px;flex-wrap:wrap}
.hero-trust div{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.hero-trust svg{color:var(--sec)}

/* HERO produtos */
.arch-produtos .hero{background:var(--pri);min-height:auto;padding:76px 0 80px}
.arch-produtos .hero::before{background:radial-gradient(900px 480px at 82% 18%,color-mix(in srgb,var(--sec) 38%,transparent),transparent 65%)}
.arch-produtos .hero-in{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center;padding-top:0;padding-bottom:0}
.arch-produtos .hero-frame{aspect-ratio:1/1.05;border-radius:22px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6)}
.hero-chip{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;color:#fff;width:fit-content}
.hero-chip svg{color:var(--acc)}

/* Quickstrip */
.quick{margin-top:-58px;position:relative;z-index:5}
.quick-in{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.quick-card{background:#fff;border-radius:20px;padding:22px 24px;display:flex;align-items:center;gap:18px;cursor:pointer;border:1px solid rgba(0,0,0,.05);box-shadow:0 24px 50px -24px rgba(27,37,22,.28);transition:transform .3s,box-shadow .3s;text-align:left}
.quick-card:hover{transform:translateY(-4px)}
.quick-card .ic{width:52px;height:52px;border-radius:15px;background:var(--soft);color:var(--sec);display:grid;place-items:center}
.quick-card .ic svg{width:24px;height:24px}
.quick-card b{display:block;font-size:16px;letter-spacing:-.02em}
.quick-card small{color:color-mix(in srgb,var(--ink) 60%,transparent);font-size:13px}
.quick-card>svg{margin-left:auto;color:var(--sec)}

/* Seções genéricas */
.sec{padding:96px 0}
.sec-head{display:flex;flex-direction:column;gap:14px;margin-bottom:48px}
.sec-head.center{align-items:center;text-align:center}
.sec-head.center .sub{margin:0 auto}

/* Menu / catálogo */
.pills{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:36px}
.pill{padding:10px 22px;border-radius:999px;font-size:13.5px;font-weight:700;cursor:pointer;border:1.5px solid color-mix(in srgb,var(--ink) 14%,transparent);background:transparent;color:var(--ink);transition:all .25s;font-family:var(--fb)}
.pill.on,.pill:hover{background:var(--pri);color:#fff;border-color:var(--pri)}
.grid-menu{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.card-item{background:#fff;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,.05);box-shadow:0 18px 40px -24px rgba(0,0,0,.22);display:flex;flex-direction:column;transition:transform .3s,box-shadow .3s}
.card-item:hover{transform:translateY(-5px);box-shadow:0 30px 55px -25px rgba(0,0,0,.3)}
.card-ph{position:relative;aspect-ratio:16/10.5;overflow:hidden;cursor:pointer}
.card-ph img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.65,.3,1)}
.card-item:hover .card-ph img{transform:scale(1.06)}
.card-badge{position:absolute;top:14px;left:14px;background:var(--acc);color:var(--pri);font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:7px 13px;border-radius:999px;box-shadow:0 8px 20px -6px rgba(0,0,0,.35)}
.card-body{padding:20px 22px 22px;display:flex;flex-direction:column;gap:9px;flex:1}
.card-body h3{font-size:19px}
.card-body p{font-size:13.5px;line-height:1.55;color:color-mix(in srgb,var(--ink) 62%,transparent);flex:1}
.card-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:6px}
.price{font-family:var(--fh);font-weight:800;font-size:19px;color:var(--sec);letter-spacing:-.02em}
.card-order{display:inline-flex;align-items:center;gap:8px;background:var(--pri);color:#fff;border:none;padding:10px 18px;border-radius:999px;font-weight:700;font-size:13px;cursor:pointer;font-family:var(--fb);transition:transform .25s,background .25s;position:relative;overflow:hidden}
.card-order:hover{background:var(--sec);transform:translateY(-2px)}
.card-order svg{width:15px;height:15px}

/* Spotlight */
.spot{background:var(--pri);color:#fff;border-radius:0;position:relative;overflow:hidden}
.spot-in{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.spot .eyebrow{color:var(--acc)}
.spot p{color:rgba(255,255,255,.78);line-height:1.7;font-size:16px}
.spot-car{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:4/3.2;box-shadow:0 40px 80px -30px rgba(0,0,0,.5)}
.spot-car img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .7s}
.spot-car img.on{opacity:1}
.spot-nav{position:absolute;bottom:18px;right:18px;display:flex;gap:10px;z-index:3}
.spot-nav button{width:42px;height:42px;border-radius:50%;border:none;background:rgba(255,255,255,.92);color:var(--pri);cursor:pointer;display:grid;place-items:center;transition:transform .2s}
.spot-nav button:hover{transform:scale(1.08)}
.spot-stats{display:flex;gap:34px;margin-top:26px}
.spot-stats b{font-family:var(--fh);font-size:30px;display:block;color:var(--acc)}
.spot-stats small{opacity:.75;font-size:12.5px}

/* Sobre */
.about-in{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.about-ph{position:relative}
.about-ph img{border-radius:24px;aspect-ratio:4/4.4;object-fit:cover;width:100%;box-shadow:0 35px 70px -28px rgba(0,0,0,.3)}
.about-tag{position:absolute;top:22px;left:-18px;background:var(--pri);color:#fff;border-radius:16px;padding:14px 20px;font-size:13px;font-weight:700;box-shadow:0 18px 40px -14px rgba(0,0,0,.4);display:flex;gap:10px;align-items:center}
.about-tag svg{color:var(--acc)}
.about-list{display:flex;flex-direction:column;gap:13px;margin-top:22px}
.about-list li{list-style:none;display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.about-list svg{color:var(--sec);margin-top:2px}

/* Galeria */
.gal-tabs{display:flex;gap:10px;justify-content:center;margin-bottom:36px}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gal figure{border-radius:16px;overflow:hidden;cursor:zoom-in;position:relative;margin:0;aspect-ratio:4/3;box-shadow:0 4px 14px rgba(0,0,0,.06)}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.gal figure:hover img{transform:scale(1.05)}
@media (max-width:768px){.gal{grid-template-columns:repeat(2,1fr);gap:12px}}
.lightbox{position:fixed;inset:0;z-index:100;background:rgba(8,10,8,.9);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:4vw}
.lightbox.open{display:flex}
.lightbox img{max-width:92vw;max-height:86vh;border-radius:18px;box-shadow:0 40px 90px rgba(0,0,0,.6)}
.lightbox button{position:absolute;top:26px;right:26px;width:46px;height:46px;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;display:grid;place-items:center}

/* Bento (serviços) */
.bento{display:grid;grid-template-columns:1.25fr 1fr 1fr;grid-template-rows:auto auto;gap:20px}
.bento-card{background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:22px;padding:30px;display:flex;flex-direction:column;gap:14px;transition:transform .3s,box-shadow .3s;position:relative;overflow:hidden}
.bento-card:hover{transform:translateY(-4px);box-shadow:0 26px 50px -24px rgba(15,23,42,.22)}
.bento-card.big{grid-row:span 2;background:var(--pri);color:#fff;justify-content:flex-end;min-height:420px}
.bento-card.big::before{content:"";position:absolute;inset:0;background:var(--bimg) center/cover;opacity:.28}
.bento-card.big>*{position:relative}
.bento-ic{width:50px;height:50px;border-radius:14px;background:var(--soft);color:var(--sec);display:grid;place-items:center}
.bento-ic svg{width:23px;height:23px}
.bento-card.big .bento-ic{background:rgba(255,255,255,.14);color:var(--acc)}
.bento-card h3{font-size:20px}
.bento-card.big h3{font-size:27px}
.bento-card p{font-size:13.5px;line-height:1.6;color:color-mix(in srgb,var(--ink) 62%,transparent);flex:1}
.bento-card.big p{color:rgba(255,255,255,.78)}
.bento-link{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--sec)}
.bento-card.big .bento-link{color:var(--acc)}
.bento-link svg{transition:transform .25s}
.bento-link:hover svg{transform:translateX(4px)}

/* Passos */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.step{background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:22px;padding:32px 28px;display:flex;flex-direction:column;gap:13px}
.step .num{font-family:var(--fh);font-size:44px;font-weight:800;color:var(--acc);letter-spacing:-.04em;line-height:1}
.step h3{font-size:19px}
.step p{font-size:13.5px;line-height:1.6;color:color-mix(in srgb,var(--ink) 62%,transparent)}

/* Autoridade */
.auth-in{display:grid;grid-template-columns:.95fr 1.05fr;gap:64px;align-items:center}
.auth-nums{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:30px}
.auth-num{background:#fff;border:1px solid rgba(15,23,42,.07);border-radius:18px;padding:22px}
.auth-num b{font-family:var(--fh);font-size:32px;color:var(--sec);display:block;letter-spacing:-.03em}
.auth-num small{font-size:12.5px;color:color-mix(in srgb,var(--ink) 60%,transparent);font-weight:600}

/* Promo */
.promo{background:linear-gradient(120deg,var(--pri),color-mix(in srgb,var(--pri) 70%,var(--sec)));color:#fff}
.promo-in{display:flex;align-items:center;justify-content:space-between;gap:44px;flex-wrap:wrap}
.promo-eyebrow{color:var(--acc);font-size:11.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;gap:9px}
.promo h2{color:#fff;margin:10px 0 8px}
.promo .old{text-decoration:line-through;opacity:.6;font-size:17px;margin-right:12px}
.promo .new{font-family:var(--fh);font-size:38px;font-weight:800;color:var(--acc);letter-spacing:-.03em}
.count{display:flex;gap:12px;margin-top:6px}
.count div{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 16px;text-align:center;min-width:76px}
.count b{font-family:var(--fh);font-size:30px;display:block;font-variant-numeric:tabular-nums}
.count small{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;opacity:.75;font-weight:700}

/* Vídeo */
.video-frame{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:16/8;box-shadow:0 40px 80px -30px rgba(0,0,0,.35);background:#0b0f0c}
.video-frame iframe,.video-frame video{width:100%;height:100%;border:0;object-fit:cover}
.video-cover{position:absolute;inset:0;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;cursor:pointer}
.video-cover::before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.45),rgba(0,0,0,.15))}
.video-play{position:relative;width:84px;height:84px;border-radius:50%;background:var(--acc);color:var(--pri);display:grid;place-items:center;border:none;cursor:pointer;transition:transform .3s;box-shadow:0 20px 50px -12px rgba(0,0,0,.5)}
.video-play:hover{transform:scale(1.1)}
.video-play svg{width:30px;height:30px;margin-left:4px}

/* Avaliações */
.rev{background:var(--soft)}
.rev-sum{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.rev-score{font-family:var(--fh);font-size:64px;font-weight:800;letter-spacing:-.04em;line-height:1}
.rev-stars{display:flex;gap:3px}
.rev-stars svg{width:20px;height:20px}
.rev-count{font-size:13.5px;color:color-mix(in srgb,var(--ink) 60%,transparent);font-weight:600}
.rev-google{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:color-mix(in srgb,var(--ink) 70%,transparent)}
.rev-google svg{width:26px;height:26px}
.rev-track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding:34px 4px 14px;scrollbar-width:none}
.rev-track::-webkit-scrollbar{display:none}
.rev-card{scroll-snap-align:start;flex:0 0 calc(33.333% - 14px);background:#fff;border-radius:20px;padding:26px;border:1px solid rgba(0,0,0,.05);box-shadow:0 16px 36px -22px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:13px}
.rev-head{display:flex;align-items:center;gap:13px}
.rev-av{width:44px;height:44px;border-radius:50%;background:var(--pri);color:var(--acc);display:grid;place-items:center;font-weight:800;font-size:14px;letter-spacing:.02em}
.rev-head b{font-size:14.5px;display:block}
.rev-head small{font-size:12px;color:color-mix(in srgb,var(--ink) 55%,transparent)}
.rev-card p{font-size:13.5px;line-height:1.65;color:color-mix(in srgb,var(--ink) 72%,transparent);flex:1}
.rev-nav{display:flex;gap:10px}
.rev-nav button{width:44px;height:44px;border-radius:50%;border:1.5px solid color-mix(in srgb,var(--ink) 15%,transparent);background:#fff;color:var(--ink);cursor:pointer;display:grid;place-items:center;transition:all .25s}
.rev-nav button:hover{background:var(--pri);color:#fff;border-color:var(--pri)}
.rev-cta{margin-top:26px;display:flex;justify-content:center}

/* Localização */
.loc{background:#fff;border-radius:26px;overflow:hidden;border:1px solid rgba(0,0,0,.06);box-shadow:0 30px 60px -30px rgba(0,0,0,.22);display:grid;grid-template-columns:1fr 1.2fr}
.loc-info{padding:44px;display:flex;flex-direction:column;gap:16px}
.loc-line{display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:color-mix(in srgb,var(--ink) 75%,transparent)}
.loc-line svg{color:var(--sec);margin-top:2px}
.open-badge{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:#15803d;background:#dcfce7;border-radius:999px;padding:7px 14px;width:fit-content}
.open-badge.closed{color:#b45309;background:#fef3c7}
.open-badge i{width:8px;height:8px;border-radius:50%;background:currentColor;display:block;animation:pulse 2s infinite}
.loc-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}
.loc-map{min-height:380px}
.loc-map iframe{width:100%;height:100%;border:0;display:block;min-height:380px}

/* FAQ */
.faq{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.faq details{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:0 24px;transition:box-shadow .3s}
.faq details[open]{box-shadow:0 16px 36px -20px rgba(0,0,0,.18)}
.faq summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0;font-weight:700;font-size:15.5px;letter-spacing:-.01em}
.faq summary::-webkit-details-marker{display:none}
.faq summary svg{color:var(--sec);transition:transform .3s}
.faq details[open] summary svg{transform:rotate(45deg)}
.faq .a{padding:0 0 22px;font-size:14.5px;line-height:1.7;color:color-mix(in srgb,var(--ink) 65%,transparent)}

/* Bottom shell / footer */
.bottom{background:var(--pri);color:#fff}
.bottom-cta{text-align:center;padding:90px 24px 70px;border-bottom:1px solid rgba(255,255,255,.1)}
.bottom-cta .eyebrow{color:var(--acc);justify-content:center}
.bottom-cta h2{color:#fff;margin:14px 0 12px}
.bottom-cta p{color:rgba(255,255,255,.72);max-width:520px;margin:0 auto 28px;line-height:1.7}
.foot{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:44px;padding:60px 0 46px}
.foot h4{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--acc);margin-bottom:16px;font-weight:800}
.foot p,.foot a{color:rgba(255,255,255,.72);font-size:14px;line-height:1.8;display:block}
.foot a:hover{color:#fff}
.foot-brand{font-family:var(--fh);font-size:22px;font-weight:800;margin-bottom:12px}
.copy{border-top:1px solid rgba(255,255,255,.1);padding:20px 0;text-align:center;font-size:12.5px;color:rgba(255,255,255,.5)}

/* Barra WhatsApp mobile */
.wa-bar{position:fixed;left:14px;right:14px;bottom:14px;z-index:70;display:none;background:var(--sec);color:#fff;border-radius:18px;padding:14px 20px;align-items:center;gap:13px;font-weight:800;font-size:15px;box-shadow:0 20px 45px -12px rgba(0,0,0,.45);transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.65,.3,1);border:none;font-family:var(--fb);cursor:pointer;justify-content:center}
.wa-bar.show{transform:none}
.wa-bar svg{width:20px;height:20px}

/* ---------------- TEMPLATE #02: ATELIÊ DA VAL V5 (EDITORIAL BOUTIQUE) ---------------- */
.tpl-atelie-val h1,.tpl-atelie-val h2,.tpl-atelie-val h3{font-weight:500;letter-spacing:-.02em}
.tpl-atelie-val .eyebrow{color:var(--sec);letter-spacing:.18em}
.tpl-atelie-val .eyebrow::before{width:26px;height:1px;border-radius:0;background:var(--sec);box-shadow:none}
.topnote{background:#eee5dd;border-bottom:1px solid #e6ddd5;font-size:13px;color:#5f554f;padding:9px 0}
.topnote-in{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.topnote a{color:var(--sec);font-weight:600}
.tpl-atelie-val .hdr{background:rgba(250,247,242,.95);border-bottom:1px solid #e6ddd5}
.tpl-atelie-val .hdr-in{min-height:84px}
.brand-seal{width:46px;height:46px;border-radius:50%;border:1px solid #cdb09e;display:grid;place-items:center;font-family:var(--fh);font-size:17px;color:var(--sec);background:linear-gradient(180deg,#fff,#f4ede6);position:relative;flex:none}
.brand-seal::after{content:"";position:absolute;inset:4px;border-radius:50%;border:1px dashed rgba(165,114,88,.45)}
.brand-copy{display:flex;flex-direction:column;min-width:0}
.brand-copy strong{font-family:var(--fh);font-size:24px;font-weight:500;line-height:1.05;color:var(--ink)}
.brand-copy small{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8c7f77;margin-top:2px}
.tpl-atelie-val .hero{background:radial-gradient(circle at 85% 20%,rgba(173,128,110,.15),transparent 36%),linear-gradient(180deg,#f9f6f1 0%,var(--bg) 100%);padding:48px 0 68px}
.tpl-atelie-val .hero-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-top:22px;border-top:1px solid #e6ddd5;width:100%}
.tpl-atelie-val .hero-metrics b{display:block;font-family:var(--fh);font-size:28px;font-weight:500;color:var(--ink)}
.tpl-atelie-val .hero-metrics span{font-size:13px;color:#665c56}
.tpl-atelie-val .hero-card-art{position:relative;border-radius:30px;overflow:hidden;min-height:540px;background:#e8ddd2;box-shadow:0 18px 50px rgba(59,45,35,.08);border:1px solid rgba(255,255,255,.75)}
.tpl-atelie-val .hero-card-art img{width:100%;height:100%;min-height:540px;object-fit:cover}
.tpl-atelie-val .hero-card-cap{position:absolute;left:22px;right:22px;bottom:22px;background:rgba(250,246,241,.92);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.8);border-radius:20px;padding:16px 18px;display:flex;justify-content:space-between;gap:14px;align-items:center}
.tpl-atelie-val .hero-card-cap strong{display:block;font-family:var(--fh);font-size:21px;font-weight:500;color:var(--ink)}
.tpl-atelie-val .hero-card-cap span{font-size:13px;color:#665c56}
.tpl-atelie-val .pill-badge{background:#fff;border:1px solid #e6ddd5;border-radius:999px;padding:9px 14px;font-size:12px;font-weight:700;color:var(--sec);white-space:nowrap}
.services-grid-val{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.service-card-val{background:rgba(255,255,255,.84);border:1px solid #e6ddd5;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(59,45,35,.06);display:flex;flex-direction:column;transition:transform .25s ease,box-shadow .25s ease}
.service-card-val:hover{transform:translateY(-4px);box-shadow:0 24px 55px rgba(59,45,35,.12)}
.service-media-val{height:240px;background:#efe6dc;position:relative;overflow:hidden;cursor:pointer}
.service-media-val img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.service-card-val:hover .service-media-val img{transform:scale(1.05)}
.service-body-val{padding:22px;display:flex;flex-direction:column;gap:12px;flex:1}
.service-body-val h3{font-size:25px;font-weight:500;line-height:1.12}
.service-body-val p{margin:0;color:#665c56;font-size:14.5px;line-height:1.65;flex:1}
.service-foot-val{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:10px;border-top:1px solid #eee4dc}
.service-tag-val{font-size:11.5px;text-transform:uppercase;letter-spacing:.12em;color:#8c7f77;font-weight:700}
.discover-val{width:38px;height:38px;border-radius:50%;border:1px solid #dac8bb;display:grid;place-items:center;color:var(--pri);background:#fff;transition:.2s ease}
.service-card-val:hover .discover-val{background:var(--pri);color:#fff;border-color:var(--pri)}
.note-val{margin-top:18px;font-size:13.5px;color:#8c7f77}

/* ---------------- TEMPLATE #03: CONCEITO EXECUTIVO #01 (EMERALD & SAGE) ---------------- */
.tpl-modelo-premium h1,.tpl-modelo-premium h2,.tpl-modelo-premium h3{font-weight:800;letter-spacing:-.045em}
.tpl-modelo-premium .hdr{background:rgba(12,41,38,.94);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08);color:#fff}
.tpl-modelo-premium .hdr-in{min-height:82px}
.logo-mark-exec{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#d2ead035,#ffffff12);border:1px solid rgba(181,215,182,.45);color:var(--acc);font-weight:800;font-size:15px;flex:none}
.brand-exec{display:flex;align-items:center;gap:12px;color:#fff;min-width:0}
.brand-exec strong{display:block;font-size:16px;letter-spacing:-.02em;line-height:1.15}
.brand-exec span{display:block;font-size:11.5px;color:rgba(255,255,255,.64);font-weight:500}
.tpl-modelo-premium .hero{background:var(--pri);color:#fff;padding:64px 0 88px;position:relative;overflow:hidden}
.tpl-modelo-premium .hero::before{display:block;content:"";position:absolute;width:460px;height:460px;border-radius:50%;background:#6ca48f;filter:blur(90px);opacity:.18;top:-140px;right:-100px;pointer-events:none}
.tpl-modelo-premium .hero .eyebrow{color:var(--acc)}
.tpl-modelo-premium .hero .eyebrow::before{width:24px;height:1.5px;border-radius:99px;background:var(--acc);box-shadow:none}
.tpl-modelo-premium .hero h1{color:#fff}
.tpl-modelo-premium .hero h1 em{color:var(--acc);font-style:normal}
.tpl-modelo-premium .hero p.sub{color:rgba(255,255,255,.78)}
.hero-proof-exec{display:flex;flex-wrap:wrap;gap:18px;margin-top:10px;color:rgba(255,255,255,.76);font-size:14px;font-weight:600}
.hero-proof-exec span{display:inline-flex;align-items:center;gap:9px}
.hero-proof-exec i{width:20px;height:20px;border-radius:50%;display:inline-grid;place-items:center;background:rgba(181,215,182,.16);color:var(--acc);font-style:normal;font-size:12px}
.visual-frame-exec{position:relative;min-height:480px;border-radius:28px;padding:24px;background:linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px rgba(7,26,24,.32);overflow:hidden;display:flex;align-items:flex-end}
.visual-bg-exec{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55;cursor:pointer}
.visual-pattern-exec{position:absolute;inset:22px;border-radius:22px;border:1px solid rgba(255,255,255,.12);pointer-events:none}
.visual-card-exec{position:relative;z-index:2;max-width:340px;background:rgba(248,246,240,.96);color:var(--ink);padding:24px;border-radius:22px;box-shadow:0 20px 50px rgba(0,0,0,.22)}
.visual-card-exec small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#4a6762;margin-bottom:8px;font-weight:800}
.visual-card-exec strong{display:block;font-size:24px;line-height:1.08;letter-spacing:-.04em;margin-bottom:8px;font-family:var(--fh)}
.visual-card-exec p{margin:0;color:#526965;font-size:13.5px;line-height:1.55}
.floating-badge-exec{position:absolute;top:24px;right:24px;z-index:2;width:96px;height:96px;border-radius:24px;background:#f4d7a4;color:#17302e;display:grid;place-items:center;text-align:center;padding:10px;font-weight:800;line-height:1.1;font-size:12px;transform:rotate(8deg);box-shadow:0 18px 34px rgba(0,0,0,.22)}
.strip-exec{background:#fff;border-bottom:1px solid rgba(18,45,42,.08)}
.strip-grid-exec{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:30px 0}
.strip-item-exec{display:flex;gap:14px;align-items:flex-start}
.strip-icon-exec{width:42px;height:42px;border-radius:14px;background:#ecf3eb;color:var(--pri);display:grid;place-items:center;font-weight:800;flex:0 0 auto}
.strip-item-exec strong{display:block;margin-bottom:4px;font-size:15.5px}
.strip-item-exec p{margin:0;color:#5a706c;font-size:13.5px;line-height:1.55}
.cards-exec{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.card-exec{background:#fff;border-radius:26px;padding:28px;border:1px solid rgba(18,45,42,.08);box-shadow:0 12px 35px rgba(10,31,29,.05);display:flex;flex-direction:column;justify-content:space-between;min-height:310px;transition:transform .25s,box-shadow .25s}
.card-exec:hover{transform:translateY(-4px);box-shadow:0 22px 45px rgba(10,31,29,.1)}
.card-exec-ph{height:175px;border-radius:18px;overflow:hidden;margin-bottom:18px;cursor:pointer}
.card-exec-ph img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.card-exec:hover .card-exec-ph img{transform:scale(1.05)}
.card-exec .tag-exec{display:inline-flex;align-items:center;gap:8px;width:fit-content;padding:6px 12px;border-radius:999px;background:#eff5ee;color:#1e4a41;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px}
.card-exec h3{margin:0 0 10px;font-size:24px;line-height:1.12;letter-spacing:-.04em}
.card-exec p{margin:0 0 20px;color:#5a706c;font-size:14.5px;line-height:1.6;flex:1}
.card-link-exec{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:14px;color:var(--pri)}

/* ---------------- ZYCRON TEMPLATES & FLOATING SMART PILL ---------------- */
.zycron-dock-wrap{position:fixed;left:0;right:0;bottom:14px;z-index:80;display:flex;justify-content:center;padding:0 12px;pointer-events:none}
.zycron-dock{pointer-events:auto;background:rgba(20,20,20,.95);backdrop-filter:blur(14px);color:#fff;border-radius:999px;padding:6px;display:flex;align-items:center;gap:8px;box-shadow:0 18px 44px -14px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12);max-width:520px;width:auto}
.zycron-dock-status{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.9);white-space:nowrap}
.zycron-dock-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.25);flex:none}
.zycron-dock-dot.closed{background:#fbbf24;box-shadow:0 0 0 3px rgba(251,191,36,.25)}
.zycron-dock-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 18px;border-radius:999px;background:var(--sec);color:#fff;font-size:13.5px;font-weight:700;white-space:nowrap;transition:transform .2s,filter .2s}
.zycron-dock-cta:hover{transform:translateY(-1px);filter:brightness(1.1)}
.zycron-dock-ic{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;display:grid;place-items:center;transition:background .2s;flex:none}
.zycron-dock-ic:hover{background:rgba(255,255,255,.22)}

/* Zycron #01: Dark Split (Barbearia Dom Bigode) */
.tpl-zycron-barbearia h1,.tpl-zycron-barbearia h2,.tpl-zycron-barbearia h3{text-transform:uppercase;letter-spacing:.01em;line-height:.95;font-weight:400}
.tpl-zycron-barbearia .hdr{background:var(--bg);border-bottom:1px solid rgba(20,23,27,.1);color:var(--ink)}
.zycron-barber-hero-card{background:#16181B;color:#fff;border-radius:20px;overflow:hidden;display:grid;grid-template-columns:1.05fr .95fr;min-height:480px;box-shadow:0 24px 60px -24px rgba(0,0,0,.35)}
.zycron-barber-hero-copy{padding:48px 44px;display:flex;flex-direction:column;justify-content:center;gap:18px}
.zycron-barber-hero-copy h1{font-size:clamp(42px,5.2vw,72px);color:#fff;line-height:.92}
.zycron-barber-hero-copy p{color:rgba(255,255,255,.8);font-size:17px;line-height:1.6;max-width:46ch}
.zycron-barber-hero-ph{position:relative;min-height:380px;overflow:hidden;cursor:pointer}
.zycron-barber-hero-ph img{width:100%;height:100%;object-fit:cover}
.zycron-barber-strip{margin-top:14px;background:#16181B;border-radius:14px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid rgba(255,255,255,.08);overflow:hidden}
.zycron-barber-strip-item{display:flex;align-items:center;gap:14px;padding:18px 22px;border-right:1px solid rgba(255,255,255,.1);color:#fff}
.zycron-barber-strip-item:last-child{border-right:0}
.zycron-barber-strip-ic{width:36px;height:36px;border-radius:50%;background:var(--sec);color:#fff;display:grid;place-items:center;flex:none}
.zycron-barber-strip-item small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.58)}
.zycron-barber-strip-item b{display:block;font-size:14.5px;font-weight:600;color:#fff;margin-top:2px}
.zycron-dark-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.zycron-dark-card{position:relative;aspect-ratio:4/3.3;border-radius:10px;overflow:hidden;background:#16181B;color:#fff;display:block;cursor:pointer}
.zycron-dark-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s}
.zycron-dark-card:hover img{transform:scale(1.06)}
.zycron-dark-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 25%,rgba(0,0,0,.88) 100%);pointer-events:none}
.zycron-dark-card-body{position:absolute;inset:auto 0 0 0;padding:18px;z-index:2}
.zycron-dark-card-body h3{font-size:24px;color:#fff;margin-bottom:6px;line-height:1}
.zycron-dark-card-body p{font-size:13px;line-height:1.45;color:rgba(255,255,255,.82);margin:0}
.zycron-steps-4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;border-top:1.5px solid rgba(20,23,27,.15);padding-top:28px}
.zycron-step-num{font-family:var(--fh);font-size:64px;line-height:.9;color:var(--sec);display:block;margin-bottom:12px}
.zycron-rail{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px;scrollbar-width:none}
.zycron-rail::-webkit-scrollbar{display:none}
.zycron-rail-item{flex:0 0 340px;aspect-ratio:4/3;border-radius:12px;overflow:hidden;position:relative;scroll-snap-align:start;cursor:pointer}
.zycron-rail-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.zycron-rail-item:hover img{transform:scale(1.05)}
.zycron-rail-badge{position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,.65);color:#fff;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;backdrop-filter:blur(6px)}

/* Zycron #02: Arched & Chat (Padaria da Marlene) */
.tpl-zycron-padaria h1,.tpl-zycron-padaria h2,.tpl-zycron-padaria h3{font-weight:400;letter-spacing:-.01em;line-height:1.06}
.tpl-zycron-padaria .hdr{background:var(--bg);border-bottom:1px solid #E6D7EA;color:var(--ink)}
.zycron-arch-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center;padding:44px 0 64px}
.zycron-arch-visual{position:relative;max-width:460px;margin-left:auto;width:100%}
.zycron-arch-main{aspect-ratio:4/4.8;border-radius:999px 999px 28px 28px;overflow:hidden;border:6px solid #fff;box-shadow:0 28px 60px -24px rgba(59,35,66,.25);cursor:pointer}
.zycron-arch-main img{width:100%;height:100%;object-fit:cover}
.zycron-arch-circle{position:absolute;left:-32px;top:36%;width:128px;height:128px;border-radius:50%;overflow:hidden;border:5px solid #fff;box-shadow:0 18px 36px -12px rgba(59,35,66,.3);cursor:pointer;background:#fff}
.zycron-arch-circle img{width:100%;height:100%;object-fit:cover}
.zycron-arch-pill{position:absolute;left:-18px;bottom:22px;background:#fff;border:1px solid #E6D7EA;border-radius:18px;padding:12px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 18px 40px -14px rgba(59,35,66,.22)}
.zycron-chat-steps{display:flex;flex-direction:column;gap:14px;max-width:520px}
.zycron-chat-bubble{background:#D9F6D0;color:#1A2E1A;border-radius:18px 18px 4px 18px;padding:16px 20px;box-shadow:0 8px 22px -12px rgba(0,0,0,.14);position:relative;margin-left:auto;width:100%}
.zycron-chat-bubble b{display:block;font-size:15.5px;margin-bottom:4px;color:#112211}
.zycron-chat-bubble p{font-size:14px;line-height:1.5;margin:0;color:#253D25}
.zycron-chat-faq-item{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.zycron-chat-q{align-self:flex-end;background:var(--sec);color:#fff;padding:11px 18px;border-radius:18px 18px 4px 18px;font-weight:700;font-size:14.5px;display:inline-flex;align-items:center;gap:8px}
.zycron-chat-a{align-self:flex-start;background:#fff;border:1px solid #E6D7EA;color:var(--ink);padding:16px 20px;border-radius:18px 18px 18px 4px;font-size:14.5px;line-height:1.6;max-width:560px;box-shadow:0 10px 24px -16px rgba(59,35,66,.15)}

/* Zycron #03: Lookbook Boutique (Ateliê / Moda) */
.tpl-zycron-moda h1,.tpl-zycron-moda h2,.tpl-zycron-moda h3{font-weight:500;letter-spacing:-.03em;line-height:1}
.tpl-zycron-moda .hdr{background:var(--bg);border-bottom:1px solid rgba(21,21,21,.1);color:var(--ink)}
.zycron-moda-hero-imgs{display:grid;grid-template-columns:1.35fr .65fr;gap:16px;margin-bottom:28px}
.zycron-moda-hero-ph{aspect-ratio:16/9.5;overflow:hidden;position:relative;cursor:pointer;background:#e5e0d8}
.zycron-moda-hero-ph.tall{aspect-ratio:4/4.8}
.zycron-moda-hero-ph img{width:100%;height:100%;object-fit:cover}
.zycron-moda-hero-bar{display:grid;grid-template-columns:1.25fr 1fr auto;gap:32px;align-items:end;padding-top:12px}
.zycron-lookbook-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.zycron-lookbook-card{position:relative;aspect-ratio:4/5;overflow:hidden;display:block;background:#e5e0d8;cursor:pointer}
.zycron-lookbook-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .7s}
.zycron-lookbook-card:hover img{transform:scale(1.05)}
.zycron-lookbook-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.78) 100%);pointer-events:none}
.zycron-lookbook-body{position:absolute;inset:auto 0 0 0;padding:20px;z-index:2;color:#fff}
.zycron-lookbook-body h3{font-size:21px;color:#fff;margin-bottom:6px}
.zycron-lookbook-body p{font-size:13px;color:rgba(255,255,255,.82);line-height:1.45;margin:0}

/* Suspensa */
.susp{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0f0e;color:#fff;text-align:center;padding:24px}
.susp-in{max-width:440px;display:flex;flex-direction:column;gap:16px;align-items:center}
.susp .ic{width:66px;height:66px;border-radius:20px;background:rgba(255,255,255,.08);display:grid;place-items:center;color:#f3c94d}
.susp h1{font-size:26px;letter-spacing:-.03em}
.susp p{color:rgba(255,255,255,.6);font-size:14.5px;line-height:1.7}

/* Responsivo */
@media(max-width:1000px){
  .grid-menu,.cards-exec,.zycron-dark-grid,.zycron-lookbook-grid,.zycron-steps-4{grid-template-columns:repeat(2,1fr)}
  .zycron-barber-hero-card,.zycron-arch-hero,.zycron-moda-hero-imgs,.zycron-moda-hero-bar{grid-template-columns:1fr}
  .zycron-barber-strip{grid-template-columns:1fr}
  .zycron-barber-strip-item{border-right:0;border-bottom:1px solid rgba(255,255,255,.1)}
  .services-grid-val{grid-template-columns:repeat(2,1fr)}
  .strip-grid-exec{grid-template-columns:1fr}
  .bento{grid-template-columns:1fr 1fr}
  .bento-card.big{grid-column:span 2;grid-row:auto;min-height:320px}
  .rev-card{flex-basis:calc(50% - 10px)}
  .spot-in,.about-in,.auth-in{grid-template-columns:1fr;gap:40px}
  .arch-servicos .hero-in,.arch-produtos .hero-in{grid-template-columns:1fr;gap:44px}
  .loc{grid-template-columns:1fr}
  .foot{grid-template-columns:1fr 1fr}
  .gal{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:700px){
  .sec{padding:64px 0}
  .hdr nav{display:none}
  .hdr-city{display:none}
  .topnote-in{justify-content:center;text-align:center}
  .hero{min-height:88svh}
  .hero-badge{display:none}
  .hero-ctas .btn{width:100%;justify-content:center}
  .tpl-atelie-val .hero-metrics{grid-template-columns:1fr}
  .services-grid-val,.cards-exec,.zycron-dark-grid,.zycron-steps-4{grid-template-columns:1fr}
  .zycron-lookbook-grid{grid-template-columns:repeat(2,1fr)}
  .zycron-dock-status{display:none}
  .quick-in{grid-template-columns:1fr}
  .steps{grid-template-columns:1fr}
  .bento{grid-template-columns:1fr}
  .bento-card.big{grid-column:auto}
  .grid-menu{grid-template-columns:1fr;gap:14px}
  .card-item{flex-direction:row;align-items:stretch}
  .card-ph{flex:0 0 40%;aspect-ratio:auto;min-height:128px}
  .card-badge{top:10px;left:10px;font-size:9.5px;padding:5px 10px}
  .card-body{padding:13px 14px;gap:5px}
  .card-body h3{font-size:15px}
  .card-body p{font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .card-foot{flex-direction:column;align-items:flex-start;gap:8px;margin-top:2px}
  .price{font-size:16px}
  .card-order{padding:8px 15px;font-size:12px}
  .rev-card{flex-basis:88%}
  .promo-in{flex-direction:column;align-items:flex-start}
  .count div{min-width:64px;padding:10px 12px}
  .foot{grid-template-columns:1fr;gap:30px}
  .wa-bar{display:flex}
  .gal{grid-auto-rows:150px}
  .loc-info{padding:28px}
  .spot-stats{flex-wrap:wrap;gap:20px}
}
${arch === "produtos" ? ".arch-produtos .card-order{background:var(--sec)}.arch-produtos .card-order:hover{background:var(--pri)}" : ""}
`;
}
