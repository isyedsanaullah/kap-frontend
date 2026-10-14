// src/pages/stock/Stock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import service from '../../api/service';
import AddStockModal from '../products/AddStockModal';
import Pagination from '../../components/ui/Pagination';

const PAGE_SIZE = 20;
const LOW_THRESHOLD = 5;

const fmt = (v) => (Number(v) || 0).toLocaleString();

const stockBadge = (stock) => {
  const s = Number(stock) || 0;
  if (s === 0) return { label: 'Out',  cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',       dot: 'bg-red-500' };
  if (s < LOW_THRESHOLD) return { label: 'Low',  cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' };
  return { label: 'OK', cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' };
};

const TABS = [
  { key: 'out',  label: 'Out of Stock', color: 'from-red-500 to-rose-600' },
  { key: 'low',  label: 'Low Stock',    color: 'from-orange-500 to-amber-600' },
  { key: 'all',  label: 'All Stock',    color: 'from-blue-500 to-indigo-600' },
];

export default function Stock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [tab,         setTab]         = useState(searchParams.get('filter') === 'low' ? 'low' : 'out');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected,    setSelected]    = useState(null);
  const [showModal,   setShowModal]   = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res  = await service.getProducts({ limit: 5000 });
      const list = Array.isArray(res?.products) ? res.products : Array.isArray(res) ? res : [];
      setProducts(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* Filter by tab + search */
  const filtered = products.filter(p => {
    const s = Number(p.stock) || 0;
    if (tab === 'out' && s !== 0) return false;
    if (tab === 'low' && (s === 0 || s >= LOW_THRESHOLD)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged        = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const outCount     = products.filter(p => Number(p.stock) === 0).length;
  const lowCount     = products.filter(p => { const s = Number(p.stock) || 0; return s > 0 && s < LOW_THRESHOLD; }).length;
  const totalValue   = products.reduce((s, p) => s + (p.stock || 0) * (p.buyPrice || 0), 0);

  const changeTab = (t) => { setTab(t); setCurrentPage(1); };

  return (
    <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor and restock your inventory</p>
          </div>
          <button onClick={() => navigate('/products/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all">
            + Add New Product
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Products',  value: products.length,        color: 'from-blue-500 to-blue-600',    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { label: 'Out of Stock',    value: outCount,               color: 'from-red-500 to-rose-600',     icon: 'M6 18L18 6M6 6l12 12' },
            { label: 'Low Stock',       value: lowCount,               color: 'from-orange-500 to-amber-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { label: 'Inventory Value', value: `PKR ${fmt(totalValue)}`, color: 'from-emerald-500 to-teal-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(c => (
            <div key={c.label} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-white shadow-md`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">{c.label}</p>
                  <p className="text-2xl font-bold mt-1">{c.value}</p>
                </div>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={c.icon}/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => changeTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key
                    ? `bg-gradient-to-r ${t.color} text-white shadow-sm`
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {t.label}
                <span className="ml-1.5 text-xs opacity-80">
                  ({t.key === 'out' ? outCount : t.key === 'low' ? lowCount : products.length})
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input placeholder="Search by name, category..." value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"/>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-xl">
            {error} <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No products in this category.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {['Product', 'Category', 'Stock', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paged.map(p => {
                      const badge = stockBadge(p.stock);
                      return (
                        <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => navigate(`/products/${p._id}`)}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-sm text-left max-w-[200px] truncate block">
                              {p.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.category || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-lg font-bold ${Number(p.stock) === 0 ? 'text-red-600 dark:text-red-400' : Number(p.stock) < LOW_THRESHOLD ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
                              {p.stock ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}/>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setSelected(p); setShowModal(true); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all shadow-sm hover:shadow-md">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showModal && selected && (
        <AddStockModal
          product={selected}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onStockAdded={async () => { setShowModal(false); setSelected(null); await load(); }}
        />
      )}
    </main>
  );
}
