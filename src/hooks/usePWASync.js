// src/hooks/usePWASync.js
import { useState, useEffect } from 'react';
import { useOnlineStatus }     from './useOnlineStatus';

/**
 * Tracks PWA sync state:
 *  - isOnline        — browser connectivity
 *  - isSyncing       — SW is currently replaying queued requests
 *  - lastSyncedAt    — Date of last successful sync
 *  - pendingCount    — approx number of queued mutations (incremented locally)
 *  - queueAction()   — call this when a mutation is queued offline
 */
export function usePWASync() {
  const isOnline   = useOnlineStatus();
  const [isSyncing,  setIsSyncing]  = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [pendingCount, setPendingCount] = useState(
    () => Number(localStorage.getItem('kap-pending') || 0)
  );

  /* ── Sync pending counter with localStorage changes ─────────── */
  useEffect(() => {
    const refresh = () =>
      setPendingCount(Number(localStorage.getItem('kap-pending') || 0));
    window.addEventListener('kap-pending-change', refresh);
    return () => window.removeEventListener('kap-pending-change', refresh);
  }, []);

  /* ── Listen for messages from SW ─────────────────────────── */
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    const handler = ({ data }) => {
      if (!data) return;
      if (data.type === 'KAP_SYNC_START') {
        setIsSyncing(true);
      }
      if (data.type === 'KAP_SYNC_DONE') {
        setIsSyncing(false);
        setPendingCount(0);
        localStorage.setItem('kap-pending', '0');
        setLastSyncedAt(new Date());
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  /* ── Reset pending when back online (SW will auto-sync) ───── */
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      // SW will replay; we mark syncing optimistically
      setIsSyncing(true);
    }
  }, [isOnline]);

  /* ── Call this in service.js when a request is queued ──────── */
  const queueAction = () => {
    setPendingCount(p => {
      const next = p + 1;
      localStorage.setItem('kap-pending', String(next));
      return next;
    });
  };

  return { isOnline, isSyncing, lastSyncedAt, pendingCount, queueAction };
}
