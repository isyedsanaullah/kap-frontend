// src/context/OfflineContext.jsx
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react';
import {
  getDrafts, saveDraft, deleteDraft, updateDraft,
  cacheProducts, cacheCustomers, cacheSales,
  cacheProduct, cacheCustomer, cacheSale,
} from '../db/localDB';
import service from '../api/service';

const OfflineContext = createContext();

const LAST_SYNC_KEY = 'kap_last_sync';
// Auto-refresh cache every 5 minutes when online
const AUTO_REFRESH_MS = 5 * 60 * 1000;

/* ── Draft type constants ────────────────────────────────── */
export const DRAFT_TYPES = {
  CREATE_PRODUCT:  'CREATE_PRODUCT',
  UPDATE_PRODUCT:  'UPDATE_PRODUCT',
  ADD_STOCK:       'ADD_STOCK',
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  CREATE_SALE:     'CREATE_SALE',
  RECEIVE_PAYMENT: 'RECEIVE_PAYMENT',
};

export const DRAFT_META = {
  CREATE_PRODUCT:  { label: 'New Product',      icon: '📦', color: 'blue'   },
  UPDATE_PRODUCT:  { label: 'Edit Product',      icon: '✏️', color: 'indigo' },
  ADD_STOCK:       { label: 'Add Stock',         icon: '📥', color: 'emerald'},
  CREATE_CUSTOMER: { label: 'New Customer',      icon: '👤', color: 'violet' },
  UPDATE_CUSTOMER: { label: 'Edit Customer',     icon: '✏️', color: 'violet' },
  CREATE_SALE:     { label: 'New Sale',          icon: '🧾', color: 'amber'  },
  RECEIVE_PAYMENT: { label: 'Receive Payment',   icon: '💰', color: 'emerald'},
};

/* ── Execute one draft against the live API ─────────────── */
async function executeDraft(draft) {
  switch (draft.type) {
    case DRAFT_TYPES.CREATE_PRODUCT: {
      const p = await service.createProduct(draft.data);
      await cacheProduct(p);
      return p;
    }
    case DRAFT_TYPES.UPDATE_PRODUCT: {
      const p = await service.updateProduct(draft.data.id, draft.data.updates);
      await cacheProduct(p);
      return p;
    }
    case DRAFT_TYPES.ADD_STOCK: {
      const p = await service.addStock(draft.data.productId, {
        quantity: draft.data.quantity,
        note:     draft.data.note || '',
      });
      await cacheProduct(p);
      return p;
    }
    case DRAFT_TYPES.CREATE_CUSTOMER: {
      const c = await service.createCustomer(draft.data);
      await cacheCustomer(c);
      return c;
    }
    case DRAFT_TYPES.UPDATE_CUSTOMER: {
      const c = await service.updateCustomer(draft.data.id, draft.data.updates);
      await cacheCustomer(c);
      return c;
    }
    case DRAFT_TYPES.CREATE_SALE: {
      const s = await service.createSale(draft.data);
      await cacheSale(s);
      return s;
    }
    case DRAFT_TYPES.RECEIVE_PAYMENT: {
      const result = await service.receivePayment(draft.data);
      return result;
    }
    default:
      throw new Error(`Unknown draft type: ${draft.type}`);
  }
}

