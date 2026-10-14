// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import {
  setAccessToken as setApiToken,
  clearAccessToken,
  registerLogoutHandler,
} from "../api/api";

const AuthContext = createContext();

const TOKEN_KEY = "kap_token";
const USER_KEY  = "kap_user";

// Check the Friday cutoff every 60 seconds
const CUTOFF_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * Compute the next Friday 12:00 PM Asia/Karachi (UTC+05:00) as a Unix timestamp (seconds).
 * Mirrors the backend's getNextFridayNoonUTC() exactly.
 */
const getNextFridayNoonUTC = () => {
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowPKT = new Date(nowUTC + PKT_OFFSET_MS);

  const dayPKT = nowPKT.getUTCDay();
  const hourPKT = nowPKT.getUTCHours();
  const minPKT = nowPKT.getUTCMinutes();

  let daysUntilFriday = (5 - dayPKT + 7) % 7;

  if (daysUntilFriday === 0) {
    const isPastNoon = hourPKT > 12 || (hourPKT === 12 && minPKT >= 0);
    if (isPastNoon) {
      daysUntilFriday = 7;
    }
  }

  const todayMidnightPKT_UTC = new Date(Date.UTC(
    nowPKT.getUTCFullYear(),
    nowPKT.getUTCMonth(),
    nowPKT.getUTCDate(),
    0, 0, 0, 0
  ));

  const fridayNoonUTC = new Date(
    todayMidnightPKT_UTC.getTime()
    + daysUntilFriday * 24 * 60 * 60 * 1000
    + 12 * 60 * 60 * 1000
    - PKT_OFFSET_MS
  );

  return Math.floor(fridayNoonUTC.getTime() / 1000);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionEndedMessage, setSessionEndedMessage] = useState(null);
  const timerRef              = useRef(null);

  /* ── Logout ───────────────────────────────────────────────── */
  const logout = useCallback((message) => {
    clearAccessToken();
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (message) {
      setSessionEndedMessage(message);
    }
  }, []);

  // Register logout with the axios interceptor so genuine 401s clear auth
  useEffect(() => {
    registerLogoutHandler(logout);
  }, [logout]);

  /* ── Friday Noon Session Cutoff Checker ──────────────────── */
  const startSessionCutoffChecker = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (!stored) return;

        const { sessionCutoff } = jwtDecode(stored);
        if (sessionCutoff && Date.now() >= sessionCutoff * 1000) {
          console.log("[AUTH] Friday noon session cutoff reached — logging out");
          logout("Your session has ended. Please log in again.");
        }
      } catch {
        // Token decode failed — ignore, will be caught on next API call
      }
    }, CUTOFF_CHECK_INTERVAL_MS);
  }, [logout]);

  /* ── Restore session on page load ─────────────────────────── */
  useEffect(() => {
    const bootstrap = () => {
      try {
        const token     = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (token && savedUser) {
          const decoded = jwtDecode(token);

          // Check JWT expiration (7-day security ceiling)
          const jwtExpired = decoded.exp && decoded.exp * 1000 <= Date.now();

          // Check Friday noon session cutoff
          const cutoffPassed = decoded.sessionCutoff && Date.now() >= decoded.sessionCutoff * 1000;

          if (jwtExpired || cutoffPassed) {
            // Session is over — clear and show message if cutoff
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            if (cutoffPassed) {
              setSessionEndedMessage("Your session has ended. Please log in again.");
            }
          } else {
            // Token is valid and within session cutoff — restore session
            setApiToken(token);
            setUser(JSON.parse(savedUser));
            startSessionCutoffChecker();
          }
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Login ────────────────────────────────────────────────── */
  const login = (token, userFromServer) => {
    setApiToken(token);
    setSessionEndedMessage(null);

    const userObj = userFromServer
      ? {
          id:    userFromServer.id    || userFromServer._id,
          name:  userFromServer.name  || "",
          email: userFromServer.email || "",
          role:  userFromServer.role  || "employee",
        }
      : (() => {
          const d = jwtDecode(token);
          return { id: d.id, name: "", email: "", role: d.role };
        })();

    setUser(userObj);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY,  JSON.stringify(userObj));
    startSessionCutoffChecker();
  };

  /* ── Clear session-ended message ─────────────────────────── */
  const clearSessionMessage = useCallback(() => {
    setSessionEndedMessage(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      sessionEndedMessage,
      clearSessionMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);