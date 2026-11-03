/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "@/index.css";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import Studio from "@/pages/Studio";
import PublicSite from "@/pages/PublicSite";
import PublicContractSign from "@/pages/PublicContractSign";

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || "Erro inesperado na interface" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8FF] p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-purple-200 p-6 shadow-xl">
            <h2 className="text-lg font-extrabold text-[#120E24] mb-2">Recarregando Interface</h2>
            <p className="text-xs text-slate-600 mb-4">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] text-white text-xs font-extrabold hover:bg-[#6D28D9] cursor-pointer"
            >
              Recarregar Agora
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Protected({ children }: { children: React.ReactNode }) {
  const auth = useAuth() as any;
  const user = auth?.user;
  if (user === null || user === undefined)
    return (
      <div className="auth-loading" data-testid="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/site/:slug" element={<PublicSite />} />
            <Route path="/contrato/:id" element={<PublicContractSign />} />
            <Route
              path="/studio"
              element={
                <Protected>
                  <Studio />
                </Protected>
              }
            />
            <Route
              path="/"
              element={
                <Protected>
                  <Studio />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors toastOptions={{ style: { fontFamily: "Nunito, Inter, sans-serif" } }} />
      </AuthProvider>
    </AppErrorBoundary>
  );
}
