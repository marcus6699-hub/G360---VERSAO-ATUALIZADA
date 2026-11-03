import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calculator,
  MessageSquareQuote,
  FileText,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Download,
  Printer,
  ShieldCheck,
} from "lucide-react";
import {
  calculateZycronEarnings,
  buildWhatsappScripts,
  generateContractHtml,
} from "@/lib/sitegen/zycronCatalog";

const SITE_PRICE_OPTIONS = [500, 900, 1500, 2000];
const MONTHLY_FEE_OPTIONS = [0, 100, 150, 200];

const fmtBRL = (n) =>
  Number(n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export default function SalesHubPanel({ projects = [] }) {
  // 1) Earnings Calculator state (defaults match Zycron video: R$ 900, R$ 150/mês, 3 sites/mês)
  const [sitePrice, setSitePrice] = useState(900);
  const [monthlyFee, setMonthlyFee] = useState(150);
  const [sitesPerMonth, setSitesPerMonth] = useState(3);

  // 2) Objection Scripts & Contract target business
  const firstBiz = projects[0]?.data?.business;
  const [clientName, setClientName] = useState(firstBiz?.name || "Padaria Pão Quente");
  const [clientCity, setClientCity] = useState(firstBiz?.city || "Campinas");
  const [clientCategory, setClientCategory] = useState(firstBiz?.category || "Padaria e Confeitaria");
  const [clientPhone, setClientPhone] = useState(firstBiz?.whatsapp || "5511999999999");
  const [providerName, setProviderName] = useState("Agência Site Express Pro");
  const [activeScriptId, setActiveScriptId] = useState("primeiro-contato");
  const [copiedId, setCopiedId] = useState("");

  const calc = useMemo(
    () =>
      calculateZycronEarnings({
        sitePrice,
        monthlyFee,
        sitesPerMonth,
      }),
    [sitePrice, monthlyFee, sitesPerMonth]
  );

  const maxMonthTotal = useMemo(
    () => Math.max(...calc.months.map((m) => m.grossTotal), 1),
    [calc.months]
  );

  const scripts = useMemo(
    () =>
      buildWhatsappScripts(
        {
          name: clientName,
          city: clientCity,
          category: clientCategory,
        },
        `https://${clientName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}.siteexpress.com.br`,
        sitePrice,
        monthlyFee || 150
      ),
    [clientName, clientCity, clientCategory, sitePrice, monthlyFee]
  );

  const activeScript = scripts.find((s) => s.id === activeScriptId) || scripts[0];

  const copyScript = (sc) => {
    navigator.clipboard.writeText(sc.reply);
    setCopiedId(sc.id);
    toast.success("Resposta copiada para a área de transferência!");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleDownloadContract = () => {
    const html = generateContractHtml({
      providerName,
      clientName,
      clientCity,
      clientPhone,
      sitePrice,
      monthlyFee,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contrato-${clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Contrato baixado com sucesso!");
  };

  const handlePrintContract = () => {
    const html = generateContractHtml({
      providerName,
      clientName,
      clientCity,
      clientPhone,
      sitePrice,
      monthlyFee,
    });
    const win = window.open("", "_blank");
    if (!win) {
      handleDownloadContract();
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="max-w-[1260px] w-full mx-auto px-5 py-10 space-y-12" data-testid="sales-hub-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-800 bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-full mb-3">
            <Sparkles size={13} /> Central de Prospecção & Fechamento Zycron
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Calculadora de Ganhos, Quebra de Objeções & Contrato
          </h1>
          <p className="text-[14.5px] text-slate-500 mt-1.5 max-w-2xl">
            Simule sua renda recorrente em 12 meses, copie respostas prontas para fechar pelo WhatsApp e emita contratos de prestação de serviço em 1 clique.
          </p>
        </div>
      </div>

      {/* SECTION 1: 12-Month Earnings Calculator ("Faça a conta com os seus números") */}
      <section className="panel p-6 sm:p-9" data-testid="zycron-calculator-section">
        <div className="flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-amber-700 mb-2">
          <Calculator size={14} /> Simulador de Faturamento em 12 Meses
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Faça a conta com os seus números
        </h2>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Controls */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50/80 border border-[#E4E4E7] rounded-2xl p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between text-[13px] font-bold text-slate-700 mb-2.5">
                <span>Quanto cobrar por site</span>
                <span className="text-amber-700 font-extrabold">R$ {fmtBRL(sitePrice)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SITE_PRICE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-testid={`calc-price-${p}`}
                    onClick={() => setSitePrice(p)}
                    className={`py-2.5 px-2 rounded-xl text-[12.5px] font-extrabold border transition-all ${
                      sitePrice === p
                        ? "bg-slate-900 text-amber-300 border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-[#E4E4E7] hover:border-slate-400"
                    }`}
                  >
                    R$ {fmtBRL(p)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[13px] font-bold text-slate-700 mb-2.5">
                <span>Mensalidade de manutenção</span>
                <span className="text-emerald-700 font-extrabold">
                  {monthlyFee === 0 ? "Sem mensalidade" : `R$ ${fmtBRL(monthlyFee)}/mês`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {MONTHLY_FEE_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-testid={`calc-monthly-${m}`}
                    onClick={() => setMonthlyFee(m)}
                    className={`py-2.5 px-2 rounded-xl text-[12.5px] font-extrabold border transition-all ${
                      monthlyFee === m
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                        : "bg-white text-slate-700 border-[#E4E4E7] hover:border-slate-400"
                    }`}
                  >
                    {m === 0 ? "Sem" : `R$ ${m}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[13px] font-bold text-slate-700 mb-2">
                <span>Sites vendidos por mês</span>
                <span className="text-slate-900 font-extrabold text-[15px]">
                  {sitesPerMonth} {sitesPerMonth === 1 ? "site/mês" : "sites/mês"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sitesPerMonth}
                data-testid="calc-sites-slider"
                onChange={(e) => setSitesPerMonth(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                <span>1/mês (iniciante)</span>
                <span>3/mês (1 por semana)</span>
                <span>10/mês (agência)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 text-[12px] text-slate-500 leading-relaxed">
              <b className="text-slate-800">Por que a mensalidade muda tudo?</b> Cada site entregue continua gerando{" "}
              <b className="text-emerald-700">R$ {fmtBRL(monthlyFee)}/mês</b> de hospedagem e suporte. No 12º mês você tem{" "}
              <b className="text-slate-800">{calc.totalSitesYear} clientes ativos</b> pagando todo mês.
            </div>
          </div>

          {/* Right Live Output + 12-Month Stacked Bar Chart */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#151210] text-[#FBF7F0] rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-500/20">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-400/90 block mb-1">
                    Resultado acumulado em 12 meses
                  </span>
                  <div
                    className="text-4xl sm:text-5xl font-black tracking-tight text-amber-400"
                    data-testid="calc-annual-net"
                  >
                    R$ {fmtBRL(calc.annualNet)}{" "}
                    <span className="text-lg sm:text-xl font-bold text-[#FBF7F0]/80">líquido no ano</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <TrendingUp size={14} /> {calc.totalSitesYear} sites entregues
                </span>
              </div>

              <p className="text-[13.5px] text-[#FBF7F0]/75 mt-2">
                No <b className="text-white">mês 12</b> você fatura{" "}
                <b className="text-amber-300">R$ {fmtBRL(calc.month12.netTotal)}</b> · sendo{" "}
                <span className="text-amber-200">R$ {fmtBRL(calc.month12.salesRevenue)} de sites novos</span> +{" "}
                <span className="text-emerald-300">R$ {fmtBRL(calc.month12.recurringRevenue)} só de mensalidade recorrente</span>
              </p>

              {/* 12-Month Stacked Bar Chart */}
              <div className="mt-7 pt-4">
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 items-end h-44 pt-6">
                  {calc.months.map((m) => {
                    const salesH = Math.max(8, Math.round((m.salesRevenue / maxMonthTotal) * 120));
                    const recH = m.recurringRevenue > 0 ? Math.max(6, Math.round((m.recurringRevenue / maxMonthTotal) * 120)) : 0;
                    const isFirstOrLast = m.month === 1 || m.month === 6 || m.month === 12;
                    return (
                      <div key={m.month} className="flex flex-col items-center justify-end h-full group">
                        <span
                          className={`text-[9.5px] font-bold mb-1 transition-opacity ${
                            isFirstOrLast ? "opacity-100 text-amber-300" : "opacity-0 group-hover:opacity-100 text-white/80"
                          }`}
                        >
                          {(m.grossTotal / 1000).toFixed(1).replace(".", ",")}k
                        </span>
                        <div className="w-full max-w-[30px] flex flex-col justify-end rounded-t-md overflow-hidden">
                          {recH > 0 && (
                            <div
                              style={{ height: `${recH}px` }}
                              className="w-full bg-emerald-500 transition-all duration-300"
                              title={`Mês ${m.month}: R$ ${fmtBRL(m.recurringRevenue)} recorrente`}
                            />
                          )}
                          <div
                            style={{ height: `${salesH}px` }}
                            className="w-full bg-amber-500 transition-all duration-300"
                            title={`Mês ${m.month}: R$ ${fmtBRL(m.salesRevenue)} vendas`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/50 mt-2">M{m.month}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-5 mt-4 pt-3 border-t border-white/10 text-[11.5px] text-white/70">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Venda dos sites (R$ {fmtBRL(calc.annualSales)} no ano)
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Mensalidades acumuladas (R$ {fmtBRL(calc.annualRecurring)} no ano)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 text-[11.5px] text-white/55">
              Conta transparente: {calc.totalSitesYear} sites entregues = R$ {fmtBRL(calc.annualSales)} em vendas + R${" "}
              {fmtBRL(calc.annualRecurring)} de mensalidades acumuladas = <b className="text-white/85">R$ {fmtBRL(calc.annualGross)} bruto</b>.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WhatsApp Objection Breaker ("Travou no 'tá caro'? A resposta já está escrita") */}
      <div className="grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 panel p-6 sm:p-8 flex flex-col justify-between" data-testid="zycron-scripts-section">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 mb-2">
              <MessageSquareQuote size={15} /> Scripts de Abordagem e Quebra de Objeção
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Travou no “tá caro”? A resposta já está escrita
            </h2>
            <p className="text-[13.5px] text-slate-500 mt-1 mb-5">
              Clique na objeção do comerciante para ver a resposta testada e copiar direto para o WhatsApp.
            </p>

            {/* Objection Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {scripts.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  data-testid={`script-tab-${sc.id}`}
                  onClick={() => setActiveScriptId(sc.id)}
                  className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold border transition-all ${
                    activeScript.id === sc.id
                      ? "bg-slate-900 text-amber-300 border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-[#E4E4E7] hover:bg-slate-50"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Simulated WhatsApp Conversation */}
            <motion.div
              key={activeScript.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#EFEAE2] border border-[#E4E4E7] p-4 sm:p-5 space-y-3.5"
            >
              {/* Client incoming bubble */}
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-1">
                  O cliente diz:
                </span>
                <div className="bg-white text-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13.5px] font-medium shadow-sm">
                  {activeScript.incoming}
                </div>
              </div>

              {/* Your outgoing pitch bubble */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1 mr-1">
                  Sua resposta pronta (toque para copiar):
                </span>
                <div
                  className="bg-[#D9FDD3] text-slate-900 rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] leading-relaxed shadow-sm whitespace-pre-line max-w-[92%]"
                  data-testid="active-script-text"
                >
                  {activeScript.reply}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              data-testid="copy-script-button"
              onClick={() => copyScript(activeScript)}
              className="btn-primary-dark !py-2.5 !px-4 !text-[12.5px] !rounded-xl"
            >
              {copiedId === activeScript.id ? <Check size={15} /> : <Copy size={15} />}
              {copiedId === activeScript.id ? "Copiado!" : "Copiar Resposta"}
            </button>
            <a
              href={`https://wa.me/${String(clientPhone).replace(/\D/g, "")}?text=${encodeURIComponent(activeScript.reply)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12.5px] transition-colors"
            >
              <ExternalLink size={14} /> Abrir no WhatsApp do Cliente
            </a>
          </div>
        </section>

        {/* SECTION 3: 1-Click Contract & Proposal Generator */}
        <section className="lg:col-span-5 panel p-6 sm:p-8 flex flex-col justify-between" data-testid="zycron-contract-section">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[0.14em] text-blue-700 mb-2">
              <FileText size={15} /> Fechamento Profissional
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Gerador de Contrato em 1 Clique
            </h2>
            <p className="text-[13.5px] text-slate-500 mt-1 mb-5">
              Personalize os dados do cliente abaixo. Eles alimentam tanto os scripts ao lado quanto o contrato formal de criação e hospedagem.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Nome do Comércio / Cliente</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  data-testid="contract-client-name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] text-[13.5px] font-medium text-slate-900 focus:border-slate-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Ramo</label>
                  <input
                    value={clientCategory}
                    onChange={(e) => setClientCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] text-[13.5px] font-medium text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Cidade</label>
                  <input
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] text-[13.5px] font-medium text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">WhatsApp do Cliente</label>
                  <input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] text-[13.5px] font-medium text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Seu Nome / Agência</label>
                  <input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] text-[13.5px] font-medium text-slate-900 focus:border-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E4E4E7] text-[12.5px] text-slate-600 flex items-center justify-between">
                <span>
                  Valor no contrato: <b className="text-slate-900">R$ {fmtBRL(sitePrice)}</b> +{" "}
                  <b className="text-emerald-700">R$ {fmtBRL(monthlyFee)}/mês</b>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck size={14} /> Pronto p/ PDF
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              data-testid="download-contract-btn"
              onClick={handleDownloadContract}
              className="btn-primary-dark flex-1 justify-center !py-2.5 !px-4 !text-[12.5px] !rounded-xl"
            >
              <Download size={15} /> Baixar Contrato (.HTML)
            </button>
            <button
              type="button"
              onClick={handlePrintContract}
              className="px-4 py-2.5 rounded-xl border border-[#E4E4E7] hover:bg-slate-50 text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5 transition-colors"
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