/* ── Provider ────────────────────────────────────────────── */
export const OfflineProvider = ({ children }) => {
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [drafts,         setDrafts]         = useState([]);
  const [syncing,        setSyncing]        = useState(false);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const [syncResults,    setSyncResults]    = useState(null);
  const [downloading,    setDownloading]    = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null); // { step, total }
  const [lastSyncedAt,   setLastSyncedAt]   = useState(
    () => localStorage.getItem(LAST_SYNC_KEY) || null
  );
  const autoRefreshTimer = useRef(null);

  /* ── Load drafts ────────────────────────────────────────── */
  const loadDrafts = useCallback(async () => {
    try {
      const all = await getDrafts();
      setDrafts(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      return all;
    } catch { return []; }
  }, []);

  useEffect(() => { loadDrafts(); }, [loadDrafts]);

  /* ── Download ALL data to device ────────────────────────── */
  const downloadAll = useCallback(async () => {
    if (!navigator.onLine || !localStorage.getItem('kap_token')) return;
    setDownloading(true);
    setDownloadProgress({ step: 0, total: 3 });

    try {
      // Step 1: Products
      setDownloadProgress({ step: 1, total: 3, label: 'Downloading products…' });
      const prodRes = await service.getProducts({ limit: 10000 });
      if (prodRes?.products?.length) await cacheProducts(prodRes.products);

      // Step 2: Customers
      setDownloadProgress({ step: 2, total: 3, label: 'Downloading customers…' });
      const custRes = await service.getCustomersForSale();
      const customers = Array.isArray(custRes?.customers) ? custRes.customers
                      : Array.isArray(custRes) ? custRes : [];
      if (customers.length) await cacheCustomers(customers);

      // Step 3: Sales
      setDownloadProgress({ step: 3, total: 3, label: 'Downloading sales…' });
      const salesRes = await service.getSales({ limit: 10000 });
      if (salesRes?.sales?.length) await cacheSales(salesRes.sales);

      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSyncedAt(now);
      setDownloadProgress({ done: true, label: 'All data downloaded!' });
      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadProgress({ error: true, label: 'Download failed. Check connection.' });
      setTimeout(() => setDownloadProgress(null), 3000);
    } finally {
      setDownloading(false);
    }
  }, []);

  /* ── Auto-refresh cache in background ───────────────────── */
  const refreshCache = useCallback(async (silent = true) => {
    if (!navigator.onLine || !localStorage.getItem('kap_token')) return;
    try {
      const [prodRes, custRes, salesRes] = await Promise.allSettled([
        service.getProducts({ limit: 10000 }),
        service.getCustomersForSale(),
        service.getSales({ limit: 10000 }),
      ]);
      if (prodRes.status  === 'fulfilled' && prodRes.value?.products)
        await cacheProducts(prodRes.value.products);
      const custData = custRes.status === 'fulfilled'
        ? (Array.isArray(custRes.value?.customers) ? custRes.value.customers
           : Array.isArray(custRes.value) ? custRes.value : [])
        : [];
      if (custData.length) await cacheCustomers(custData);
      if (salesRes.status === 'fulfilled' && salesRes.value?.sales)
        await cacheSales(salesRes.value.sales);

      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, now);
      setLastSyncedAt(now);
    } catch { /* silent */ }
  }, []);

  /* ── Periodic cache refresh (every 5 min when online) ───── */
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    autoRefreshTimer.current = setInterval(() => {
      if (navigator.onLine && localStorage.getItem('kap_token')) refreshCache(true);
    }, AUTO_REFRESH_MS);
  }, [refreshCache]);

  /* ── Online / Offline listeners ─────────────────────────── */
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      if (localStorage.getItem('kap_token')) {
        startAutoRefresh();
        refreshCache(true);                       // sync cache immediately
      }
      const all     = await loadDrafts();
      const pending = all.filter(d => d.status === 'pending');
      if (pending.length > 0) setShowSyncBanner(true);
    };
    const onOffline = () => {
      setIsOnline(false);
      setShowSyncBanner(false);
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // Boot: if already online and logged in, start auto-refresh
    if (navigator.onLine && localStorage.getItem('kap_token')) {
      startAutoRefresh();
      refreshCache(true);
    }

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
    };
  }, [loadDrafts, startAutoRefresh, refreshCache]);

  /* ── Add a draft ─────────────────────────────────────────── */
  const addDraft = useCallback(async (type, data, customLabel) => {
    const meta  = DRAFT_META[type] || {};
    const label = customLabel || meta.label || type;
    const draft = await saveDraft({ type, data, label });
    await loadDrafts();
    window.dispatchEvent(new CustomEvent('kap-draft-change'));
    return draft;
  }, [loadDrafts]);

  /* ── Remove a draft ──────────────────────────────────────── */
  const removeDraft = useCallback(async (localId) => {
    await deleteDraft(localId);
    await loadDrafts();
    window.dispatchEvent(new CustomEvent('kap-draft-change'));
  }, [loadDrafts]);

  /* ── Edit a draft's data ─────────────────────────────────── */
  const editDraft = useCallback(async (localId, newData, newLabel) => {
    await updateDraft(localId, {
      data:   newData,
      label:  newLabel || undefined,
      status: 'pending',
      error:  undefined,
    });
    await loadDrafts();
  }, [loadDrafts]);

  /* ── Sync a single draft ─────────────────────────────────── */
  const syncDraft = useCallback(async (localId) => {
    if (!isOnline) return { success: false, error: 'You are offline' };
    const draft = (await getDrafts()).find(d => d.localId === localId);
    if (!draft) return { success: false, error: 'Draft not found' };

    setSyncing(true);
    try {
      await executeDraft(draft);
      await deleteDraft(localId);
      await loadDrafts();
      window.dispatchEvent(new CustomEvent('kap-draft-change'));
      return { success: true, label: draft.label };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Sync failed';
      await updateDraft(localId, { status: 'failed', error: msg });
      await loadDrafts();
      return { success: false, label: draft.label, error: msg };
    } finally {
      setSyncing(false);
    }
  }, [isOnline, loadDrafts]);

  /* ── Sync all pending drafts ─────────────────────────────── */
  const syncAll = useCallback(async () => {
    if (!isOnline) return;
    const all     = await getDrafts();
    const pending = all.filter(d => d.status === 'pending');
    if (!pending.length) return;

    setSyncing(true);
    setSyncResults(null);
    setShowSyncBanner(false);

    const results = [];
    for (const draft of pending) {
      try {
        await executeDraft(draft);
        await deleteDraft(draft.localId);
        results.push({ label: draft.label, success: true });
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed';
        await updateDraft(draft.localId, { status: 'failed', error: msg });
        results.push({ label: draft.label, success: false, error: msg });
      }
    }

    // Re-sync cache after successful syncs
    await refreshCache(true);
    setSyncResults(results);
    await loadDrafts();
    window.dispatchEvent(new CustomEvent('kap-draft-change'));
    setSyncing(false);
  }, [isOnline, loadDrafts, refreshCache]);

  const pendingCount = drafts.filter(d => d.status === 'pending').length;
  const failedCount  = drafts.filter(d => d.status === 'failed').length;

  const fmtSyncTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
      + ' ' + d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
  };

  return (
    <OfflineContext.Provider value={{
      isOnline,
      drafts,
      pendingCount,
      failedCount,
      syncing,
      syncResults,
      setSyncResults,
      showSyncBanner,
      setShowSyncBanner,
      downloading,
      downloadProgress,
      lastSyncedAt,
      lastSyncedAtFmt: fmtSyncTime(lastSyncedAt),
      addDraft,
      removeDraft,
      editDraft,
      syncDraft,
      syncAll,
      downloadAll,
      refreshCache,
      loadDrafts,
      DRAFT_TYPES,
      DRAFT_META,
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
