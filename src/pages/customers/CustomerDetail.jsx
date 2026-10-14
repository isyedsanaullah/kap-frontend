// src/pages/customers/CustomerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import service from '../../api/service';
import Pagination from '../../components/ui/Pagination';
import CustomerReportModal from '../../components/CustomerReportModal';

const fmt     = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const PAGE_SIZE = 10;

const avatarColors = [
  'from-blue-500 to-blue-600','from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600','from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600','from-cyan-500 to-sky-600',
];
const getColor   = (n) => avatarColors[(n?.charCodeAt(0)||0) % avatarColors.length];
const getInitial = (n) => n ? n.charAt(0).toUpperCase() : '?';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [showReport, setShowReport] = useState(false);

  /* edit modal */
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name:'', phone:'', address:'', companyName:'' });
  const [saving,   setSaving]   = useState(false);
  const [editErr,  setEditErr]  = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await service.getCustomerById(id);
      setCustomer(data);
      setEditForm({ name: data.name||'', phone: data.phone||'', address: data.address||'', companyName: data.companyName||'' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${customer?.name}"? This cannot be undone.`)) return;
    try { setDeleting(true); await service.deleteCustomer(id); navigate('/customers'); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); setDeleting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setEditErr('Name is required');
    try {
      setSaving(true);
      await service.updateCustomer(id, editForm);
      await load();
      setShowEdit(false);
    } catch (err) { setEditErr(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error || !customer) return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
      <p className="text-red-500 dark:text-red-400">{error || 'Customer not found'}</p>
      <button onClick={() => navigate('/customers')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">← Back</button>
    </div>
  );

  const sales      = customer.sales || [];
  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const pagedSales = sales.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasDue     = (customer.totalDue || customer.dueRemainings || 0) > 0;

  const infoRows = [
    { icon:'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label:'Phone', val: customer.phone },
    { icon:'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label:'Company', val: customer.companyName },
    { icon:'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label:'Address', val: customer.address },
    { icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label:'Customer Since', val: fmtDate(customer.createdAt) },
  ].filter(r => r.val);

  return (
    <>
    <main className="p-3 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
            </svg>
            All Customers
          </button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Report
            </button>
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {deleting
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              }
              Delete
            </button>
          </div>
        </div>

        {/* ── Profile Card ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${getColor(customer.name)} rounded-2xl flex items-center justify-center shadow-lg shrink-0`}>
                <span className="text-white font-bold text-2xl sm:text-3xl">{getInitial(customer.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{customer.name}</h1>
                {customer.phone && <p className="text-blue-200 mt-0.5 text-sm">{customer.phone}</p>}
                {customer.companyName && <p className="text-blue-100 text-sm">{customer.companyName}</p>}
              </div>
              {hasDue && (
                <span className="px-3 py-1 bg-red-500/80 text-white text-xs font-semibold rounded-full">
                  Outstanding Due
                </span>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
            {[
              { label:'Total Sales',  val:`PKR ${fmt(customer.totalSales)}`,  color:'text-blue-600 dark:text-blue-400' },
              { label:'Total Paid',   val:`PKR ${fmt(customer.totalPaid)}`,   color:'text-emerald-600 dark:text-emerald-400' },
              { label:'Total Due',    val:`PKR ${fmt(customer.totalDue)}`,    color: hasDue ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
              { label:'Invoices',     val:`${customer.saleCount || sales.length}`, color:'text-violet-600 dark:text-violet-400' },
            ].map(s => (
              <div key={s.label} className="p-4 sm:p-5 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Info + Due Alert ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Contact Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Contact Details</h2>
            {infoRows.length > 0 ? (
              <div className="space-y-3">
                {infoRows.map(({ icon, label, val }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon}/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No additional contact information.</p>
            )}
          </div>

          {/* Due Alert */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h2>
            {hasDue ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">PKR {fmt(customer.totalDue)}</p>
                  </div>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Pending across {sales.filter(s => (s.dueAmount||0) > 0).length} sale(s).
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">All Clear</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">No outstanding payments.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sales History ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sales History</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{sales.length} sale(s)</span>
          </div>

          {sales.length === 0 ? (
            <div className="py-16 text-center text-gray-500 dark:text-gray-400 text-sm">No sales recorded yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {['Invoice','Date','Total','Paid','Due',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pagedSales.map(sale => {
                      const due  = sale.dueAmount || 0;
                      const d    = sale.createdAt ? new Date(sale.createdAt) : null;
                      const ddmm = d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` : '—';
                      return (
                        <tr key={sale._id}
                          onClick={() => navigate(`/sales/${sale._id}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">
                            {sale.invoiceNumber || `INV-${sale._id?.slice(-5).toUpperCase()}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{ddmm}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{fmt(sale.totalAmount)}</td>
                          <td className="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(sale.paidAmount)}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className={due > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400'}>
                              {fmt(due)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                  <Pagination currentPage={page} totalPages={totalPages} totalItems={sales.length} pageSize={PAGE_SIZE} onPageChange={setPage}/>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Customer</h2>
              <button onClick={() => { setShowEdit(false); setEditErr(null); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {editErr && <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{editErr}</div>}
              {[
                { name:'name',        label:'Name *',       required: true },
                { name:'phone',       label:'Phone' },
                { name:'address',     label:'Address' },
                { name:'companyName', label:'Company Name' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input value={editForm[f.name]} required={f.required}
                    onChange={e => setEditForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(false); setEditErr(null); }}
                  className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>

    {showReport && customer && (
      <CustomerReportModal customer={customer} onClose={() => setShowReport(false)} />
    )}
    </>
  );
}