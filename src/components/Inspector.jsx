import { useEffect } from "react";
import { X, MousePointerClick, ImageIcon } from "lucide-react";
import { BUTTON_EFFECTS } from "@/lib/sitegen/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Inspector({ inspector, data, onChange, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isBtn = inspector.type === "button";
  const btn = (data.buttons || {})[inspector.id] || {};
  const itemMatch = String(inspector.id || "").match(/^item_(\d+)$/);
  const itemIdx = itemMatch ? Number(itemMatch[1]) : -1;
  const currentItem = itemIdx >= 0 ? (data.business?.items || [])[itemIdx] : null;
  const imgOverride = (data.images || {})[inspector.id] || {};
  const img = {
    url: imgOverride.url || currentItem?.image || "",
    fit: imgOverride.fit || "cover",
  };

  const setBtn = (k, v) => onChange((d) => ({ ...d, buttons: { ...d.buttons, [inspector.id]: { ...btn, [k]: v } } }));
  const setImg = (k, v) =>
    onChange((d) => {
      const nextImages = { ...d.images, [inspector.id]: { ...(d.images?.[inspector.id] || {}), [k]: v } };
      if (itemIdx >= 0 && k === "url" && d.business?.items) {
        return {
          ...d,
          images: nextImages,
          business: {
            ...d.business,
            items: d.business.items.map((it, idx) => (idx === itemIdx ? { ...it, image: v } : it)),
          },
        };
      }
      return { ...d, images: nextImages };
    });

  const upload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImg("url", r.result);
    r.readAsDataURL(f);
  };

  return (
    <aside className="w-[300px] flex-none bg-white border-l border-[#E4E4E7] overflow-y-auto studio-scroll" data-testid="inspector-panel" data-lenis-prevent="true">
      <div className="p-3.5 border-b border-[#E4E4E7] flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-slate-900 text-amber-300 grid place-items-center shrink-0">
          {isBtn ? <MousePointerClick size={15} /> : <ImageIcon size={15} />}
        </span>
        <div className="flex-1 min-w-0">
          <b className="block text-[13px] text-slate-900 truncate">
            {isBtn ? "Inspetor de Botão" : currentItem ? `Foto: ${currentItem.name}` : "Inspetor de Imagem"}
          </b>
          <code className="text-[10px] text-slate-400">{inspector.id}</code>
        </div>
        <button
          type="button"
          data-testid="inspector-close"
          onClick={onClose}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-950 text-[11px] font-bold transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100"
          title="Fechar inspetor (Esc)"
        >
          <X size={13} />
          <span>Esc</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {isBtn ? (
          <>
            <div>
              <label className="field-label">Texto do botão</label>
              <input
                data-testid="inspector-btn-label"
                className="field"
                value={btn.label || ""}
                placeholder="Texto padrão do template"
                onChange={(e) => setBtn("label", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Mensagem do WhatsApp</label>
              <textarea
                data-testid="inspector-btn-wamsg"
                rows={3}
                className="field resize-none"
                value={btn.waMessage || ""}
                placeholder={`Olá! Vim pelo site da ${data.business?.name}...`}
                onChange={(e) => setBtn("waMessage", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Cor personalizada</label>
              <div className="flex items-center gap-2.5">
                <input
                  data-testid="inspector-btn-color"
                  type="color"
                  className="w-11 h-10 rounded-lg border border-[#E4E4E7] cursor-pointer bg-white"
                  value={btn.color || "#2D7819"}
                  onChange={(e) => setBtn("color", e.target.value)}
                />
                <button
                  data-testid="inspector-btn-color-clear"
                  className="text-[12px] font-semibold text-slate-500 hover:text-slate-900"
                  onClick={() => setBtn("color", "")}
                >
                  Usar cor do tema
                </button>
              </div>
            </div>
            <div>
              <label className="field-label">Efeito do botão</label>
              <Select value={btn.effect || "lift"} onValueChange={(v) => setBtn("effect", v)}>
                <SelectTrigger data-testid="inspector-btn-effect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_EFFECTS.map((f) => (
                    <SelectItem key={f.id} value={f.id} data-testid={`btn-effect-${f.id}`}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="field-label">URL da imagem</label>
              <input
                data-testid="inspector-img-url"
                className="field"
                value={img.url || ""}
                placeholder="https://..."
                onChange={(e) => setImg("url", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Ou envie do seu computador</label>
              <input
                data-testid="inspector-img-upload"
                type="file"
                accept="image/*"
                onChange={upload}
                className="block w-full text-[12px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-[12px] file:font-semibold hover:file:bg-slate-700 file:cursor-pointer"
              />
            </div>
            <div>
              <label className="field-label">Ajuste da imagem</label>
              <Select value={img.fit || "cover"} onValueChange={(v) => setImg("fit", v)}>
                <SelectTrigger data-testid="inspector-img-fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (preencher)</SelectItem>
                  <SelectItem value="contain">Contain (mostrar inteira)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {img.url && <img src={img.url} alt="Prévia" referrerPolicy="no-referrer" className="rounded-xl border border-[#E4E4E7] max-h-36 w-full object-cover" />}
          </>
        )}

        <div className="pt-2 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[12px] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <X size={14} />
            <span>Fechar Inspetor (Esc)</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
