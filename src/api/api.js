// src/api/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://kap-new-backend.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/* ── In-memory access token ─────────────────────────────────── */
let accessToken = null;
export const setAccessToken   = (t) => { accessToken = t; };
export const clearAccessToken = () => { accessToken = null; };

/* ── Logout callback (set by AuthContext) ───────────────────── */
let _logoutFn = null;
export const registerLogoutHandler = (fn) => { _logoutFn = fn; };

/* ── Auth header on every request ──────────────────────────── */
api.interceptors.request.use((config) => {
  const token = accessToken || localStorage.getItem("kap_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response interceptor ───────────────────────────────────── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code   = err.response?.data?.code;
    const url    = err.config?.url || "";

    /* ── Database errors → dispatch popup event, NEVER logout ── */
    if (code === "DATABASE_UNAVAILABLE" || code === "DATABASE_TIMEOUT") {
      window.dispatchEvent(new CustomEvent("kap-db-error", {
        detail: {
          code,
          message: err.response?.data?.message || "Database connection failed."
        }
      }));
      return Promise.reject(err);
    }

    /* ── 401 on protected requests → clear auth state ────────── */
    // Do NOT logout for /auth/login 401s (that's just bad credentials)
    // Do NOT logout for database errors (handled above)
    if (status === 401 && !url.includes("/auth/login")) {
      _logoutFn?.();
    }

    /* ── Offline mutation counter ────────────────────────────── */
    const method     = err.config?.method?.toUpperCase();
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const isOffline  = !err.response;

    if (isMutation && isOffline) {
      const n = Number(localStorage.getItem("kap-pending") || 0);
      localStorage.setItem("kap-pending", String(n + 1));
      window.dispatchEvent(new CustomEvent("kap-pending-change"));
    }

    return Promise.reject(err);
  }
);

export default api;