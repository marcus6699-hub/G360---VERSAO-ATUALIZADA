import { ArrowUp, ArrowDown, Upload, Trash2, Film, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ARCH_SECTIONS } from "@/lib/sitegen/generateSiteHtml";

export default function SectionsPanel({ data, onChange }) {
  const defs = ARCH_SECTIONS[data.archetype] || [];
  const order = data.sections || [];
  const rows = order.map((s) => ({ ...s, meta: defs.find((d) => d.id === s.id) })).filter((r) => r.meta);

  // Nenhuma seção tem cadeado bloqueado: todas (incluindo o Hero) podem ser ativadas/desativadas e movidas livremente.
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange((d) => ({ ...d, sections: next }));
  };

  const toggle = (id, on) =>
    onChange((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, on } : s)),
    }));

  return (
    <div className="space-y-2.5" data-testid="sections-panel">
      <p className="text-[11.5px] text-slate-500 leading-relaxed mb-3">
        Ative, desative e reordene livremente todas as seções do site (incluindo o Hero). O cabeçalho, rodapé e barra de WhatsApp são permanentes.
      </p>
      {rows.map((r, i) => (
        <div key={r.id} data-testid={`section-row-${r.id}`} className={`panel !rounded-xl px-3.5 py-3 transition-opacity ${r.on ? "" : "opacity-55"}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col gap-0.5">
              <button
                data-testid={`section-up-${r.id}`}
                aria-label={`Mover ${r.meta.label} para cima`}
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
              >
                <ArrowUp size={13} />
              </button>
              <button
                data-testid={`section-down-${r.id}`}
                aria-label={`Mover ${r.meta.label} para baixo`}
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
              >
                <ArrowDown size={13} />
              </button>
            </div>
            <span className="flex-1 text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
              {r.meta.label}
            </span>
            <Switch
              data-testid={`section-toggle-${r.id}`}
              aria-label={`Alternar seção ${r.meta.label}`}
              checked={r.on}
              onCheckedChange={(v) => toggle(r.id, v)}
            />
          </div>
          {r.id === "video" && r.on && (
            <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Film size={12} /> Vídeo da Empresa / Negócio
              </div>
              <input
                data-testid="video-url-input"
                className="field !py-2 !text-[12px]"
                placeholder="Cole URL (YouTube, Vimeo ou link MP4)"
                value={data.video?.url?.startsWith("data:") ? "" : data.video?.url || ""}
                onChange={(e) => onChange((d) => ({ ...d, video: { ...d.video, url: e.target.value, filename: "" } }))}
              />
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11.5px] font-bold cursor-pointer transition">
                  <Upload size={13} />
                  <span>Subir Vídeo MP4/WebM do PC</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 80 * 1024 * 1024) {
                        toast.error("Arquivo de vídeo muito grande. Limite: 80MB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        onChange((d) => ({
                          ...d,
                          video: {
                            ...(d.video || {}),
                            url: reader.result,
                            filename: file.name,
                          },
                        }));
                        toast.success(`Vídeo "${file.name}" carregado com sucesso!`);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {data.video?.url && (
                  <button
                    type="button"
                    onClick={() => onChange((d) => ({ ...d, video: { ...d.video, url: "", filename: "" } }))}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Remover vídeo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {data.video?.filename && (
                <div className="text-[10.5px] text-emerald-600 font-semibold truncate flex items-center gap-1">
                  <CheckCircle2 size={12} /> Arquivo: {data.video.filename}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="pt-2">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Dica: clique em qualquer texto, botão ou imagem dentro do canvas para editar diretamente.
        </p>
      </div>
    </div>
  );
}
