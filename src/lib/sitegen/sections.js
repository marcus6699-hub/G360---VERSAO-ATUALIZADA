// Construtores de seções HTML dos sites gerados (compartilhado entre canvas e exportação).
import { ICONS, esc, waLink, initials, formatRating } from "./theme";

const ed = (key) => ` data-edit="${key}"`;
const eimg = (id) => ` data-img="${id}"`;

function responsiveImgTag(ctx, desktopSlot, mobileSlot, fallbackUrl, altText, extraClass = "") {
  const desk = ctx.img(desktopSlot, fallbackUrl || "");
  const mob = mobileSlot ? ctx.img(mobileSlot, "") : { url: "" };
  const clsAttr = extraClass ? ` class="${extraClass}"` : "";
  const imgEl = `<img${clsAttr} src="${esc(desk.url)}" style="object-fit:${desk.fit}" alt="${esc(altText)}"${eimg(desktopSlot)}>`;
  if (mob && mob.url) {
    return `<picture style="display:contents"><source media="(max-width: 768px)" srcset="${esc(mob.url)}">${imgEl}</picture>`;
  }
  return imgEl;
}

export function btnHtml(ctx, id, fallbackLabel, cls, waMsg, icon = "whatsapp") {
  const cfg = (ctx.buttons && ctx.buttons[id]) || {};
  const label = cfg.label || fallbackLabel;
  const msg = cfg.waMessage || waMsg;
  const fx = cfg.effect || "lift";
  const style = cfg.color ? ` style="background:${esc(cfg.color)};color:#fff"` : "";
  return `<a href="${waLink(ctx.b, msg)}" target="_blank" rel="noopener" data-btn="${id}" data-wa class="btn ${cls} bfx-${fx}"${style}>${ICONS[icon]}<span>${esc(label)}</span></a>`;
}

export function titleWithAccent(ctx, key, fallback, accentKey) {
  const text = ctx.t(key, fallback);
  const accent = ctx.t(accentKey, "");
  if (accent && text.toLowerCase().includes(accent.toLowerCase())) {
    const i = text.toLowerCase().indexOf(accent.toLowerCase());
    return `${esc(text.slice(0, i))}<em>${esc(text.slice(i, i + accent.length))}</em>${esc(text.slice(i + accent.length))}`;
  }
  return esc(text);
}

export function brandMark(ctx) {
  const logo = ctx.logo;
  if (logo && logo.url)
    return `<img class="brand-logo${logo.round ? " round" : ""}" src="${esc(logo.url)}" alt="${esc(ctx.b.name)}" data-logo-edit="1" title="Clique para trocar a logomarca" style="cursor:pointer">`;
  return `<span class="brand-dot" data-logo-edit="1" title="Clique para adicionar a logomarca" style="cursor:pointer"></span>`;
}

export function header(ctx) {
  const { b, arch, templateId } = ctx;
  const hideName = ctx.logo && ctx.logo.url && ctx.logo.hideName;

  if (templateId === "atelie-val") {
    return `
<header class="hdr">
  <div class="wrap hdr-in">
    <a href="#" class="brand" style="max-width:380px">
      ${
        ctx.logo && ctx.logo.url
          ? `<img class="brand-logo${ctx.logo.round ? " round" : ""}" src="${esc(ctx.logo.url)}" alt="${esc(b.name)}" data-logo-edit="1" title="Clique para trocar a logomarca" style="cursor:pointer">`
          : `<span class="brand-seal" data-logo-edit="1" title="Clique para enviar a logomarca" style="cursor:pointer">${initials(b.name)}</span>`
      }
      ${
        hideName
          ? ""
          : `<span class="brand-copy"><strong${ed("brand.name")}>${esc(ctx.t("brand.name", b.name.split(" - ")[0]))}</strong><small${ed("brand.sub")}>${esc(
              ctx.t("brand.sub", b.category || "Atendimento Personalizado")
            )}</small></span>`
      }
    </a>
    <nav>
      <a href="#servicos"${ed("nav.servicos")}>${esc(ctx.t("nav.servicos", "Serviços"))}</a>
      <a href="#autoridade"${ed("nav.sobre")}>${esc(ctx.t("nav.sobre", "Sobre"))}</a>
      <a href="#avaliacoes"${ed("nav.avaliacoes")}>${esc(ctx.t("nav.avaliacoes", "Avaliações"))}</a>
      <a href="#localizacao"${ed("nav.localizacao")}>${esc(ctx.t("nav.localizacao", "Localização"))}</a>
      <a href="#faq"${ed("nav.faq")}>${esc(ctx.t("nav.faq", "Dúvidas"))}</a>
    </nav>
    <div style="display:flex;align-items:center;gap:14px">
      ${btnHtml(ctx, "header_cta", "Chamar no WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
    </div>
  </div>
</header>`;
  }

  if (templateId === "zycron-padaria") {
    return `
<header class="hdr">
  <div class="wrap hdr-in" style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center">
    <nav style="justify-content:flex-start">
      <a href="#cardapio"${ed("nav.cardapio")}>${esc(ctx.t("nav.cardapio", "Cardápio"))}</a>
      <a href="#sobre"${ed("nav.sobre")}>${esc(ctx.t("nav.sobre", "Sobre"))}</a>
      <a href="#galeria"${ed("nav.fotos")}>${esc(ctx.t("nav.fotos", "Fotos"))}</a>
    </nav>
    <a href="#" class="brand" style="justify-content:center;text-align:center;font-size:24px;font-weight:400">
      ${ctx.logo && ctx.logo.url ? `<img class="brand-logo${ctx.logo.round ? " round" : ""}" src="${esc(ctx.logo.url)}" alt="${esc(b.name)}" data-logo-edit="1" title="Clique para trocar a logomarca" style="cursor:pointer">` : ""}
      ${hideName ? "" : `<span${ed("brand.name")}>${esc(ctx.t("brand.name", b.name))}</span>`}
    </a>
    <div style="display:flex;align-items:center;justify-content:flex-end;gap:20px">
      <nav>
        <a href="#avaliacoes"${ed("nav.avaliacoes")}>${esc(ctx.t("nav.avaliacoes", "Avaliações"))}</a>
        <a href="#faq"${ed("nav.faq")}>${esc(ctx.t("nav.faq", "Dúvidas"))}</a>
      </nav>
      ${btnHtml(ctx, "header_cta", "WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e quero fazer uma encomenda.`)}
    </div>
  </div>
</header>`;
  }

  if (templateId === "zycron-barbearia" || templateId === "zycron-moda") {
    const isModa = templateId === "zycron-moda";
    return `
