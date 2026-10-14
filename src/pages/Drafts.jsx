// src/pages/Drafts.jsx
import React, { useState, useEffect } from 'react';
import { useOffline, DRAFT_META } from '../context/OfflineContext';

/* ── Helpers ───────────────────────────────────────────────── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })
    + ' ' + d.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  failed:  'bg-red-100  text-red-700  dark:bg-red-900/40  dark:text-red-300',
  synced:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const COLOR_MAP = {
  blue:    'bg-blue-100   dark:bg-blue-900/40   text-blue-600   dark:text-blue-400',
  indigo:  'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  violet:  'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  amber:   'bg-amber-100  dark:bg-amber-900/40  text-amber-600  dark:text-amber-400',
};

/* ── Delete confirm modal ──────────────────────────────────── */
function DeleteModal({ draft, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </div>
        <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-1">Delete Draft?</h3>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          "<span className="font-medium text-gray-700 dark:text-gray-300">{draft?.label}</span>" will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sync Results modal ────────────────────────────────────── */
function SyncResultsModal({ results, onClose }) {
  const ok   = results.filter(r => r.success).length;
  const fail = results.filter(r => !r.success).length;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Sync Complete</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="text-emerald-600 font-semibold">{ok} succeeded</span>
          {fail > 0 && <>, <span className="text-red-500 font-semibold">{fail} failed</span></>}
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${r.success
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
              <span>{r.success ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.label}</p>
                {!r.success && r.error && <p className="text-xs opacity-75 truncate">{r.error}</p>}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}

/* ── Draft Card ────────────────────────────────────────────── */
function DraftCard({ draft, onSync, onDelete, onRetry, syncing }) {
  const meta   = DRAFT_META[draft.type] || { icon: '📄', label: draft.type, color: 'blue' };
  const isSelf = syncing === draft.localId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex gap-4">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${COLOR_MAP[meta.color] || COLOR_MAP.blue}`}>
        {meta.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{draft.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(draft.createdAt)}</p>
          </div>
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[draft.status] || STATUS_STYLES.pending}`}>
            {draft.status === 'pending' ? 'Pending' : draft.status === 'failed' ? 'Failed' : 'Synced'}
          </span>
        </div>

        {/* Error */}
        {draft.status === 'failed' && draft.error && (
          <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-start gap-1">
            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {draft.error}
          </p>
        )}

        {/* Draft data preview */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
          {draft.data?.name && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Name: <span className="text-gray-700 dark:text-gray-300 font-medium">{draft.data.name}</span></span>
          )}
          {draft.data?.quantity && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Qty: <span className="text-gray-700 dark:text-gray-300 font-medium">+{draft.data.quantity}</span></span>
          )}
          {draft.data?.totalAmount !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Amount: <span className="text-gray-700 dark:text-gray-300 font-medium">PKR {Number(draft.data.totalAmount).toLocaleString()}</span></span>
          )}
          {draft.data?.phone && (
            <span className="text-xs text-gray-500 dark:text-gray-400">Phone: <span className="text-gray-700 dark:text-gray-300 font-medium">{draft.data.phone}</span></span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {(draft.status === 'pending' || draft.status === 'failed') && (
            <button
              onClick={() => draft.status === 'failed' ? onRetry(draft.localId) : onSync(draft.localId)}
              disabled={!!syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
              {isSelf ? (
                <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Syncing…</>
              ) : (
                <>{draft.status === 'failed' ? '🔄 Retry' : '☁️ Sync'}</>
              )}
            </button>
          )}
          <button
            onClick={() => onDelete(draft)}
            disabled={!!syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function Drafts() {
  const {
    isOnline, drafts, pendingCount, failedCount,
    syncing, syncResults, setSyncResults,
    syncDraft, syncAll, removeDraft, loadDrafts,
    downloadAll, downloading, downloadProgress, lastSyncedAtFmt,
  } = useOffline();

  const [filter,     setFilter]     = useState('all');   // all | pending | failed
  const [deletingDraft, setDeletingDraft] = useState(null);
  const [syncingOne, setSyncingOne] = useState(null);
  const [toast,      setToast]      = useState(null);

  useEffect(() => { loadDrafts(); }, []); // eslint-disable-line

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Filtered list */
  const filtered = drafts.filter(d => {
    if (filter === 'all')     return true;
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'failed')  return d.status === 'failed';
    return true;
  });

  /* Sync one */
  const handleSync = async (localId) => {
    if (!isOnline) return showToast('You are offline', 'error');
    setSyncingOne(localId);
    const result = await syncDraft(localId);
    setSyncingOne(null);
    if (result?.success) showToast(`✅ ${result.label} synced!`);
    else showToast(`❌ ${result?.error || 'Sync failed'}`, 'error');
  };

  /* Delete */
  const handleDeleteConfirm = async () => {
    if (!deletingDraft) return;
    await removeDraft(deletingDraft.localId);
    setDeletingDraft(null);
    showToast('Draft deleted');
  };

  /* Sync all */
  const handleSyncAll = async () => {
    if (!isOnline) return showToast('You are offline', 'error');
    await syncAll();
  };

  const totalDrafts = drafts.length;

  return (
    <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offline Drafts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Operations saved while offline. Sync when you're back online.
            </p>
          </div>
          {/* Online indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}/>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* ── Download All Data Card ───────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shrink-0">
              📲
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-white text-base">Device Data Sync</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Download all products, customers & sales to this device for offline use.
                Data auto-refreshes every 5 minutes when online.
              </p>

              {/* Last sync time */}
              {lastSyncedAtFmt && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Last synced: {lastSyncedAtFmt}
                </p>
              )}
              {!lastSyncedAtFmt && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  No local data yet — download first.
                </p>
              )}

              {/* Progress bar */}
              {downloadProgress && (
                <div className="mt-3">
                  {downloadProgress.error ? (
                    <p className="text-xs text-red-600 dark:text-red-400">❌ {downloadProgress.label}</p>
                  ) : downloadProgress.done ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">✅ {downloadProgress.label}</p>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{downloadProgress.label}</span>
                        <span>{downloadProgress.step}/{downloadProgress.total}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${(downloadProgress.step / downloadProgress.total) * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Download button */}
            <button
              onClick={downloadAll}
              disabled={downloading || !isOnline}
              title={!isOnline ? 'You must be online to download' : 'Download all data to this device'}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
              {downloading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Downloading…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Download All
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Drafts', value: totalDrafts,    color: 'text-blue-600   dark:text-blue-400'   },
            { label: 'Pending Sync', value: pendingCount,   color: 'text-amber-600  dark:text-amber-400'  },
            { label: 'Failed',       value: failedCount,    color: 'text-red-600    dark:text-red-400'    },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Sync All banner ────────────────────────────────── */}
        {pendingCount > 0 && isOnline && (
          <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
            <div>
              <p className="font-semibold">Ready to sync {pendingCount} pending draft{pendingCount > 1 ? 's' : ''}</p>
              <p className="text-blue-100 text-sm mt-0.5">You're online — push your offline work to the server now.</p>
            </div>
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white text-blue-700 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-60">
              {syncing
                ? <><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>Syncing…</>
                : <>☁️ Sync All</>}
            </button>
          </div>
        )}

        {/* ── Offline banner ─────────────────────────────────── */}
        {!isOnline && pendingCount > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <span className="text-2xl">📡</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">You're offline</p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                {pendingCount} draft{pendingCount > 1 ? 's' : ''} will sync automatically when you reconnect.
              </p>
            </div>
          </div>
        )}

        {/* ── Filter tabs ────────────────────────────────────── */}
        {totalDrafts > 0 && (
          <div className="flex gap-2">
            {[
              { key: 'all',     label: `All (${totalDrafts})` },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'failed',  label: `Failed (${failedCount})` },
            ].map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === t.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Draft list ─────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-4">
              {totalDrafts === 0 ? '✅' : '🔍'}
            </div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {totalDrafts === 0 ? 'No drafts yet' : 'No drafts in this filter'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {totalDrafts === 0
                ? 'Operations made while offline will appear here for review before syncing.'
                : 'Try switching the filter above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(draft => (
              <DraftCard
                key={draft.localId}
                draft={draft}
                onSync={handleSync}
                onRetry={handleSync}
                onDelete={setDeletingDraft}
                syncing={syncingOne}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ─────────────────────────────── */}
      {deletingDraft && (
        <DeleteModal
          draft={deletingDraft}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingDraft(null)}
        />
      )}

      {/* ── Sync results modal ───────────────────────────────── */}
      {syncResults && (
        <SyncResultsModal
          results={syncResults}
          onClose={() => setSyncResults(null)}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}
