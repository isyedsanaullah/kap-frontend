// src/components/ui/DatabaseErrorPopup.jsx
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Global database error popup.
 * Listens for 'kap-db-error' custom events dispatched by the API interceptor.
 * Implements deduplication: multiple simultaneous DB errors produce ONE popup.
 * Does NOT alter authentication state.
 */
export default function DatabaseErrorPopup() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const cooldownRef = useRef(false);

  const handleDbError = useCallback((e) => {
    // Deduplication: if already showing or in cooldown, ignore
    if (cooldownRef.current) return;

    const detail = e.detail || {};
    setMessage(
      detail.message || "We are temporarily unable to connect to the database. Please try again in a moment."
    );
    setVisible(true);

    // Cooldown: don't show another popup for 5 seconds
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 5000);
  }, []);

  useEffect(() => {
    window.addEventListener("kap-db-error", handleDbError);
    return () => window.removeEventListener("kap-db-error", handleDbError);
  }, [handleDbError]);

  const dismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
         onClick={dismiss}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="db-error-title"
        aria-describedby="db-error-desc"
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
        </div>

        {/* Title */}
        <h3 id="db-error-title" className="text-lg font-semibold text-center text-gray-900 dark:text-white">
          Database Connection Failed
        </h3>

        {/* Message */}
        <p id="db-error-desc" className="text-sm text-center text-gray-600 dark:text-gray-400">
          {message}
        </p>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
