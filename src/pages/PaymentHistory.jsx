// src/pages/PaymentHistory.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import service from '../api/service';
import Pagination from '../components/ui/Pagination';
import { generatePaymentsPDFClient } from '../utils/paymentPdfExport';

const fmt     = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '';

// Helper to format Date object into YYYY-MM-DD local string
const toYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Date calculation for Option A: Last N Months (rolling period up to today)
const calculateLastNMonthsRange = (nMonths) => {
  const num = Math.max(1, parseInt(nMonths, 10) || 1);
  const now = new Date();
  const end = now;

  // Calculate target month and clamp day to prevent month overflow (e.g. Mar 31 -> Feb 28)
  const targetDate = new Date(now.getFullYear(), now.getMonth() - num, 1);
  const maxDaysInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(now.getDate(), maxDaysInTargetMonth);
  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), safeDay);

  return {
    startDate: toYMD(start),
    endDate: toYMD(end),
  };
};

// Date calculation for Option B: Specific Calendar Month (1st to last day of selected month)
const calculateSpecificMonthRange = (year, monthIndex) => {
  const y = parseInt(year, 10);
  const m = parseInt(monthIndex, 10);
  const start = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = new Date(y, m, lastDay);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() === m;

  return {
    startDate: toYMD(start),
    endDate: toYMD(end),
    isCurrentMonth,
    lastDay,
  };
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/* ── Group raw PaymentHistory records by paymentBatchId ─────────── */
function groupPayments(list) {
  const map = new Map();
  list.forEach(p => {
    // If paymentBatchId exists use it; otherwise fallback to p._id or customer+minute
    const minute = new Date(p.createdAt).toISOString().slice(0, 16);
    const key = p.paymentBatchId || (p._id ? p._id.toString() : `${p.customer?._id}-${minute}`);
    if (!map.has(key)) {
      map.set(key, {
        batchId:       key,
        id:            p._id,
        customer:      p.customer,
        paymentMethod: p.paymentMethod,
        receivedBy:    p.receivedBy,
        note:          p.note,
        date:          p.paymentDate || p.createdAt,
        totalAmount:   0,
        allocations:   [],
      });
    }
    const g = map.get(key);
    g.totalAmount += (p.appliedAmount || 0);
    g.allocations.push(p);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function PaymentHistory() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();

  // Filter Mode: 'lastN' (Option A) | 'specificMonth' (Option B)
  const [filterMode, setFilterMode] = useState('lastN');

  // Option A State: Last N Months
  const [nMonths, setNMonths] = useState(1);
  const [customNInput, setCustomNInput] = useState('1');

  // Option B State: Specific Calendar Month
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);

  // Common Filter State
  const [paymentMethod, setPaymentMethod] = useState('');

  // Pagination State (25 payments per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Data State
  const [payments,  setPayments]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [company,   setCompany]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf,   setExportingPdf]   = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [expandedBatch,    setExpandedBatch]    = useState(null);
  const [error, setError] = useState(null);

  // Location flash message & state
  const location = useLocation();
  const [successToast, setSuccessToast] = useState(location.state?.message || null);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessToast(location.state.message);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setSuccessToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const [receiveForm, setReceiveForm] = useState({
    customerId: '', amount: '', paymentMethod: 'Cash', note: '',
  });

  // Calculate current active date boundaries based on selected filter mode
  const activeDateRange = useMemo(() => {
    if (filterMode === 'lastN') {
      return calculateLastNMonthsRange(nMonths);
    } else {
      return calculateSpecificMonthRange(selectedYear, selectedMonth);
    }
  }, [filterMode, nMonths, selectedYear, selectedMonth]);

  const fetchCustomers = async () => {
    const res = await service.getCustomers().catch(() => null);
    if (!res) return;
    const list = Array.isArray(res?.customers) ? res.customers : Array.isArray(res) ? res : [];
    setCustomers(list.filter(c => (c.dueRemainings || 0) > 0));
  };

  const fetchCompany = async () => {
    try {
      const res = await service.getCompany();
      setCompany(res?.company || res);
    } catch {
      // Non-critical if fails
    }
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // NOTE: Send limit: 10000 AND getAll: 'true' so both local and remote Vercel backend
      // return all payments in the selected period without capping at 30!
      const params = {
        startDate: activeDateRange.startDate,
        endDate:   activeDateRange.endDate,
        limit:     10000,
        getAll:    'true',
      };
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const res = await service.getAllPayments(params);
      const list = Array.isArray(res?.payments) ? res.payments : Array.isArray(res) ? res : [];
      setPayments(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [activeDateRange.startDate, activeDateRange.endDate, paymentMethod]);

  // Fetch whenever active date boundaries or payment method change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchCustomers();
    fetchCompany();
  }, []);

  // Reset pagination to page 1 whenever filters change
  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
    setCurrentPage(1);
  };

  const handleQuickNChange = (n) => {
    setNMonths(n);
    setCustomNInput(String(n));
    setCurrentPage(1);
  };

  const handleCustomNSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(customNInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setNMonths(parsed);
      setCurrentPage(1);
    }
  };

  const handleMonthYearChange = (year, monthIdx) => {
    setSelectedYear(year);
    setSelectedMonth(monthIdx);
    setCurrentPage(1);
  };

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    setCurrentPage(1);
  };

  const handleReceivePayment = async (e) => {
    e.preventDefault();
    try {
      setReceiving(true);
      await service.receivePayment({
        customerId:    receiveForm.customerId,
        amount:        Number(receiveForm.amount),
        paymentMethod: receiveForm.paymentMethod,
        note:          receiveForm.note,
      });
      await fetchPayments();
      await fetchCustomers();
      setShowReceiveModal(false);
      setReceiveForm({ customerId: '', amount: '', paymentMethod: 'Cash', note: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to receive payment');
    } finally {
      setReceiving(false);
    }
  };

  // Group raw payments into payment events
  const groups = useMemo(() => groupPayments(payments), [payments]);

  // Overall stats for the filtered period
  const totalAmt  = useMemo(() => groups.reduce((s, g) => s + g.totalAmount, 0), [groups]);
  const cashAmt   = useMemo(() => groups.filter(g => g.paymentMethod === 'Cash').reduce((s, g) => s + g.totalAmount, 0), [groups]);
  const onlineAmt = useMemo(() => groups.filter(g => g.paymentMethod === 'Online').reduce((s, g) => s + g.totalAmount, 0), [groups]);

  // Pagination calculation (25 payment events per page)
  const totalItems  = groups.length;
  const totalPages  = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedGroups = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return groups.slice(startIndex, startIndex + PAGE_SIZE);
  }, [groups, safeCurrentPage]);

  // Year choices for Option B (current year down to 4 years back)
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Descriptive text for the currently active filter badge
  const filterDescription = useMemo(() => {
    if (filterMode === 'lastN') {
      const label = nMonths === 1 ? 'Last 1 Month' : nMonths === 2 ? 'Last 2 Months' : `Last ${nMonths} Months`;
      return `${label} (${fmtDate(activeDateRange.startDate)} – ${fmtDate(activeDateRange.endDate)})`;
    } else {
      const monthName = MONTH_NAMES[selectedMonth];
      const isCur = currentYear === selectedYear && currentMonthIdx === selectedMonth;
      return `${monthName} ${selectedYear}${isCur ? ' (In Progress)' : ''} (${fmtDate(activeDateRange.startDate)} – ${fmtDate(activeDateRange.endDate)})`;
    }
  }, [filterMode, nMonths, selectedMonth, selectedYear, activeDateRange, currentYear, currentMonthIdx]);

  // PDF Export: Exports matching payments (supports exporting current page only or all pages)
  const handleExportPDF = async (exportMode = 'page') => {
    try {
      setExportingPdf(true);
      const isPageMode = exportMode === 'page' && totalPages > 1;
      const targetEvents = isPageMode ? paginatedGroups : groups;

      const periodLabel = filterMode === 'lastN'
        ? `last_${nMonths}_months`
        : `${MONTH_NAMES[selectedMonth]}_${selectedYear}`.toLowerCase();
      const pageTag = isPageMode ? `_page_${safeCurrentPage}_of_${totalPages}` : `_all_${groups.length}`;
      const filename = `payments_${periodLabel}${pageTag}_${activeDateRange.startDate}_to_${activeDateRange.endDate}.pdf`;

      generatePaymentsPDFClient({
        paymentEvents: targetEvents,
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        filterDescription,
        company,
        filename,
        currentPage: safeCurrentPage,
        totalPages,
        isCurrentPageOnly: isPageMode,
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Excel Export: Exports all payments matching the filter
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const params = {
        startDate: activeDateRange.startDate,
        endDate:   activeDateRange.endDate,
        limit:     10000,
      };
      if (paymentMethod) params.paymentMethod = paymentMethod;

      const blob = await service.exportPayments(params);
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `payments_${activeDateRange.startDate}_to_${activeDateRange.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <main className="p-3 sm:p-6 min-h-[calc(100vh-4rem)] overflow-x-auto bg-gray-50/50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Top Header & Actions ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Track and reconcile all received payments with 25 payments per page
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setShowReceiveModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Receive Payment
            </button>

            {/* PDF Export Button (Supports Current Page or All Pages) */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <button
                  onClick={() => handleExportPDF('page')}
                  disabled={exportingPdf || loading || groups.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  title={`Export Page ${safeCurrentPage} of ${totalPages} (${paginatedGroups.length} payments) to PDF`}
                >
                  {exportingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Exporting…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <span>Export Page {safeCurrentPage} PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExportPDF('all')}
                  disabled={exportingPdf || loading || groups.length === 0}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
                  title={`Export All ${totalItems} payments across all ${totalPages} pages to PDF`}
                >
                  All ({totalItems})
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleExportPDF('all')}
                disabled={exportingPdf || loading || groups.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Export matching payments to PDF"
              >
                {exportingPdf ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    <span>Exporting PDF…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || loading || groups.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Export all matching payments for this period to Excel"
            >
              {exportingExcel ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  <span>Exporting Excel…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span>Export Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast / Notification Banner */}
        {successToast && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-between text-sm shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">✓</span>
              <span className="font-medium">{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="font-bold text-lg hover:opacity-75">×</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="font-bold text-lg hover:text-red-900">×</button>
          </div>
        )}

        {/* ── Redesigned Filter Panel ─────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filter Header & Mode Switcher */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                Payment Date Filter
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Choose between a rolling months duration or a specific calendar month
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-xl text-xs sm:text-sm font-medium">
              <button
                type="button"
                onClick={() => handleFilterModeChange('lastN')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  filterMode === 'lastN'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Last N Months
              </button>

              <button
                type="button"
                onClick={() => handleFilterModeChange('specificMonth')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                  filterMode === 'specificMonth'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Specific Past Month
              </button>
            </div>
          </div>

          {/* Filter Body */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* OPTION A: Last N Months Controls */}
            {filterMode === 'lastN' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Quick Periods & Custom Duration
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Calculated from today back to the selected month
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Quick Preset Buttons */}
                  <button
                    type="button"
                    onClick={() => handleQuickNChange(1)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      nMonths === 1
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    Last 1 Month
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNChange(2)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                      nMonths === 2
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    Last 2 Months
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNChange(3)}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                      nMonths === 3
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                    }`}
                  >
                    Last 3 Months
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNChange(6)}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                      nMonths === 6
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                    }`}
                  >
                    Last 6 Months
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickNChange(12)}
                    className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all ${
                      nMonths === 12
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                    }`}
                  >
                    Last 12 Months (1 Year)
                  </button>

                  {/* Custom Number Input Form */}
                  <form onSubmit={handleCustomNSubmit} className="flex items-center gap-1.5 ml-auto">
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={customNInput}
                        onChange={(e) => setCustomNInput(e.target.value)}
                        placeholder="N"
                        className="w-20 px-2.5 py-1.5 text-sm text-center font-semibold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">months</span>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      Set
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* OPTION B: Specific Calendar Month Controls */}
            {filterMode === 'specificMonth' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                    Select Calendar Month & Year
                  </label>
                  {currentYear === selectedYear && currentMonthIdx === selectedMonth && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"/>
                      Current month (incomplete) — showing payments recorded so far
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Month Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Calendar Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthYearChange(selectedYear, parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx}>
                          {name} {currentYear === selectedYear && currentMonthIdx === idx ? '• Current Month' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => handleMonthYearChange(parseInt(e.target.value, 10), selectedMonth)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Shortcut Buttons for Recent Months */}
                  <div className="sm:col-span-2 flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleMonthYearChange(currentYear, currentMonthIdx)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                        selectedYear === currentYear && selectedMonth === currentMonthIdx
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300 font-semibold'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      This Month ({MONTH_NAMES[currentMonthIdx]})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const prevDate = new Date(currentYear, currentMonthIdx - 1, 1);
                        handleMonthYearChange(prevDate.getFullYear(), prevDate.getMonth());
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                        (currentMonthIdx === 0 ? selectedYear === currentYear - 1 && selectedMonth === 11 : selectedYear === currentYear && selectedMonth === currentMonthIdx - 1)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-300 font-semibold'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Last Month ({MONTH_NAMES[(currentMonthIdx + 11) % 12]})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Secondary Row: Payment Method & Active Date Range Banner */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Payment Method Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Method:</span>
                <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium">
                  {[
                    { key: '', label: 'All Methods' },
                    { key: 'Cash', label: 'Cash Only' },
                    { key: 'Online', label: 'Online Only' },
                  ].map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleMethodChange(m.key)}
                      className={`px-3 py-1 rounded-md transition-all ${
                        paymentMethod === m.key
                          ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filter Period Badge */}
              <div className="flex items-center gap-2 bg-blue-50/80 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 text-xs">
                <span className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Active Filter:
                </span>
                <span className="text-blue-700 dark:text-blue-200 font-medium truncate">
                  {filterDescription}
                </span>
                {paymentMethod && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-200/60 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 font-semibold text-[11px]">
                    {paymentMethod}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filtered Period Stats Summary ──────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Matching Payments',
              value: totalItems,
              sub: `25 per page • ${totalPages} page${totalPages !== 1 ? 's' : ''}`,
              color: 'blue',
              icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
            },
            {
              label: 'Total Received',
              value: `PKR ${fmt(totalAmt)}`,
              sub: 'Across matching period',
              color: 'emerald',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            },
            {
              label: 'Cash Received',
              value: `PKR ${fmt(cashAmt)}`,
              sub: `${groups.filter(g => g.paymentMethod === 'Cash').length} payments`,
              color: 'amber',
              icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2'
            },
            {
              label: 'Online Received',
              value: `PKR ${fmt(onlineAmt)}`,
              sub: `${groups.filter(g => g.paymentMethod === 'Online').length} payments`,
              color: 'violet',
              icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
            },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg sm:text-2xl font-bold mt-1 text-${color}-600 dark:text-${color}-400`}>{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Payments List (Paginated at 25 payments per page) ──────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header with Page Indicator */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Payment Events</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {totalItems} total
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Displaying 25 payments per page • Page {safeCurrentPage} of {totalPages}
              </p>
            </div>

            {totalItems > 0 && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, totalItems)}
                </span>
                {' '}of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
              </div>
            )}
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading payments for {filterDescription}…</p>
            </div>
          ) : totalItems === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">No payments found</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                No payments were recorded in the selected period ({filterDescription}). Try choosing another month or a wider period.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedGroups.map((g) => (
                <div key={g.batchId} className="transition-colors">
                  {/* Payment Row */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                    onClick={() => setExpandedBatch(expandedBatch === g.batchId ? null : g.batchId)}
                  >
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                      {/* Customer */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Customer</p>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {g.customer?.name || 'Walk-in Customer'}
                        </p>
                        {g.customer?.phone && (
                          <p className="text-[11px] text-gray-400 truncate">{g.customer.phone}</p>
                        )}
                      </div>

                      {/* Total Received */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Amount Received</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          PKR {fmt(g.totalAmount)}
                        </p>
                      </div>

                      {/* Method */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Method</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          g.paymentMethod === 'Cash'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {g.paymentMethod}
                        </span>
                      </div>

                      {/* Date & Time */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date & Time</p>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{fmtDate(g.date)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{fmtTime(g.date)}</p>
                      </div>

                      {/* Received By */}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Received By</p>
                        <p className="text-gray-800 dark:text-gray-200">{g.receivedBy?.name || 'Admin'}</p>
                        {g.note && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]" title={g.note}>
                            "{g.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Area: Details Button & Expand Trigger */}
                    <div
                      className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700/60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/payment-history/${g.batchId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/80 transition-all shadow-2xs hover:scale-105 active:scale-95"
                        title="View full payment detail page with edit and delete actions"
                      >
                        <span>Details</span>
                        <span className="text-[11px]">→</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setExpandedBatch(expandedBatch === g.batchId ? null : g.batchId)}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        title="Toggle sales breakdown"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedBatch === g.batchId ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Sale allocations fulfilled by this payment */}
                  {expandedBatch === g.batchId && (
                    <div className="bg-gray-50/80 dark:bg-gray-900/60 px-5 sm:px-6 py-3.5 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sales fulfilled by this payment ({g.allocations.length} sales):
                        </p>
                        <Link
                          to={`/payment-history/${g.batchId}`}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Open Full Payment Detail Page →
                        </Link>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase border-b dark:border-gray-800">
                              <th className="text-left pb-2 font-medium">Invoice ID</th>
                              <th className="text-right pb-2 font-medium">Applied Amount</th>
                              <th className="text-right pb-2 font-medium">Due Before</th>
                              <th className="text-right pb-2 font-medium">Due After</th>
                              <th className="text-right pb-2 font-medium">Direct Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {g.allocations.map((a) => {
                              const saleId = (a.sale?._id || a.sale)?.toString();
                              const invNo = a.sale?.invoiceNumber || (saleId ? `INV-${saleId.slice(-6).toUpperCase()}` : 'INV-—');
                              return (
                                <tr key={a._id} className="hover:bg-gray-100/60 dark:hover:bg-gray-800/40">
                                  <td className="py-2 font-mono font-medium">
                                    <Link
                                      to={`/sales/${saleId}`}
                                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-bold"
                                      title={`Navigate to sale ${invNo}`}
                                    >
                                      <span>{invNo}</span>
                                      <span className="text-[10px]">↗</span>
                                    </Link>
                                  </td>
                                  <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                    PKR {fmt(a.appliedAmount)}
                                  </td>
                                  <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                                    PKR {fmt(a.saleDueBefore)}
                                  </td>
                                  <td className={`py-2 text-right font-semibold ${a.saleDueAfter > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    PKR {fmt(a.saleDueAfter)}
                                  </td>
                                  <td className="py-2 text-right">
                                    <Link
                                      to={`/sales/${saleId}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
                                    >
                                      <span>View Sale</span>
                                      <span>↗</span>
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Pagination Controls (25 Payments Per Page) ───────────── */}
          {totalItems > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {totalPages > 1 && (
                  <button
                    onClick={() => handleExportPDF('page')}
                    disabled={exportingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                    title={`Export Page ${safeCurrentPage} of ${totalPages} to PDF`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <span>Export Page {safeCurrentPage} PDF</span>
                  </button>
                )}
              </div>
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={PAGE_SIZE}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Receive Payment Modal ────────────────────────────────────── */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Receive Payment</h2>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleReceivePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer *</label>
                <select
                  required
                  value={receiveForm.customerId}
                  onChange={e => setReceiveForm(p => ({ ...p, customerId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select customer with due balance…</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — Due: PKR {fmt(c.dueRemainings)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiveForm.amount}
                  onChange={e => setReceiveForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method *</label>
                <select
                  required
                  value={receiveForm.paymentMethod}
                  onChange={e => setReceiveForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={receiveForm.note}
                  onChange={e => setReceiveForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Optional note…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {receiving ? 'Processing…' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}