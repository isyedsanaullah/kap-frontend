// src/pages/payments/PaymentDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import service from '../../api/service';
import { useAuth } from '../../context/AuthContext';
import { generateSinglePaymentPDF } from '../../utils/paymentPdfExport';

const fmt = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    note: '',
    paymentDate: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchPaymentDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await service.getPaymentBatch(id);
      setBatch(res);
      setEditForm({
        amount: res.totalAmount || '',
        paymentMethod: res.paymentMethod || 'Cash',
        note: res.note || '',
        paymentDate: res.date ? new Date(res.date).toISOString().slice(0, 16) : '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment detail');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCompany = async () => {
    try {
      const res = await service.getCompany();
      setCompany(res?.company || res);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchPaymentDetail();
    fetchCompany();
  }, [fetchPaymentDetail]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Edit Payment
  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    const amt = Number(editForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    try {
      setSavingEdit(true);
      setError(null);
      await service.updatePaymentBatch(id, {
        amount: amt,
        paymentMethod: editForm.paymentMethod,
        note: editForm.note,
        paymentDate: editForm.paymentDate ? new Date(editForm.paymentDate) : undefined,
      });

      setShowEditModal(false);
      showToast('Payment updated successfully! Sales deductions were re-calculated.');
      await fetchPaymentDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Payment
  const handleDeletePayment = async () => {
    try {
      setDeleting(true);
      setError(null);
      await service.deletePaymentBatch(id);
      setShowDeleteModal(false);
      navigate('/payment-history', {
        state: { message: 'Payment deleted and deductions from sales were reverted successfully.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // Handle PDF Export
  const handleExportPDF = () => {
    try {
      setExportingPdf(true);
      const custName = batch?.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'customer';
      const filename = `payment_receipt_${custName}_${(batch?.batchId || id).slice(-6)}.pdf`;
      generateSinglePaymentPDF({
        batch,
        company,
        filename,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading payment details…</p>
        </div>
      </main>
    );
  }

  if (error && !batch) {
    return (
      <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-red-200 dark:border-red-800 text-center max-w-md w-full shadow-sm">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Payment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/payment-history')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-colors"
          >
            ← Back to Payment History
          </button>
        </div>
      </main>
    );
  }

  const allocations = batch?.allocations || [];
  const clearedSalesCount = allocations.filter((a) => (a.saleDueAfter || 0) <= 0).length;
  const partialSalesCount = allocations.length - clearedSalesCount;

  return (
    <main className="p-3 sm:p-6 min-h-[calc(100vh-4rem)] bg-gray-50/50 dark:bg-slate-950 overflow-x-auto">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Toast Notification Banner ─────────────────────────────── */}
        {notification && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center justify-between text-sm shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">✓</span>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="font-bold text-lg hover:opacity-75">×</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl flex items-center justify-between text-sm shadow-sm">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-lg hover:text-red-900">×</button>
          </div>
        )}

        {/* ── Top Header & Actions ───────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/payment-history')}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              title="Back to Payment History"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Recorded
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                Batch ID: {batch?.batchId || id}
              </p>
            </div>
          </div>

          {/* Action Buttons: Export PDF, Edit, Delete */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export Receipt PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Download payment receipt voucher as PDF"
            >
              {exportingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Export Receipt (PDF)</span>
                </>
              )}
            </button>

            {/* Edit Payment */}
            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span>Edit Payment</span>
              </button>
            )}

            {/* Delete Payment */}
            {isAdmin && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>Delete Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Payment Information Cards Grid (User-Specified Format) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Customer Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Customer
              </span>
              {batch?.customer?._id && (
                <Link
                  to={`/customers/${batch.customer._id}`}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View Profile ↗
                </Link>
              )}
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {batch?.customer?.name || 'Walk-in Customer'}
            </p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              {batch?.customer?.phone || 'No phone number'}
            </p>
          </div>

          {/* Amount Received Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-gray-800 dark:to-gray-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Amount Received
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              PKR {fmt(batch?.totalAmount)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Applied across {allocations.length} sales ({clearedSalesCount} fully cleared)
            </p>
          </div>

          {/* Method Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Method
            </span>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                batch?.paymentMethod === 'Cash'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${batch?.paymentMethod === 'Cash' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                {batch?.paymentMethod || 'Cash'}
              </span>
            </div>
          </div>

          {/* Date & Time Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Date & Time
            </span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {fmtDate(batch?.date)}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {fmtTime(batch?.date)}
            </p>
          </div>

          {/* Received By Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Received By
            </span>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {batch?.receivedBy?.name || 'Administrator'}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              {batch?.receivedBy?.role || 'Staff'}
            </span>
          </div>

          {/* Note / Reference Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Note / Reference
            </span>
            <p className="text-base font-medium text-gray-800 dark:text-gray-200 mt-1 italic">
              {batch?.note ? `"${batch.note}"` : <span className="not-italic text-gray-400">—</span>}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Total Sales Fulfilled: <span className="font-semibold text-gray-700 dark:text-gray-300">{allocations.length} sales</span>
            </p>
          </div>
        </div>

        {/* ── Sales Fulfilled by this Payment Table ─────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Sales fulfilled by this payment:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {allocations.length} sales
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Every sale where funds were applied. Click 'View Sale' or the Invoice ID to open each sale invoice directly.
              </p>
            </div>

            {/* Quick summary counters */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {clearedSalesCount} Cleared
              </span>
              {partialSalesCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {partialSalesCount} Partial
                </span>
              )}
            </div>
          </div>

          {allocations.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              No sales were linked with this payment record.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/70 dark:bg-gray-800/80 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Invoice ID</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Applied Amount</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Due Before</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Due After</th>
                    <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Direct Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 font-medium">
                  {allocations.map((a) => {
                    const saleId = a.sale?._id || a.sale;
                    const saleIdStr = saleId?.toString() || '';
                    const invNo = a.sale?.invoiceNumber || (saleIdStr ? `INV-${saleIdStr.slice(-6).toUpperCase()}` : 'INV-UNKNOWN');
                    const isFullyCleared = (a.saleDueAfter || 0) <= 0;

                    return (
                      <tr
                        key={a._id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        {/* Invoice ID with direct clickable link */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link
                            to={`/sales/${saleIdStr}`}
                            className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1.5"
                            title={`Navigate to invoice ${invNo}`}
                          >
                            <span>{invNo}</span>
                            <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                            </svg>
                          </Link>
                          {a.sale?.createdAt && (
                            <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                              {fmtDate(a.sale.createdAt)}
                            </p>
                          )}
                        </td>

                        {/* Applied Amount */}
                        <td className="px-4 py-4 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                          PKR {fmt(a.appliedAmount)}
                        </td>

                        {/* Due Before */}
                        <td className="px-4 py-4 text-right whitespace-nowrap text-gray-700 dark:text-gray-300">
                          PKR {fmt(a.saleDueBefore)}
                        </td>

                        {/* Due After */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <span className={`font-bold ${
                            isFullyCleared
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            PKR {fmt(a.saleDueAfter)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {isFullyCleared ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                              ✓ Cleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                              PKR {fmt(a.saleDueAfter)} Due
                            </span>
                          )}
                        </td>

                        {/* Direct Page Navigation Button */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/${saleIdStr}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200/80 dark:border-blue-800/80 transition-all shadow-2xs hover:scale-105 active:scale-95"
                            title={`Open sale ${invNo}`}
                          >
                            <span>View Sale</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50/80 dark:bg-gray-800/90 font-bold border-t border-gray-200 dark:border-gray-700 text-xs sm:text-sm">
                  <tr>
                    <td className="px-5 py-3.5 text-gray-900 dark:text-white">
                      TOTAL APPLIED ({allocations.length} SALES)
                    </td>
                    <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                      PKR {fmt(batch?.totalAmount)}
                    </td>
                    <td colSpan={4} className="px-4 py-3.5 text-right text-gray-500 dark:text-gray-400 font-normal">
                      {clearedSalesCount} sales completely cleared of debt
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Payment Modal ────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Payment</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Update payment details or amount
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              {/* Notice Banner */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <span>
                  <strong>Note:</strong> If you change the payment amount, all existing deductions from old invoices will be reverted first, and the new amount will be re-allocated across this customer's sales in chronological order.
                </span>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Amount Received (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-xs">
                    PKR
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full pl-13 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 197600"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Payment Method *
                </label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Payment Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editForm.paymentDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, paymentDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Note / Reference */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={editForm.note}
                  onChange={(e) => setEditForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 10-10-26 or check number"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Payment Confirmation Modal ────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Payment?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this payment of{' '}
                <strong className="text-red-600 font-bold">PKR {fmt(batch?.totalAmount)}</strong> received from{' '}
                <strong>"{batch?.customer?.name}"</strong>?
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs text-left">
                <strong>Critical Effect:</strong> All deductions applied to the{' '}
                <strong>{allocations.length} sales</strong> fulfilled by this payment will be completely reverted.
                Those sales will become <strong>uncleared and due again</strong>.
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePayment}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <span>Yes, Delete & Revert</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}