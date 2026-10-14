// src/pages/products/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import service from '../../api/service';
import AddStockModal from './AddStockModal';
import { useOffline } from '../../context/OfflineContext';


const fmt = (v) => (Number(v) || 0).toLocaleString();

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product,   setProduct]  = useState(null);
  const [logs,      setLogs]     = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [error,     setError]    = useState(null);
  const [showStock, setShowStock] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const { isOnline, addDraft, DRAFT_TYPES } = useOffline();

  const load = async () => {
    try {
      setLoading(true);
      const [prod, stockLogs] = await Promise.all([
        service.getProductById(id),
        service.getStockLogs(id).catch(() => []),
      ]);
      setProduct(prod?.product || prod);
      const logList = Array.isArray(stockLogs?.logs) ? stockLogs.logs
                    : Array.isArray(stockLogs) ? stockLogs : [];
      setLogs(logList);
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    try {
      setDeleting(true);
      await service.deleteProduct(id);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product.');
      setDeleting(false);
    }
  };

  const stockStatus = (product) => {
    const s = Number(product?.stock) || 0;
    if (s === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
    if (s < 5)    return { label: 'Low Stock',    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
    return               { label: 'In Stock',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error || !product) return (
    <div className="p-6 text-center">
      <p className="text-red-500">{error || 'Product not found'}</p>
      <button onClick={() => navigate('/products')} className="mt-4 text-blue-600 hover:underline">← Back to Products</button>
    </div>
  );

  const status = stockStatus(product);
  const salePrice = Number(product.salePrice) || 0;
  const buyPrice  = Number(product.buyPrice)  || 0;
  const margin = (salePrice > 0 && buyPrice > 0)
    ? (((salePrice - buyPrice) / buyPrice) * 100).toFixed(1) + '%'
    : '—';

  return (
    <main className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back button */}
        <button onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
          Back to Products
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${status.cls}`}>
                  {status.label}
                </span>
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.category && <p className="text-blue-100 mt-1">{product.category}</p>}
                {product.dimensions && <p className="text-blue-100 text-sm">{product.dimensions}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowStock(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Stock
                </button>
                <button onClick={() => navigate(`/products/${id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-600/90 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {deleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 dark:divide-gray-700">
            {[
              { label: 'Current Stock',   value: `${fmt(product.stock)} units`,                          color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Buy Price',        value: `PKR ${fmt(product.buyPrice)}`,                          color: 'text-gray-900 dark:text-white' },
              { label: 'Inventory Value',  value: `PKR ${fmt(buyPrice * (Number(product.stock) || 0))}`,  color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Profit Margin',    value: margin,                                                  color: 'text-violet-600 dark:text-violet-400' },
            ].map(s => (
              <div key={s.label} className="p-5 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details + Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Product Details</h2>
            <dl className="space-y-3">
              {[
                ['Category',       product.category   || '—'],
                ['Dimensions',     product.dimensions || '—'],
                ['Description',    product.description|| '—'],
                ['Inventory Value', `PKR ${fmt((product.stock || 0) * (product.buyPrice || 0))}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center text-sm">
                  <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Stock Alert</h2>
            {(() => {
              const stock = Number(product.stock) || 0;
              const isOut = stock === 0;
              const isLow = stock > 0 && stock < 5;

              const cfg = isOut ? {
                wrap:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                iconBg:  'bg-red-100 dark:bg-red-900/40',
                icon:    'text-red-600 dark:text-red-400',
                badge:   'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
                label:   'Out of Stock',
                title:   'Restock Immediately',
                desc:    'This product has 0 units remaining and cannot be sold.',
                bar:     'bg-red-500',
                barW:    4,
                num:     'text-red-600 dark:text-red-400',
                path:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              } : isLow ? {
                wrap:    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
                iconBg:  'bg-amber-100 dark:bg-amber-900/40',
                icon:    'text-amber-600 dark:text-amber-400',
                badge:   'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
                label:   'Low Stock',
                title:   'Consider Restocking',
                desc:    `Only ${stock} unit${stock !== 1 ? 's' : ''} remaining. Running low.`,
                bar:     'bg-amber-500',
                barW:    Math.min(100, (stock / 25) * 100),
                num:     'text-amber-600 dark:text-amber-400',
                path:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
              } : {
                wrap:    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
                iconBg:  'bg-emerald-100 dark:bg-emerald-900/40',
                icon:    'text-emerald-600 dark:text-emerald-400',
                badge:   'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                label:   'In Stock',
                title:   'Healthy Stock Level',
                desc:    `${stock} units available and ready to sell.`,
                bar:     'bg-emerald-500',
                barW:    Math.min(100, (stock / 25) * 100),
                num:     'text-emerald-600 dark:text-emerald-400',
                path:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              };

              return (
                <div className={`rounded-xl border p-4 ${cfg.wrap}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                      <svg className={`w-5 h-5 ${cfg.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cfg.path}/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{cfg.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-3xl font-bold leading-none ${cfg.num}`}>{stock}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">units</p>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${cfg.barW}%` }}/>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Stock Log */}
        {logs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Stock History</h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.slice(0, 20).map((log, i) => {
                const qty = log.quantity ?? 0;
                const isPositive = qty > 0;
                const actionLabel = {
                  STOCK_ADD:            'Stock Added',
                  SALE_CREATE:          'Sale',
                  SALE_DELETE:          'Sale Deleted',
                  SALE_UPDATE_RESTORE:  'Sale Updated (restored)',
                  SALE_UPDATE_DEDUCT:   'Sale Updated (deducted)',
                }[log.action] || log.action;

                return (
                  <div key={i} className="flex items-center justify-between px-6 py-3 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}{qty} units
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {log.previousStock} → {log.newStock}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{actionLabel}</span>
                        {log.note && <span className="text-xs text-gray-600 dark:text-gray-300">— {log.note}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-4">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showStock && (
        <AddStockModal
          product={product}
          onClose={() => setShowStock(false)}
          onStockAdded={async (productId, data) => {
            if (!isOnline) {
              // Offline: save as draft
              await addDraft(
                DRAFT_TYPES.ADD_STOCK,
                { productId, quantity: data.quantity, note: data.note },
                `Add Stock: +${data.quantity} to ${product.name}`
              );
              setShowStock(false);
            } else {
              // Online: call API then refresh
              await service.addStock(productId, data);
              setShowStock(false);
              await load();
            }
          }}
        />
      )}
    </main>
  );
}