<header class="hdr">
  <div class="wrap hdr-in">
    <a href="#" class="brand" style="font-size:${isModa ? "22px" : "24px"};font-weight:${isModa ? "600" : "400"};letter-spacing:${isModa ? "-.02em" : ".03em"}">
      ${ctx.logo && ctx.logo.url ? `<img class="brand-logo${ctx.logo.round ? " round" : ""}" src="${esc(ctx.logo.url)}" alt="${esc(b.name)}" data-logo-edit="1" title="Clique para trocar a logomarca" style="cursor:pointer">` : ""}
      ${hideName ? "" : `<span${ed("brand.name")}>${esc(ctx.t("brand.name", b.name))}</span>`}
    </a>
    <nav>
      <a href="${isModa ? "#catalogo" : "#especialidades"}"${ed("nav.item1")}>${esc(ctx.t("nav.item1", isModa ? "Coleção" : "Serviços"))}</a>
      <a href="#sobre"${ed("nav.sobre")}>${esc(ctx.t("nav.sobre", "Sobre"))}</a>
      <a href="#galeria"${ed("nav.fotos")}>${esc(ctx.t("nav.fotos", "Fotos"))}</a>
      <a href="#avaliacoes"${ed("nav.avaliacoes")}>${esc(ctx.t("nav.avaliacoes", "Avaliações"))}</a>
      <a href="#faq"${ed("nav.faq")}>${esc(ctx.t("nav.faq", "Dúvidas"))}</a>
    </nav>
    <div style="display:flex;align-items:center;gap:14px">
      ${btnHtml(ctx, "header_cta", "WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
    </div>
  </div>
</header>`;
  }

  if (templateId === "modelo-premium") {
    return `
<header class="hdr">
  <div class="wrap hdr-in">
    <a href="#" class="brand-exec">
      ${
        ctx.logo && ctx.logo.url
          ? `<img class="brand-logo${ctx.logo.round ? " round" : ""}" src="${esc(ctx.logo.url)}" alt="${esc(b.name)}" data-logo-edit="1" title="Clique para trocar a logomarca" style="cursor:pointer">`
          : `<span class="logo-mark-exec" data-logo-edit="1" title="Clique para enviar a logomarca" style="cursor:pointer">${initials(b.name)}</span>`
      }
      ${
        hideName
          ? ""
          : `<div><strong${ed("brand.name")}>${esc(ctx.t("brand.name", b.name))}</strong><span${ed("brand.sub")}>${esc(
              ctx.t("brand.sub", `${b.category} · ${b.city}`)
            )}</span></div>`
      }
    </a>
    <nav>
      <a href="#servicos"${ed("nav.solucoes")}>${esc(ctx.t("nav.solucoes", "Soluções"))}</a>
      <a href="#autoridade"${ed("nav.sobre")}>${esc(ctx.t("nav.sobre", "Sobre"))}</a>
      <a href="#avaliacoes"${ed("nav.avaliacoes")}>${esc(ctx.t("nav.avaliacoes", "Avaliações"))}</a>
      <a href="#localizacao"${ed("nav.contato")}>${esc(ctx.t("nav.contato", "Contato"))}</a>
    </nav>
    <div style="display:flex;align-items:center;gap:14px">
      ${btnHtml(ctx, "header_cta", "Falar no WhatsApp", "btn-acc", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
    </div>
  </div>
</header>`;
  }

  const anchors =
    arch === "gastronomia"
      ? [
          ["#cardapio", "Cardápio"],
          ["#destaque", "Destaques"],
          ["#sobre", "Sobre"],
          ["#avaliacoes", "Avaliações"],
          ["#localizacao", "Localização"],
        ]
      : arch === "servicos"
      ? [
          ["#especialidades", "Especialidades"],
          ["#como-funciona", "Como funciona"],
          ["#avaliacoes", "Avaliações"],
          ["#localizacao", "Localização"],
        ]
      : [
          ["#catalogo", "Produtos"],
          ["#avaliacoes", "Avaliações"],
          ["#localizacao", "Localização"],
        ];
  const ctaLabel = arch === "gastronomia" ? "Fazer pedido" : arch === "servicos" ? "Agendar horário" : "Pedir cotação";
  return `
<header class="hdr">
  <div class="wrap hdr-in">
    <a href="#" class="brand">${brandMark(ctx)}${hideName ? "" : `<span${ed("brand.name")}>${esc(ctx.t("brand.name", b.name))}</span>`}</a>
    <nav>${anchors.map(([h, l], idx) => `<a href="${h}"${ed(`nav.link_${idx}`)}>${esc(ctx.t(`nav.link_${idx}`, l))}</a>`).join("")}</nav>
    <div style="display:flex;align-items:center;gap:16px;flex-shrink:0">
      ${arch !== "gastronomia" ? `<span class="hdr-city">${ICONS.mappin} ${esc(b.city)}${b.uf ? " · " + esc(b.uf) : ""}</span>` : ""}
      ${btnHtml(ctx, "header_cta", ctaLabel, arch === "servicos" ? "btn-pri" : "btn-acc", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
    </div>
  </div>
</header>`;
}

export function topbar(ctx) {
  // Removida faixa de topo promocional conforme solicitação
  return "";
}

export function hero(ctx) {
  const { b, arch, templateId } = ctx;
  const img = ctx.img("hero", b.photos[0] || "");
  const stars = ICONS.star.repeat(5);

  if (templateId === "atelie-val") {
    const isSewing = /ateli|costur|roupa|reparo|alfaiat|noiva|moda/i.test(`${b.name} ${b.category}`);
    const defaultTitle = isSewing ? "Sua peça favorita merece um novo caimento." : `Cuidado artesanal e acabamento que você confia`;
    const defaultAccent = isSewing ? "novo caimento." : "confia";
    return `
<section class="hero" id="inicio">
  <div class="wrap hero-in">
    <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start">
      <span class="eyebrow"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", `${b.category} em ${b.city}`))}</span>
      <h1${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", defaultTitle, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", defaultAccent))}">
      <p class="sub"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", b.bio))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", "Pedir orçamento no WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e gostaria de pedir um orçamento.`)}
        <a href="#servicos" class="btn btn-ghost bfx-lift" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", "Conhecer os serviços"))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-metrics">
        <div>
          <b${ed("hero.m1v")}>${esc(ctx.t("hero.m1v", `${formatRating(b.rating)} / 5`))}</b>
          <span${ed("hero.m1l")}>${esc(ctx.t("hero.m1l", `Nota no Google (${b.rating_count || "50+"} avaliações)`))}</span>
        </div>
        <div>
          <b${ed("hero.m2v")}>${esc(ctx.t("hero.m2v", "20+ anos"))}</b>
          <span${ed("hero.m2l")}>${esc(ctx.t("hero.m2l", "Tradição, cuidado e experiência comprovada"))}</span>
        </div>
        <div>
          <b${ed("hero.m3v")}>${esc(ctx.t("hero.m3v", "Sob medida"))}</b>
          <span${ed("hero.m3l")}>${esc(ctx.t("hero.m3l", "Atendimento próximo e acabamento impecável"))}</span>
        </div>
      </div>
    </div>
    <div class="hero-card-art">
      ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
      <div class="hero-card-cap">
        <div>
          <strong${ed("hero.capTitle")}>${esc(ctx.t("hero.capTitle", "Cuidado artesanal em cada detalhe"))}</strong>
          <span${ed("hero.capSub")}>${esc(ctx.t("hero.capSub", `${b.address || b.city}`))}</span>
        </div>
        <div class="pill-badge"${ed("hero.capBadge")}>${esc(ctx.t("hero.capBadge", b.city || "Atendimento Local"))}</div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (templateId === "zycron-barbearia") {
    const isBarber = /barbearia|barber|cabelo|salão|salao|estética|estetica/i.test(`${b.name} ${b.category}`);
    const defTitle =
      b.hero_title_override ||
      (isBarber
        ? `Corte e barba sem fila em ${b.city || "sua cidade"}`
        : `${b.category || "Atendimento"} com agilidade e confiança em ${b.city || "sua cidade"}`);
    const cta1Lbl = isBarber ? "Agendar meu horário" : "Chamar no WhatsApp";
    const cta2Lbl = isBarber ? "Ver serviços" : "Ver destaques";
    return `
<section class="sec" style="padding:24px 0 48px" id="inicio">
  <div class="wrap">
    <div class="zycron-barber-hero-card">
      <div class="zycron-barber-hero-copy">
        <span style="display:inline-flex;align-items:center;gap:8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)"${ed("hero.eyebrow")}>${ICONS.sparkles} ${esc(ctx.t("hero.eyebrow", `${b.category} em ${b.city}`))}</span>
        <h1${ed("hero.title")}>${esc(ctx.t("hero.title", defTitle))}</h1>
        <p${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", b.bio))}</p>
        <div class="hero-ctas" style="margin-top:10px">
          ${btnHtml(ctx, "cta1", cta1Lbl, "btn-pri", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
          <a href="#servicos" class="btn btn-ghost bfx-lift" style="color:#fff;border-radius:10px" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", cta2Lbl))}</span>${ICONS.arrowR}</a>
        </div>
      </div>
      <div class="zycron-barber-hero-ph" title="Clique para trocar a foto principal">
        ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
      </div>
    </div>
    <div class="zycron-barber-strip">
      <div class="zycron-barber-strip-item">
        <span class="zycron-barber-strip-ic">${ICONS.clock}</span>
        <div><small>Horário</small><b${ed("hero.strip1")}>${esc(ctx.t("hero.strip1", b.hours_text || "Segunda a sábado · 9h às 20h"))}</b></div>
      </div>
      <div class="zycron-barber-strip-item">
        <span class="zycron-barber-strip-ic">${ICONS.mappin}</span>
        <div><small>Onde</small><b${ed("hero.strip2")}>${esc(ctx.t("hero.strip2", b.address || b.city))}</b></div>
      </div>
      <div class="zycron-barber-strip-item">
        <span class="zycron-barber-strip-ic">${ICONS.star}</span>
        <div><small>No Google</small><b${ed("hero.strip3")}>${esc(ctx.t("hero.strip3", `${formatRating(b.rating)} · ${b.rating_count || "180"} avaliações`))}</b></div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (templateId === "zycron-padaria") {
    const isFood = /padaria|confeitaria|bolo|doce|pamonha|restaurante|lanchonete|pizzaria|hamburgueria|café|cafe/i.test(`${b.name} ${b.category}`);
    const defTitle =
      b.hero_title_override ||
      (isFood
        ? `Encomende salgados e bolo para a festa pelo WhatsApp`
        : `${b.name}: peça pelo WhatsApp com entrega rápida em ${b.city || "sua cidade"}`);
    const img2 = ctx.img("hero_inset", b.photos[1] || b.photos[0] || "");
    return `
<section style="padding:20px 0 40px;background:var(--bg)" id="inicio">
  <div class="wrap zycron-arch-hero">
    <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start">
      <span style="font-size:13.5px;color:var(--sec);font-weight:700"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", `${b.category} em ${b.city}`))}</span>
      <h1 style="font-size:clamp(38px,4.8vw,62px);color:var(--ink)"${ed("hero.title")}>${esc(ctx.t("hero.title", defTitle))}</h1>
      <p class="sub"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", b.bio))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", isFood ? "Encomendar pelo WhatsApp" : "Pedir pelo WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e quero fazer um pedido.`)}
        <a href="#cardapio" class="btn btn-ghost bfx-lift" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", isFood ? "Ver cardápio" : "Ver catálogo"))}</span>${ICONS.arrowR}</a>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:14.5px;margin-top:4px">
        <span style="display:inline-flex;gap:2px">${stars}</span>
        <b>${formatRating(b.rating)}</b>
        <span style="opacity:.75">no Google · ${b.rating_count || "120"} avaliações</span>
      </div>
    </div>
    <div class="zycron-arch-visual">
      <div class="zycron-arch-main" title="Clique para trocar a foto principal">
        ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
      </div>
      <div class="zycron-arch-circle" title="Clique para trocar a foto em destaque">
        <img src="${esc(img2.url)}" style="object-fit:${img2.fit}" alt="${esc(b.name)}"${eimg("hero_inset")}>
      </div>
      <div class="zycron-arch-pill">
        <span style="width:36px;height:36px;border-radius:50%;background:var(--soft);color:var(--sec);display:grid;place-items:center">${ICONS.whatsapp}</span>
        <div>
          <b style="display:block;font-size:13.5px;color:var(--ink)"${ed("hero.pillTitle")}>${esc(ctx.t("hero.pillTitle", "Atendimento pelo WhatsApp"))}</b>
          <small style="font-size:12px;opacity:.75"${ed("hero.pillSub")}>${esc(ctx.t("hero.pillSub", b.hours_text || "Segunda a sábado · 9h às 18h"))}</small>
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (templateId === "zycron-moda") {
    const isFashion = /roupa|moda|boutique|ateli|costur|calçado|calcado|joia|acess/i.test(`${b.name} ${b.category}`);
    const defTitle =
      b.hero_title_override ||
      (isFashion
        ? `Roupa nova para o trabalho, o passeio e a festa`
        : `Destaques e atendimento exclusivo na ${b.name} em ${b.city || "sua cidade"}`);
    const img2 = ctx.img("hero_second", b.photos[1] || b.photos[0] || "");
    return `
<section style="padding:28px 0 56px;background:var(--bg)" id="inicio">
  <div class="wrap">
    <div class="zycron-moda-hero-imgs">
      <div class="zycron-moda-hero-ph" title="Clique para trocar a foto 1">
        ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
      </div>
      <div class="zycron-moda-hero-ph tall" title="Clique para trocar a foto 2">
        <img src="${esc(img2.url)}" style="object-fit:${img2.fit}" alt="${esc(b.name)}"${eimg("hero_second")}>
      </div>
    </div>
    <div class="zycron-moda-hero-bar">
      <h1 style="font-size:clamp(34px,3.8vw,52px)"${ed("hero.title")}>${esc(ctx.t("hero.title", defTitle))}</h1>
      <p class="sub" style="font-size:16.5px"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", b.bio))}</p>
      <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-start">
        ${btnHtml(ctx, "cta1", "Comprar pelo WhatsApp", "btn-pri", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
        <div style="display:flex;align-items:center;gap:8px;font-size:13.5px">
          <span style="display:inline-flex;gap:2px">${stars}</span>
          <b>${formatRating(b.rating)}</b> no Google · ${b.rating_count || "120"} avaliações
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  if (templateId === "modelo-premium") {
    return `
<section class="hero" id="inicio">
  <div class="wrap hero-in">
    <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start">
      <span class="eyebrow"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", `${b.category} · ${b.city}${b.uf ? " - " + b.uf : ""}`))}</span>
      <h1${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", `Excelência e confiança que valorizam você.`, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", "valorizam você."))}">
      <p class="sub"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", b.bio))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", "Chamar no WhatsApp", "btn-acc", `Olá! Vim pelo site da ${b.name} e quero falar com a equipe.`)}
        <a href="#servicos" class="btn btn-ghost bfx-lift" style="color:#fff" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", "Conhecer soluções"))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-proof-exec">
        <span><i style="display:inline-flex;width:14px;height:14px">${ICONS.check}</i> <span${ed("hero.p1")}>${esc(ctx.t("hero.p1", "Atendimento imediato"))}</span></span>
        <span><i style="display:inline-flex;width:14px;height:14px">${ICONS.check}</i> <span${ed("hero.p2")}>${esc(ctx.t("hero.p2", `Nota ${formatRating(b.rating)} no Google`))}</span></span>
        <span><i style="display:inline-flex;width:14px;height:14px">${ICONS.check}</i> <span${ed("hero.p3")}>${esc(ctx.t("hero.p3", "Qualidade garantida"))}</span></span>
      </div>
    </div>
    <div class="visual-frame-exec">
      ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name, "visual-bg-exec")}
      <div class="visual-pattern-exec"></div>
      <div class="floating-badge-exec">
        <div>
          <div style="display:flex;justify-content:center;margin-bottom:4px">${ICONS.award}</div>
          <span${ed("hero.seal")}>${esc(ctx.t("hero.seal", `Referência em ${b.city}`))}</span>
        </div>
      </div>
      <div class="visual-card-exec">
        <small${ed("hero.vcSmall")}>${esc(ctx.t("hero.vcSmall", "Padrão de excelência"))}</small>
        <strong${ed("hero.vcTitle")}>${esc(ctx.t("hero.vcTitle", "Profissional. Memorável."))}</strong>
        <p${ed("hero.vcText")}>${esc(ctx.t("hero.vcText", `${b.rating_count || "Centenas de"} clientes atendidos com máxima dedicação e transparência.`))}</p>
      </div>
    </div>
  </div>
