// src/pages/products/ProductNew.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import service from '../../api/service';
import { useOffline } from '../../context/OfflineContext';
import { cacheProduct } from '../../db/localDB';

const INITIAL = {
  name: '',
  category: '',
  buyPrice: '',
  stock: '',
  dimensions: '',
  description: '',
};

const ProductNew = () => {
  const navigate = useNavigate();
  const [form,    setForm]    = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const { isOnline, addDraft, DRAFT_TYPES } = useOffline();

  /* ── helpers ─────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* ── submit ───────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const buyPrice = Number(String(form.buyPrice).replace(/,/g, ''));
    const stock    = Number(String(form.stock).replace(/,/g, ''));

    if (!form.name.trim()) return setError('Product name is required.');
    if (!buyPrice || buyPrice <= 0) return setError('Buy price must be a positive number.');
    if (!stock && stock !== 0) return setError('Initial stock is required.');
    if (stock < 0) return setError('Stock cannot be negative.');

    const payload = {
      name:        form.name.trim(),
      category:    form.category.trim(),
      buyPrice,
      stock,
      dimensions:  form.dimensions.trim(),
      description: form.description.trim(),
    };

    /* ── OFFLINE: save as draft + local cache ──────────────── */
    if (!isOnline) {
      const localId = `draft_prod_${Date.now()}`;
      // Save as local product so it shows up in sale search
      await cacheProduct({ ...payload, _id: localId, _isDraft: true, createdAt: new Date().toISOString() });
      await addDraft(DRAFT_TYPES.CREATE_PRODUCT, payload, `New Product: ${payload.name}`);
      setDraftSaved(true);
      setTimeout(() => navigate('/drafts'), 1500);
      return;
    }

    /* ── ONLINE: call API ──────────────────────────────────── */
    try {
      setLoading(true);
      const created = await service.createProduct(payload);
      // Also cache locally so it's available offline
      await cacheProduct(created);
      navigate('/products');
    } catch (err) {
      console.error('Create product error:', err);
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── UI ───────────────────────────────────────────────────────── */
  return (
    <main className="p-3 min-h-[calc(100vh-4rem)] overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Products
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Create New Product</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new product to your inventory</p>
              </div>
            </div>
          </div>

          {/* Draft saved banner */}
          {draftSaved && (
            <div className="mb-4 p-4 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-2">
              <span>✅</span> Product saved as draft. Redirecting to Drafts…
            </div>
          )}

          {/* Offline banner */}
          {!isOnline && !draftSaved && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg flex items-center gap-2">
              <span>📡</span> <span><strong>You're offline.</strong> Product will be saved as a draft and synced when you reconnect.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Product Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fill in all required fields to add a new product</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        required
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g., Product Name eg: excavator"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        placeholder="Product category: China, Japan, USA"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Buy Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buy Price (PKR) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">PKR</span>
                      </div>
                      <input
                        inputMode="decimal"
                        required
                        name="buyPrice"
                        value={form.buyPrice}
                        onChange={handleChange}
                        placeholder="PKR 1,234"
                        className="w-full pl-16 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Initial Stock <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        inputMode="numeric"
                        required
                        name="stock"
                        value={form.stock}
                        onChange={handleChange}
                        placeholder="Stock Quantity"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimensions (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        name="dimensions"
                        value={form.dimensions}
                        onChange={handleChange}
                        placeholder="Dimensions eg: 10x20x15, 101102"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Product description..."
                        rows="4"
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-8 mt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : !isOnline ? (
                    <>💾 Save as Draft</>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductNew;