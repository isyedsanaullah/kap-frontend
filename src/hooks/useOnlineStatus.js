// src/hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';

/**
 * Returns true if the browser has network connectivity.
 * Updates reactively when the browser goes online/offline.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online',  up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return isOnline;
}
