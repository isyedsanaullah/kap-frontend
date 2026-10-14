// src/pages/sales/SaleDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import service from '../../api/service';
import api from '../../api/api';

const fmt    = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';


/* ── Main Component ─────────────────────────────────────────────── */
export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale,        setSale]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await service.getSaleById(id);
        setSale(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load sale');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this sale? Stock will be restored.')) return;
    try {
      setDeleting(true);
      await service.deleteSale(id);
      navigate('/sales');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete sale');
      setDeleting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      // Use the api axios instance so the JWT interceptor attaches Authorization header
      const response = await api.get(`/invoices/sale/${id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `invoice-${id.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button onClick={() => navigate('/sales')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back to Sales</button>
    </div>
  );

  if (!sale) return null;

  const totalAmount = Number(sale.totalAmount || 0);
  const paidAmount  = Number(sale.paidAmount  || 0);
  const dueAmount   = Math.max(totalAmount - paidAmount, 0);
  const isPaid      = dueAmount === 0;
  const invoiceNo   = `INV-${sale._id?.toString().slice(-6).toUpperCase()}`;

  return (
    <main className="p-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/sales')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sale Detail</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{invoiceNo} · {fmtDate(sale.createdAt)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadInvoice} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {downloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              )}
              {downloading ? 'Generating…' : 'Download Invoice'}
            </button>

            <button onClick={() => navigate(`/sales/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Update Sale
            </button>

            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              )}
              {deleting ? 'Deleting…' : 'Delete Sale'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: main info */}
          <div className="md:col-span-2 space-y-6">

            {/* Customer Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer</h2>
                {sale.customer?._id && (
                  <button onClick={() => navigate(`/customers/${sale.customer._id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    View Profile →
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {[
                  ['Name',    sale.customer?.name],
                  ['Phone',   sale.customer?.phone],
                  ['Address', sale.customer?.address],
                  ['Company', sale.customer?.companyName],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Products */}
            {sale.myProducts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inventory Products</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">Product</th>
                        <th className="pb-2 font-medium text-right">Qty</th>
                        <th className="pb-2 font-medium text-right">Sale Price</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {sale.myProducts.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-900 dark:text-white">{item.product?.name || 'Unknown'}</td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">{item.quantitySold}</td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">PKR {fmt(item.salePrice)}</td>
                          <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">PKR {fmt(item.salePrice * item.quantitySold)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Custom Products */}
            {sale.customProducts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Products</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2 font-medium text-right">Qty</th>
                        <th className="pb-2 font-medium text-right">Sale Price</th>
                        <th className="pb-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {sale.customProducts.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-900 dark:text-white">{item.name}</td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">{item.quantitySold}</td>
                          <td className="py-2 text-right text-gray-700 dark:text-gray-300">PKR {fmt(item.salePrice)}</td>
                          <td className="py-2 text-right font-semibold text-gray-900 dark:text-white">PKR {fmt(item.salePrice * item.quantitySold)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h2>
              <div className="space-y-3">
                {[
                  ['Method',    sale.paymentMethod],
                  ['Created By', sale.createdBy?.name],
                  ['Sale Date',  fmtDate(sale.createdAt)],
                  ['Due Date',   fmtDate(sale.lastDueDate)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value || '—'}</span>
                  </div>
                ))}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">PKR {fmt(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Paid</span>
                    <span className="font-bold text-green-600 dark:text-green-400">PKR {fmt(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Due</span>
                    <span className={`font-bold ${dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      PKR {fmt(dueAmount)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                           : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {isPaid ? 'Fully Paid' : dueAmount < totalAmount ? 'Partial' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {sale.customer?._id && (
                  <button onClick={() => navigate(`/customers/${sale.customer._id}`)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    View Customer Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}