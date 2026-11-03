// Monta o HTML completo e autossuficiente do site gerado (canvas + exportação).
// ATENÇÃO: Nenhuma seção possui cadeado bloqueado (fixed: false em todas, incluindo o Hero).
import { PALETTES, ALL_PALETTES, FONT_PAIRS, DEFAULT_FONT, SITE_TEMPLATES, buildCss, esc } from "./theme";
import * as S from "./sections";
import JSZip from "jszip";

export const ARCH_SECTIONS = {
  gastronomia: [
    { id: "hero", label: "Hero Fotográfico", fixed: false },
    { id: "quickstrip", label: "Atalho Rápido", fixed: false },
    { id: "menu", label: "Cardápio Categorizado", fixed: false },
    { id: "steps", label: "Como Funciona", fixed: false },
    { id: "promo", label: "Promoção com Cronômetro", fixed: false },
    { id: "spotlight", label: "Destaque Giratório", fixed: false },
    { id: "video", label: "Vídeo Institucional", fixed: false },
    { id: "about", label: "Sobre Nós", fixed: false },
    { id: "gallery", label: "Galeria / Por Dentro", fixed: false },
    { id: "reviews", label: "Avaliações do Google", fixed: false },
    { id: "location", label: "Localização & Rotas", fixed: false },
    { id: "faq", label: "Dúvidas Frequentes", fixed: false },
  ],
  servicos: [
    { id: "hero", label: "Hero Editorial", fixed: false },
    { id: "bento", label: "Vitrine de Serviços / Especialidades", fixed: false },
    { id: "gallery", label: "Galeria / Por Dentro", fixed: false },
    { id: "steps", label: "Como Funciona (Etapas)", fixed: false },
    { id: "promo", label: "Promoção com Cronômetro", fixed: false },
    { id: "authority", label: "Sobre / Autoridade & Números", fixed: false },
    { id: "video", label: "Vídeo Institucional", fixed: false },
    { id: "reviews", label: "Avaliações do Google", fixed: false },
    { id: "location", label: "Localização & Rotas", fixed: false },
    { id: "faq", label: "Dúvidas Frequentes", fixed: false },
  ],
  produtos: [
    { id: "hero", label: "Hero Vitrine", fixed: false },
    { id: "catalog", label: "Catálogo de Produtos", fixed: false },
    { id: "gallery", label: "Galeria / Por Dentro", fixed: false },
    { id: "steps", label: "Como Funciona", fixed: false },
    { id: "promo", label: "Promoção com Cronômetro", fixed: false },
    { id: "video", label: "Vídeo Institucional", fixed: false },
    { id: "about", label: "Sobre a Loja", fixed: false },
    { id: "reviews", label: "Avaliações do Google", fixed: false },
    { id: "location", label: "Localização & Rotas", fixed: false },
    { id: "faq", label: "Dúvidas Frequentes", fixed: false },
  ],
};

export function defaultSections(arch) {
  const off = new Set(["promo", "video"]);
  return (ARCH_SECTIONS[arch] || ARCH_SECTIONS.produtos).map((s) => ({
    id: s.id,
    on: !off.has(s.id),
  }));
}

const SECTION_RENDERERS = {
  hero: (ctx) => S.hero(ctx),
  quickstrip: (ctx) => S.quickstrip(ctx),
  menu: (ctx) => S.menu(ctx),
  catalog: (ctx) => S.catalog(ctx),
  spotlight: (ctx) => S.spotlight(ctx),
  about: (ctx) => S.about(ctx),
  gallery: (ctx) => S.gallery(ctx),
  bento: (ctx) => S.bento(ctx),
  steps: (ctx) => S.steps(ctx),
  authority: (ctx) => S.authority(ctx),
  promo: (ctx) => S.promo(ctx),
  video: (ctx) => S.video(ctx),
  reviews: (ctx) => S.reviews(ctx),
  location: (ctx) => S.location(ctx),
  faq: (ctx) => S.faq(ctx),
};

