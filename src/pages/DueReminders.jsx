// src/pages/DueReminders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import service from '../api/service';
import Pagination from '../components/ui/Pagination';

const fmt   = (v)  => (Number(v) || 0).toLocaleString();
const PAGE_SIZE = 12;

const urgency = (lastDueDate) => {
  if (!lastDueDate) return { label: 'No Date', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300', days: null, group: 'no-date' };
  const diff = Math.ceil((new Date(lastDueDate) - new Date()) / 86400000);
  if (diff < 0)    return { label: `Overdue (${Math.abs(diff)}d)`, cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',       days: diff, group: 'overdue'  };
  if (diff <= 2)   return { label: 'Coming Due',                   cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', days: diff, group: 'coming'   };
  return                  { label: `Due in ${diff}d`,              cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     days: diff, group: 'upcoming' };
};

export default function DueReminders() {
  const navigate = useNavigate();
  const [sales,       setSales]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('overdue'); // overdue | amount | date
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res  = await service.getSales();
        const list = Array.isArray(res) ? res : Array.isArray(res?.sales) ? res.sales : [];
        // Only show sales with pending dues
        setSales(list.filter(s => (Number(s.totalAmount) - Number(s.paidAmount)) > 0));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load due reminders');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = sales.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.customer?.name?.toLowerCase().includes(q) ||
      s.customer?.phone?.includes(q) ||
      s.invoiceNumber?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const dueA = Number(a.totalAmount) - Number(a.paidAmount);
    const dueB = Number(b.totalAmount) - Number(b.paidAmount);
    if (sortBy === 'amount') return dueB - dueA;
    if (sortBy === 'date')   return new Date(a.lastDueDate || 0) - new Date(b.lastDueDate || 0);
    // overdue: most overdue first
    const daysA = a.lastDueDate ? Math.ceil((new Date(a.lastDueDate) - new Date()) / 86400000) : 999;
    const daysB = b.lastDueDate ? Math.ceil((new Date(b.lastDueDate) - new Date()) / 86400000) : 999;
    return daysA - daysB;
  });

  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged       = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalDue    = filtered.reduce((s, sale) => s + (Number(sale.totalAmount) - Number(sale.paidAmount)), 0);
  const overdueCount = filtered.filter(s => s.lastDueDate && new Date(s.lastDueDate) < new Date()).length;

  return (
    <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Due Reminders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all pending payments and overdue sales</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Sales',  value: filtered.length,        color: 'from-blue-500 to-blue-600',    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Overdue',        value: overdueCount,           color: 'from-red-500 to-rose-600',     icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { label: 'Total Due',      value: `PKR ${fmt(totalDue)}`, color: 'from-orange-500 to-amber-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(c => (
            <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-md`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <svg className="w-9 h-9 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={c.icon}/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input placeholder="Search customer name, phone, invoice..." value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"/>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="overdue">Most Overdue First</option>
            <option value="amount">Highest Amount First</option>
            <option value="date">Due Date (Ascending)</option>
          </select>
        </div>

        {/* Error */}
        {error && <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-xl">{error}</div>}

        {/* Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <svg className="mx-auto w-12 h-12 text-emerald-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-gray-900 dark:text-white font-semibold">All clear!</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No pending dues found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paged.map(sale => {
                const due  = Number(sale.totalAmount) - Number(sale.paidAmount);
                const urg  = urgency(sale.lastDueDate);
                return (
                  <div key={sale._id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${urg.group === 'overdue' ? 'border-red-200 dark:border-red-800' : urg.group === 'coming' ? 'border-amber-200 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700'}`}>

                    {/* Top stripe */}
                    <div className={`h-1 ${urg.group === 'overdue' ? 'bg-red-500' : urg.group === 'coming' ? 'bg-amber-500' : 'bg-blue-400'}`}/>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {sale.customer?.name || 'Cash Sale'}
                          </p>
                          {sale.customer?.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sale.customer.phone}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${urg.cls}`}>
                          {urg.label}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Total</span>
                          <span className="font-medium text-gray-900 dark:text-white">PKR {fmt(sale.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Paid</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">PKR {fmt(sale.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t border-gray-100 dark:border-gray-700 pt-2">
                          <span className="text-gray-700 dark:text-gray-300">Due</span>
                          <span className="text-red-600 dark:text-red-400 text-base">PKR {fmt(due)}</span>
                        </div>
                      </div>

                      {sale.lastDueDate && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Due: {new Date(sale.lastDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}

                      <button onClick={() => navigate(`/sales/${sale._id}`)}
                        className="mt-4 w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors">
                        View Sale →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sorted.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </main>
  );
}