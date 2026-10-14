// src/pages/Notifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import service from '../api/service';
import Pagination from '../components/ui/Pagination';

const TYPE_META = {
  // Sales
  SALE_CREATED:        { label: 'Sale Created',     color: 'blue'    },
  SALE_UPDATED:        { label: 'Sale Updated',     color: 'indigo'  },
  SALE_DELETED:        { label: 'Sale Deleted',     color: 'red'     },
  
  // Products
  PRODUCT_CREATED:     { label: 'Product Created',  color: 'emerald' },
  PRODUCT_UPDATED:     { label: 'Product Updated',  color: 'teal'    },
  PRODUCT_DELETED:     { label: 'Product Deleted',  color: 'rose'    },
  LOW_STOCK:           { label: 'Low Stock',        color: 'amber'   },
  OUT_OF_STOCK:        { label: 'Out of Stock',     color: 'red'     },

  // Customers
  CUSTOMER_CREATED:    { label: 'Customer Added',   color: 'cyan'    },
  CUSTOMER_UPDATED:    { label: 'Customer Updated', color: 'sky'     },
  CUSTOMER_DELETED:    { label: 'Customer Deleted', color: 'purple'  },
  DUE_REMINDER:        { label: 'Overdue Reminder', color: 'orange'  },
  PAYMENT_RECEIVED:    { label: 'Payment Received', color: 'green'   },

  // Employees
  EMPLOYEE_CREATED:    { label: 'Employee Added',   color: 'violet'  },
  EMPLOYEE_UPDATED:    { label: 'Employee Updated', color: 'fuchsia' },
  EMPLOYEE_DELETED:    { label: 'Employee Deleted', color: 'pink'    },

  // System & Login
  LOGIN_ALERT:         { label: 'Login Alert',      color: 'blue'    },
  SYSTEM_ALERT:        { label: 'System Alert',     color: 'gray'    },
  SALE_UPDATE_RESTORE: { label: 'Stock Restored',   color: 'teal'    },
  SALE_UPDATE_DEDUCT:  { label: 'Stock Deducted',   color: 'rose'    },
};

