/* src/sw.js — Custom Service Worker
 * Injected by vite-plugin-pwa (injectManifest strategy).
 * __WB_MANIFEST is replaced at build time with the precache manifest.
 */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute }         from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin }  from 'workbox-background-sync';
import { ExpirationPlugin }      from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

/* ── 1. Precache all static assets ─────────────────────────────── */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

/* ── 2. Cache GET /api/* with NetworkFirst (5s timeout) ─────────
 * If network responds → serve it and update cache.
 * If offline or timeout → serve stale cached response.
 */
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'kap-api-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries:    400,
        maxAgeSeconds: 24 * 60 * 60, // 24 h
      }),
    ],
  })
);

/* ── 3. Background Sync for mutations ────────────────────────────
 * POST / PUT / PATCH / DELETE to /api/* are attempted normally.
 * If the network fails (offline), Workbox stores the request in
 * IndexedDB and retries it automatically when connectivity returns.
 */
const bgSync = new BackgroundSyncPlugin('kap-mutations', {
  maxRetentionTime: 72 * 60, // store up to 72 hours
  async onSync({ queue }) {
    // Tell all open tabs that sync is starting
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'KAP_SYNC_START' }));

    let anyFailed = false;
    try {
      await queue.replayRequests();
    } catch {
      anyFailed = true;
    }

    // Notify all tabs that sync finished
    const clients2 = await self.clients.matchAll({ includeUncontrolled: true });
    clients2.forEach(c => c.postMessage({ type: 'KAP_SYNC_DONE', anyFailed }));
  },
});

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkOnly({ plugins: [bgSync] }),
    method
  );
}

/* ── 4. Skip waiting so new SW activates immediately ────────────── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