const BACKEND = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_BACKEND_URL || "" : "";
export const absUrl = (u) => (typeof u === "string" && u.startsWith("/api/") ? BACKEND + u : u);

function normalizeBusiness(b) {
  return {
    ...b,
    photos: (b.photos || []).map(absUrl),
    items: (b.items || []).map((it) => ({ ...it, image: absUrl(it.image) })),
  };
}

export function buildCtx(data) {
  const arch = data.archetype || "produtos";
  const defaultTpl = arch === "gastronomia" ? "simprao" : arch === "servicos" ? "atelie-val" : "vitrine-express";
  const templateId = data.templateId || defaultTpl;
  const tplDef = SITE_TEMPLATES.find((t) => t.id === templateId);
  const palList = PALETTES[arch] || PALETTES.produtos;
  const foundPal = ALL_PALETTES.find((p) => p.id === (data.paletteId || tplDef?.paletteId)) || palList[0];
  const pal = data.customPalette && data.paletteId === "logo-auto" ? data.customPalette : foundPal.vars;
  const font =
    FONT_PAIRS.find((f) => f.id === (data.fontId || tplDef?.fontId)) ||
    FONT_PAIRS.find((f) => f.id === DEFAULT_FONT[arch]) ||
    FONT_PAIRS[0];
  return {
    b: normalizeBusiness(data.business),
    arch,
    templateId,
    pal,
    font,
    logo: data.logo || null,
    heroLayout: data.heroLayout || (templateId === "novolar-moveis" ? "cover" : "default"),
    heroOpacity: data.heroOpacity != null ? data.heroOpacity : 78,
    heroFinish: data.heroFinish || "clean",
    promo: data.promo || {},
    video: data.video || { url: "" },
    buttons: data.buttons || {},
    t: (key, fallback) => (data.texts && data.texts[key] != null ? data.texts[key] : fallback),
    img: (id, fallback) => {
      const o = (data.images || {})[id];
      return {
        url: absUrl((o && o.url) || fallback),
        fit: (o && o.fit) || "cover",
      };
    },
  };
}

function seoHead(data, ctx) {
  const b = ctx.b;
  const m = data.marketing || {};
  const title = m.seoTitle || `${b.name} | ${b.category} em ${b.city}${b.uf ? " - " + b.uf : ""}`;
  const desc = m.seoDesc || (b.bio || "").slice(0, 155);
  const type = data.archetype === "gastronomia" ? "FoodEstablishment" : data.archetype === "servicos" ? "MedicalBusiness" : "LocalBusiness";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    name: b.name,
    description: desc,
    telephone: b.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address,
      addressLocality: b.city,
      addressRegion: b.uf,
      addressCountry: "BR",
    },
    geo: b.lat && b.lng ? { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng } : undefined,
    aggregateRating: b.rating ? { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.rating_count || 0 } : undefined,
    image: (b.photos || [])[0],
    openingHours: b.hours_text || undefined,
  };
  Object.keys(jsonLd).forEach((k) => jsonLd[k] === undefined && delete jsonLd[k]);
  return `
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${esc((b.photos || [])[0] || "")}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(m.canonical || "")}">
${m.gsc ? `<meta name="google-site-verification" content="${esc(m.gsc)}">` : ""}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

function pixelScripts(data) {
  const m = data.marketing || {};
  let out = "";
  if (m.metaPixelId) {
    out += `
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(m.metaPixelId)}');fbq('track','PageView');</script>`;
  }
  if (m.ga4Id || m.gadsId) {
    const gid = m.gadsId || m.ga4Id;
    out += `
<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(gid)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${m.gadsId ? `gtag('config','${esc(m.gadsId)}');` : ""}${m.ga4Id ? `gtag('config','${esc(m.ga4Id)}');` : ""}</script>`;
  }
  if (m.gtmId) {
    out += `
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${esc(m.gtmId)}');</script>`;
  }
  return out;
}