const ROW_COLORS = {
  blue:    { bg: 'bg-blue-50/60    dark:bg-blue-950/30',    border: 'border-l-blue-500',    badge: 'bg-blue-100    dark:bg-blue-900/50    text-blue-700    dark:text-blue-300'    },
  emerald: { bg: 'bg-emerald-50/60  dark:bg-emerald-950/30',  border: 'border-l-emerald-500',  badge: 'bg-emerald-100  dark:bg-emerald-900/50  text-emerald-700  dark:text-emerald-300'  },
  green:   { bg: 'bg-green-50/60    dark:bg-green-950/30',    border: 'border-l-green-500',    badge: 'bg-green-100    dark:bg-green-900/50    text-green-700    dark:text-green-300'    },
  amber:   { bg: 'bg-amber-50/60   dark:bg-amber-950/30',   border: 'border-l-amber-500',   badge: 'bg-amber-100   dark:bg-amber-900/50   text-amber-700   dark:text-amber-300'   },
  orange:  { bg: 'bg-orange-50/60  dark:bg-orange-950/30',  border: 'border-l-orange-500',  badge: 'bg-orange-100  dark:bg-orange-900/50  text-orange-700  dark:text-orange-300'  },
  indigo:  { bg: 'bg-indigo-50/60  dark:bg-indigo-950/30',  border: 'border-l-indigo-500',  badge: 'bg-indigo-100  dark:bg-indigo-900/50  text-indigo-700  dark:text-indigo-300'  },
  red:     { bg: 'bg-red-50/60     dark:bg-red-950/30',     border: 'border-l-red-500',     badge: 'bg-red-100     dark:bg-red-900/50     text-red-700     dark:text-red-300'     },
  rose:    { bg: 'bg-rose-50/60    dark:bg-rose-950/30',    border: 'border-l-rose-500',    badge: 'bg-rose-100    dark:bg-rose-900/50    text-rose-700    dark:text-rose-300'    },
  violet:  { bg: 'bg-violet-50/60  dark:bg-violet-950/30',  border: 'border-l-violet-500',  badge: 'bg-violet-100  dark:bg-violet-900/50  text-violet-700  dark:text-violet-300'  },
  fuchsia: { bg: 'bg-fuchsia-50/60 dark:bg-fuchsia-950/30', border: 'border-l-fuchsia-500', badge: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300' },
  cyan:    { bg: 'bg-cyan-50/60    dark:bg-cyan-950/30',    border: 'border-l-cyan-500',    badge: 'bg-cyan-100    dark:bg-cyan-900/50    text-cyan-700    dark:text-cyan-300'    },
  sky:     { bg: 'bg-sky-50/60     dark:bg-sky-950/30',     border: 'border-l-sky-500',     badge: 'bg-sky-100     dark:bg-sky-900/50     text-sky-700     dark:text-sky-300'     },
  teal:    { bg: 'bg-teal-50/60    dark:bg-teal-950/30',    border: 'border-l-teal-500',    badge: 'bg-teal-100    dark:bg-teal-900/50    text-teal-700    dark:text-teal-300'    },
  pink:    { bg: 'bg-pink-50/60    dark:bg-pink-950/30',    border: 'border-l-pink-500',    badge: 'bg-pink-100    dark:bg-pink-900/50    text-pink-700    dark:text-pink-300'    },
  purple:  { bg: 'bg-purple-50/60  dark:bg-purple-950/30',  border: 'border-l-purple-500',  badge: 'bg-purple-100  dark:bg-purple-900/50  text-purple-700  dark:text-purple-300'  },
  gray:    { bg: 'bg-gray-50/60    dark:bg-gray-950/30',    border: 'border-l-gray-500',    badge: 'bg-gray-100    dark:bg-gray-800        text-gray-700    dark:text-gray-300'    },
};

const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const PAGE_SIZE = 20;

export default function Notifications() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGen]  = useState(false);
  const [filter, setFilter]   = useState('all');
  const [typeF, setTypeF]     = useState('');
  const [toast, setToast]     = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unread') params.filter = 'unread';
      if (filter === 'read')   params.filter = 'read';
      if (typeF) params.type = typeF;
      const res = await service.getNotifications(params);
      setList(Array.isArray(res) ? res : []);
      setCurrentPage(1);
    } catch { setList([]); } finally { setLoading(false); }
  }, [filter, typeF]);

  useEffect(() => { load(); }, [load]);

  const markRead   = async (id) => { try { await service.markNotificationRead(id); setList(p => p.map(n => n._id === id ? { ...n, isRead: true } : n)); } catch { setList(p => p.map(n => n._id === id ? { ...n, isRead: true } : n)); } };
  const markAll    = async () => { try { await service.markAllNotificationsRead(); setList(p => p.map(n => ({ ...n, isRead: true }))); showToast('All marked as read'); } catch { showToast('Failed', false); } };
  const del        = async (id) => { try { await service.deleteNotification(id); setList(p => p.filter(n => n._id !== id)); } catch { showToast('Failed', false); } };
  const clearRead  = async () => { try { await service.deleteReadNotifications(); setList(p => p.filter(n => !n.isRead)); showToast('Cleared read notifications'); } catch { showToast('Failed', false); } };
  const generate   = async () => { setGen(true); try { const r = await service.generateSystemNotifications(); showToast(`Generated ${r.created} alerts`); await load(); } catch { showToast('Failed', false); } finally { setGen(false); } };

  const unread = list.filter(n => !n.isRead).length;
  const shown  = filter === 'read' ? list.filter(n => n.isRead) : filter === 'unread' ? list.filter(n => !n.isRead) : list;

  // Group by type for display
  const totalPages   = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const pagedShown   = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">
        {toast && (
          <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unread > 0 && (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                {unread} unread
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={generate} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60 shadow-sm hover:shadow-md">
              <svg className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Scan & Generate
            </button>
            {unread > 0 && (
              <button onClick={markAll} className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm rounded-xl hover:bg-blue-100 transition-all">
                Mark all read
              </button>
            )}
            <button onClick={clearRead} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm rounded-xl hover:bg-red-100 transition-all">
              Clear read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            {['all', 'unread', 'read'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                {f}
              </button>
            ))}
          </div>
          <select value={typeF} onChange={e => { setTypeF(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {shown.length} notification{shown.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications — click "Scan & Generate" to check for alerts</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedShown.map(n => {
                      const meta = TYPE_META[n.type] || { label: n.type, color: 'violet' };
                      const rc   = ROW_COLORS[meta.color] || ROW_COLORS.violet;
                      return (
                        <tr key={n._id}
                          className={`border-l-4 ${rc.border} ${rc.bg} ${!n.isRead ? 'animate-pulse' : ''} hover:brightness-95 dark:hover:brightness-110 transition-all`}>
                          {/* Unread dot */}
                          <td className="px-4 py-3">
                            {!n.isRead && <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"/>}
                          </td>
                          {/* Type badge */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rc.badge}`}>
                              {meta.label}
                            </span>
                          </td>
                          {/* Message */}
                          <td className="px-4 py-3">
                            <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {n.message}
                            </p>
                          </td>
                          {/* Time */}
                          <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {timeAgo(n.createdAt)}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-1">
                              {!n.isRead && (
                                <button onClick={() => markRead(n._id)}
                                  className="text-xs px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors font-medium">
                                  ✓ Read
                                </button>
                              )}
                              <button onClick={() => del(n._id)}
                                className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors font-medium">
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={shown.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </main>
  );
}