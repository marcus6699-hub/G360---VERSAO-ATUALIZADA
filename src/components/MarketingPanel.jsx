import { useMemo } from "react";
import { Megaphone, BarChart3, SearchCheck, Code2 } from "lucide-react";

const GROUP = "space-y-4";

export default function MarketingPanel({ data, onChange }) {
  const m = data.marketing || {};
  const b = data.business || {};
  const set = (k, v) => onChange((d) => ({ ...d, marketing: { ...(d.marketing || {}), [k]: v } }));

  const jsonLd = useMemo(
    () =>
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type":
            data.archetype === "gastronomia" ? "FoodEstablishment" : data.archetype === "servicos" ? "MedicalBusiness" : "LocalBusiness",
          name: b.name,
          telephone: b.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: b.address,
            addressLocality: b.city,
            addressRegion: b.uf,
            addressCountry: "BR",
          },
          ...(b.lat ? { geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng } } : {}),
          ...(b.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.rating_count } } : {}),
        },
        null,
        2
      ),
    [data.archetype, b]
  );

  return (
    <div className={GROUP} data-testid="marketing-panel">
      <p className="text-[11.5px] text-slate-500 leading-relaxed">
        Cole apenas os IDs — o site exportado já sai com todos os scripts e conversões configurados.
      </p>

      <div className="panel !rounded-xl p-4 space-y-3.5">
        <b className="flex items-center gap-2 text-[13px] text-slate-900">
          <Megaphone size={15} /> Tráfego pago
        </b>
        <div>
          <label className="field-label">Meta Pixel ID</label>
          <input
            data-testid="meta-pixel-input"
            className="field !py-2.5 !text-[13px]"
            placeholder="Ex.: 1234567890123456"
            value={m.metaPixelId || ""}
            onChange={(e) => set("metaPixelId", e.target.value)}
          />
          <p className="text-[10.5px] text-slate-400 mt-1">
            Dispara <code>fbq('track','Contact')</code> em todo clique de WhatsApp/telefone.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="field-label">Google Ads ID</label>
            <input
              data-testid="gads-id-input"
              className="field !py-2.5 !text-[13px]"
              placeholder="AW-XXXXXXXXX"
              value={m.gadsId || ""}
              onChange={(e) => set("gadsId", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Rótulo conversão</label>
            <input
              data-testid="gads-label-input"
              className="field !py-2.5 !text-[13px]"
              placeholder="AbCdEfGh..."
              value={m.gadsLabel || ""}
              onChange={(e) => set("gadsLabel", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel !rounded-xl p-4 space-y-3.5">
        <b className="flex items-center gap-2 text-[13px] text-slate-900">
          <BarChart3 size={15} /> Mensuração
        </b>
        <div>
          <label className="field-label">Google Tag Manager</label>
          <input
            data-testid="gtm-input"
            className="field !py-2.5 !text-[13px]"
            placeholder="GTM-XXXXXXX"
            value={m.gtmId || ""}
            onChange={(e) => set("gtmId", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Google Analytics 4</label>
          <input
            data-testid="ga4-input"
            className="field !py-2.5 !text-[13px]"
            placeholder="G-XXXXXXXXXX"
            value={m.ga4Id || ""}
            onChange={(e) => set("ga4Id", e.target.value)}
          />
        </div>
      </div>

      <div className="panel !rounded-xl p-4 space-y-3.5">
        <b className="flex items-center gap-2 text-[13px] text-slate-900">
          <SearchCheck size={15} /> SEO local semântico
        </b>
        <div>
          <label className="field-label">Search Console (verificação)</label>
          <input
            data-testid="gsc-input"
            className="field !py-2.5 !text-[13px]"
            placeholder="Código google-site-verification"
            value={m.gsc || ""}
            onChange={(e) => set("gsc", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Title (SEO)</label>
          <input
            data-testid="seo-title-input"
            className="field !py-2.5 !text-[13px]"
            placeholder={`${b.name} | ${b.category} em ${b.city}`}
            value={m.seoTitle || ""}
            onChange={(e) => set("seoTitle", e.target.value)}
            maxLength={70}
          />
        </div>
        <div>
          <label className="field-label">Meta Description</label>
          <textarea
            data-testid="seo-desc-input"
            rows={2}
            className="field resize-none !py-2.5 !text-[13px]"
            placeholder={(b.bio || "").slice(0, 155)}
            value={m.seoDesc || ""}
            onChange={(e) => set("seoDesc", e.target.value)}
            maxLength={170}
          />
        </div>
        <details className="rounded-lg bg-slate-50 border border-[#E4E4E7] px-3.5 py-2.5">
          <summary className="text-[12px] font-bold text-slate-600 cursor-pointer flex items-center gap-1.5">
            <Code2 size={13} /> Schema.org JSON-LD gerado
          </summary>
          <pre data-testid="jsonld-preview" className="text-[10.5px] text-slate-500 overflow-x-auto mt-2 leading-relaxed">
            {jsonLd}
          </pre>
        </details>
      </div>
    </div>
  );
}
