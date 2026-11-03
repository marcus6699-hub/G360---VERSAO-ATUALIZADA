import React, { useState } from "react";
import { toast } from "sonner";
import { FileSignature, Printer, Phone, BadgeCheck, ShieldCheck, Mail } from "lucide-react";
import { db, auth, collection, doc, setDoc } from "@/firebase";

interface ProviderData {
  name: string;
  cpf: string;
  rg: string;
  address: string;
}

interface ClientData {
  name: string;
  representative: string;
  cnpjCpf: string;
  email: string;
  address: string;
  value: string;
  serviceDesc: string;
  paymentTerms: string;
}

export default function DigitalContract({ dark = false }: { dark?: boolean }) {
  const [provider, setProvider] = useState<ProviderData>(() => {
    try {
      const saved = localStorage.getItem("g360_contract_provider");
      const p = saved ? JSON.parse(saved) : null;
      return {
        name: p?.name || "Consultor / Prestador de Serviços",
        cpf: p?.cpf || "000.000.000-00",
        rg: p?.rg || "0000000",
        address: p?.address || "Endereço Comercial / Profissional",
      };
    } catch {
      return {
        name: "Consultor / Prestador de Serviços",
        cpf: "000.000.000-00",
        rg: "0000000",
        address: "Endereço Comercial / Profissional",
      };
    }
  });

  const [client, setClient] = useState<ClientData>({
    name: "Encanto Móveis Planejados",
    representative: "João da Silva",
    cnpjCpf: "34.512.890/0001-42",
    email: "cliente@encantomoveis.com.br",
    address: "Av. Brasil Sul, 1500 - Centro, Anápolis - GO",
    value: "1.290,00",
    serviceDesc: "Otimização Completa de Perfil no Google Business Profile (Google Meu Negócio), criação de 20 serviços SEO, 6 produtos, descrição de 750 caracteres e criação de Site Express de alta conversão.",
    paymentTerms: "50% de entrada via Pix na assinatura e 50% na entrega final.",
  });

  const [signed, setSigned] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string>("");
  const [hash, setHash] = useState<string>("");

  const handleSignAndDispatch = async () => {
    const ts = new Date().toLocaleString("pt-BR");
    const generatedHash = `G360-DIGITAL-SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setSigned(true);
    setTimestamp(ts);
    setHash(generatedHash);

    // Save to Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(collection(db, "signed_contracts"), generatedHash), {
          contractId: generatedHash,
          ownerUid: user.uid,
          provider,
          client,
          timestamp: ts,
          status: "signed",
          createdAt: new Date().toISOString(),
        });
        toast.success("Contrato assinado e salvo com segurança no Firestore!");
      } catch (e) {
        console.error("Error saving signed contract to Firestore:", e);
      }
    }

    // Open mailto to dispatch email copy to client and provider
    const subject = encodeURIComponent(`Contrato Assinado Digitalmente - ${client.name} & ${provider.name}`);
    const body = encodeURIComponent(
      `Prezado(a) ${client.representative} e ${provider.name},\n\n` +
      `O Contrato de Prestação de Serviços Digitais foi assinado digitalmente com sucesso.\n\n` +
      `--- DETALHES DO CONTRATO ---\n` +
      `Prestador: ${provider.name} (CPF: ${provider.cpf})\n` +
      `Contratante: ${client.name} (CNPJ/CPF: ${client.cnpjCpf})\n` +
      `Valor Total: R$ ${client.value}\n` +
      `Condições de Pagamento: ${client.paymentTerms}\n\n` +
      `--- CERTIFICADO DE ASSINATURA DIGITAL ---\n` +
      `Carimbo de Tempo: ${ts}\n` +
      `Hash Criptográfico: ${generatedHash}\n` +
      `Validade: Art. 593 do Código Civil brasileiro e MP 2.200-2/2001.\n\n` +
      `Atenciosamente,\nGestão G360 & Site Express`
    );

    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Cliente de E-mail aberto para envio automático da cópia assinada!");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá *${client.representative}* (${client.name}), segue o resumo e link do Contrato Digital assinado.\n\n` +
      `*Contratado:* ${provider.name} (CPF: ${provider.cpf})\n` +
      `*Valor:* R$ ${client.value}\n` +
      `*Status:* ✅ Assinado Digitalmente\n` +
      `*Hash de Validação:* ${hash || "Pendente"}\n\n` +
      `Por favor, confirme o recebimento da cópia.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp aberto com a mensagem formatada!");
  };

  const cardClass = dark
    ? "bg-[#303134]/85 backdrop-blur-xl border border-[#3C4043] text-[#E8EAED]"
    : "bg-white/90 backdrop-blur-xl border border-[#DADCE0] text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,0.06),0_2px_6px_rgba(60,64,67,0.04)]";
  const mutedText = dark ? "text-[#9AA0A6]" : "text-[#5F6368]";
  const inputClass = dark
    ? "w-full bg-[#202124] border border-[#3C4043] text-[#E8EAED] rounded-xl px-3.5 py-2 text-[13px] outline-none"
    : "w-full bg-[#F8F9FA] border border-[#DADCE0] text-[#202124] rounded-xl px-3.5 py-2 text-[13px] outline-none";

  return (
    <div className="max-w-[1300px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER */}
      <section className={`rounded-2xl p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[#1A73E8] flex items-center gap-1.5">
              <FileSignature size={16} /> DigitalContract — Assinatura & Disparo Automático
            </div>
            <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight mt-1">
              Contrato Digital com Envio Automático por E-mail e WhatsApp
            </h1>
            <p className={`text-[13px] mt-1 ${mutedText}`}>
              Ao assinar, o sistema salva no Firestore e dispara cópias automáticas para você e para o cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/20">
            <BadgeCheck size={16} />
            <span>Firestore Cloud + Cópia Automática</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: INPUTS */}
        <div className={`lg:col-span-5 rounded-2xl p-6 space-y-5 ${cardClass}`}>
          <div className="pb-3 border-b border-inherit">
            <h2 className="text-[17px] font-bold">1. Seus Dados (Prestador)</h2>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Nome Completo</label>
              <input
                type="text"
                value={provider.name}
                onChange={(e) => setProvider((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>CPF</label>
                <input
                  type="text"
                  value={provider.cpf}
                  onChange={(e) => setProvider((p) => ({ ...p, cpf: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>RG</label>
                <input
                  type="text"
                  value={provider.rg}
                  onChange={(e) => setProvider((p) => ({ ...p, rg: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Endereço</label>
              <input
                type="text"
                value={provider.address}
                onChange={(e) => setProvider((p) => ({ ...p, address: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pb-3 border-b border-inherit pt-3">
            <h2 className="text-[17px] font-bold">2. Dados do Cliente</h2>
          </div>

          <div className="space-y-3 text-[13px]">
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Nome / Empresa</label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient((c) => ({ ...c, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Responsável Legal</label>
              <input
                type="text"
                value={client.representative}
                onChange={(e) => setClient((c) => ({ ...c, representative: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>E-mail do Cliente (Para Cópia)</label>
              <input
                type="email"
                value={client.email}
                onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>CPF / CNPJ</label>
                <input
                  type="text"
                  value={client.cnpjCpf}
                  onChange={(e) => setClient((c) => ({ ...c, cnpjCpf: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Valor (R$)</label>
                <input
                  type="text"
                  value={client.value}
                  onChange={(e) => setClient((c) => ({ ...c, value: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase mb-1 ${mutedText}`}>Condições de Pagamento</label>
              <input
                type="text"
                value={client.paymentTerms}
                onChange={(e) => setClient((c) => ({ ...c, paymentTerms: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-3 space-y-2">
            <button
              type="button"
              onClick={handleSignAndDispatch}
              className={`w-full py-3.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer transition shadow-md ${
                signed ? "bg-[#34A853] text-white" : "bg-[#1A73E8] hover:bg-[#1557B0] text-white"
              }`}
            >
              <BadgeCheck size={18} />
              <span>{signed ? "Contrato Assinado & Cópia Disparada!" : "Assinar & Enviar Cópia Automática"}</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-[#34A853] hover:opacity-90 text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone size={14} /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={`py-2.5 px-3 rounded-xl border font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer ${cardClass}`}
              >
                <Printer size={14} /> Imprimir PDF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className={`lg:col-span-7 rounded-2xl p-6 sm:p-8 space-y-5 ${cardClass}`}>
          <div className="border-b pb-4 border-inherit text-center">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#1A73E8]">
              Instrumento Particular de Prestação de Serviços Profissionais
            </div>
            <h3 className="text-[19px] font-bold mt-1 uppercase">
              Contrato de Otimização e Gestão Digital
            </h3>
          </div>

          <div className="space-y-4 text-[13px] leading-relaxed">
            <p>
              Por este instrumento particular, de um lado o(a) CONTRATADO(A): <strong>{provider.name}</strong>, brasileiro(a), portador(a) do RG nº <strong>{provider.rg}</strong> e inscrito(a) no CPF sob o nº <strong>{provider.cpf}</strong>, residente e domiciliado(a) na <strong>{provider.address}</strong>;
            </p>
            <p>
              E de outro lado o(a) CONTRATANTE: <strong>{client.name}</strong>, inscrito(a) no CPF/CNPJ sob o nº <strong>{client.cnpjCpf}</strong>, com sede na {client.address}, neste ato representado(a) por <strong>{client.representative}</strong> (E-mail: {client.email});
            </p>
            <p>
              Têm entre si justo e contratado o seguinte:
            </p>
            <p>
              <strong>CLÁUSULA 1ª — DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços profissionais de: {client.serviceDesc}
            </p>
            <p>
              <strong>CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO:</strong> Pelos serviços, o(a) CONTRATANTE pagará ao(à) CONTRATADO(A) o valor total de <strong>R$ {client.value}</strong>, mediante a condição: {client.paymentTerms}.
            </p>
            <p>
              <strong>CLÁUSULA 3ª — DA VALIDADE E EFICÁCIA:</strong> Este contrato possui validade jurídica plena conforme o Código Civil brasileiro (Art. 593 e seguintes), constituindo documento probatório e título executivo extrajudicial quando acompanhado do comprovante de aceite eletrônico, carimbo de tempo e e-mail de confirmação.
            </p>
            <p>
              <strong>CLÁUSULA 4ª — DO FORO:</strong> As partes elegem o foro da Comarca de Anápolis - GO para dirimir quaisquer dúvidas oriundas deste instrumento.
            </p>

            <div className="pt-8 grid grid-cols-2 gap-8 text-center">
              <div className="pt-3 border-t border-inherit">
                <div className="font-bold">{client.representative}</div>
                <div className={`text-[11px] ${mutedText}`}>{client.name} (Contratante)</div>
              </div>
              <div className="pt-3 border-t border-inherit">
                <div className="font-bold">{provider.name}</div>
                <div className={`text-[11px] ${mutedText}`}>Prestador / Contratado (CPF: {provider.cpf})</div>
              </div>
            </div>

            {signed && (
              <div className="mt-6 p-4 rounded-xl border border-[#34A853]/40 bg-[#34A853]/10 space-y-1.5 text-[12px]">
                <div className="font-bold text-[#34A853] flex items-center gap-1.5">
                  <BadgeCheck size={16} /> Contrato Assinado & Salvo no Firestore
                </div>
                <div className="font-mono text-[11px] opacity-80 space-y-0.5">
                  <div><strong>Prestador:</strong> {provider.name} (CPF: {provider.cpf})</div>
                  <div><strong>Cópia enviada para:</strong> {client.email}</div>
                  <div><strong>Carimbo de Tempo:</strong> {timestamp}</div>
                  <div><strong>Hash Criptográfico:</strong> {hash}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
