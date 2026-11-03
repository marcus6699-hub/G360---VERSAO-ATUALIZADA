import axios from "axios";

const rawBackend = import.meta.env.VITE_BACKEND_URL || "";
export const API = `${rawBackend}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export function fmtErr(e, fallback = "Algo deu errado. Tente novamente.") {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg || "").filter(Boolean).join(" ");
  return fallback;
}
