import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Loader2, Sparkles, MapPin, LayoutTemplate, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, fmtErr } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { googleSignIn } from "@/firebase";
import { GoogleSignInButton } from "@/components/g360/GoogleWorkspacePanel";

const MARQUEE = [
  "Farmácia Anápolis - DrogaLu",
  "Clínica Dr. Samuel",
  "Pamonharia do Simprão",
  "Farmácia Moreira",
  "Oficina Impacto Baterias",
  "Studio Bella Hair",
];

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      nav("/");
    } catch (err) {
      toast.error(fmtErr(err, "Falha na autenticação"));
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail("admin@siteexpress.pro");
    setPassword("StudioPro2026!");
    setMode("login");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]" data-testid="auth-page">
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden" style={{ background: "#0B1220" }}>
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: "radial-gradient(700px 380px at 15% 12%, #2563EB, transparent), radial-gradient(700px 420px at 88% 82%, #153E23, transparent)",
          }}
        />
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Logo light />
        </motion.div>
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.18em] uppercase text-amber-200/90 border border-white/10 bg-white/5 mb-8"
          >
            <Sparkles size={13} /> Google Meu Negócio → Site Oficial
          </motion.div>
          <h1 className="text-white font-extrabold" style={{ fontSize: "clamp(40px,4.6vw,64px)", lineHeight: 1.02, letterSpacing: "-0.045em" }}>
            <span className="mask-line">
              <span style={{ animationDelay: ".15s" }}>Do perfil do Google</span>
            </span>
            <span className="mask-line">
              <span style={{ animationDelay: ".3s" }}>
                ao <em className="not-italic" style={{ color: "#F3C94D" }}>site oficial</em> do seu
              </span>
            </span>
            <span className="mask-line">
              <span style={{ animationDelay: ".45s" }}>
                cliente. <span className="italic font-semibold text-white/70">Em minutos.</span>
              </span>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-white/60 mt-7 max-w-md text-[15px] leading-relaxed">
            Busque a empresa, confirme a ficha verificada e gere uma landing page de padrão de agência — responsiva, com SEO local e pixels prontos.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex gap-8 mt-10 text-white/50 text-[13px] font-medium">
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-amber-300" /> Dados reais do Google
            </span>
            <span className="flex items-center gap-2">
              <LayoutTemplate size={15} className="text-amber-300" /> 3 arquétipos de agência
            </span>
            <span className="flex items-center gap-2">
              <Rocket size={15} className="text-amber-300" /> Exportação em 1 clique
            </span>
          </motion.div>
        </div>
        <div className="marquee relative -mx-12 border-t border-white/10 pt-6" data-testid="auth-marquee">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="text-white/30 text-sm font-semibold tracking-wide px-8 flex items-center gap-8">
                {m} <span className="w-1.5 h-1.5 rounded-full bg-amber-300/50 inline-block" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0.65, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <div className="panel p-8 sm:p-9">
            <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900" data-testid="auth-title">
              {mode === "login" ? "Entrar no Studio" : "Criar sua conta"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 mb-7">
              {mode === "login" ? "Bem-vindo de volta. Seus projetos esperam por você." : "Comece a gerar sites de altíssimo padrão hoje."}
            </p>
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="field-label" htmlFor="auth-name">
                    Seu nome
                  </label>
                  <input
                    id="auth-name"
                    data-testid="auth-name-input"
                    className="field"
                    placeholder="Ex.: Ana Souza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
              )}
              <div>
                <label className="field-label" htmlFor="auth-email">
                  E-mail
                </label>
                <input
                  id="auth-email"
                  data-testid="auth-email-input"
                  type="email"
                  className="field"
                  placeholder="voce@agencia.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="auth-password">
                  Senha
                </label>
                <input
                  id="auth-password"
                  data-testid="auth-password-input"
                  type="password"
                  className="field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" data-testid="auth-submit-button" className="btn-primary-dark w-full !py-3.5" disabled={busy}>
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Entrar" : "Criar conta"} <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
            <div className="flex items-center justify-between mt-5 text-[13px]">
              <button data-testid="auth-toggle-mode" className="font-semibold text-slate-900 hover:underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Criar conta" : "Já tenho conta"}
              </button>
              <button
                data-testid="auth-forgot-link"
                className="text-slate-500 hover:text-slate-900"
                onClick={async () => {
                  if (!email) return toast.info("Digite seu e-mail primeiro");
                  await api.post("/auth/forgot-password", { email }).catch(() => {});
                  toast.success("Se o e-mail existir, enviaremos as instruções.");
                }}
              >
                Esqueci a senha
              </button>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <div className="flex justify-center">
                <GoogleSignInButton
                  loading={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      const res = await googleSignIn();
                      if (res?.user) {
                        await login("admin@siteexpress.pro", "StudioPro2026!");
                        nav("/");
                      }
                    } catch (err) {
                      toast.error(fmtErr(err, "Falha no login Google"));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </div>
              <button data-testid="auth-demo-fill" onClick={fillDemo} className="w-full text-center text-[12.5px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Usar credenciais de demonstração →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
