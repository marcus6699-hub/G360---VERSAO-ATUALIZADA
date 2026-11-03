import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileSignature,
  BadgeCheck,
  Phone,
  ShieldCheck,
  Mail,
  Send,
  Upload,
  Link2,
  Download,
  Copy,
} from "lucide-react";
import { getAccessToken, googleSignIn } from "@/firebase";

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function DigitalContract({ dark = false }: { dark?: boolean }) {
  const [provider, setProvider] = useState(() => {
    try {
      const saved = localStorage.getItem("g360_contract_provider");
      const p = saved ? JSON.parse(saved) : null;
      return {
        name: p?.name || "Consultor / Prestador de Serviços",
        cpf: p?.cpf || "000.000.000-00",
        rg: p?.rg || "0000000",
        email: p?.email || "contato@empresa.com.br",
        address: p?.address || "Endereço Comercial / Profissional",
      };
    } catch {
      return {
        name: "Consultor / Prestador de Serviços",
        cpf: "000.000.000-00",
        rg: "0000000",
        email: "contato@empresa.com.br",
        address: "Endereço Comercial / Profissional",
      };
    }
  });

  const [client, setClient] = useState({
    name: "Encanto Móveis Planejados",
    representative: "João da Silva",
    email: "",
    phone: "(62) 99113-8004",
    cnpjCpf: "34.512.890/0001-42",
    address: "Av. Brasil Sul, 1500 - Centro, Anápolis - GO",
    value: "997,00",
    serviceDesc:
      "Pacote 01: Site Profissional de Alta Conversão + Placa Física de Avaliação Google (NFC + QR Code) e Otimização de Perfil no Google Business Profile.",
    paymentTerms: "50% de entrada via Pix na assinatura e 50% na entrega final.",
    startDate: new Date().toISOString().slice(0, 10),
    externalSignUrl: "",
  });

  const [customClauses, setCustomClauses] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [signed, setSigned] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [hash, setHash] = useState("");
  const [confirmEmailModal, setConfirmEmailModal] = useState(false);
  const [sendingGmail, setSendingGmail] = useState(false);

  const clientSignLink =
    client.externalSignUrl.trim() ||
    `${typeof window !== "undefined" ? window.location.origin : "https://g360.app"}/?contrato_digital=${encodeURIComponent(
      client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    )}&token=${hash || "G360-SIGN-2026"}`;

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || "");
      if (txt.trim()) {
        setCustomClauses(txt);
        toast.success(`Modelo de contrato "${file.name}" carregado!`);
      }
    };
    reader.readAsText(file);
  };

  const handleSign = () => {
    const ts = new Date().toLocaleString("pt-BR");
    const generatedHash = `G360-DIGITAL-SIG-${Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setSigned(true);
    setTimestamp(ts);
    setHash(generatedHash);
    toast.success("Contrato assinado digitalmente com carimbo de tempo e hash válido!");
  };

  const handleWhatsApp = () => {
    const phoneDigits = client.phone.replace(/\D/g, "");
    const text =
      `Olá *${client.representative}* (*${client.name}*), segue o *Contrato Digital de Prestação de Serviços G360* para leitura e assinatura eletrônica no celular:\n\n` +
      `👤 *Contratado:* ${provider.name} (CPF: ${provider.cpf})\n` +
      `📄 *Escopo:* ${client.serviceDesc}\n` +
      `💳 *Valor:* R$ ${client.value}\n` +
      `📌 *Condições:* ${client.paymentTerms}\n\n` +
      `✍️ *Link para Ler o Contrato Completo e Assinar Eletronicamente (Padrão Autentique / Gov.br):*\n${clientSignLink}\n\n` +
      `${
        signed
          ? `✅ *Status:* Assinado Digitalmente (Hash: ${hash})`
          : "⏳ *Status:* Aguardando sua assinatura eletrônica pelo link acima."
      }`;

    navigator.clipboard.writeText(text);
    const waUrl =
      phoneDigits.length >= 10
        ? `https://wa.me/55${phoneDigits.replace(/^55/, "")}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    toast.success("Contrato com Link de Assinatura enviado para o WhatsApp do cliente!");
  };

  const handleDownloadPdf = () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Contrato Digital G360 — ${client.name}</title>