function gtmBody(data) {
  const m = data.marketing || {};
  return m.gtmId
    ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${esc(m.gtmId)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
    : "";
}

function interactionScript(data, editor, trackUrl) {
  const m = data.marketing || {};
  return `
<script>
(function(){
  var TRACK=${JSON.stringify(trackUrl || "")};
  function track(btn){if(!TRACK)return;try{var body=JSON.stringify({button:btn||'outro',page:location.href});
    if(navigator.sendBeacon){navigator.sendBeacon(TRACK,new Blob([body],{type:'text/plain'}))}
    else{fetch(TRACK,{method:'POST',body:body,keepalive:true,headers:{'Content-Type':'text/plain'}})}}catch(e){}}
  // Reveal on scroll
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll('[data-reveal]').forEach(function(el){io.observe(el)});
  // Filtros de pílulas
  var pills=document.querySelectorAll('.pill[data-filter]');
  pills.forEach(function(p){p.addEventListener('click',function(){
    pills.forEach(function(x){x.classList.remove('on')});p.classList.add('on');
    var f=p.getAttribute('data-filter');
    document.querySelectorAll('.card-item').forEach(function(c){
      c.style.display=(f==='all'||c.getAttribute('data-cat')===f)?'':'none';
    });
  })});
  // Atalhos rápidos
  document.querySelectorAll('[data-quickfilter]').forEach(function(q){q.addEventListener('click',function(){
    var mode=q.getAttribute('data-quickfilter');
    var all=document.querySelector('.pill[data-filter="all"]');if(all)all.click();
    if(mode==='top'){document.querySelectorAll('.card-item').forEach(function(c){if(c.getAttribute('data-top')!=='1')c.style.display='none'})}
    var t=document.getElementById('cardapio')||document.getElementById('catalogo');if(t)t.scrollIntoView({behavior:'smooth'});
  })});
  // Spotlight
  document.querySelectorAll('[data-spotcar]').forEach(function(car){
    var imgs=car.querySelectorAll('img'),i=0;
    if(!imgs.length)return;
    function go(d){imgs[i].classList.remove('on');i=(i+d+imgs.length)%imgs.length;imgs[i].classList.add('on')}
    var p=car.querySelector('[data-spotprev]'),n=car.querySelector('[data-spotnext]');
    if(p)p.addEventListener('click',function(){go(-1)});if(n)n.addEventListener('click',function(){go(1)});
    setInterval(function(){go(1)},5200);
  });
  // Carrossel de avaliações
  var track=document.querySelector('[data-revtrack]');
  if(track){
    var step=function(){var c=track.querySelector('.rev-card');return c?c.offsetWidth+20:320};
    var pv=document.querySelector('[data-revprev]'),nx=document.querySelector('[data-revnext]');
    if(pv)pv.addEventListener('click',function(){track.scrollBy({left:-step(),behavior:'smooth'})});
    if(nx)nx.addEventListener('click',function(){track.scrollBy({left:step(),behavior:'smooth'})});
  }
  // Galeria + lightbox
  var lb=document.querySelector('[data-lightbox]');
  document.querySelectorAll('[data-gal]').forEach(function(tab){tab.addEventListener('click',function(){
    document.querySelectorAll('[data-gal]').forEach(function(x){x.classList.remove('on')});tab.classList.add('on');
    var prod=tab.getAttribute('data-gal')==='produtos';
    var gp=document.querySelector('[data-galprod]'),ge=document.querySelector('[data-galesp]');
    if(gp)gp.style.display=prod?'grid':'none';if(ge)ge.style.display=prod?'none':'grid';
  })});
  if(lb){
    var lbi=lb.querySelector('img');
    document.querySelectorAll('.gal figure').forEach(function(f){f.addEventListener('click',function(){lbi.src=f.querySelector('img').src;lb.classList.add('open')})});
    lb.addEventListener('click',function(){lb.classList.remove('open')});
  }
  // Vídeo
  document.querySelectorAll('[data-videoplay]').forEach(function(cov){cov.addEventListener('click',function(){
    var src=cov.getAttribute('data-videoplay');if(!src)return;
    var fr=document.createElement('iframe');fr.src=src;fr.allow='autoplay;fullscreen';fr.allowFullscreen=true;
    cov.replaceWith(fr);
  })});
  // Cronômetro
  document.querySelectorAll('[data-countdown]').forEach(function(cd){
    var end=new Date(cd.getAttribute('data-countdown')).getTime();
    var h=cd.querySelector('[data-cd-h]'),m2=cd.querySelector('[data-cd-m]'),s=cd.querySelector('[data-cd-s]');
    function tick(){var d=Math.max(0,end-Date.now());var hh=Math.floor(d/3.6e6),mm=Math.floor(d%3.6e6/6e4),ss=Math.floor(d%6e4/1e3);
      if(h)h.textContent=String(hh).padStart(2,'0');if(m2)m2.textContent=String(mm).padStart(2,'0');if(s)s.textContent=String(ss).padStart(2,'0')}
    tick();setInterval(tick,1000);
  });
  // Barra WhatsApp mobile
  var bar=document.querySelector('.wa-bar');
  if(bar){var toggle=function(){bar.classList.toggle('show',window.scrollY>window.innerHeight*.6)};window.addEventListener('scroll',toggle,{passive:true});toggle()}
  // Eventos de conversão (Meta Pixel / Google Ads)
  document.querySelectorAll('a[data-wa]').forEach(function(a){a.addEventListener('click',function(){
    track(a.getAttribute('data-btn')||((a.getAttribute('href')||'').indexOf('tel:')===0?'telefone':'outro'));
    try{if(window.fbq)fbq('track','Contact')}catch(e){}
    try{if(window.gtag){${m.gadsId && m.gadsLabel ? `gtag('event','conversion',{send_to:'${m.gadsId}/${m.gadsLabel}'});` : ""}gtag('event','whatsapp_click',{event_category:'contato'})}}catch(e){}
  })});
  ${
    editor
      ? `
  // ---- Ponte do editor visual limpa (sem linhas intrusivas) ----
  document.addEventListener('click',function(e){
    var lg=e.target.closest('[data-logo-edit]');
    if(lg){e.preventDefault();parent.postMessage({__sxp:1,type:'edit-logo'},'*');return}
    var t=e.target.closest('a');if(t){e.preventDefault()}
    var b=e.target.closest('[data-btn]');
    if(b&&!e.target.closest('[data-edit]')){e.preventDefault();parent.postMessage({__sxp:1,type:'inspect-button',id:b.getAttribute('data-btn')},'*');return}
    var im=e.target.closest('[data-img]');
    if(im){e.preventDefault();parent.postMessage({__sxp:1,type:'inspect-image',id:im.getAttribute('data-img')},'*')}
  },true);

  document.querySelectorAll('[data-edit]').forEach(function(el){
    el.setAttribute('contenteditable','true');el.setAttribute('spellcheck','false');
    el.style.outline='none';
    el.style.cursor='text';
    el.addEventListener('focus',function(){
      el.style.boxShadow='0 0 0 2px rgba(59,130,246,0.6)';
      el.style.borderRadius='4px';
    });
    el.addEventListener('blur',function(){
      el.style.boxShadow='';
      parent.postMessage({__sxp:1,type:'edit',key:el.getAttribute('data-edit'),value:el.textContent},'*');
    });
    el.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();el.blur()}});
  });
  `
      : ""
  }
})();
</script>`;
}

