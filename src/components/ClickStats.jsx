import { MessageCircle, MousePointerClick } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BUTTON_LABELS = {
  cta1: "Botão principal (Hero)",
  header_cta: "Cabeçalho",
  wa_bar: "Barra fixa (celular)",
  footer_cta: "Rodapé — chamada final",
  footer_link: "Rodapé — WhatsApp direto",
  promo_cta: "Promoção",
  spot_cta: "Destaque da casa",
  telefone: "Telefone (ligação)",
  outro: "Outro",
};
const labelFor = (id, items) => {
  if (BUTTON_LABELS[id]) return BUTTON_LABELS[id];
  const m = id.match(/^item_(\d+)$/);
  if (m) return `Item: ${items?.[+m[1]]?.name || `#${+m[1] + 1}`}`;
  return id;
};

export default function ClickStats({ stats, items, index }) {
  const total = stats?.total || 0;
  const last7 = stats?.last7 || 0;
  const rows = Object.entries(stats?.by_button || {}).sort((a, b) => b[1] - a[1]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-testid={`client-clicks-${index}`}
          title="Ver detalhamento por botão"
          className="flex items-center gap-2 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
        >
          <MessageCircle size={13} /> {total} clique{total === 1 ? "" : "s"} no WhatsApp
          <span className="text-emerald-600/70 font-semibold">· {last7} em 7 dias</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0" data-testid={`client-clicks-popover-${index}`}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <MousePointerClick size={14} className="text-slate-500" />
          <b className="text-[13px] text-slate-900">Cliques por botão</b>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-5 text-[12px] text-slate-500">
            Nenhum clique registrado ainda. Os cliques do site publicado e do HTML exportado aparecem aqui.
          </p>
        ) : (
          <ul className="p-2 max-h-72 overflow-y-auto studio-scroll">
            {rows.map(([id, n]) => (
              <li key={id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50" data-testid={`click-row-${id}`}>
                <span className="flex-1 text-[12.5px] text-slate-700 truncate">{labelFor(id, items)}</span>
                <span className="text-[12px] font-extrabold text-slate-900 tabular-nums">{n}</span>
                <span className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <i className="block h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((n / total) * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {stats?.last_click && (
          <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400">
            Último clique: {new Date(stats.last_click).toLocaleString("pt-BR")}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
