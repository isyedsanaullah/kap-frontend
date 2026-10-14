import React, { useState, useEffect, useRef } from 'react';

const AddStockModal = ({ product, onClose, onStockAdded }) => {
  const [quantity, setQuantity] = useState('');
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef = useRef(null);

  // Auto-focus quantity input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const qty         = Number(quantity);
  const newStock    = (Number(product?.stock) || 0) + (qty > 0 ? qty : 0);
  const hasQuantity = qty > 0;

  const handleAddStock = async () => {
    setError('');
    if (!qty || qty <= 0) {
      setError('Please enter a positive quantity.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await onStockAdded(product._id, { quantity: qty, note: note.trim() });
      // parent handles close + reload
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add stock. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'modalPop .18s ease-out' }}
      >

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Add Stock</p>
              <h2 className="text-lg font-bold leading-tight">{product?.name}</h2>
              {product?.category && (
                <p className="text-blue-100 text-xs mt-0.5">{product.category}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stock Preview Bar ── */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
          {[
            { label: 'Current',  value: Number(product?.stock) || 0,  color: 'text-gray-700 dark:text-gray-200' },
            { label: 'Adding',   value: hasQuantity ? `+${qty}` : '+—', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'New Total',value: hasQuantity ? newStock : '—',   color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
              <p className={`text-xl font-bold ${color} transition-all duration-200`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Form ── */}
        <div className="p-6 space-y-5">

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="add-stock-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddStock(); }}
                placeholder="e.g. 50"
                className={`w-full pl-4 pr-16 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all
                  ${error
                    ? 'border-red-400 dark:border-red-500 ring-2 ring-red-200 dark:ring-red-900/40'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40'
                  }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                units
              </span>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                {error}
              </p>
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Note
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <textarea
              id="add-stock-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for restocking, supplier info, etc."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none resize-none transition-all focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStock}
              disabled={loading || !hasQuantity}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Adding…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add {hasQuantity ? qty : ''} Units
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe */}
      <style>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AddStockModal;