</section>`;
  }

  if (templateId === "novolar-moveis") {
    const isFurniture = /móveis|moveis|colch|cama|sofá|sofa|cozinha|planejad|decora/i.test(`${b.name} ${b.category}`);
    const defTitle = b.hero_title_override || (isFurniture ? "Seu lar com mais conforto e qualidade." : `${b.name}: Excelência e variedade em ${b.city || "sua cidade"}`);
    const defSub = b.bio || "Sofás, colchões e móveis com design acolhedor para tornar cada momento em casa ainda melhor. Atendimento especializado e entrega rápida em Anápolis e região.";
    const photos = b.photos && b.photos.length > 0 ? b.photos : [""];
    const p0 = photos[0] || "";

    return `
<section class="sec-novolar-hero" id="inicio" style="position:relative;background:#0F172A;min-height:560px;display:flex;align-items:center;overflow:hidden;color:#fff;">
  <div class="novolar-hero-bg" style="position:absolute;inset:0;z-index:1;background-image:url('${esc(p0)}');background-size:cover;background-position:center;"></div>
  <div style="position:absolute;inset:0;z-index:2;background:linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 45%, rgba(15,23,42,0.30) 100%);"></div>
  
  <div class="wrap" style="position:relative;z-index:3;padding:64px 20px;max-width:1200px;width:100%;">
    <div style="max-width:640px;display:flex;flex-direction:column;gap:20px;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;padding:6px 14px;border-radius:9999px;background:rgba(220,38,38,0.2);border:1px solid rgba(220,38,38,0.4);color:#FCA5A5;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;width:fit-content;">
        <span style="display:inline-flex;width:14px;height:14px;">${ICONS.sparkles}</span> <span${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", `${b.category || "Móveis & Colchões"} em ${b.city}`))}</span>
      </div>

      <h1 style="font-size:clamp(36px,4.5vw,58px);font-weight:900;line-height:1.08;letter-spacing:-0.03em;color:#fff;"${ed("hero.title")}>
        ${titleWithAccent(ctx, "hero.title", defTitle, "hero.accent")}
      </h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", "conforto e qualidade."))}">

      <p style="font-size:17px;line-height:1.6;color:rgba(255,255,255,0.85);font-weight:400;"${ed("hero.subtitle")}>
        ${esc(ctx.t("hero.subtitle", defSub))}
      </p>

      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:8px;">
        ${btnHtml(ctx, "cta1", "Falar no WhatsApp", "btn-acc", `Olá! Vim pelo site da ${b.name} e gostaria de atendimento.`)}
        <a href="#catalogo" class="btn btn-ghost bfx-lift" style="color:#fff;border-color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.08);" data-btn="cta2">
          <span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", "Ver catálogo de produtos"))}</span>${ICONS.arrowR}
        </a>
      </div>

      <div style="display:flex;align-items:center;gap:16px;margin-top:12px;font-size:13.5px;color:rgba(255,255,255,0.85);">
        <div style="display:flex;align-items:center;gap:4px;color:#FBBF24;">
          ${stars}
        </div>
        <span><b>${formatRating(b.rating)}</b> no Google (${b.rating_count || "70+"} avaliações reais)</span>
      </div>
    </div>
  </div>
</section>

<!-- 4 DIFERENCIAIS NOVO LAR STRIP -->
<div class="novolar-strip" style="background:#1E293B;border-top:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1);padding:18px 0;color:#fff;">
  <div class="wrap" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:20px;align-items:center;">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="width:42px;height:42px;border-radius:12px;background:rgba(220,38,38,0.18);border:1px solid rgba(248,113,113,0.28);color:#F87171;display:grid;place-items:center;flex-shrink:0;"><span style="width:20px;height:20px;display:inline-flex;">${ICONS.shield}</span></span>
      <div>
        <strong style="display:block;font-size:13px;">Atendimento Próximo</strong>
        <small style="color:#94A3B8;font-size:11.5px;">Compare conforto e materiais</small>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="width:42px;height:42px;border-radius:12px;background:rgba(220,38,38,0.18);border:1px solid rgba(248,113,113,0.28);color:#F87171;display:grid;place-items:center;flex-shrink:0;"><span style="width:20px;height:20px;display:inline-flex;">${ICONS.sofa}</span></span>
      <div>
        <strong style="display:block;font-size:13px;">Variedade de Produtos</strong>
        <small style="color:#94A3B8;font-size:11.5px;">Para todos os ambientes</small>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="width:42px;height:42px;border-radius:12px;background:rgba(220,38,38,0.18);border:1px solid rgba(248,113,113,0.28);color:#F87171;display:grid;place-items:center;flex-shrink:0;"><span style="width:20px;height:20px;display:inline-flex;">${ICONS.card}</span></span>
      <div>
        <strong style="display:block;font-size:13px;">Facilidade no Pagamento</strong>
        <small style="color:#94A3B8;font-size:11.5px;">Condições e parcelamento</small>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="width:42px;height:42px;border-radius:12px;background:rgba(220,38,38,0.18);border:1px solid rgba(248,113,113,0.28);color:#F87171;display:grid;place-items:center;flex-shrink:0;"><span style="width:20px;height:20px;display:inline-flex;">${ICONS.truck}</span></span>
      <div>
        <strong style="display:block;font-size:13px;">Entrega & Montagem</strong>
        <small style="color:#94A3B8;font-size:11.5px;">Agilidade garantida em ${esc(b.city)}</small>
      </div>
    </div>
  </div>
</div>`;
  }

  const defaults = {
    gastronomia: {
      eyebrow: `${b.category} · ${b.city}${b.uf ? " — " + b.uf : ""}`,
      title: `Sabor de verdade, feito hoje`,
      accent: "verdade",
      sub: b.bio,
      cta1: "Fazer meu pedido",
      cta2: "Ver cardápio",
    },
    servicos: {
      eyebrow: `${b.category} · ${b.city}${b.uf ? " — " + b.uf : ""}`,
      title: `Cuidado profissional que você confia`,
      accent: "confia",
      sub: b.bio,
      cta1: "Agendar pelo WhatsApp",
      cta2: "Conhecer especialidades",
    },
    produtos: {
      eyebrow: `${b.category} · ${b.city}${b.uf ? " — " + b.uf : ""}`,
      title: `Qualidade e atendimento rápido em ${b.city}`,
      accent: "atendimento rápido",
      sub: b.bio,
      cta1: "Chamar no WhatsApp",
      cta2: "Ver catálogo",
    },
  }[arch] || {
    eyebrow: `${b.category} · ${b.city}`,
    title: `Qualidade e confiança em ${b.city}`,
    accent: "confiança",
    sub: b.bio,
    cta1: "Chamar no WhatsApp",
    cta2: "Ver mais",
  };
  const badge = `
    <div class="hero-badge">
      <div><span class="n">${formatRating(b.rating)}</span><div class="rev-stars">${stars}</div></div>
      <div><small><b>${b.rating_count || "500+"} avaliações</b></small><small>no Google Meu Negócio</small></div>
    </div>`;
  if (arch === "gastronomia" || ctx.heroLayout === "glass-box" || ctx.heroLayout === "overlay-dark" || ctx.heroLayout === "split") {
    if (ctx.heroLayout === "split") {
      return `
<section class="hero" id="inicio" style="background:#140F0D;padding:56px 0">
  <div class="wrap" style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:36px;align-items:center">
    <div style="display:flex;flex-direction:column;gap:20px;align-items:flex-start;color:#fff">
      <span class="eyebrow"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", defaults.eyebrow))}</span>
      <h1 style="color:#fff"${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", defaults.title, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", defaults.accent))}">
      <p class="sub" style="color:rgba(255,255,255,.86)"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", defaults.sub))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", defaults.cta1, "btn-acc", `Olá! Vim pelo site da ${b.name} e quero fazer um pedido.`)}
        <a href="#cardapio" class="btn btn-ghost bfx-lift" style="color:#fff" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", defaults.cta2))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-addr" style="color:rgba(255,255,255,.82)">${ICONS.mappin}<span${ed("hero.address")}>${esc(ctx.t("hero.address", b.address))}</span></div>
    </div>
    <div style="border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.14);aspect-ratio:4/3;background:#000">
      ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
    </div>
  </div>