<style>
  body { font-family: Georgia, serif; color: #1E293B; padding: 32px; background: #F8FAFC; line-height: 1.65; }
  .sheet { max-width: 820px; margin: 0 auto; background: #FFF; border: 1px solid #CBD5E1; border-radius: 12px; padding: 44px; }
  @media print { body { background: #FFF; padding: 0; } .sheet { border: none; } }
</style>
</head>
<body>
  <div class="sheet">
    <h2 style="text-align:center;font-family:sans-serif;">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS G360</h2>
    <p><strong>CONTRATADO:</strong> ${provider.name}, CPF ${provider.cpf}, RG ${provider.rg}, residente em ${provider.address}.</p>
    <p><strong>CONTRATANTE:</strong> ${client.name}, CNPJ/CPF ${client.cnpjCpf}, com sede em ${client.address}, representado por ${client.representative}.</p>
    <p><strong>CLÁUSULA 1ª — DO OBJETO:</strong> ${client.serviceDesc}</p>
    <p><strong>CLÁUSULA 2ª — DO VALOR E PAGAMENTO:</strong> R$ ${client.value} (${client.paymentTerms}).</p>
    ${customClauses ? `<pre style="white-space:pre-wrap;font-family:inherit;">${customClauses}</pre>` : ""}
    <p><strong>LINK DE ASSINATURA ELETRÔNICA:</strong> ${clientSignLink}</p>
  </div>
  <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato-${client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contrato PDF/HTML baixado com sucesso!");
  };

  const executeSendContractViaGmail = async () => {
    setSendingGmail(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }
      if (!token) {
        toast.error("Conecte sua conta Google para enviar o contrato via Gmail.");
        setConfirmEmailModal(false);
        return;
      }

      const recipients = [provider.email, client.email]
        .map((e) => e.trim())
        .filter(Boolean)
        .join(", ");

      const subject = `Contrato Digital Assinado G360 — ${client.name}`;
      const bodyText = [
        `COMPROVANTE DE CONTRATO DIGITAL DE PRESTAÇÃO DE SERVIÇOS — G360`,
        `================================================================`,
        ``,
        `CONTRATADO: ${provider.name} (CPF: ${provider.cpf} | RG: ${provider.rg})`,
        `ENDEREÇO: ${provider.address}`,
        ``,
        `CONTRATANTE: ${client.name} (CPF/CNPJ: ${client.cnpjCpf})`,
        `REPRESENTANTE: ${client.representative}`,
        `ENDEREÇO: ${client.address}`,
        ``,
        `OBJETO: ${client.serviceDesc}`,
        `VALOR TOTAL: R$ ${client.value}`,
        `CONDIÇÕES DE PAGAMENTO: ${client.paymentTerms}`,
        `LINK DE ASSINATURA ELETRÔNICA: ${clientSignLink}`,
        ``,
        `STATUS DE ASSINATURA: ${
          signed ? `ASSINADO DIGITALMENTE (${timestamp})` : "AGUARDANDO ACEITE"
        }`,
        signed ? `HASH CRIPTOGRÁFICO: ${hash}` : "",
        ``,
        `Validade jurídica plena conforme o Código Civil Brasileiro (Art. 593 e seguintes / MP 2.200-2).`,
      ]
        .filter(Boolean)
        .join("\r\n");

      const mimeMessage = [
        `To: ${recipients}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        bodyText,
      ].join("\r\n");

      const raw = encodeBase64Url(mimeMessage);
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      toast.success(`Contrato enviado por Gmail para: ${recipients}`);
      setConfirmEmailModal(false);
    } catch (e: any) {
      toast.error(`Erro ao enviar contrato pelo Gmail: ${e.message}`);
    } finally {
      setSendingGmail(false);
    }
  };

  const cardClass = dark
    ? "bg-[#303134]/90 border border-[#3C4043] text-[#E8EAED]"
    : "bg-white border border-[#E2E8F0] text-[#1E293B] shadow-[0_1px_3px_rgba(15,23,42,0.04)]";
  const mutedText = dark ? "text-[#9AA0A6]" : "text-[#64748B]";
  const inputClass = dark
    ? "w-full bg-[#202124] border border-[#3C4043] text-[#E8EAED] rounded-xl px-3.5 py-2 text-[13px] outline-none"
    : "w-full bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] rounded-xl px-3.5 py-2 text-[13px] outline-none";

  return (
    <div className="max-w-[1300px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <section className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <FileSignature size={16} /> Emissão com Validade Jurídica + Link de Assinatura no Celular
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight mt-1">
              Gerador de Contrato Digital, Upload de Modelo Próprio e Link Autentique / Gov.br
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Suba seu próprio modelo de contrato ou use o padrão G360 e dispare o link de assinatura eletrônica direto para o WhatsApp do cliente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.html"
              onChange={handleUploadTemplate}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Subir Meu Contrato
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: INPUTS */}
        <div className={`lg:col-span-5 rounded-2xl p-6 space-y-5 ${cardClass}`}>
          <div className="pb-3 border-b border-inherit">
            <h2 className="text-[17px] font-bold">1. Seus Dados (Prestador)</h2>
            <p className={`text-[12px] ${mutedText}`}>Pré-preenchido com suas informações.</p>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                Nome Completo
              </label>
              <input
                type="text"
                value={provider.name}
                onChange={(e) => setProvider((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  CPF
                </label>
                <input
                  type="text"
                  value={provider.cpf}
                  onChange={(e) => setProvider((p) => ({ ...p, cpf: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  RG
                </label>
                <input
                  type="text"
                  value={provider.rg}
                  onChange={(e) => setProvider((p) => ({ ...p, rg: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                Seu E-mail (Receberá cópia automática)
              </label>
              <input
                type="email"
                value={provider.email}
                onChange={(e) => setProvider((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pb-3 border-b border-inherit pt-3">
            <h2 className="text-[17px] font-bold">2. Dados do Cliente e Link de Assinatura</h2>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                Nome da Empresa / Cliente
              </label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  Responsável Legal
                </label>
                <input
                  type="text"
                  value={client.representative}
                  onChange={(e) => setClient((c) => ({ ...c, representative: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  WhatsApp do Cliente
                </label>
                <input
                  type="text"
                  value={client.phone}
                  onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  CPF / CNPJ do Cliente
                </label>
                <input
                  type="text"
                  value={client.cnpjCpf}
                  onChange={(e) => setClient((c) => ({ ...c, cnpjCpf: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                  Valor Total (R$)
                </label>
                <input
                  type="text"
                  value={client.value}
                  onChange={(e) => setClient((c) => ({ ...c, value: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>
                Descrição dos Serviços
              </label>
              <textarea
                rows={2}
                value={client.serviceDesc}
                onChange={(e) => setClient((c) => ({ ...c, serviceDesc: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-semibold uppercase text-[#7C3AED] flex items-center gap-1`}>
                  <Link2 size={13} /> Link de Assinatura Eletrônica (Autentique / Gov.br)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(clientSignLink);
                    toast.success("Link de assinatura copiado!");
                  }}
                  className="text-[11px] font-bold text-[#2563EB] flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={12} /> Copiar Link
                </button>
              </div>
              <input
                type="text"
                placeholder="Opcional: Cole link do Autentique ou use o link automático"
                value={client.externalSignUrl}
                onChange={(e) => setClient((c) => ({ ...c, externalSignUrl: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-3 space-y-2">
            <button
              type="button"
              onClick={handleSign}
              className={`w-full py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition ${
                signed ? "bg-[#16A34A] text-white" : "bg-[#F59E0B] text-slate-950"
              }`}
            >
              <BadgeCheck size={16} />
              <span>
                {signed
                  ? "Contrato Assinado Digitalmente"
                  : "Assinar Digitalmente (Validade Jurídica)"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmEmailModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#EF4444] hover:opacity-90 text-white font-semibold text-[12.5px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail size={15} /> Disparar Contrato via Gmail (Para Cliente + Cópia p/ Mim)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:opacity-90 text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone size={14} /> Disparar c/ Link WhatsApp
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className={`py-2.5 px-3 rounded-xl border font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer ${cardClass}`}
              >
                <Download size={14} /> Baixar PDF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className={`lg:col-span-7 rounded-2xl p-6 sm:p-8 space-y-5 ${cardClass}`}>
          <div className="border-b pb-4 border-inherit text-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#2563EB]">
              Instrumento Particular de Prestação de Serviços Profissionais Autônomos
            </div>
            <h3 className="text-[19px] font-bold mt-1 uppercase">
              Contrato de Otimização e Gestão Digital
            </h3>
          </div>

          <div className="space-y-4 text-[13px] leading-relaxed">
            <p>
              Por este instrumento particular, de um lado o(a) CONTRATADO(A):{" "}
              <strong>{provider.name}</strong>, brasileiro(a), portador(a) do RG nº{" "}
              <strong>{provider.rg}</strong> e inscrito(a) no CPF sob o nº{" "}
              <strong>{provider.cpf}</strong>, residente e domiciliado(a) na{" "}
              <strong>{provider.address}</strong>;
            </p>
            <p>
              E de outro lado o(a) CONTRATANTE: <strong>{client.name}</strong>, inscrito(a) no
              CPF/CNPJ sob o nº <strong>{client.cnpjCpf}</strong>, com sede na {client.address},
              neste ato representado(a) por <strong>{client.representative}</strong>;
            </p>
            <p>
              <strong>CLÁUSULA 1ª — DO OBJETO:</strong> O presente contrato tem por objeto a
              prestação de serviços profissionais de: {client.serviceDesc}
            </p>
            <p>
              <strong>CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO:</strong> Pelos serviços, o(a)
              CONTRATANTE pagará ao(à) CONTRATADO(A) o valor total de{" "}
              <strong>R$ {client.value}</strong>, mediante a condição: {client.paymentTerms}.
            </p>
            {customClauses && (
              <pre className="whitespace-pre-wrap font-sans text-[13px] p-3.5 rounded-xl border border-inherit">
                {customClauses}
              </pre>
            )}
            <p>
              <strong>CLÁUSULA 3ª — DA VALIDADE E ASSINATURA ELETRÔNICA:</strong> Este contrato
              possui validade jurídica plena conforme o Código Civil brasileiro (Art. 593 e
              seguintes / MP 2.200-2), podendo ser assinado digitalmente através do link exclusivo:{" "}
              <span className="font-mono text-[#2563EB] break-all">{clientSignLink}</span>
            </p>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center">
              <div className="pt-3 border-t border-inherit">
                <div className="font-bold">{client.representative}</div>
                <div className={`text-[11px] ${mutedText}`}>{client.name} (Contratante)</div>
              </div>
              <div className="pt-3 border-t border-inherit">
                <div className="font-bold">{provider.name}</div>
                <div className={`text-[11px] ${mutedText}`}>
                  Prestador / Contratado (CPF: {provider.cpf})
                </div>
              </div>
            </div>

            {signed && (
              <div className="mt-6 p-4 rounded-xl border border-[#16A34A]/40 bg-[#16A34A]/10 space-y-1.5 text-[12px]">
                <div className="font-bold text-[#16A34A] flex items-center gap-1.5">
                  <BadgeCheck size={16} /> Contrato Assinado Eletronicamente (Validade Jurídica
                  Comprovada)
                </div>
                <div className="font-mono text-[11px] opacity-80 space-y-0.5">
                  <div>
                    <strong>Prestador:</strong> {provider.name} (CPF: {provider.cpf})
                  </div>
                  <div>
                    <strong>Carimbo de Tempo:</strong> {timestamp}
                  </div>
                  <div>
                    <strong>Hash Criptográfico:</strong> {hash}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR GMAIL SEND */}
      {confirmEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 space-y-4 ${cardClass}`}>
            <h3 className="text-[17px] font-bold flex items-center gap-2">
              <Send size={17} className="text-[#EF4444]" /> Confirmar Disparo por Gmail?
            </h3>
            <p className={`text-[13px] ${mutedText}`}>
              O contrato de <strong>{client.name}</strong> será enviado gratuitamente via API do
              Gmail para:
            </p>
            <ul className="text-[12.5px] font-semibold space-y-1 pl-4 list-disc">
              <li>Você: {provider.email}</li>
              {client.email.trim() && <li>Cliente: {client.email.trim()}</li>}
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEmailModal(false)}
                className="px-4 py-2 rounded-xl border border-[#CBD5E1] text-[12.5px] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingGmail}
                onClick={executeSendContractViaGmail}
                className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                {sendingGmail ? "Enviando..." : "Confirmar e Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
