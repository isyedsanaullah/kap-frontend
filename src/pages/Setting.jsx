// src/pages/Setting.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import service from '../api/service';

const getDeviceIcon = (deviceType) => {
  const type = (deviceType || '').toLowerCase();
  if (type === 'mobile' || type === 'phone') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    );
  }
  if (type === 'tablet') {
    return (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
      </svg>
    );
  }
  // desktop / web
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Setting() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'single' | 'all', session: obj }

  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await service.getSessions();
      if (res?.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      showToast('Could not fetch active device sessions', true);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      const res = await service.revokeSession(sessionId);
      if (res?.success) {
        showToast('Device session logged out successfully');
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        showToast(res?.message || 'Failed to logout device', true);
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
      showToast(err.response?.data?.message || 'Failed to revoke session', true);
    } finally {
      setRevokingId(null);
      setConfirmModal(null);
    }
  };

  const handleRevokeAllOther = async () => {
    try {
      setRevokingAll(true);
      const res = await service.revokeAllOtherSessions();
      if (res?.success) {
        showToast('All other devices have been logged out');
        setSessions(prev => prev.filter(s => s.isCurrent));
      } else {
        showToast(res?.message || 'Failed to logout other devices', true);
      }
    } catch (err) {
      console.error('Failed to revoke all other sessions:', err);
      showToast(err.response?.data?.message || 'Failed to revoke sessions', true);
    } finally {
      setRevokingAll(false);
      setConfirmModal(null);
    }
  };

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-medium transition-all duration-300 ${
            toast.isError
              ? 'bg-rose-500/90 text-white shadow-rose-500/20'
              : 'bg-emerald-600/90 text-white shadow-emerald-500/20'
          }`}
        >
          {toast.isError ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {confirmModal.type === 'all'
                  ? 'Log out all other devices?'
                  : `Log out from ${confirmModal.session?.deviceName || 'this device'}?`}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {confirmModal.type === 'all'
                  ? 'This will immediately terminate all active sessions except your current browser. Anyone logged into those devices will need to sign in again.'
                  : 'This device will be logged out immediately and will lose access until signed back in.'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'all') {
                    handleRevokeAllOther();
                  } else {
                    handleRevokeSingle(confirmModal.session.id);
                  }
                }}
                disabled={revokingAll || Boolean(revokingId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {revokingAll || revokingId ? 'Logging out...' : 'Yes, Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Settings & Account Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Settings & Devices
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Manage your active login sessions, monitor device access, and configure your system security and preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSessions}
              disabled={loadingSessions}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: LOGGED IN DEVICES & ACTIVE SESSIONS ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                </svg>
              </span>
              Logged-in Devices
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {sessions.length} Active
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              Devices where your account is currently signed in. You can log out from any device remotely.
            </p>
          </div>

          {otherSessions.length > 0 && (
            <button
              onClick={() => setConfirmModal({ type: 'all' })}
              disabled={revokingAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span>Log Out All Other Devices</span>
            </button>
          )}
        </div>

        {/* Sessions list */}
        {loadingSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(n => (
              <div key={n} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-slate-800" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No active session records found</p>
            <p className="text-xs text-gray-500 dark:text-slate-500">Sign out and sign back in to establish a tracked device session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Device First */}
            {currentSession && (
              <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                      {getDeviceIcon(currentSession.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {currentSession.deviceName || 'Current Device'}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          This Device
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 capitalize">
                        {currentSession.deviceType || 'Desktop / Web'} &bull; {currentSession.os || 'OS'} &bull; {currentSession.browser || 'Browser'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">IP Address</span>
                    <p className="font-mono text-gray-700 dark:text-slate-300 font-medium truncate">
                      {currentSession.ip || 'Local / Network'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Last Active</span>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Active Now
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Devices */}
            {otherSessions.map(sess => (
              <div
                key={sess.id}
                className="relative p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 shadow-sm transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-white/5 flex items-center justify-center flex-shrink-0">
                      {getDeviceIcon(sess.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {sess.deviceName || 'Other Device'}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 capitalize">
                          {sess.deviceType || 'Web'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 capitalize">
                        {sess.os || 'OS'} &bull; {sess.browser || 'Browser'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmModal({ type: 'single', session: sess })}
                    disabled={revokingId === sess.id}
                    title="Log out from this device"
                    className="p-2.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">IP Address</span>
                    <p className="font-mono text-gray-700 dark:text-slate-300 font-medium truncate">
                      {sess.ip || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-slate-500">Last Active</span>
                    <p className="text-gray-700 dark:text-slate-300 font-medium">
                      {formatTimeAgo(sess.lastActive || sess.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: APPEARANCE & THEME PREFERENCE ─── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l9.402 9.402" />
              </svg>
            </span>
            Appearance & Interface
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Customize the look and feel of your KAP application on this device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => toggleTheme('light')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                : 'border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Light Mode</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Clean, bright daytime theme</p>
            </div>
            {theme === 'light' && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-indigo-600" />
            )}
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => toggleTheme('dark')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-4 ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                : 'border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Dark Mode</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Deep sleek nighttime palette</p>
            </div>
            {theme === 'dark' && (
              <span className="ml-auto w-2.5 h-2.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* ─── SECTION 3: ACCOUNT & USER ROLE DETAILS ─── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
            Account & Role
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Current authenticated account details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-slate-500">Name</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{user?.name || 'User'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-slate-500">Email</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5 truncate">{user?.email || 'N/A'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-white/5">
            <span className="text-xs text-gray-400 dark:text-slate-500">Assigned Role</span>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 capitalize">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}