</section>`;
    }

    const extraOverlayStyle =
      ctx.heroLayout === "overlay-dark"
        ? `style="background:rgba(10,8,14,0.78);position:absolute;inset:0;z-index:1;pointer-events:none"`
        : `style="background:linear-gradient(90deg,rgba(12,9,8,0.88) 0%,rgba(12,9,8,0.70) 52%,rgba(12,9,8,0.30) 100%);position:absolute;inset:0;z-index:1;pointer-events:none"`;

    const copyBoxStyle =
      ctx.heroLayout === "glass-box"
        ? `style="position:relative;z-index:2;background:rgba(15,12,10,0.78);backdrop-filter:blur(12px);padding:32px;border-radius:24px;border:1px solid rgba(255,255,255,0.16);max-width:680px;box-shadow:0 20px 50px rgba(0,0,0,0.45)"`
        : `style="position:relative;z-index:2;max-width:680px;text-shadow:0 2px 14px rgba(0,0,0,0.65)"`;

    return `
<section class="hero" id="inicio" style="position:relative">
  ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name, "hero-bg")}
  <div ${extraOverlayStyle}></div>
  <div class="wrap hero-in" style="position:relative;z-index:2">
    <div ${copyBoxStyle}>
      <span class="eyebrow"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", defaults.eyebrow))}</span>
      <h1${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", defaults.title, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", defaults.accent))}">
      <p class="sub"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", defaults.sub))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", defaults.cta1, "btn-acc", `Olá! Vim pelo site da ${b.name} e quero fazer um pedido.`)}
        <a href="#cardapio" class="btn btn-ghost bfx-lift" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", defaults.cta2))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-addr">${ICONS.mappin}<span${ed("hero.address")}>${esc(ctx.t("hero.address", b.address))}</span></div>
    </div>
  </div>
  ${badge}
</section>`;
  }
  if (arch === "servicos") {
    return `
<section class="hero" id="inicio">
  <div class="wrap hero-in">
    <div style="display:flex;flex-direction:column;gap:22px;align-items:flex-start">
      <span class="eyebrow"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", defaults.eyebrow))}</span>
      <h1${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", defaults.title, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", defaults.accent))}">
      <p class="sub"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", defaults.sub))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", defaults.cta1, "btn-pri", `Olá! Vim pelo site da ${b.name} e quero agendar um horário.`)}
        <a href="#servicos" class="btn btn-ghost bfx-lift" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", defaults.cta2))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-trust">
        <div>${ICONS.verified} Perfil verificado no Google</div>
        <div>${ICONS.award} Nota ${formatRating(b.rating)} · ${b.rating_count || "300+"} avaliações</div>
        <div>${ICONS.clock} ${esc(b.hours_text || "Horário comercial")}</div>
      </div>
    </div>
    <div class="hero-frame">
      ${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}
      <div class="hero-badge" style="position:absolute">
        <div><span class="n" style="color:var(--sec)">${formatRating(b.rating)}</span><div class="rev-stars">${stars}</div></div>
        <div><small><b>${b.rating_count || "300+"} avaliações</b></small><small>Google Meu Negócio</small></div>
      </div>
    </div>
  </div>
</section>`;
  }
  return `
<section class="hero" id="inicio">
  <div class="wrap hero-in">
    <div style="display:flex;flex-direction:column;gap:22px;align-items:flex-start">
      <span class="hero-chip">${ICONS.truck} Atendimento imediato no WhatsApp</span>
      <span class="eyebrow" style="color:var(--acc)"${ed("hero.eyebrow")}>${esc(ctx.t("hero.eyebrow", defaults.eyebrow))}</span>
      <h1 style="color:#fff"${ed("hero.title")}>${titleWithAccent(ctx, "hero.title", defaults.title, "hero.accent")}</h1>
      <input type="hidden" data-accent="hero.accent" value="${esc(ctx.t("hero.accent", defaults.accent))}">
      <p class="sub" style="color:rgba(255,255,255,.8)"${ed("hero.subtitle")}>${esc(ctx.t("hero.subtitle", defaults.sub))}</p>
      <div class="hero-ctas">
        ${btnHtml(ctx, "cta1", defaults.cta1, "btn-acc", `Olá! Vim pelo site da ${b.name} e quero uma cotação.`)}
        <a href="#produtos" class="btn btn-ghost bfx-lift" data-btn="cta2"><span${ed("hero.cta2")}>${esc(ctx.t("hero.cta2", defaults.cta2))}</span>${ICONS.arrowR}</a>
      </div>
      <div class="hero-addr" style="color:rgba(255,255,255,.85)">${ICONS.mappin}<span${ed("hero.address")}>${esc(ctx.t("hero.address", b.address))}</span></div>
    </div>
    <div class="hero-frame">${responsiveImgTag(ctx, "hero", "hero_mobile", b.photos[0] || "", b.name)}</div>
  </div>
</section>`;
}

export function quickstrip(ctx) {
  return `
<section class="quick"><div class="wrap">
  <span class="eyebrow" style="margin-bottom:16px;display:inline-flex"${ed("quick.title")}>${esc(ctx.t("quick.title", "O que você procura hoje?"))}</span>
  <div class="quick-in">
    <button class="quick-card" data-quickfilter="all">
      <span class="ic">${ICONS.utensils}</span>
      <span><b${ed("quick.card1t")}>${esc(ctx.t("quick.card1t", "Ver o cardápio completo"))}</b><small${ed("quick.card1s")}>${esc(ctx.t("quick.card1s", "Todos os itens fresquinhos de hoje"))}</small></span>
      ${ICONS.arrowR}
    </button>
    <button class="quick-card" data-quickfilter="top">
      <span class="ic">${ICONS.heart}</span>
      <span><b${ed("quick.card2t")}>${esc(ctx.t("quick.card2t", "Os mais pedidos da casa"))}</b><small${ed("quick.card2s")}>${esc(ctx.t("quick.card2s", "Os favoritos de quem é de casa"))}</small></span>
      ${ICONS.arrowR}
    </button>
  </div>
</div></section>`;
}

function itemCard(ctx, it, i, labelBtn) {
  const { b } = ctx;
  const btnId = `item_${i}`;
  const cfg = (ctx.buttons && ctx.buttons[btnId]) || {};
  const finalLabel = cfg.label || labelBtn;
  const defaultMsg = `Olá! Vim pelo site da ${b.name} e quero ${labelBtn === "Pedir" ? "pedir" : "saber mais sobre"}: ${it.name}`;
  const msg = cfg.waMessage || defaultMsg;
  const fx = cfg.effect || "lift";
  const btnStyle = cfg.color ? ` style="background:${esc(cfg.color)};color:#fff"` : "";
  const im = ctx.img(`item_${i}`, it.image);
  const rawDesc = String(it.description || "");
  const cardDesc = rawDesc.length > 165 ? `${rawDesc.slice(0, 155).trim()}...` : rawDesc;

  return `
<article class="card-item" data-cat="${esc(it.category)}" data-top="${it.badge ? "1" : "0"}" data-reveal>
  <div class="card-ph" title="Clique para trocar a foto deste item">
    <img src="${esc(im.url)}" style="object-fit:${im.fit}" alt="${esc(it.name)}" loading="lazy"${eimg(`item_${i}`)}>
    ${it.badge ? `<span class="card-badge"${ed(`item.${i}.badge`)}>${esc(it.badge)}</span>` : ""}
  </div>
  <div class="card-body">
    <h3${ed(`item.${i}.name`)}>${esc(it.name)}</h3>
    <p${ed(`item.${i}.description`)}>${esc(cardDesc)}</p>
    <div class="card-foot">
      <span class="price"${ed(`item.${i}.price`)}>${esc(it.price)}</span>
      <a class="card-order bfx-${fx}" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}"${btnStyle}>${ICONS.whatsapp}<span>${esc(finalLabel)}</span></a>
    </div>
  </div>
</article>`;
}

export function menu(ctx) {
  const { b } = ctx;
  const cats = [...new Set(b.items.map((i) => i.category))];
  return `
<section class="sec" id="cardapio"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("menu.eyebrow")}>${esc(ctx.t("menu.eyebrow", "Feito hoje, com carinho"))}</span>
    <h2${ed("menu.title")}>${titleWithAccent(ctx, "menu.title", "O cardápio da casa", "menu.accent")}</h2>
    <input type="hidden" data-accent="menu.accent" value="${esc(ctx.t("menu.accent", "cardápio"))}">
    <p class="sub"${ed("menu.subtitle")}>${esc(ctx.t("menu.subtitle", "Escolha seu favorito e peça direto no WhatsApp — rápido, quentinho e sem complicação."))}</p>
  </div>
  <div class="pills">
    <button class="pill on" data-filter="all">Todos</button>
    ${cats.map((c) => `<button class="pill" data-filter="${esc(c)}">${esc(c)}</button>`).join("")}
  </div>
  <div class="grid-menu">${b.items.map((it, i) => itemCard(ctx, it, i, "Pedir")).join("")}</div>