export function generateSiteHtml(data, opts = {}) {
  const editor = !!opts.editor;
  const trackUrl = !editor && opts.slug ? `${BACKEND}/api/public/track/${opts.slug}` : "";
  const ctx = buildCtx(data);
  const sections = (data.sections || defaultSections(data.archetype)).filter((s) => s.on);
  const body = sections.map((s) => (SECTION_RENDERERS[s.id] ? SECTION_RENDERERS[s.id](ctx) : "")).join("\n");
  const font = ctx.font;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoHead(data, ctx)}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font.google}&display=swap" rel="stylesheet">
<script>window.tailwind={config:{corePlugins:{preflight:false}}};</script>
<script src="https://cdn.tailwindcss.com"></script>
<style>${buildCss(ctx.pal, font, data.archetype, ctx.templateId)}</style>
${pixelScripts(data)}
</head>
<body class="arch-${data.archetype} tpl-${ctx.templateId}">
${gtmBody(data)}
${S.header(ctx)}
${body}
${S.bottomShell(ctx)}
${interactionScript(data, editor, trackUrl)}
</body>
</html>`;
}

export function suspendedHtml(name, reason = "manual", expiredDays = 0) {
  const isExpired = reason === "contract_expired";
  const title = isExpired ? "Site Temporariamente Fora do Ar" : "Site Temporariamente Indisponível";
  const badge = isExpired
    ? `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(239,68,68,0.18);color:#f87171;border:1px solid rgba(239,68,68,0.35);padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;">Vigência Contratual Expirada${expiredDays > 0 ? ` · Há ${expiredDays}d` : ""}</span>`
    : `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.35);padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;">Manutenção Temporária</span>`;

  const desc = isExpired
    ? `O período de vigência e manutenção do site de <b>${esc(name)}</b> encerrou seu ciclo contratual.<br><br>Para renovar o contrato digital, regularizar o ciclo ou reativar o endereço oficial da empresa imediatamente, entre em contato com a equipe comercial e de atendimento.`
    : `O site oficial de <b>${esc(name)}</b> foi pausado temporariamente pela administração.<br><br>Para mais informações ou reativação, consulte os responsáveis pelo atendimento.`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(name)} — ${isExpired ? "Contrato Expirado" : "Indisponível"}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>body{margin:0;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;}svg{width:32px;height:32px}</style></head>
