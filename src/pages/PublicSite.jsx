import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { generateSiteHtml, suspendedHtml } from "@/lib/sitegen/generateSiteHtml";

export default function PublicSite() {
  const { slug } = useParams();
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/public/site/${slug}`)
      .then(({ data }) =>
        setHtml(
          data.status === "suspended"
            ? suspendedHtml(data.name, data.suspendedReason, data.expiredDays)
            : generateSiteHtml(data.data, { slug })
        )
      )
      .catch(() => setError(true));
  }, [slug]);

  if (error)
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white text-center p-6" data-testid="public-site-404">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Site não encontrado</h1>
          <p className="text-white/50 text-sm">Verifique o endereço ou fale com a administração.</p>
        </div>
      </div>
    );
  if (!html)
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  return <iframe title="Site gerado" data-testid="public-site-frame" srcDoc={html} className="w-full border-0 fixed inset-0" style={{ height: "100vh" }} />;
}
