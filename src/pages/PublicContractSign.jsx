import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Eraser,
  Lock,
  ExternalLink,
  Calendar,
  Building2,
  UserCheck,
  Hash,
  Globe,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";

export default function PublicContractSign() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [signerName, setSignerName] = useState("");
  const [signerDocument, setSignerDocument] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/g360/contracts/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (data?.contract) {
          setContract(data.contract);
          setSignerName(data.contract.representativeName || "");
          setSignerDocument(data.contract.cnpjCpf || "");
        }
      })
      .catch((e) => {
        toast.error(fmtErr(e, "Contrato não encontrado"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Setup Canvas Signature Pad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1E1B4B";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [loading, contract?.status]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignContract = async (e) => {
    e.preventDefault();
    if (!signerName.trim() || !signerDocument.trim()) {
      toast.error("Informe o seu Nome Completo e CPF/CNPJ para prosseguir.");
      return;
    }
    if (!hasDrawn) {
      toast.error("Desenhe sua assinatura ou rubrica no quadro de assinatura abaixo.");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Marque a caixa declarando ciência e concordância jurídica com o contrato.");
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL("image/png") : "";

    setSubmitting(true);
    try {
      const { data } = await api.post(`/g360/contracts/${encodeURIComponent(id)}/sign`, {
        signerName: signerName.trim(),
        signerDocument: signerDocument.trim(),
        signerEmail: signerEmail.trim(),
        signatureDataUrl,
        acceptedTerms: true,
      });
      if (data?.contract) {
        setContract(data.contract);
        toast.success("Contrato assinado digitalmente com sucesso! Certificado SHA-256 emitido.");
      }
    } catch (err) {
      toast.error(fmtErr(err, "Erro ao registrar assinatura eletrônica"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-purple-900/10 p-8 shadow-lg text-center space-y-3 max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto animate-pulse">
            <FileSignature size={24} />
          </div>
          <h2 className="text-[18px] font-extrabold text-[#120E24]">Carregando Contrato Digital...</h2>
          <p className="text-[13px] text-[#5E5775]">Verificando integridade criptográfica do documento.</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#F7F4FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-lg text-center space-y-3 max-w-md w-full">
          <h2 className="text-[20px] font-extrabold text-red-600">Contrato Não Localizado</h2>
          <p className="text-[13px] text-slate-600">
            O link do contrato informado não existe ou foi substituído por uma nova emissão. Solicite o link atualizado ao seu consultor G360.
          </p>
        </div>
      </div>
    );
  }

  const isSigned = contract.status === "signed" && contract.signature;

  return (
    <div className="min-h-screen bg-[#F7F4FB] text-[#120E24] py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP SECURITY BANNER */}
        <div className="bg-gradient-to-r from-[#1E1638] via-[#2D1B69] to-[#4C1D95] text-white rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck size={26} className="text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-purple-200">
                <Lock size={12} />
                <span>Ambiente Criptografado de Assinatura Eletrônica · G360 Sign</span>
              </div>
              <h1 className="text-[20px] sm:text-[22px] font-extrabold mt-0.5">
                Contrato de Prestação de Serviços — {contract.clientName}
              </h1>
              <p className="text-[12.5px] text-purple-200 mt-0.5">
                Validade jurídica assegurada pela MP 2.200-2/2001 (Art. 10, § 2º) e Código de Processo Civil (Art. 784, § 4º).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              data-testid="public-contract-status-badge"
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                isSigned
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-400 text-slate-950"
              }`}
            >
              {isSigned ? (
                <>
                  <CheckCircle2 size={15} /> Assinado Digitalmente
                </>
              ) : (
                <>
                  <FileSignature size={15} /> Aguardando Assinatura
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
          <div className="bg-white rounded-2xl p-4 border border-purple-900/10 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-[#7C3AED] flex items-center gap-1.5">
              <Building2 size={13} /> Contratante
            </div>
            <div className="font-extrabold text-[15px] mt-1">{contract.clientName}</div>
            <div className="text-[12px] text-[#5E5775] mt-0.5">
              CNPJ/CPF: <span className="font-mono font-semibold">{contract.cnpjCpf}</span>
            </div>
            <div className="text-[12px] text-[#5E5775]">Resp.: {contract.representativeName}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-purple-900/10 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-[#7C3AED] flex items-center gap-1.5">
              <UserCheck size={13} /> Contratada (Prestador)
            </div>
            <div className="font-extrabold text-[15px] mt-1">{contract.providerName}</div>
            <div className="text-[12px] text-[#5E5775] mt-0.5">
              CPF/CNPJ: <span className="font-mono font-semibold">{contract.providerCpfCnpj}</span>
            </div>
            <div className="text-[12px] text-[#5E5775] truncate">{contract.providerAddress}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-purple-900/10 shadow-sm">
            <div className="text-[11px] font-bold uppercase text-[#7C3AED] flex items-center gap-1.5">
              <Calendar size={13} /> Investimento e Condições
            </div>
            <div className="font-extrabold text-[20px] text-[#16A34A] mt-0.5 tabular-nums">
              R$ {Number(contract.totalValue || 0).toLocaleString("pt-BR")},00
            </div>
            <div className="text-[11.5px] text-[#5E5775] mt-0.5 line-clamp-2">{contract.paymentTerms}</div>
          </div>
        </div>

        {/* FULL CONTRACT INSTRUMENT */}
        <div className="bg-white rounded-2xl border border-purple-900/15 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#7C3AED]">
                Instrumento Particular de Prestação de Serviços · ID {contract.id}
              </div>
              <h2 className="text-[18px] font-extrabold mt-0.5">
                CLÁUSULAS E CONDIÇÕES CONTRATUAIS
              </h2>
            </div>
            <div className="text-[11.5px] font-mono text-slate-500">
              Emissão: {new Date(contract.createdAt).toLocaleDateString("pt-BR")}
            </div>
          </div>

          <pre
            className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-slate-800 bg-[#FBF9FE] p-5 rounded-xl border border-purple-900/10"
            data-testid="public-contract-text"
          >
            {contract.contractText}
          </pre>

          {/* Optional External Platform Link (Autentique / ZapSign / Gov.br) if configured */}
          {contract.externalSignatureUrl && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="text-[12.5px] text-purple-950">
                <strong>Assinador Externo Opcional Disponível:</strong> Você também pode assinar este documento via portal externo (Autentique / ZapSign / Gov.br).
              </div>
              <a
                href={contract.externalSignatureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-[12px] font-bold flex items-center gap-1.5 shrink-0"
              >
                <span>Abrir Link Externo</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* IF ALREADY SIGNED: SHOW LEGAL AUDIT TRAIL CERTIFICATE */}
          {isSigned ? (
            <div
              className="mt-6 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-6 space-y-5"
              data-testid="contract-signed-certificate"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                      Certificado Oficial de Assinatura Eletrônica e Trilha de Auditoria
                    </div>
                    <h3 className="text-[18px] font-extrabold text-emerald-950">
                      Documento Assinado e Blindado com Hash SHA-256
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold uppercase">
                  Título Executivo Extrajudicial (Art. 784 §4º CPC)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2.5 text-[13px]">
                  <div>
                    <span className="text-slate-500 font-semibold">Signatário Responsável:</span>{" "}
                    <strong className="text-slate-900" data-testid="certificate-signer-name">
                      {contract.signature.signerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Documento Confirmado (CPF/CNPJ):</span>{" "}
                    <strong className="font-mono text-slate-900" data-testid="certificate-signer-doc">
                      {contract.signature.signerDocument}
                    </strong>
                  </div>
                  {contract.signature.signerEmail && (
                    <div>
                      <span className="text-slate-500 font-semibold">E-mail do Signatário:</span>{" "}
                      <strong className="text-slate-900">{contract.signature.signerEmail}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 font-semibold">Data e Hora Exata (Carimbo Temporal):</span>{" "}
                    <strong className="font-mono text-slate-900">
                      {new Date(contract.signature.signedAt).toLocaleString("pt-BR")} (ISO: {contract.signature.signedAt})
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-emerald-700 shrink-0" />
                    <span className="text-slate-500 font-semibold">Endereço IP de Origem:</span>{" "}
                    <strong className="font-mono text-slate-900">{contract.signature.clientIp}</strong>
                  </div>
                  <div className="text-[11.5px] text-slate-500">
                    <strong>Dispositivo / Navegador:</strong> {contract.signature.userAgent}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-emerald-300 p-4 text-center space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Rubrica / Assinatura Manuscrita Capturada em Tela
                  </div>
                  {contract.signature.signatureDataUrl && (
                    <img
                      src={contract.signature.signatureDataUrl}
                      alt="Assinatura do Contratante"
                      className="max-h-28 mx-auto object-contain"
                    />
                  )}
                  <div className="border-t border-slate-200 pt-2 text-[12px] font-bold text-slate-800">
                    {contract.signature.signerName} — {contract.signature.signerDocument}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11.5px] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Hash size={13} />
                  <span>HASH CRIPTOGRÁFICO SHA-256 DO CONTRATO + EVIDÊNCIAS:</span>
                </div>
                <div className="break-all select-all" data-testid="certificate-sha256">
                  {contract.signature.sha256Hash}
                </div>
                <div className="text-[10.5px] text-slate-400 font-sans pt-1">
                  Base Legal: {contract.signature.legalBasis}
                </div>
              </div>

              {/* Action Buttons for Signer: Send WhatsApp Confirmation & Download Signed PDF Copy */}
              <div className="pt-2 flex flex-wrap items-center gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-[13.5px] flex items-center gap-2 shadow-md cursor-pointer"
                  data-testid="print-signed-contract-copy-btn"
                >
                  <Printer size={16} />
                  <span>Baixar / Imprimir Cópia Assinada (PDF)</span>
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `✅ *CONTRATO ASSINADO DIGITALMENTE — ${contract.clientName}*\n\n` +
                      `👤 Signatário: *${contract.signature.signerName}* (${contract.signature.signerDocument})\n` +
                      `📅 Data/Hora: ${new Date(contract.signature.signedAt).toLocaleString("pt-BR")}\n` +
                      `🔐 Hash SHA-256: ${contract.signature.sha256Hash}\n` +
                      `📄 Link Oficial com Certificado:\n${window.location.href}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-[13.5px] flex items-center gap-2 shadow-md"
                  data-testid="whatsapp-signed-receipt-btn"
                >
                  <CheckCircle2 size={16} />
                  <span>Enviar Comprovante de Assinatura no WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* SIGNATURE COLLECTION FORM */
            <form
              onSubmit={handleSignContract}
              className="mt-6 rounded-2xl border-2 border-[#7C3AED]/30 bg-[#FBF9FE] p-6 space-y-5 print:hidden"
              data-testid="public-contract-sign-form"
            >
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                  Formalização e Aceite Digital (MP 2.200-2/2001)
                </div>
                <h3 className="text-[18px] font-extrabold mt-0.5">
                  Assinar Contrato Digitalmente Agora
                </h3>
                <p className="text-[12.5px] text-[#5E5775]">
                  Confirme seus dados abaixo e assine com o dedo (no celular) ou com o mouse no quadro de assinatura.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5E5775] mb-1">
                    Nome Completo do Signatário *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Seu nome completo"
                    data-testid="signer-name-input"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/15 bg-white font-semibold outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5E5775] mb-1">
                    CPF ou CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={signerDocument}
                    onChange={(e) => setSignerDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    data-testid="signer-doc-input"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/15 bg-white font-mono font-semibold outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#5E5775] mb-1">
                    E-mail (Para Cópia do Certificado)
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="seuemail@empresa.com.br"
                    data-testid="signer-email-input"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-900/15 bg-white outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* HTML5 Canvas Signature Pad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-[#5E5775]">
                    Desenhe sua Assinatura ou Rubrica Abaixo (Dedo ou Mouse) *
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[12px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser size={13} /> Limpar Assinatura
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-[#7C3AED]/40 bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={720}
                    height={190}
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={moveDraw}
                    onTouchEnd={endDraw}
                    data-testid="signature-canvas"
                    className="w-full h-[180px] touch-none cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-slate-400 text-[13px] font-medium">
                      Assine aqui com o mouse ou toque na tela do celular
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Consent Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-purple-900/15 cursor-pointer text-[12.5px] leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  data-testid="accept-legal-terms-checkbox"
                  className="mt-1 w-4 h-4 accent-[#7C3AED] shrink-0"
                />
                <span>
                  Declaro que li e concordo integralmente com o objeto, valores e cláusulas deste Contrato de Prestação de Serviços, reconhecendo esta assinatura eletrônica e sua trilha de auditoria (IP, Data/Hora e Hash SHA-256) como juridicamente válidas e vinculantes nos termos do <strong>Art. 10, § 2º da MP 2.200-2/2001</strong> e <strong>Art. 784, § 4º do Código de Processo Civil</strong>.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                data-testid="submit-digital-signature-btn"
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <FileSignature size={18} />
                <span>
                  {submitting
                    ? "Registrando Assinatura e Gerando Hash SHA-256..."
                    : "Assinar Contrato Digitalmente e Emitir Certificado"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
