import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FolderOpen,
  Mail,
  MessageSquare,
  Send,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  LogOut,
  FileText,
} from "lucide-react";
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  getFirebaseIdToken,
  logout,
} from "@/firebase";
import { User } from "firebase/auth";

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

interface DriveFileRecord {
  id?: number;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  businessName?: string;
}

interface GmailMessageSummary {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

interface ChatSpace {
  name: string;
  displayName?: string;
  spaceType?: string;
}

export function GoogleSignInButton({
  onClick,
  loading,
  label = "Sign in with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="gsi-material-button inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#202124] font-semibold text-[13px] shadow-sm transition cursor-pointer disabled:opacity-60"
    >
      <div className="gsi-material-button-state"></div>
      <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
        <div className="gsi-material-button-icon w-4 h-4 shrink-0">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: "block", width: "18px", height: "18px" }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
        </div>
        <span className="gsi-material-button-contents">
          {loading ? "Conectando..." : label}
        </span>
        <span style={{ display: "none" }}>Sign in with Google</span>
      </div>
    </button>
  );
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function GoogleWorkspacePanel({
  dark = false,
  activeBusinessName = "",
  onFilePicked,
}: {
  dark?: boolean;
  activeBusinessName?: string;
  onFilePicked?: (file: DriveFileRecord) => void;
}) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google Picker & Cloud SQL files state
  const [driveFiles, setDriveFiles] = useState<DriveFileRecord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFileRecord | null>(null);

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [emailTo, setEmailTo] = useState("contato@empresa.com.br");
  const [emailSubject, setEmailSubject] = useState(
    activeBusinessName
      ? `Diagnóstico & Proposta G360 — ${activeBusinessName}`
      : "Relatório & Contrato Digital G360"
  );
  const [emailBody, setEmailBody] = useState(
    `Olá,\n\nSegue o resumo da auditoria e otimização Google Meu Negócio + Site Express preparado pela nossa equipe.\n\nAtenciosamente,\nMarcus Henrique Pires Dias`
  );
  const [confirmSendEmail, setConfirmSendEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Google Chat state
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [chatMessage, setChatMessage] = useState(
    activeBusinessName
      ? `🚀 Novo lead analisado no G360: ${activeBusinessName}`
      : "🚀 Atualização de Auditoria e Contrato no G360 Studio!"
  );
  const [chatError404, setChatError404] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [confirmSendChat, setConfirmSendChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const syncWithCloudSql = async () => {
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;
      await fetch("/api/sql/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      setLoadingFiles(true);
      const res = await fetch("/api/sql/drive-files", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (e) {
      console.error("Failed to load Cloud SQL files:", e);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (!needsAuth && user) {
      syncWithCloudSql();
    }
  }, [needsAuth, user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        toast.success(`Conectado ao Google Workspace como ${result.user.email}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Falha ao autenticar com o Google");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToken(null);
    setUser(null);
    setNeedsAuth(true);
    toast.info("Sessão Google Workspace encerrada.");
  };

  // ---------------- 1. GOOGLE PICKER (DRIVE) ----------------
  const openGooglePicker = async () => {
    const accessToken = token || (await getAccessToken());
    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }

    const createPicker = () => {
      const pickerOrigin =
        window.location.ancestorOrigins &&
        window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[
              window.location.ancestorOrigins.length - 1
            ]
          : window.location.origin;

      const pickerCallback = async (data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          const pickedRecord: DriveFileRecord = {
            driveFileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType || "application/octet-stream",
            url: file.url || `https://drive.google.com/file/d/${file.id}/view`,
            iconUrl: file.iconUrl || "",
            businessName: activeBusinessName || "Geral",
          };
          toast.success(`Arquivo selecionado: ${file.name}`);
          if (onFilePicked) onFilePicked(pickedRecord);

          try {
            const idToken = await getFirebaseIdToken();
            if (idToken) {
              const res = await fetch("/api/sql/drive-files", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify(pickedRecord),
              });
              if (res.ok) {
                const saved = await res.json();
                if (saved.file) {
                  setDriveFiles((prev) => [saved.file, ...prev]);
                }
              }
            }
          } catch (e) {
            console.error("Failed to persist picked file:", e);
          }
        }
      };

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setCallback(pickerCallback)
        .setOrigin(pickerOrigin)
        .build();
      picker.setVisible(true);
    };

    if (window.google && window.google.picker) {
      createPicker();
    } else if (window.gapi) {
      window.gapi.load("picker", { callback: createPicker });
    } else {
      toast.error("Carregando biblioteca Google Picker, tente novamente em instantes.");
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!confirmDeleteFile) return;
    try {
      const idToken = await getFirebaseIdToken();
      if (idToken && confirmDeleteFile.id) {
        await fetch(`/api/sql/drive-files/${confirmDeleteFile.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        });
      }
      setDriveFiles((prev) => prev.filter((f) => f.id !== confirmDeleteFile.id));
      toast.success(`Arquivo "${confirmDeleteFile.fileName}" removido da lista.`);
    } catch (e) {
      toast.error("Erro ao remover referência do arquivo.");
    } finally {
      setConfirmDeleteFile(null);
    }
  };

  // ---------------- 2. GMAIL API ----------------
  const loadGmailMessages = async () => {
    const accessToken = token || (await getAccessToken());
    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }
    setLoadingGmail(true);
    try {
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      const list = data.messages || [];
      const details: GmailMessageSummary[] = [];
      for (const item of list.slice(0, 5)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
          details.push({
            id: item.id,
            snippet: msgData.snippet || "",
            subject: getHeader("Subject") || "(Sem assunto)",
            from: getHeader("From") || "",
            date: getHeader("Date") || "",
          });
        }
      }
      setGmailMessages(details);
      toast.success("Caixa de entrada Gmail sincronizada!");
    } catch (e: any) {
      toast.error("Erro ao listar mensagens do Gmail.");
    } finally {
      setLoadingGmail(false);
    }
  };

  const executeSendGmail = async () => {
    const accessToken = token || (await getAccessToken());
    if (!accessToken) {
      setConfirmSendEmail(false);
      setNeedsAuth(true);
      return;
    }
    setSendingEmail(true);
    try {
      const mimeMessage = [
        `To: ${emailTo.trim()}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(emailSubject)))}?=`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        emailBody,
      ].join("\r\n");

      const raw = encodeBase64Url(mimeMessage);
      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      toast.success(`E-mail enviado com sucesso para ${emailTo}!`);
      setConfirmSendEmail(false);
    } catch (e: any) {
      toast.error(`Falha ao enviar e-mail via Gmail: ${e.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // ---------------- 3. GOOGLE CHAT API ----------------
  const loadChatSpaces = async () => {
    const accessToken = token || (await getAccessToken());
    if (!accessToken) {
      setNeedsAuth(true);
      return;
    }
    setLoadingChat(true);
    setChatError404(null);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg =
          errData?.error?.message ||
          "Google Chat app not found. To create a Chat app, you must turn on the Chat API and configure the app in the Google Cloud console.";
        setChatError404(msg);
        return;
      }
      const data = await res.json();
      const spaces: ChatSpace[] = data.spaces || [];
      setChatSpaces(spaces);
      if (spaces.length > 0 && !selectedSpace) {
        setSelectedSpace(spaces[0].name);
      }
      toast.success(`${spaces.length} espaço(s) do Google Chat encontrado(s).`);
    } catch (e: any) {
      setChatError404(e.message || "Erro ao consultar espaços do Google Chat.");
    } finally {
      setLoadingChat(false);
    }
  };

  const executeSendChatMessage = async () => {
    const accessToken = token || (await getAccessToken());
    if (!accessToken) {
      setConfirmSendChat(false);
      setNeedsAuth(true);
      return;
    }
    if (!selectedSpace) {
      toast.error("Selecione ou informe um espaço do Google Chat (ex: spaces/AAAA...).");
      setConfirmSendChat(false);
      return;
    }
    setSendingChat(true);
    try {
      const res = await fetch(
        `https://chat.googleapis.com/v1/${selectedSpace}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: chatMessage }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${res.status}`;
        if (res.status === 404 || msg.includes("Chat app not found")) {
          setChatError404(msg);
        }
        throw new Error(msg);
      }
      toast.success("Mensagem enviada para o espaço no Google Chat!");
      setConfirmSendChat(false);
    } catch (e: any) {
      toast.error(`Erro no Google Chat: ${e.message}`);
    } finally {
      setSendingChat(false);
    }
  };

  const cardClass = dark
    ? "bg-[#303134]/85 border border-[#3C4043] text-[#E8EAED]"
    : "bg-white border border-[#DADCE0] text-[#202124] shadow-sm";
  const subtleBg = dark ? "bg-[#202124]" : "bg-[#F8F9FA]";
  const borderCol = dark ? "border-[#3C4043]" : "border-[#DADCE0]";
  const mutedText = dark ? "text-[#9AA0A6]" : "text-[#5F6368]";

  return (
    <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1A73E8] flex items-center gap-1.5">
            <Database size={14} /> Google Workspace + Cloud SQL + Firebase (100% Gratuito)
          </div>
          <h2 className="text-[18px] sm:text-[20px] font-bold mt-0.5">
            Central Google Picker (Drive), Gmail Automático e Google Chat
          </h2>
          <p className={`text-[12.5px] mt-0.5 ${mutedText}`}>
            Selecione fotos e arquivos direto do seu Google Drive, dispare contratos e propostas via Gmail e envie alertas no Google Chat.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {needsAuth ? (
            <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#34A853]/10 text-[#34A853] border border-[#34A853]/25 text-[12px] font-semibold">
                <CheckCircle2 size={14} /> {user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className={`p-2 rounded-xl border ${borderCol} ${subtleBg} hover:opacity-80 cursor-pointer`}
                title="Desconectar Google Workspace"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {needsAuth ? (
        <div className={`rounded-xl p-5 border ${borderCol} ${subtleBg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div className="space-y-1">
            <div className="font-bold text-[14px]">
              Conecte sua conta Google para habilitar o Drive Picker, Gmail e Google Chat
            </div>
            <p className={`text-[12.5px] ${mutedText}`}>
              O token OAuth fica protegido apenas em memória na sua sessão e ativa o disparo de e-mails, seleção de arquivos do Drive e persistência em Cloud SQL PostgreSQL.
            </p>
          </div>
          <GoogleSignInButton onClick={handleLogin} loading={isLoggingIn} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* COLUMN 1: GOOGLE PICKER + CLOUD SQL */}
          <div className={`rounded-xl p-4 border ${borderCol} ${subtleBg} space-y-3 flex flex-col justify-between`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider text-[#1A73E8] flex items-center gap-1.5">
                  <FolderOpen size={15} /> 1. Google Picker (Drive)
                </span>
                <button
                  type="button"
                  onClick={openGooglePicker}
                  className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white font-semibold text-[12px] flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen size={13} /> Abrir Google Drive
                </button>
              </div>
              <p className={`text-[12px] ${mutedText}`}>
                Importe fotos da fachada, logomarcas ou PDFs direto do seu Google Drive. Os registros ficam salvos no banco Cloud SQL.
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {loadingFiles ? (
                  <div className={`text-[12px] ${mutedText}`}>Carregando arquivos salvos...</div>
                ) : driveFiles.length === 0 ? (
                  <div className={`text-[12px] p-3 rounded-lg border border-dashed ${borderCol} ${mutedText}`}>
                    Nenhum arquivo selecionado ainda. Clique em "Abrir Google Drive" acima.
                  </div>
                ) : (
                  driveFiles.map((f, idx) => (
                    <div
                      key={f.id || idx}
                      className={`p-2.5 rounded-lg border ${borderCol} bg-white/60 dark:bg-black/20 flex items-center justify-between gap-2 text-[12px]`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <FileText size={13} className="text-[#1A73E8] shrink-0" />
                          <span className="truncate">{f.fileName}</span>
                        </div>
                        <div className={`text-[11px] truncate ${mutedText}`}>
                          {f.businessName || "Drive"} · {f.mimeType}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-black/10 text-[#1A73E8]"
                            title="Abrir no Drive"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFile(f)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer"
                          title="Remover arquivo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: GMAIL API */}
          <div className={`rounded-xl p-4 border ${borderCol} ${subtleBg} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#EA4335] flex items-center gap-1.5">
                <Mail size={15} /> 2. Gmail (Envio & Leitura)
              </span>
              <button
                type="button"
                onClick={loadGmailMessages}
                disabled={loadingGmail}
                className={`px-2.5 py-1 rounded-lg border ${borderCol} text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer`}
              >
                <RefreshCw size={12} className={loadingGmail ? "animate-spin" : ""} /> Ler Recentes
              </button>
            </div>

            <div className="space-y-2 text-[12px]">
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                  Destinatário (Para o Cliente ou Cópia)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="cliente@empresa.com.br"
                  className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} bg-transparent outline-none`}
                />
              </div>
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                  Assunto
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} bg-transparent outline-none`}
                />
              </div>
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                  Mensagem
                </label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} bg-transparent outline-none`}
                />
              </div>
              <button
                type="button"
                onClick={() => setConfirmSendEmail(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#EA4335] hover:opacity-90 text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={13} /> Enviar E-mail pelo Gmail
              </button>
            </div>

            {gmailMessages.length > 0 && (
              <div className="pt-2 border-t border-inherit space-y-1.5 max-h-36 overflow-y-auto">
                <div className={`text-[10.5px] font-bold uppercase ${mutedText}`}>
                  Últimos E-mails na Caixa de Entrada
                </div>
                {gmailMessages.map((m) => (
                  <div key={m.id} className={`p-2 rounded border ${borderCol} text-[11px]`}>
                    <div className="font-bold truncate">{m.subject}</div>
                    <div className={`truncate ${mutedText}`}>{m.from}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 3: GOOGLE CHAT API */}
          <div className={`rounded-xl p-4 border ${borderCol} ${subtleBg} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#34A853] flex items-center gap-1.5">
                <MessageSquare size={15} /> 3. Google Chat
              </span>
              <button
                type="button"
                onClick={loadChatSpaces}
                disabled={loadingChat}
                className={`px-2.5 py-1 rounded-lg border ${borderCol} text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer`}
              >
                <RefreshCw size={12} className={loadingChat ? "animate-spin" : ""} /> Carregar Espaços
              </button>
            </div>

            <div className={`p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] space-y-1`}>
              <div className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={12} /> Pré-requisitos da API Google Chat:
              </div>
              <p className={mutedText}>
                1. Requer conta Google Workspace Business/Enterprise (contas consumidor <code>@gmail.com</code> não suportam a API Chat).
              </p>
              <p className={mutedText}>
                2. Configure o App Chat no Console GCP:{" "}
                <a
                  href="https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=gen-lang-client-0860310554"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1A73E8] underline font-semibold"
                >
                  Abrir Configuração Google Chat API
                </a>
              </p>
            </div>

            {chatError404 && (
              <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-[11px] space-y-1">
                <div className="font-bold text-red-500">Aviso da API Google Chat:</div>
                <div className={mutedText}>{chatError404}</div>
                <a
                  href="https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=gen-lang-client-0860310554"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1A73E8] underline font-semibold"
                >
                  Configurar Chat App no Google Cloud Console <ExternalLink size={11} />
                </a>
              </div>
            )}

            <div className="space-y-2 text-[12px]">
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                  Espaço Google Chat
                </label>
                {chatSpaces.length > 0 ? (
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} ${subtleBg} outline-none`}
                  >
                    {chatSpaces.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.displayName || s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    placeholder="spaces/AAAAAAAAAAA"
                    className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} bg-transparent outline-none`}
                  />
                )}
              </div>
              <div>
                <label className={`block text-[10.5px] font-semibold uppercase mb-0.5 ${mutedText}`}>
                  Mensagem para a Equipe / Espaço
                </label>
                <textarea
                  rows={2}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border ${borderCol} bg-transparent outline-none`}
                />
              </div>
              <button
                type="button"
                onClick={() => setConfirmSendChat(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#34A853] hover:opacity-90 text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={13} /> Publicar no Google Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE DRIVE FILE */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 space-y-4 ${cardClass}`}>
            <h3 className="text-[17px] font-bold">Confirmar exclusão de registro?</h3>
            <p className={`text-[13px] ${mutedText}`}>
              Deseja remover o arquivo <strong>"{confirmDeleteFile.fileName}"</strong> da lista sincronizada do projeto?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(null)}
                className={`px-4 py-2 rounded-xl border ${borderCol} text-[12.5px] font-semibold cursor-pointer`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriveFile}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: SEND GMAIL */}
      {confirmSendEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 space-y-4 ${cardClass}`}>
            <h3 className="text-[17px] font-bold">Confirmar envio de e-mail via Gmail?</h3>
            <p className={`text-[13px] ${mutedText}`}>
              Um e-mail com o assunto <strong>"{emailSubject}"</strong> será enviado da sua conta Google para <strong>{emailTo}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendEmail(false)}
                className={`px-4 py-2 rounded-xl border ${borderCol} text-[12.5px] font-semibold cursor-pointer`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingEmail}
                onClick={executeSendGmail}
                className="px-4 py-2 rounded-xl bg-[#EA4335] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                {sendingEmail ? "Enviando..." : "Confirmar e Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: SEND GOOGLE CHAT MESSAGE */}
      {confirmSendChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 space-y-4 ${cardClass}`}>
            <h3 className="text-[17px] font-bold">Confirmar envio de mensagem no Google Chat?</h3>
            <p className={`text-[13px] ${mutedText}`}>
              A mensagem será publicada no espaço <strong>{selectedSpace || "(não informado)"}</strong> em seu nome.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendChat(false)}
                className={`px-4 py-2 rounded-xl border ${borderCol} text-[12.5px] font-semibold cursor-pointer`}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={sendingChat}
                onClick={executeSendChatMessage}
                className="px-4 py-2 rounded-xl bg-[#34A853] text-white text-[12.5px] font-semibold cursor-pointer"
              >
                {sendingChat ? "Publicando..." : "Confirmar Publicação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
