// src/pages/products/Products.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import Pagination from '../../components/ui/Pagination';
import service from '../../api/service.js';

const PAGE_SIZE = 24;

const Products = () => {
  const navigate = useNavigate();
  const [allProducts,  setAllProducts]  = useState([]);
  const [products,     setProducts]     = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [exporting,    setExporting]    = useState(false);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [stockFilter,  setStockFilter]  = useState('all'); // all | low | out

  /* ── Fetch ALL products once ─────────────────────────────── */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await service.getProducts({ page: 1, limit: 5000 });
      const list = Array.isArray(res?.products) ? res.products : Array.isArray(res) ? res : [];
      setAllProducts(list);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  /* ── Client-side search + stock filter + pagination ── */
  useEffect(() => {
    let list = allProducts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.dimensions?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (stockFilter === 'low') list = list.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5);
    if (stockFilter === 'out') list = list.filter(p => (p.stock || 0) === 0);

    setTotalProducts(list.length);
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    setTotalPages(pages);
    const safePage = Math.min(currentPage, pages);
    setCurrentPage(safePage);
    setProducts(list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE));
  }, [allProducts, search, stockFilter, currentPage]);

  /* ── Export products ──────────────────────────────────────── */
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await service.exportProductsExcel();
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  return (
    <div className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Product Inventory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {loading ? 'Loading…' : `${totalProducts} products · page ${currentPage} of ${totalPages}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/products/new')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
              <span className="sm:hidden">↓</span>
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
            </div>
            <input
              placeholder="Search name, category, dimensions, description…"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0">
            {[{ v: 'all', l: 'All' }, { v: 'low', l: 'Low' }, { v: 'out', l: 'Out' }].map(f => (
              <button key={f.v} onClick={() => { setStockFilter(f.v); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  stockFilter === f.v
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Loading spinner */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding your first product.</p>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                pageSize={PAGE_SIZE}
                onPageChange={p => setCurrentPage(p)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;