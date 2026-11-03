import { toast } from "sonner";
import { Upload, Trash2, Palette, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function extractPaletteFromImage(dataUrl) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 48;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          const buckets = new Map();

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 128) continue; // ignore transparent
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const lum = (max + min) / 2;
            // Skip near-white and near-black background pixels
            if (lum > 240 || lum < 18) continue;
            const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
            const qr = Math.round(r / 24) * 24;
            const qg = Math.round(g / 24) * 24;
            const qb = Math.round(b / 24) * 24;
            const key = `${qr},${qg},${qb}`;
            const prev = buckets.get(key) || { r: qr, g: qg, b: qb, score: 0 };
            prev.score += 1 + sat * 2.5;
            buckets.set(key, prev);
          }

          const sorted = [...buckets.values()].sort((a, b) => b.score - a.score);
          const primary = sorted[0] || { r: 124, g: 58, b: 237 };
          const secondary =
            sorted.find(
              (c) =>
                Math.abs(c.r - primary.r) +
                  Math.abs(c.g - primary.g) +
                  Math.abs(c.b - primary.b) >
                95
            ) || {
              r: Math.max(15, Math.round(primary.r * 0.35)),
              g: Math.max(15, Math.round(primary.g * 0.35)),
              b: Math.max(20, Math.round(primary.b * 0.35)),
            };

          const secHex = rgbToHex(primary.r, primary.g, primary.b);
          const priHex = rgbToHex(
            Math.max(14, Math.round(secondary.r * 0.45)),
            Math.max(14, Math.round(secondary.g * 0.45)),
            Math.max(22, Math.round(secondary.b * 0.45))
          );
          const bgHex = rgbToHex(
            248 + Math.round((primary.r - 128) * 0.03),
            247 + Math.round((primary.g - 128) * 0.03),
            245 + Math.round((primary.b - 128) * 0.03)
          );
          const bg2Hex = rgbToHex(
            238 + Math.round((primary.r - 128) * 0.06),
            235 + Math.round((primary.g - 128) * 0.06),
            230 + Math.round((primary.b - 128) * 0.06)
          );

          resolve({
            id: "logo-auto",
            name: "Cores da Logomarca",
            vars: {
              bg: bgHex,
              bg2: bg2Hex,
              surface: "#FFFFFF",
              ink: priHex,
              muted: "#57534E",
              pri: priHex,
              priFg: "#FFFFFF",
              sec: secHex,
              secFg: "#FFFFFF",
              line: `rgba(${primary.r},${primary.g},${primary.b},0.16)`,
            },
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

export default function BrandPanel({ data, onChange }) {
  const logo = data.logo || {};
  const setLogo = (k, v) => onChange((d) => ({ ...d, logo: { ...(d.logo || {}), [k]: v } }));

  const applyLogoWithAutoPalette = async (urlValue) => {
    const extracted = await extractPaletteFromImage(urlValue);
    onChange((d) => ({
      ...d,
      logo: { ...(d.logo || {}), url: urlValue },
      ...(extracted
        ? {
            paletteId: "logo-auto",
            customPalette: extracted,
          }
        : {}),
    }));
    if (extracted) {
      toast.success("Logo aplicada e paleta de cores do site sincronizada com sua marca!");
    } else {
      toast.success("Logo aplicada ao cabeçalho e rodapé");
    }
  };

  const upload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande (máx. 2 MB). Use PNG, JPG, WEBP ou SVG otimizado.");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      applyLogoWithAutoPalette(r.result);
    };
    r.readAsDataURL(f);
  };

  const customPal = data.customPalette;

  return (
    <div className="space-y-4" data-testid="brand-panel">
      <p className="text-[11.5px] text-slate-500 leading-relaxed">
        Ao enviar sua logomarca, o sistema aplica o logo no cabeçalho e rodapé e <strong>extrai automaticamente a paleta de cores da marca</strong> para harmonizar o site.
      </p>

      <div className="panel !rounded-xl p-4 flex flex-col items-center gap-3" data-testid="brand-logo-preview">
        <div className="w-full h-24 rounded-lg bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,#fff_25%,#fff_75%,#f1f5f9_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] border border-[#E4E4E7] grid place-items-center overflow-hidden">
          {logo.url ? (
            <img src={logo.url} alt="Logo" className={`max-h-16 max-w-[80%] object-contain ${logo.round ? "rounded-full" : ""}`} />
          ) : (
            <span className="text-[11px] text-slate-400">Sem logo — exibindo selo com iniciais no cabeçalho</span>
          )}
        </div>
        <label className="btn-primary-dark !py-2 !px-4 !text-[12px] cursor-pointer w-full justify-center">
          <Upload size={14} /> {logo.url ? "Trocar logo (Extrair Cores)" : "Enviar logo (Extrair Cores)"}
          <input data-testid="brand-logo-upload" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={upload} />
        </label>
      </div>

      {customPal?.vars && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
              <Sparkles size={12} /> Paleta da Logomarca
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: customPal.vars.sec }} title={`Destaque: ${customPal.vars.sec}`} />
              <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: customPal.vars.pri }} title={`Principal: ${customPal.vars.pri}`} />
              <span className="w-4 h-4 rounded-full border border-slate-300 shadow-sm" style={{ background: customPal.vars.bg }} title={`Fundo: ${customPal.vars.bg}`} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange((d) => ({ ...d, paletteId: "logo-auto" }));
              toast.success("Paleta extraída da logomarca aplicada!");
            }}
            className={`w-full py-1.5 px-3 rounded-lg text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              data.paletteId === "logo-auto"
                ? "bg-purple-700 text-white shadow-sm"
                : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
            }`}
          >
            <Palette size={12} />
            {data.paletteId === "logo-auto" ? "Cores da Logomarca Ativas" : "Aplicar Cores da Logomarca"}
          </button>
        </div>
      )}

      <div>
        <label className="field-label">Ou cole a URL do logo</label>
        <input
          data-testid="brand-logo-url"
          className="field !py-2 !text-[12.5px]"
          placeholder="https://..."
          value={logo.url && !logo.url.startsWith("data:") ? logo.url : ""}
          onChange={(e) => applyLogoWithAutoPalette(e.target.value)}
        />
      </div>

      {logo.url && (
        <>
          <label className="flex items-center justify-between text-[12.5px] font-semibold text-slate-700">
            Logo redondo
            <Switch data-testid="brand-logo-round" checked={!!logo.round} onCheckedChange={(v) => setLogo("round", v)} />
          </label>
          <label className="flex items-center justify-between text-[12.5px] font-semibold text-slate-700">
            Ocultar nome ao lado do logo
            <Switch data-testid="brand-logo-hidename" checked={!!logo.hideName} onCheckedChange={(v) => setLogo("hideName", v)} />
          </label>
          <button
            data-testid="brand-logo-remove"
            onClick={() => onChange((d) => ({ ...d, logo: null }))}
            className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-600 hover:text-red-700"
          >
            <Trash2 size={12} /> Remover logo
          </button>
        </>
      )}

      {/* CONTROLE DE LEITURA DA CAPA (HERO) QUANDO A FOTO TEM FACHADA/LETREIRO */}
      <div className="pt-3 border-t border-slate-200 space-y-2.5">
        <div>
          <label className="field-label !mb-0.5">Proteção de Leitura da Capa (Hero)</label>
          <p className="text-[11px] text-slate-500 leading-snug">
            Se a foto principal for uma fachada com letreiro ou muita informação, escolha como proteger a leitura do título:
          </p>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            {
              id: "default",
              label: "Padrão do Modelo",
              desc: " Contraste original do template",
            },
            {
              id: "glass-box",
              label: "Caixa Escura / Vidro atrás do Texto (Recomendado p/ Fachadas)",
              desc: "Isola o texto em um quadro escuro translúcido",
            },
            {
              id: "overlay-dark",
              label: "Película Escura Forte (78%) sobre a Foto",
              desc: "Escurece toda a foto de fundo para destacar o texto branco",
            },
            {
              id: "split",
              label: "Dividido Lado a Lado (Texto à Esquerda · Foto à Direita)",
              desc: "Texto nunca fica em cima do letreiro da foto",
            },
          ].map((opt) => {
            const active = (data.heroLayout || "default") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange((d) => ({ ...d, heroLayout: opt.id }));
                  toast.success(`Estilo da capa alterado para: ${opt.label}`);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-purple-600 bg-purple-50/80 text-purple-950 ring-1 ring-purple-500/30"
                    : "border-slate-200 bg-white hover:border-purple-300 text-slate-700"
                }`}
                data-testid={`hero-layout-${opt.id}`}
              >
                <div className="text-[12px] font-bold">{opt.label}</div>
                <div className="text-[10.5px] text-slate-500">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