</div></section>`;
}

export function catalog(ctx) {
  const { b, templateId } = ctx;
  if (templateId === "zycron-moda") {
    return `
<section class="sec" id="produtos" data-alias="catalogo"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("menu.eyebrow")}>${esc(ctx.t("menu.eyebrow", "Coleção & Destaques"))}</span>
    <h2${ed("menu.title")}>${esc(ctx.t("menu.title", "Produtos"))}</h2>
  </div>
  <div class="zycron-lookbook-grid">
    ${b.items
      .slice(0, 8)
      .map((it, i) => {
        const btnId = `item_${i}`;
        const msg = `Olá! Vim pelo site da ${b.name} e quero saber sobre: ${it.name}`;
        const im = ctx.img(`item_${i}`, it.image);
        return `
    <a class="zycron-lookbook-card" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}">
      <img src="${esc(im.url)}" style="object-fit:${im.fit}" alt="${esc(it.name)}" loading="lazy"${eimg(`item_${i}`)}>
      <div class="zycron-lookbook-body">
        <h3${ed(`item.${i}.name`)}>${esc(it.name)}</h3>
        <p${ed(`item.${i}.description`)}>${esc(it.description)}</p>
      </div>
    </a>`;
      })
      .join("")}
  </div>
</div></section>`;
  }
  const cats = [...new Set(b.items.map((i) => i.category))];
  return `
<section class="sec" id="catalogo"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("menu.eyebrow")}>${esc(ctx.t("menu.eyebrow", "Vitrine e soluções"))}</span>
    <h2${ed("menu.title")}>${titleWithAccent(ctx, "menu.title", "Destaques para você", "menu.accent")}</h2>
    <input type="hidden" data-accent="menu.accent" value="${esc(ctx.t("menu.accent", "você"))}">
    <p class="sub"${ed("menu.subtitle")}>${esc(ctx.t("menu.subtitle", "Escolha o que você precisa e receba atendimento ou orçamento na hora pelo WhatsApp."))}</p>
  </div>
  <div class="pills">
    <button class="pill on" data-filter="all">Todos</button>
    ${cats.map((c) => `<button class="pill" data-filter="${esc(c)}">${esc(c)}</button>`).join("")}
  </div>
  <div class="grid-menu">${b.items.map((it, i) => itemCard(ctx, it, i, "Solicitar")).join("")}</div>
</div></section>`;
}

export function spotlight(ctx) {
  const { b } = ctx;
  const imgs = [0, 1, 2].map((i) => ctx.img(`spotlight${i}`, b.photos[(i + 1) % b.photos.length] || b.photos[0]));
  return `
<section class="sec spot" id="destaque"><div class="wrap spot-in">
  <div data-reveal>
    <span class="eyebrow"${ed("spot.eyebrow")}>${esc(ctx.t("spot.eyebrow", "Destaque da casa"))}</span>
    <h2 style="color:#fff;margin:14px 0 16px"${ed("spot.title")}>${titleWithAccent(ctx, "spot.title", "O queridinho de quem volta sempre", "spot.accent")}</h2>
    <input type="hidden" data-accent="spot.accent" value="${esc(ctx.t("spot.accent", "queridinho"))}">
    <p${ed("spot.text")}>${esc(ctx.t("spot.text", `Cada detalhe da ${b.name} é pensado para você se sentir em casa: ingredientes frescos, preparo caprichado e aquele atendimento que só quem é de verdade oferece.`))}</p>
    <div class="spot-stats">
      <div><b>${formatRating(b.rating)}</b><small>nota no Google</small></div>
      <div><b>${b.rating_count || "500"}+</b><small>avaliações reais</small></div>
      <div><b>100%</b><small>feito no dia</small></div>
    </div>
    <div style="margin-top:28px">${btnHtml(ctx, "spot_cta", "Quero experimentar", "btn-acc", `Olá! Vim pelo site da ${b.name} e quero experimentar o destaque da casa.`)}</div>
  </div>
  <div class="spot-car" data-reveal data-spotcar>
    ${imgs.map((im, i) => `<img src="${esc(im.url)}" style="object-fit:${im.fit}" class="${i === 0 ? "on" : ""}" alt="Destaque ${i + 1}"${i === 0 ? eimg("spotlight0") : ""}>`).join("")}
    <div class="spot-nav"><button data-spotprev aria-label="Anterior">${ICONS.chevL}</button><button data-spotnext aria-label="Próximo">${ICONS.chevR}</button></div>
  </div>
</div></section>`;
}

export function about(ctx) {
  const { b, arch } = ctx;
  const img = ctx.img("about", b.photos[b.photos.length - 1] || b.photos[0]);
  const checks =
    arch === "gastronomia"
      ? ["Ingredientes frescos selecionados todos os dias", "Receitas de família aperfeiçoadas há anos", "Atendimento que faz você se sentir em casa"]
      : arch === "servicos"
      ? ["Profissionais experientes e cuidado em cada detalhe", "Estrutura acolhedora pensada no seu conforto", "Atendimento humanizado do início ao fim"]
      : ["Qualidade comprovada por clientes reais", "Atendimento ágil e transparente no WhatsApp", "Compromisso com o melhor resultado para você"];
  return `
<section class="sec" id="sobre"><div class="wrap about-in">
  <div class="about-ph" data-reveal>
    ${responsiveImgTag(ctx, "about", "about_mobile", b.photos[b.photos.length - 1] || b.photos[0], `Sobre ${b.name}`)}
    <div class="about-tag">${ICONS.heart}<span${ed("about.tag")}>${esc(ctx.t("about.tag", `Feito com dedicação em ${b.city}`))}</span></div>
  </div>
  <div data-reveal>
    <span class="eyebrow"${ed("about.eyebrow")}>${esc(ctx.t("about.eyebrow", "Nossa história"))}</span>
    <h2 style="margin:14px 0 18px"${ed("about.title")}>${titleWithAccent(ctx, "about.title", `Quem faz a ${b.name}`, "about.accent")}</h2>
    <input type="hidden" data-accent="about.accent" value="${esc(ctx.t("about.accent", b.name.split(" ")[0]))}">
    <p class="sub"${ed("about.text")}>${esc(ctx.t("about.text", `A ${b.name} nasceu em ${b.city} com um propósito simples: entregar o melhor, todos os dias, para cada pessoa que passa pela porta. Hoje somos referência na região — e a nota ${formatRating(b.rating)} no Google é reflexo disso.`))}</p>
    <ul class="about-list">${checks.map((c) => `<li>${ICONS.check}<span>${c}</span></li>`).join("")}</ul>
    
  </div>
</div></section>`;
}

export function featureChips(b) {
  const feats = (b.features || []).slice(0, 8);
  if (!feats.length) return "";
  return `<div class="feat-chips">${feats.map((f) => `<span>${ICONS.check}${esc(f)}</span>`).join("")}</div>`;
}

export function gallery(ctx) {
  const { b, templateId } = ctx;
  const rawProducts = b.items.map((i, idx) => ctx.img(`item_${idx}`, i.image).url).filter(Boolean);
  const spaceSlots = [0, 1, 2, 3, 4, 5]
    .map((idx) => ctx.img(`gallery_${idx}`, b.photos[idx] || b.photos[idx % Math.max(1, b.photos.length)] || rawProducts[idx % Math.max(1, rawProducts.length)] || "").url)
    .filter(Boolean);
  const space = spaceSlots.length ? spaceSlots : b.photos;
  const products =
    rawProducts.length >= 6
      ? rawProducts.slice(0, 6)
      : [0, 1, 2, 3, 4, 5]
          .map((idx) => rawProducts[idx] || space[idx % Math.max(1, space.length)] || rawProducts[idx % Math.max(1, rawProducts.length)] || "")
          .filter(Boolean);

  if (templateId.startsWith("zycron-")) {
    const allPhotos = [...new Set([...space, ...products])].slice(0, 8);
    return `
<section class="sec" id="galeria"><div class="wrap">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap">
    <h2${ed("gal.title")}>${esc(ctx.t("gal.title", "Por dentro"))}</h2>
    <span style="font-size:14px;opacity:.7">${esc(ctx.t("gal.sub", "Arraste para o lado para ver mais."))}</span>
  </div>
  <div class="zycron-rail">
    ${allPhotos
      .map(
        (u, idx) => `
    <div class="zycron-rail-item">
      <img src="${esc(u)}" alt="Foto ${idx + 1}" loading="lazy"${idx < 6 ? eimg(`gallery_${idx}`) : ""}>
      <span class="zycron-rail-badge">${idx + 1}/${allPhotos.length}</span>
    </div>`
      )
      .join("")}
  </div>
</div></section>`;
  }

  return `
<section class="sec" id="galeria"><div class="wrap">
  <div class="sec-head center">
    <span class="eyebrow"${ed("gal.eyebrow")}>${esc(ctx.t("gal.eyebrow", "Conheça nosso trabalho"))}</span>
    <h2${ed("gal.title")}>${titleWithAccent(ctx, "gal.title", "Galeria de fotos", "gal.accent")}</h2>
    <input type="hidden" data-accent="gal.accent" value="${esc(ctx.t("gal.accent", "Galeria"))}">
  </div>
  <div class="gal-tabs">
    <button class="pill on" data-gal="produtos">Destaques</button>
    <button class="pill" data-gal="espaco">Nosso Espaço</button>
  </div>
  <div class="gal" data-galprod>${products.slice(0, 6).map((u, idx) => `<figure><img src="${esc(u)}" alt="Destaque" loading="lazy"${eimg(`item_${idx}`)}></figure>`).join("")}</div>
  <div class="gal" data-galesp style="display:none">${space.slice(0, 6).map((u, idx) => `<figure><img src="${esc(u)}" alt="Nosso espaço" loading="lazy"${eimg(`gallery_${idx}`)}></figure>`).join("")}</div>