<body><div class="susp"><div class="susp-in">
<div class="ic ${isExpired ? "ic-exp" : "ic-man"}">
  ${
    isExpired
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`
  }
</div>
${badge}
<h1>${title}</h1>
<p>${desc}</p>
<div class="foot">Plataforma G360 · Sistema de Hospedagem & Gestão de Contratos Digitais</div>
</div></div>
<style>
.susp{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090d16;color:#fff;text-align:center;padding:32px 20px;}
.susp-in{max-width:520px;display:flex;flex-direction:column;gap:18px;align-items:center;background:#0f172a;border:1px solid #1e293b;padding:42px 32px;border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);}
.susp .ic{width:72px;height:72px;border-radius:20px;display:grid;place-items:center;}
.susp .ic-exp{background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);}
.susp .ic-man{background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);}
.susp h1{font-size:26px;font-weight:900;letter-spacing:-0.03em;margin:0;color:#f8fafc;}
.susp p{color:#94a3b8;font-size:14.5px;line-height:1.75;margin:0;}
.susp .foot{margin-top:8px;font-size:11.5px;color:#64748b;font-weight:600;letter-spacing:0.02em;}
</style>
</body></html>`;
}

export function downloadHtml(data, filename, slug) {
  const html = generateSiteHtml(data, { editor: false, slug });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadSiteZip(data, filename, slug) {
  const zip = new JSZip();
  const cleanSlug = (slug || filename || "site-oficial").replace(/\.html$/i, "").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  const siteOrigin = (data?.marketing?.canonical || `https://${cleanSlug}.vercel.app`).replace(/\/+$/, "");
  const html = generateSiteHtml(data, { editor: false, slug: cleanSlug });
  const nowIso = new Date().toISOString().slice(0, 10);

  // 1. Complete index.html
  zip.file("index.html", html);

  // 2. sitemap.xml for Google Search Console
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteOrigin}/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  zip.file("sitemap.xml", sitemapXml);

  // 3. robots.txt pointing to sitemap.xml
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteOrigin}/sitemap.xml
`;
  zip.file("robots.txt", robotsTxt);

  // 4. manifest.webmanifest for mobile / PWA indexing
  const webManifest = {
    name: data.business?.name || "Site Oficial",
    short_name: (data.business?.name || "Site").slice(0, 20),
    description: (data.business?.bio || `${data.business?.category || ""} em ${data.business?.city || ""}`).slice(0, 160),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7C3AED",
  };
  zip.file("manifest.webmanifest", JSON.stringify(webManifest, null, 2));

  // 5. Hosting configs: vercel.json & netlify.toml
  zip.file(
    "vercel.json",
    JSON.stringify(
      {
        cleanUrls: true,
        trailingSlash: false,
        headers: [
          {
            source: "/(.*)",
            headers: [
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "X-Frame-Options", value: "SAMEORIGIN" },
            ],
          },
        ],
      },
      null,
      2
    )
  );

  zip.file(
    "netlify.toml",
    `[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
`
  );

  // 6. Step-by-step instructions for Hosting + Google Search Console
  zip.file(
    "COMO-PUBLICAR-E-USAR-SEARCH-CONSOLE.txt",
    `====================================================================
PACOTE COMPLETO DE HOSPEDAGEM E GOOGLE SEARCH CONSOLE — ${(data.business?.name || "SITE EXPRESS").toUpperCase()}
====================================================================

1. ARQUIVOS INCLUSOS NESTA PASTA ZIP:
   - index.html               -> Página oficial completa com Schema.org LocalBusiness e SEO Local
   - sitemap.xml              -> Mapa do site oficial para enviar ao Google Search Console
   - robots.txt               -> Diretrizes de indexação para o Googlebot
   - manifest.webmanifest     -> Manifesto web para dispositivos móveis
   - vercel.json / netlify.toml -> Configuração pronta para hospedagem gratuita (Vercel / Netlify)
   - site-manifest.json       -> Dados estruturados do projeto

2. COMO SUBIR NA HOSPEDAGEM GRATUITA (VERCEL OU NETLIFY) OU PRÓPRIA (HOSTINGER / CPANEL):
   - Opção A (Pela própria ferramenta G360): Clique em "Publicar Online" no topo do editor para publicar gratuitamente na Vercel, Netlify ou Link Público G360.
   - Opção B (Netlify Drop Gratuito): Acesse https://app.netlify.com/drop e arraste esta pasta descompactada (ou o arquivo ZIP).
   - Opção C (Hospedagem tradicional / cPanel / Hostinger / HostGator): Extraia todos os arquivos desta pasta dentro do diretório "public_html" do seu domínio.

3. COMO INDEXAR NO GOOGLE SEARCH CONSOLE:
   - Passo 1: Acesse https://search.google.com/search-console e adicione a URL do seu site.
   - Passo 2: Copie o código da "Tag HTML" (google-site-verification) fornecido pelo Google e cole na aba "Marketing & Pixels" do Editor G360 (ou diretamente no <head> do index.html).
   - Passo 3: No menu lateral do Google Search Console, clique em "Sitemaps" e digite: sitemap.xml -> Clique em Enviar.
`
  );

  zip.file(
    "site-manifest.json",
    JSON.stringify(
      {
        name: data.business?.name || "",
        category: data.business?.category || "",
        phone: data.business?.phone || data.business?.whatsapp || "",
        city: data.business?.city || "",
        uf: data.business?.uf || "",
        slug: cleanSlug,
        files: [
          "index.html",
          "sitemap.xml",
          "robots.txt",
          "manifest.webmanifest",
          "vercel.json",
          "netlify.toml",
          "COMO-PUBLICAR-E-USAR-SEARCH-CONSOLE.txt",
        ],
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cleanSlug}-pacote-hospedagem-seo.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
