import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import { absUrl } from "@/lib/sitegen/generateSiteHtml";

const LABELS = {
  gastronomia: { one: "item do cardápio", many: "Cardápio", price: "R$ 0,00" },
  servicos: { one: "serviço", many: "Serviços / Especialidades", price: "Sob consulta" },
  produtos: { one: "produto", many: "Catálogo de produtos", price: "R$ 0,00" },
};

function readImage(file, cb) {
  if (file.size > 15 * 1024 * 1024) {
    toast.error("Imagem muito grande (máx. 15 MB)");
    return;
  }
  const r = new FileReader();
  r.onload = () => {
    const dataUrl = r.result;
    // Compress large images (> 600KB) via canvas so saving project JSON stays fast
    if (file.size > 600 * 1024 && typeof Image !== "undefined") {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        cb(canvas.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = () => cb(dataUrl);
      img.src = dataUrl;
      return;
    }
    cb(dataUrl);
  };
  r.readAsDataURL(file);
}

export default function ItemsPanel({ data, onChange }) {
  const items = data.business.items || [];
  const lbl = LABELS[data.archetype] || LABELS.produtos;
  const [open, setOpen] = useState(0);
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];

  const setItems = (fn) => onChange((d) => ({ ...d, business: { ...d.business, items: fn(d.business.items || []) } }));
  const patch = (i, k, v) =>
    onChange((d) => {
      const nextItems = (d.business.items || []).map((it, idx) => (idx === i ? { ...it, [k]: v } : it));
      const nextImages = { ...(d.images || {}) };
      if (k === "image") {
        nextImages[`item_${i}`] = { ...(nextImages[`item_${i}`] || {}), url: v };
      }
      return {
        ...d,
        images: nextImages,
        business: { ...d.business, items: nextItems },
      };
    });
  const move = (i, dir) =>
    setItems((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      setOpen(j);
      return next;
    });
  const remove = (i) => {
    setItems((list) => list.filter((_, idx) => idx !== i));
    setOpen(null);
  };
  const add = () => {
    setItems((list) => [
      ...list,
      {
        name: `Novo ${lbl.one}`,
        category: cats[0] || "Geral",
        price: lbl.price,
        description: "Descreva aqui o diferencial deste item.",
        image: items[0]?.image || data.business.photos?.[0] || "",
        badge: "",
      },
    ]);
    setOpen(items.length);
  };

  return (
    <div className="space-y-2.5" data-testid="items-panel">
      <div className="flex items-center justify-between mb-1">
        <div>
          <b className="text-[13px] text-slate-900">{lbl.many}</b>
          <p className="text-[11px] text-slate-500">
            {items.length} {items.length === 1 ? "item" : "itens"} · clique para editar
          </p>
        </div>
        <button
          data-testid="items-add-button"
          onClick={add}
          className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} data-testid={`item-row-${i}`} className="panel !rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <button
                  data-testid={`item-up-${i}`}
                  aria-label="Mover item para cima"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  data-testid={`item-down-${i}`}
                  aria-label="Mover item para baixo"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="text-slate-400 hover:text-slate-900 disabled:opacity-25 transition-colors"
                >
                  <ArrowDown size={13} />
                </button>
              </div>
              <img src={absUrl(it.image)} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-none" />
              <button data-testid={`item-toggle-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="flex-1 text-left min-w-0">
                <span className="block text-[12.5px] font-bold text-slate-800 truncate">{it.name || "Sem nome"}</span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {it.category}
                  {it.price ? ` · ${it.price}` : ""}
                </span>
              </button>
              <button onClick={() => setOpen(isOpen ? null : i)} className="text-slate-400 hover:text-slate-900">
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-slate-100" data-testid={`item-form-${i}`}>
                <input
                  data-testid={`item-name-${i}`}
                  className="field !py-2 !text-[12.5px]"
                  placeholder="Nome"
                  value={it.name || ""}
                  onChange={(e) => patch(i, "name", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    data-testid={`item-category-${i}`}
                    className="field !py-2 !text-[12.5px]"
                    placeholder="Categoria"
                    list={`cats-${i}`}
                    value={it.category || ""}
                    onChange={(e) => patch(i, "category", e.target.value)}
                  />
                  <datalist id={`cats-${i}`}>
                    {cats.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <input
                    data-testid={`item-price-${i}`}
                    className="field !py-2 !text-[12.5px]"
                    placeholder="Preço"
                    value={it.price || ""}
                    onChange={(e) => patch(i, "price", e.target.value)}
                  />
                </div>
                <textarea
                  data-testid={`item-description-${i}`}
                  rows={2}
                  className="field !py-2 !text-[12.5px] resize-none"
                  placeholder="Descrição curta"
                  value={it.description || ""}
                  onChange={(e) => patch(i, "description", e.target.value)}
                />
                <input
                  data-testid={`item-badge-${i}`}
                  className="field !py-2 !text-[12.5px]"
                  placeholder="Selo (ex.: Mais pedido) — opcional"
                  value={it.badge || ""}
                  onChange={(e) => patch(i, "badge", e.target.value)}
                />
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      data-testid={`item-image-url-${i}`}
                      className="field !py-2 !text-[12.5px] flex-1"
                      placeholder="URL da foto (ou envie abaixo)"
                      value={it.image && !it.image.startsWith("data:") ? it.image : ""}
                      onChange={(e) => patch(i, "image", e.target.value)}
                    />
                  </div>
                  <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-700 text-[12px] font-bold cursor-pointer transition-colors">
                    <ImagePlus size={14} /> Enviar foto do computador
                    <input
                      data-testid={`item-image-upload-${i}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          readImage(f, (url) => {
                            patch(i, "image", url);
                            toast.success("Foto do item atualizada!");
                          });
                        }
                      }}
                    />
                  </label>
                </div>
                <button
                  data-testid={`item-remove-${i}`}
                  onClick={() => remove(i)}
                  className="flex items-center gap-1.5 text-[11.5px] font-bold text-red-600 hover:text-red-700 pt-1"
                >
                  <Trash2 size={12} /> Remover {lbl.one}
                </button>
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && <p className="text-[12px] text-slate-400 text-center py-6">Nenhum item. Adicione o primeiro acima.</p>}
    </div>
  );
}