</div>
<div class="lightbox" data-lightbox><button data-lbclose aria-label="Fechar">${ICONS.x}</button><img src="" alt="Foto ampliada"></div>
</section>`;
}

export function bento(ctx) {
  const { b, templateId } = ctx;
  const items = b.items || [];

  if (templateId === "zycron-barbearia") {
    return `
<section class="sec" id="servicos" data-alias="especialidades"><div class="wrap">
  <div class="sec-head">
    <h2${ed("bento.title")}>${esc(ctx.t("bento.title", "Serviços"))}</h2>
  </div>
  <div class="zycron-dark-grid">
    ${items
      .slice(0, 8)
      .map((it, i) => {
        const btnId = `item_${i}`;
        const msg = `Olá! Vim pelo site da ${b.name} e quero saber sobre: ${it.name}`;
        const im = ctx.img(`item_${i}`, it.image);
        return `
    <a class="zycron-dark-card" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}" title="Clique na foto para alterar">
      <img src="${esc(im.url)}" style="object-fit:${im.fit}" alt="${esc(it.name)}" loading="lazy"${eimg(`item_${i}`)}>
      <div class="zycron-dark-card-body">
        <h3${ed(`item.${i}.name`)}>${esc(it.name)}</h3>
        <p${ed(`item.${i}.description`)}>${esc(it.description)}</p>
      </div>
    </a>`;
      })
      .join("")}
  </div>
</div></section>`;
  }

  if (templateId === "atelie-val") {
    return `
<section class="sec" id="especialidades"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("bento.eyebrow")}>${esc(ctx.t("bento.eyebrow", "Serviços principais"))}</span>
    <h2${ed("bento.title")}>${titleWithAccent(ctx, "bento.title", "Especialidades pensadas para valorizar cada detalhe.", "bento.accent")}</h2>
    <input type="hidden" data-accent="bento.accent" value="${esc(ctx.t("bento.accent", "cada detalhe."))}">
    <p class="sub"${ed("bento.sub")}>${esc(ctx.t("bento.sub", "Clique em qualquer serviço abaixo para solicitar seu orçamento direto no WhatsApp ou clique na foto para alterá-la."))}</p>
  </div>
  <div class="services-grid-val">
    ${items
      .slice(0, 8)
      .map((it, i) => {
        const btnId = `item_${i}`;
        const cfg = (ctx.buttons && ctx.buttons[btnId]) || {};
        const msg = cfg.waMessage || `Olá! Vim pelo site da ${b.name} e gostaria de orçamento para: ${it.name}`;
        const style = cfg.color ? ` style="background:${esc(cfg.color)};color:#fff;border-color:${esc(cfg.color)}"` : "";
        const im = ctx.img(`item_${i}`, it.image);
        const rawValDesc = String(it.description || "");
        const cardValDesc = rawValDesc.length > 165 ? `${rawValDesc.slice(0, 155).trim()}...` : rawValDesc;
        return `
    <article class="service-card-val" data-reveal>
      <div class="service-media-val" title="Clique para trocar a foto deste serviço">
        <img src="${esc(im.url)}" style="object-fit:${im.fit}" alt="${esc(it.name)}" loading="lazy"${eimg(`item_${i}`)}>
        ${it.badge ? `<span class="card-badge"${ed(`item.${i}.badge`)}>${esc(it.badge)}</span>` : ""}
      </div>
      <div class="service-body-val">
        <h3${ed(`item.${i}.name`)}>${esc(it.name)}</h3>
        <p${ed(`item.${i}.description`)}>${esc(cardValDesc)}</p>
        <div class="service-foot-val">
          <span class="service-tag-val"${ed(`item.${i}.price`)}>${esc(it.price || it.category || "Sob medida")}</span>
          <a class="discover-val" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}"${style} title="Pedir orçamento no WhatsApp"><span style="width:15px;height:15px;display:inline-flex">${ICONS.arrowR}</span></a>
        </div>
      </div>
    </article>`;
      })
      .join("")}
  </div>
  <p class="note-val"${ed("bento.note")}>${esc(ctx.t("bento.note", "* Orçamento personalizado pelo WhatsApp. Envie uma mensagem ou foto e retornamos rapidamente."))}</p>
</div></section>`;
  }

  if (templateId === "modelo-premium") {
    return `
<section class="strip-exec">
  <div class="wrap strip-grid-exec">
    <div class="strip-item-exec">
      <div class="strip-icon-exec">01</div>
      <div>
        <strong${ed("strip.1.t")}>${esc(ctx.t("strip.1.t", "Apresentação de alto impacto"))}</strong>
        <p${ed("strip.1.d")}>${esc(ctx.t("strip.1.d", "Atendimento estruturado para transmitir segurança e profissionalismo desde o primeiro contato."))}</p>
      </div>
    </div>
    <div class="strip-item-exec">
      <div class="strip-icon-exec">02</div>
      <div>
        <strong${ed("strip.2.t")}>${esc(ctx.t("strip.2.t", "Contato direto sem burocracia"))}</strong>
        <p${ed("strip.2.d")}>${esc(ctx.t("strip.2.d", "Respostas ágeis no WhatsApp para tirar dúvidas, enviar orçamentos e agendar horários."))}</p>
      </div>
    </div>
    <div class="strip-item-exec">
      <div class="strip-icon-exec">03</div>
      <div>
        <strong${ed("strip.3.t")}>${esc(ctx.t("strip.3.t", "Reputação comprovada no Google"))}</strong>
        <p${ed("strip.3.d")}>${esc(ctx.t("strip.3.d", `Nota ${formatRating(b.rating)} baseada na satisfação real de quem já conhece nosso trabalho em ${b.city}.`))}</p>
      </div>
    </div>
  </div>
</section>
<section class="sec" id="especialidades"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("bento.eyebrow")}>${esc(ctx.t("bento.eyebrow", "Soluções em destaque"))}</span>
    <h2${ed("bento.title")}>${titleWithAccent(ctx, "bento.title", "Como podemos atender você com excelência", "bento.accent")}</h2>
    <input type="hidden" data-accent="bento.accent" value="${esc(ctx.t("bento.accent", "excelência"))}">
  </div>
  <div class="cards-exec">
    ${items
      .slice(0, 6)
      .map((it, i) => {
        const btnId = `item_${i}`;
        const cfg = (ctx.buttons && ctx.buttons[btnId]) || {};
        const label = cfg.label || "Solicitar no WhatsApp ↗";
        const msg = cfg.waMessage || `Olá! Vim pelo site da ${b.name} e quero saber mais sobre: ${it.name}`;
        const style = cfg.color ? ` style="color:${esc(cfg.color)}"` : "";
        const im = ctx.img(`item_${i}`, it.image);
        const rawExecDesc = String(it.description || "");
        const cardExecDesc = rawExecDesc.length > 165 ? `${rawExecDesc.slice(0, 155).trim()}...` : rawExecDesc;
        return `
    <article class="card-exec" data-reveal>
      <div>
        <div class="card-exec-ph" title="Clique para trocar a foto">
          <img src="${esc(im.url)}" style="object-fit:${im.fit}" alt="${esc(it.name)}" loading="lazy"${eimg(`item_${i}`)}>
        </div>
        <span class="tag-exec"${ed(`item.${i}.badge`)}>DESTAQUE 0${i + 1}${it.badge ? ` · ${esc(it.badge)}` : ""}</span>
        <h3${ed(`item.${i}.name`)}>${esc(it.name)}</h3>
        <p${ed(`item.${i}.description`)}>${esc(cardExecDesc)}</p>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid rgba(18,45,42,.08)">
        <span class="price" style="font-size:16px"${ed(`item.${i}.price`)}>${esc(it.price)}</span>
        <a class="card-link-exec" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}"${style}>${esc(label)}</a>
      </div>
    </article>`;
      })
      .join("")}
  </div>
</div></section>`;
  }

  const subItems = items.slice(0, 4);
  const big = subItems[0] || {};
  const rest = subItems.slice(1);
  const bigImg = ctx.img("item_0", big.image || "");
  const link = (it, i) => {
    const btnId = `item_${i}`;
    const cfg = (ctx.buttons && ctx.buttons[btnId]) || {};
    const lbl = cfg.label || "Solicitar no WhatsApp";
    const msg = cfg.waMessage || `Olá! Vim pelo site da ${b.name} e quero saber mais sobre: ${it.name}`;
    const style = cfg.color ? ` style="color:${esc(cfg.color)}"` : "";
    return `<a class="bento-link" href="${waLink(b, msg)}" target="_blank" rel="noopener" data-wa data-btn="${btnId}"${style}><span>${esc(lbl)}</span> ${ICONS.arrowR}</a>`;
  };
  return `
<section class="sec" id="especialidades"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("bento.eyebrow")}>${esc(ctx.t("bento.eyebrow", "Especialidades"))}</span>
    <h2${ed("bento.title")}>${titleWithAccent(ctx, "bento.title", "Como podemos cuidar de você", "bento.accent")}</h2>
    <input type="hidden" data-accent="bento.accent" value="${esc(ctx.t("bento.accent", "cuidar"))}">
  </div>
  <div class="bento">
    <div class="bento-card big" style="--bimg:url('${esc(bigImg.url)}')" data-reveal${eimg("item_0")}>
      <span class="bento-ic">${ICONS.award}</span>
      <h3${ed("item.0.name")}>${esc(big.name || "")}</h3>
      <p${ed("item.0.description")}>${esc(big.description || "")}</p>
      ${link(big, 0)}
    </div>
    ${rest
      .map(
        (it, i) => `
    <div class="bento-card" data-reveal>
      <span class="bento-ic">${[ICONS.sparkles, ICONS.shield, ICONS.calendar][i % 3]}</span>
      <h3${ed(`item.${i + 1}.name`)}>${esc(it.name)}</h3>
      <p${ed(`item.${i + 1}.description`)}>${esc(it.description)}</p>
      ${link(it, i + 1)}
    </div>`
      )
      .join("")}
  </div>
