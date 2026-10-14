// src/db/localDB.js
// IndexedDB wrapper for offline caching and draft queue

const DB_NAME    = 'kap_offline';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('products'))
        db.createObjectStore('products', { keyPath: '_id' });
      if (!db.objectStoreNames.contains('customers'))
        db.createObjectStore('customers', { keyPath: '_id' });
      if (!db.objectStoreNames.contains('sales'))
        db.createObjectStore('sales', { keyPath: '_id' });
      if (!db.objectStoreNames.contains('drafts'))
        db.createObjectStore('drafts', { keyPath: 'localId' });
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror   = ()  => reject(req.error);
  });
}

async function getAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

async function getOne(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

async function putMany(store, items) {
  if (!items?.length) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const s  = tx.objectStore(store);
    items.forEach(item => s.put(item));
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

async function putOne(store, item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item);
    req.onsuccess = () => resolve(item);
    req.onerror   = () => reject(req.error);
  });
}

async function deleteOne(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    req.onsuccess = resolve;
    req.onerror   = () => reject(req.error);
  });
}

/* ── Products ─────────────────────────────────────────────── */
export const cacheProducts       = (items) => putMany('products', items);
export const cacheProduct        = (item)  => putOne('products', item);
export const getCachedProducts   = ()      => getAll('products');
export const getCachedProduct    = (id)    => getOne('products', id);
export const removeCachedProduct = (id)    => deleteOne('products', id);

/* ── Customers ────────────────────────────────────────────── */
export const cacheCustomers      = (items) => putMany('customers', items);
export const cacheCustomer       = (item)  => putOne('customers', item);
export const getCachedCustomers  = ()      => getAll('customers');

/* ── Sales ────────────────────────────────────────────────── */
export const cacheSales          = (items) => putMany('sales', items);
export const cacheSale           = (item)  => putOne('sales', item);
export const getCachedSales      = ()      => getAll('sales');

/* ── Drafts ───────────────────────────────────────────────── */
export const getDrafts    = ()    => getAll('drafts');
export const getDraft     = (id)  => getOne('drafts', id);
export const deleteDraft  = (id)  => deleteOne('drafts', id);

export const saveDraft = async (draft) => {
  const item = {
    ...draft,
    localId:   draft.localId || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status:    draft.status  || 'pending',
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await putOne('drafts', item);
  return item;
};

export const updateDraft = async (localId, updates) => {
  const existing = await getDraft(localId);
  if (!existing) throw new Error('Draft not found');
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await putOne('drafts', updated);
  return updated;
};
