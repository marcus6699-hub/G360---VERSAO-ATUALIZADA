import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Safely suppress Vite HMR WebSocket connection notices in iframe environment
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "");
    const file = String(e?.filename || "");
    if (
      msg.includes("WebSocket") ||
      file.includes("@vite/client") ||
      msg.includes("failed to connect")
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = String(e?.reason?.message || e?.reason || "");
    if (
      reason.includes("WebSocket") ||
      reason.includes("@vite/client") ||
      reason.includes("failed to connect")
    ) {
      e.preventDefault();
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