</div></section>`;
}

export function steps(ctx) {
  const { b, templateId } = ctx;
  const customSteps = Array.isArray(b.steps_override) && b.steps_override.length >= 3 ? b.steps_override : null;

  if (templateId === "zycron-barbearia") {
    const list4 = customSteps || [
      { t: "Chame no WhatsApp", d: "Diga o serviço e o horário que você prefere." },
      { t: "Reserve seu horário", d: "Confirmamos na hora e deixamos tudo preparado para você." },
      { t: "Atendimento sob medida", d: "Você mostra o estilo ou explica o que precisa com calma." },
      { t: "Acabamento impecável", d: "Saia com o visual alinhado e a qualidade que você merece." },
    ];
    return `
<section class="sec" id="como-funciona" style="background:var(--soft)"><div class="wrap">
  <div class="sec-head">
    <h2${ed("steps.title")}>${esc(ctx.t("steps.title", "Como funciona"))}</h2>
  </div>
  <div class="zycron-steps-4">
    ${list4
      .slice(0, 4)
      .map(
        (s, i) => `
    <div>
      <span class="zycron-step-num">${i + 1}</span>
      <h3 style="font-size:22px;margin-bottom:8px;font-family:var(--fb);text-transform:none;font-weight:700"${ed(`step.${i}.title`)}>${esc(ctx.t(`step.${i}.title`, s.t))}</h3>
      <p style="font-size:14.5px;line-height:1.6;opacity:.8"${ed(`step.${i}.text`)}>${esc(ctx.t(`step.${i}.text`, s.d))}</p>
    </div>`
      )
      .join("")}
  </div>
</div></section>`;
  }

  if (templateId === "zycron-padaria") {
    const listChat = customSteps || [
      { t: "Mande a lista", d: "No WhatsApp, diga quantos salgados, que bolo, quantos pães e para qual dia." },
      { t: "Confira valor e data", d: "A gente vê o que dá para fazer na data pedida e passa o valor antes de anotar." },
      { t: "Confirme a encomenda", d: "Com tudo certo, o pedido fica anotado e a hora de retirada fica combinada." },
    ];
    return `
<section class="sec" id="como-funciona" style="background:var(--soft)"><div class="wrap" style="display:grid;grid-template-columns:1fr 1.1fr;gap:48px;align-items:start">
  <div>
    <h2${ed("steps.title")}>${esc(ctx.t("steps.title", "Como funciona"))}</h2>
    <p class="sub" style="margin-top:12px"${ed("steps.sub")}>${esc(ctx.t("steps.sub", "Tudo começa por uma mensagem. É assim que funciona:"))}</p>
  </div>
  <div class="zycron-chat-steps">
    ${listChat
      .slice(0, 4)
      .map(
        (s, i) => `
    <div class="zycron-chat-bubble">
      <b${ed(`step.${i}.title`)}>${esc(ctx.t(`step.${i}.title`, s.t))}</b>
      <p${ed(`step.${i}.text`)}>${esc(ctx.t(`step.${i}.text`, s.d))}</p>
    </div>`
      )
      .join("")}
  </div>
</div></section>`;
  }

  const list = customSteps || [
    { n: "01", t: "Chame no WhatsApp", d: "Clique em qualquer botão do site e conte o que você precisa. Respondemos rápido, de verdade." },
    { n: "02", t: "Receba o atendimento", d: "Agendamos o melhor horário ou separamos o que você pediu com todo cuidado e atenção." },
    { n: "03", t: "Aproveite o resultado", d: `Experimente o padrão ${b.name}: qualidade que rende nota ${formatRating(b.rating)} no Google.` },
  ];
  return `
<section class="sec" id="como-funciona" style="background:var(--soft)"><div class="wrap">
  <div class="sec-head center">
    <span class="eyebrow"${ed("steps.eyebrow")}>${esc(ctx.t("steps.eyebrow", "Simples assim"))}</span>
    <h2${ed("steps.title")}>${titleWithAccent(ctx, "steps.title", "Como funciona", "steps.accent")}</h2>
    <input type="hidden" data-accent="steps.accent" value="${esc(ctx.t("steps.accent", "funciona"))}">
  </div>
  <div class="steps">${list
    .slice(0, 3)
    .map(
      (s, i) => `
    <div class="step" data-reveal>
      <span class="num">${s.n || `0${i + 1}`}</span>
      <h3${ed(`step.${i}.title`)}>${esc(ctx.t(`step.${i}.title`, s.t))}</h3>
      <p${ed(`step.${i}.text`)}>${esc(ctx.t(`step.${i}.text`, s.d))}</p>
    </div>`
    )
    .join("")}</div>
</div></section>`;
}

export function authority(ctx) {
  const { b } = ctx;
  const fallbackAuth = ctx.img("about", b.photos[1] || b.photos[0]).url;
  return `
<section class="sec" id="autoridade"><div class="wrap auth-in">
  <div class="about-ph" data-reveal>
    ${responsiveImgTag(ctx, "authority", "about_mobile", fallbackAuth, b.name)}
    <div class="about-tag">${ICONS.verified}<span${ed("auth.tag")}>${esc(ctx.t("auth.tag", "Perfil verificado no Google"))}</span></div>
  </div>
  <div data-reveal>
    <span class="eyebrow"${ed("auth.eyebrow")}>${esc(ctx.t("auth.eyebrow", "Por que confiar"))}</span>
    <h2 style="margin:14px 0 18px"${ed("auth.title")}>${titleWithAccent(ctx, "auth.title", "Referência em " + b.city, "auth.accent")}</h2>
    <input type="hidden" data-accent="auth.accent" value="${esc(ctx.t("auth.accent", b.city))}">
    <p class="sub"${ed("auth.text")}>${esc(ctx.t("auth.text", `A ${b.name} construiu sua reputação atendimento após atendimento. Números que mostram compromisso real com quem confia no nosso trabalho.`))}</p>
    <div class="auth-nums">
      <div class="auth-num"><b>${formatRating(b.rating)}</b><small>nota média no Google</small></div>
      <div class="auth-num"><b>${b.rating_count || "300"}+</b><small>avaliações de clientes</small></div>
      <div class="auth-num"><b>10+</b><small>anos de experiência</small></div>
      <div class="auth-num"><b>98%</b><small>clientes que recomendam</small></div>
    </div>
    
  </div>
</div></section>`;
}

export function promo(ctx) {
  const { b, promo: p } = ctx;
  return `
<section class="sec promo" id="promocao"><div class="wrap promo-in">
  <div data-reveal>
    <span class="promo-eyebrow">${ICONS.percent}<span${ed("promo.eyebrow")}>${esc(ctx.t("promo.eyebrow", "Oferta por tempo limitado"))}</span></span>
    <h2${ed("promo.title")}>${esc(ctx.t("promo.title", p.title))}</h2>
    <div><span class="old"${ed("promo.oldPrice")}>${esc(ctx.t("promo.oldPrice", p.oldPrice))}</span><span class="new"${ed("promo.newPrice")}>${esc(ctx.t("promo.newPrice", p.newPrice))}</span></div>
    <p style="opacity:.78;margin-top:10px;font-size:14.5px"${ed("promo.subtitle")}>${esc(ctx.t("promo.subtitle", p.subtitle))}</p>
  </div>
  <div style="display:flex;flex-direction:column;gap:18px;align-items:flex-start" data-reveal>
    <div class="count" data-countdown="${esc(p.endsAt)}">
      <div><b data-cd-h>00</b><small>Horas</small></div>
      <div><b data-cd-m>00</b><small>Minutos</small></div>
      <div><b data-cd-s>00</b><small>Segundos</small></div>
    </div>
    ${btnHtml(ctx, "promo_cta", "Garantir Oferta no WhatsApp", "btn-acc", `Olá! Vim pelo site da ${b.name} e quero garantir a oferta: ${p.title}`)}
  </div>
</div></section>`;
}

export function video(ctx) {
  const { video: v, b } = ctx;
  const url = String(v.url || "");
  const yt = (url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/) || [])[1];
  const vimeo = (url.match(/vimeo\.com\/(\d+)/) || [])[1];
  const isDirectVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url) || /^(data:video\/|blob:)/i.test(url);
  const cover = b.photos[0] || "";
  const isPortrait = v.aspectRatio === "9:16";
  const frameStyle = isPortrait ? ' style="max-width:360px;aspect-ratio:9/16;margin:0 auto"' : "";
  return `
<section class="sec" id="video"><div class="wrap">
  <div class="sec-head center">
    <span class="eyebrow"${ed("video.eyebrow")}>${esc(ctx.t("video.eyebrow", "Conheça de perto"))}</span>
    <h2${ed("video.title")}>${titleWithAccent(ctx, "video.title", "Um pouco da nossa rotina", "video.accent")}</h2>
    <input type="hidden" data-accent="video.accent" value="${esc(ctx.t("video.accent", "rotina"))}">
  </div>
  <div class="video-frame"${frameStyle} data-reveal>
    ${
      yt
        ? `<div class="video-cover" style="background-image:url('https://img.youtube.com/vi/${yt}/maxresdefault.jpg')" data-videoplay="https://www.youtube.com/embed/${yt}?autoplay=1"><button class="video-play">${ICONS.play}</button></div>`
        : vimeo
        ? `<div class="video-cover" style="background-image:url('${esc(cover)}')" data-videoplay="https://player.vimeo.com/video/${vimeo}?autoplay=1"><button class="video-play">${ICONS.play}</button></div>`
        : isDirectVideo
        ? `<video src="${esc(url)}" controls autoplay muted loop playsinline preload="metadata" poster="${esc(cover)}" style="width:100%;height:100%;object-fit:cover"></video>`
        : `<div class="video-cover" style="background-image:url('${esc(cover)}')" data-videoplay=""><button class="video-play">${ICONS.play}</button></div>`
    }
  </div>
