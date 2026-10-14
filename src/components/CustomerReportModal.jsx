// src/components/CustomerReportModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import service from '../api/service';
import {
  generateCustomerReportPdf,
  buildWhatsAppMessage,
  openWhatsApp,
  shareCustomerReportOnWhatsApp,
  FILTER_LABELS,
} from '../utils/customerReportPdf';

const fmt = (v) => `PKR ${Number(v || 0).toLocaleString()}`;

const FILTERS = [
  { key: '1week',   label: 'Last 7 Days' },
  { key: '1month',  label: 'Last Month'  },
  { key: '3months', label: '3 Months'    },
  { key: '6months', label: '6 Months'    },
  { key: '1year',   label: '1 Year'      },
  { key: 'all',     label: 'All Time'    },
  { key: 'lastN',   label: 'Last N Sales'},
  { key: 'custom',  label: 'Custom'      },
];

export default function CustomerReportModal({ customer, onClose }) {
  const [filter,    setFilter]    = useState('1month');
  const [lastN,     setLastN]     = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const [loading,    setLoading]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sharingWa,  setSharingWa]  = useState(false);
  const [report,     setReport]     = useState(null);
  const [error,      setError]      = useState(null);
  const [waMsg,      setWaMsg]      = useState('');
  const [showWa,     setShowWa]     = useState(false);
  const [company,    setCompany]    = useState(null);
  const overlayRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Fetch company profile for logo and details */
  useEffect(() => {
    service.getCompany()
      .then((res) => setCompany(res?.company || res))
      .catch(() => {});
  }, []);

  /* Auto-fetch preview when filter changes (after initial mount) */
  const fetchReport = async (f = filter) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const params = { filter: f };
      if (f === 'lastN')  params.lastN = lastN;
      if (f === 'custom') { params.startDate = startDate; params.endDate = endDate; }
      const data = await service.getCustomerReport(customer._id, params);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const params = { filter };
      if (filter === 'lastN')  params.lastN = lastN;
      if (filter === 'custom') { params.startDate = startDate; params.endDate = endDate; }
      const data = await service.getCustomerReport(customer._id, params);
      setReport(data);
      await generateCustomerReportPdf(data, {
        lastN,
        startDate,
        endDate,
        company: data.company || company,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => fetchReport(filter);

  const handleWhatsApp = async () => {
    let r = report;
    if (!r) {
      setLoading(true);
      try {
        const params = { filter };
        if (filter === 'lastN')  params.lastN = lastN;
        if (filter === 'custom') { params.startDate = startDate; params.endDate = endDate; }
        r = await service.getCustomerReport(customer._id, params);
        setReport(r);
      } catch (err) {
        setError('Failed to load data for WhatsApp message');
        setLoading(false);
        return;
      } finally { setLoading(false); }
    }
    const msg = buildWhatsAppMessage(r, { lastN, startDate, endDate });
    setWaMsg(msg);
    setShowWa(true);
  };

  const sendWhatsApp = async () => {
    if (!report) return;
    setSharingWa(true);
    setError(null);
    try {
      await shareCustomerReportOnWhatsApp({
        reportData: report,
        opts: {
          lastN,
          startDate,
          endDate,
          company: report.company || company,
        },
        message: waMsg,
      });
      setShowWa(false);
    } catch (err) {
      setError(err.message || 'Failed to share report on WhatsApp');
    } finally {
      setSharingWa(false);
    }
  };

  const filterLabel = FILTER_LABELS[filter] || 'Report';

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl
                      bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4
                        bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Customer Sales Report</h2>
            <p className="text-blue-200 text-sm mt-0.5">{customer.name}</p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Filter chips ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Select Period
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f.key}
                  onClick={() => { setFilter(f.key); setReport(null); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${filter === f.key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── lastN input ── */}
          {filter === 'lastN' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Show last
              </label>
              <input
                type="number" min="1" max="500" value={lastN}
                onChange={(e) => { setLastN(e.target.value); setReport(null); }}
                className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">sales</label>
            </div>
          )}

          {/* ── custom date range ── */}
          {filter === 'custom' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">From</label>
                <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setReport(null); }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To</label>
                <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setReport(null); }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
          )}

          {/* ── Preview button ── */}
          <button onClick={handlePreview} disabled={loading || (filter === 'custom' && (!startDate || !endDate))}
            className="w-full py-2.5 rounded-xl text-sm font-medium border-2 border-blue-500 text-blue-600 dark:text-blue-400
                       hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>Loading preview...</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>Preview Summary</>
            }
          </button>

          {/* ── Error ── */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Summary preview ── */}
          {report && !loading && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Report Preview — {filterLabel}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Billed',    val: fmt(report.summary?.totalSales), color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20'  },
                  { label: 'Total Received',  val: fmt(report.summary?.totalPaid),  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Outstanding Due', val: fmt(report.summary?.totalDue),   color: report.summary?.totalDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400', bg: report.summary?.totalDue > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Counts */}
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>
                  {report.summary?.saleCount || 0} invoices
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>
                  {report.summary?.paymentCount || 0} payment batches
                </span>
              </div>

              {/* Recent sales mini-table */}
              {(report.sales || []).length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Invoice</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Date</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Total</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Paid</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(report.sales || []).slice(0, 8).map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">
                            {s.invoiceId || s._id?.toString().slice(-6).toUpperCase()}
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                            {new Date(s.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">
                            {fmt(s.totalAmount)}
                          </td>
                          <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                            {fmt(s.paidAmount)}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${s.dueAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {fmt(s.dueAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(report.sales || []).length > 8 && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      + {(report.sales || []).length - 8} more invoices in PDF
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="flex gap-3 pt-2">
            {/* PDF Export */}
            <button
              onClick={handleGenerate}
              disabled={generating || loading || (filter === 'custom' && (!startDate || !endDate))}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                         bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white transition-all shadow-lg shadow-blue-500/30"
            >
              {generating
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
              }
              {generating ? 'Generating...' : 'Export PDF'}
            </button>

            {/* WhatsApp */}
            {customer.phone && (
              <button
                onClick={handleWhatsApp}
                disabled={loading || (filter === 'custom' && (!startDate || !endDate))}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold
                           bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed
                           text-white transition-all shadow-lg shadow-green-500/30"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12.004 2.003C6.479 2.003 2 6.479 2 12c0 1.849.487 3.626 1.41 5.175L2.003 22l4.906-1.395A9.931 9.931 0 0012 21.997c5.524 0 10.003-4.477 10.003-9.997C22.003 6.479 17.525 2 12.004 2z"/>
                </svg>
                Share on WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── WhatsApp message editor modal ── */}
      {showWa && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#075E54]">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12.004 2.003C6.479 2.003 2 6.479 2 12c0 1.849.487 3.626 1.41 5.175L2.003 22l4.906-1.395A9.931 9.931 0 0012 21.997c5.524 0 10.003-4.477 10.003-9.997C22.003 6.479 17.525 2 12.004 2z"/>
                </svg>
                <div>
                  <p className="text-white font-semibold text-sm">Share Report on WhatsApp</p>
                  <p className="text-green-200 text-xs">{customer.phone}</p>
                </div>
              </div>
              <button onClick={() => setShowWa(false)} className="text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Attached PDF file badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    PDF Report Statement
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                    Attached with company header & logo
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  PDF
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Message (Filter details only):
                </label>
                <textarea
                  value={waMsg}
                  onChange={(e) => setWaMsg(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none
                             focus:ring-2 focus:ring-green-500 font-mono resize-none leading-relaxed"
                />
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                💡 On supported devices, the PDF file attaches directly into WhatsApp. On desktop browsers, the PDF downloads instantly to attach to the opened chat.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWa(false)}
                  disabled={sharingWa}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendWhatsApp}
                  disabled={sharingWa}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d]
                             text-white transition-colors flex items-center justify-center gap-2 shadow-md shadow-green-500/20 disabled:opacity-50"
                >
                  {sharingWa ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Preparing & Sharing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                      <span>Share PDF on WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