</div></section>`;
}

export function reviews(ctx) {
  const { b } = ctx;
  const good = (b.reviews || []).filter((r) => r.rating >= 4).sort((a, z) => z.rating - a.rating).slice(0, 10);
  return `
<section class="sec rev" id="avaliacoes"><div class="wrap">
  <div class="rev-sum" data-reveal>
    <span class="rev-score"${ed("rev.score")}>${formatRating(b.rating)}</span>
    <div>
      <div class="rev-stars">${ICONS.star.repeat(Math.round(b.rating || 5))}</div>
      <div class="rev-count">Baseado em ${b.rating_count || good.length} avaliações reais</div>
    </div>
    <div class="rev-google">${ICONS.google}<span>Google<br>Avaliações</span></div>
    <div class="rev-nav"><button data-revprev aria-label="Anterior">${ICONS.chevL}</button><button data-revnext aria-label="Próximo">${ICONS.chevR}</button></div>
  </div>
  <div class="rev-track" data-revtrack>
    ${good
      .map(
        (r) => `
    <article class="rev-card">
      <div class="rev-head">
        <span class="rev-av">${initials(r.author)}</span>
        <div><b>${esc(r.author)}</b><small>${esc(r.time || "recentemente")}</small></div>
      </div>
      <div class="rev-stars">${ICONS.star.repeat(r.rating)}</div>
      <p>“${esc(r.text)}”</p>
      <div style="display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:700;color:color-mix(in srgb,var(--ink) 50%,transparent)">${ICONS.google} Publicado no Google</div>
    </article>`
      )
      .join("")}
  </div>
  <div class="rev-cta">
    <a class="btn btn-ghost bfx-lift" style="color:var(--ink)" href="${esc(b.google_maps_uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + " " + b.address)}`)}" target="_blank" rel="noopener" data-btn="rev_cta">${ICONS.google}<span>Ver todas no Google Maps</span></a>
  </div>
</div></section>`;
}

export function location(ctx) {
  const { b } = ctx;
  const q = encodeURIComponent(b.address || `${b.name} ${b.city}`);
  const mapsUrl = b.google_maps_uri || `https://www.google.com/maps/search/?api=1&query=${q}`;
  const wazeUrl = b.lat && b.lng ? `https://waze.com/ul?ll=${b.lat}%2C${b.lng}&navigate=yes` : `https://waze.com/ul?q=${q}&navigate=yes`;
  const embed = b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}&z=16&output=embed` : `https://www.google.com/maps?q=${q}&output=embed`;
  return `
<section class="sec" id="localizacao"><div class="wrap">
  <div class="sec-head">
    <span class="eyebrow"${ed("loc.eyebrow")}>${esc(ctx.t("loc.eyebrow", "Perto de você"))}</span>
    <h2${ed("loc.title")}>${titleWithAccent(ctx, "loc.title", "Como chegar", "loc.accent")}</h2>
    <input type="hidden" data-accent="loc.accent" value="${esc(ctx.t("loc.accent", "chegar"))}">
  </div>
  <div class="loc" data-reveal>
    <div class="loc-info">
      <span class="open-badge${b.open_now ? "" : " closed"}"><i></i>${b.open_now ? "Aberto agora" : "Fechado no momento"}</span>
      <h3 style="font-size:24px"${ed("loc.name")}>${esc(ctx.t("loc.name", b.name))}</h3>
      <div class="loc-line">${ICONS.mappin}<span${ed("loc.address")}>${esc(ctx.t("loc.address", b.address))}</span></div>
      <div class="loc-line">${ICONS.clock}<span${ed("loc.hours")}>${esc(ctx.t("loc.hours", b.hours_text || "Consulte os horários"))}</span></div>
      <div class="loc-line">${ICONS.phone}<a href="tel:+${esc(b.whatsapp)}" data-wa>${esc(b.phone)}</a></div>
      <div class="loc-btns">
        <a class="btn btn-pri bfx-lift" style="padding:12px 20px;font-size:13.5px" href="${mapsUrl}" target="_blank" rel="noopener" data-btn="loc_maps">${ICONS.mappin}<span>Abrir no Google Maps</span></a>
        <a class="btn btn-ghost bfx-lift" style="padding:12px 20px;font-size:13.5px;color:var(--ink)" href="${wazeUrl}" target="_blank" rel="noopener" data-btn="loc_waze">${ICONS.navigation}<span>Traçar Rota no Waze</span></a>
      </div>
    </div>
    <div class="loc-map"><iframe src="${embed}" loading="lazy" title="Mapa de ${esc(b.name)}" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
  </div>
</div></section>`;
}

export function faq(ctx) {
  const { b, templateId } = ctx;
  const faqs = b.faqs || [];

  if (templateId === "zycron-padaria") {
    return `
<section class="sec" id="faq" style="background:var(--bg)"><div class="wrap" style="display:grid;grid-template-columns:.9fr 1.1fr;gap:48px;align-items:start">
  <div>
    <h2${ed("faq.title")}>${esc(ctx.t("faq.title", "Perguntas que sempre chegam"))}</h2>
    <p style="margin-top:14px;font-size:15px"><a href="${waLink(b, `Olá! Vim pelo site da ${b.name} e tenho uma dúvida.`)}" target="_blank" rel="noopener" style="text-decoration:underline;color:var(--sec)">Não achou? Pergunte no WhatsApp</a></p>
  </div>
  <div>
    ${faqs
      .map(
        (f, i) => `
    <div class="zycron-chat-faq-item">
      <div class="zycron-chat-q"><span${ed(`faq.${i}.q`)}>${esc(f.q)}</span><span style="width:14px;height:14px;display:inline-flex;opacity:.8">${ICONS.checkDouble}</span></div>
      <div class="zycron-chat-a"${ed(`faq.${i}.a`)}>${esc(f.a)}</div>
    </div>`
      )
      .join("")}
  </div>
</div></section>`;
  }

  return `
<section class="sec" id="faq" style="background:var(--soft)"><div class="wrap">
  <div class="sec-head center">
    <span class="eyebrow"${ed("faq.eyebrow")}>${esc(ctx.t("faq.eyebrow", "Sem dúvidas por aqui"))}</span>
    <h2${ed("faq.title")}>${titleWithAccent(ctx, "faq.title", "Perguntas frequentes", "faq.accent")}</h2>
    <input type="hidden" data-accent="faq.accent" value="${esc(ctx.t("faq.accent", "frequentes"))}">
  </div>
  <div class="faq">
    ${faqs
      .map(
        (f, i) => `
    <details>
      <summary><span${ed(`faq.${i}.q`)}>${esc(f.q)}</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></summary>
      <div class="a"${ed(`faq.${i}.a`)}>${esc(f.a)}</div>
    </details>`
      )
      .join("")}
  </div>
</div></section>`;
}

function hoursList(b) {
  const hours = Array.isArray(b.hours) ? b.hours : [];
  if (hours.length !== 7) return `<p>${esc(b.hours_text || "Consulte nosso horário")}</p>`;
  const today = (new Date().getDay() + 6) % 7;
  return `<div class="hours-list">${hours
    .map((h, i) => {
      const [day, ...rest] = h.split(": ");
      return `<span class="${i === today ? "today" : ""}"><b>${esc(day.replace("-feira", ""))}</b><i>${esc(rest.join(": "))}</i></span>`;
    })
    .join("")}</div>`;
}

export function bottomShell(ctx) {
  const { b, arch } = ctx;
  const cta = arch === "gastronomia" ? "Encomendar pelo WhatsApp" : arch === "servicos" ? "Agendar pelo WhatsApp" : "Chamar no WhatsApp";
  const q = encodeURIComponent(b.address || `${b.name} ${b.city}`);
  const mapsUrl = b.google_maps_uri || `https://www.google.com/maps/search/?api=1&query=${q}`;
  const isOpen = b.open_now !== false;
  return `
<footer class="bottom" style="padding-bottom:68px">
  <div class="wrap">
    <div class="bottom-cta" data-reveal>
      <span class="eyebrow"${ed("foot.eyebrow")}>${esc(ctx.t("foot.eyebrow", "A um clique de distância"))}</span>
      <h2${ed("foot.title")}>${titleWithAccent(ctx, "foot.title", `Fale com a ${b.name}`, "foot.accent")}</h2>
      <input type="hidden" data-accent="foot.accent" value="${esc(ctx.t("foot.accent", b.name.split(" ")[0]))}">
      <p${ed("foot.text")}>${esc(ctx.t("foot.text", "Atendimento rápido e humano direto no WhatsApp. Sem robôs, sem espera — do jeito que você merece."))}</p>
      ${btnHtml(ctx, "footer_cta", cta, "btn-acc", `Olá! Vim pelo site da ${b.name} e quero atendimento.`)}
    </div>
    <div class="foot">
      <div>
        ${ctx.logo && ctx.logo.url ? `<img class="foot-logo" src="${esc(ctx.logo.url)}" alt="${esc(b.name)}">` : ""}
        <div class="foot-brand">${esc(b.name)}</div>
        <p${ed("foot.tagline")}>${esc(ctx.t("foot.tagline", `${b.category} em ${b.city}${b.uf ? " · " + b.uf : ""}. Qualidade comprovada por ${b.rating_count || "centenas de"} avaliações no Google.`))}</p>
      </div>
      <div>
        <h4>Contato</h4>
        <a href="tel:+${esc(b.whatsapp)}" data-wa>${esc(b.phone)}</a>
        <a href="${waLink(b, `Olá! Vim pelo site da ${b.name}.`)}" target="_blank" rel="noopener" data-wa data-btn="footer_link">WhatsApp direto</a>
        ${b.website ? `<a href="${esc(b.website)}" target="_blank" rel="noopener">Site oficial</a>` : ""}
        <p>${esc(b.address)}</p>
      </div>
      <div>
        <h4>Horários</h4>
        ${hoursList(b)}
        <p>${isOpen ? "Aberto agora" : "Fechado no momento"}</p>
      </div>
    </div>
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${esc(b.name)} · Todos os direitos reservados · Site criado com Site Express Studio Pro</div>
</footer>
`;
}
