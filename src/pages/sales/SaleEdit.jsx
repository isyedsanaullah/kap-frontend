// src/pages/sales/SaleEdit.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import service from '../../api/service';

const fmt = (v) => (Number(v) || 0).toLocaleString();

/* ── Searchable product picker ── */
const ProductPicker = ({ value, allProducts, onChange }) => {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  const selected = allProducts.find(p => p._id === value);

  const filtered = allProducts.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.dimensions?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (prod) => {
    onChange('product', prod._id);
    onChange('originalPrice', prod.buyPrice || 0);
    onChange('salePrice', prod.salePrice || prod.buyPrice || 0);
    setQuery('');
    setOpen(false);
  };

  const stockColor = (s) => Number(s) === 0
    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    : Number(s) <= 10
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';

  return (
    <div ref={ref} className="relative">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{selected.name}</p>
            <div className="flex gap-1.5 mt-0.5 flex-wrap">
              {selected.category && <span className="text-xs bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{selected.category}</span>}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${stockColor(selected.stock)}`}>stock: {selected.stock}</span>
            </div>
          </div>
          <button type="button" onClick={() => { onChange('product', ''); setOpen(true); }}
            className="text-gray-400 hover:text-red-500 font-bold text-xl leading-none flex-shrink-0">×</button>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
            </div>
            <input value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search product name, category…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-4 text-center">No products found</p>
              ) : filtered.map(p => (
                <button key={p._id} type="button" onMouseDown={() => pick(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {p.category   && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{p.category}</span>}
                        {p.dimensions && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{p.dimensions}</span>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0 ${stockColor(p.stock)}`}>{p.stock} left</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ── inventory product row ── */
const MyProductRow = ({ row, onChange, onRemove, allProducts }) => (
  <div className="grid grid-cols-12 gap-2 items-start mb-2">
    <div className="col-span-5">
      <ProductPicker value={row.product} allProducts={allProducts} onChange={onChange} />
    </div>
    <div className="col-span-3">
      <input type="number" min="1" placeholder="Qty" value={row.quantitySold}
        onChange={e => onChange('quantitySold', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-3">
      <input type="number" min="0" placeholder="Sale Price" value={row.salePrice}
        onChange={e => onChange('salePrice', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-1 flex justify-center pt-2">
      <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
    </div>
  </div>
);


/* ── tiny sub-component: one custom product row ── */
const CustomProductRow = ({ row, onChange, onRemove }) => (
  <div className="grid grid-cols-12 gap-2 items-center mb-2">
    <div className="col-span-3">
      <input type="text" placeholder="Name" value={row.name}
        onChange={e => onChange('name', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-2">
      <input type="number" min="1" placeholder="Qty" value={row.quantitySold}
        onChange={e => onChange('quantitySold', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-3">
      <input type="number" min="0" placeholder="Sale Price" value={row.salePrice}
        onChange={e => onChange('salePrice', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-3">
      <input type="number" min="0" placeholder="Cost Price" value={row.originalPrice}
        onChange={e => onChange('originalPrice', e.target.value)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
    </div>
    <div className="col-span-1 flex justify-center">
      <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
    </div>
  </div>
);

const newMyProduct  = () => ({ product: '', quantitySold: 1, salePrice: 0, originalPrice: 0 });
const newCustomProd = () => ({ name: '', quantitySold: 1, salePrice: 0, originalPrice: 0 });

export default function SaleEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [customers,      setCustomers]      = useState([]);
  const [products,       setProducts]       = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [myProducts,     setMyProducts]     = useState([]);
  const [customProducts, setCustomProducts] = useState([]);
  const [paymentMethod,  setPaymentMethod]  = useState('Cash');
  const [paidAmount,     setPaidAmount]     = useState(0);
  const [lastDueDate,    setLastDueDate]    = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);

  /* ── load initial data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          service.getCustomersForSale(),
          service.getProducts({ limit: 9999 }),
        ]);
        // getCustomersForSale returns all customers (no pagination)
        const custList = Array.isArray(custRes) ? custRes
          : Array.isArray(custRes?.customers) ? custRes.customers
          : Array.isArray(custRes?.data) ? custRes.data : [];
        setCustomers(custList);
        const prodList = Array.isArray(prodRes?.products) ? prodRes.products
          : Array.isArray(prodRes?.data) ? prodRes.data
          : Array.isArray(prodRes) ? prodRes : [];
        setProducts(prodList);

        if (isEdit) {
          const sale = await service.getSaleById(id);
          setSelectedCustomer(sale.customer);
          setMyProducts(sale.myProducts?.map(i => ({ product: i.product?._id || i.product, quantitySold: i.quantitySold, salePrice: i.salePrice })) || []);
          setCustomProducts(sale.customProducts || []);
          setPaymentMethod(sale.paymentMethod || 'Cash');
          setPaidAmount(sale.paidAmount || 0);
          setLastDueDate(sale.lastDueDate ? sale.lastDueDate.split('T')[0] : '');
        }
      } catch (err) {
        setError('Failed to load data');
      }
    };
    load();
  }, [id]);

  /* ── live totals ── */
  const totalAmount = [
    ...myProducts.map(i => (Number(i.salePrice) || 0) * (Number(i.quantitySold) || 0)),
    ...customProducts.map(i => (Number(i.salePrice) || 0) * (Number(i.quantitySold) || 0)),
  ].reduce((a, b) => a + b, 0);

  const dueAmount = Math.max(totalAmount - (Number(paidAmount) || 0), 0);

  const paymentStatus =
    Number(paidAmount) >= totalAmount && totalAmount > 0 ? 'Fully Paid'
    : Number(paidAmount) > 0 ? 'Partial'
    : 'Unpaid';

  /* ── inventory product row helpers ── */
  const updateMyProduct = (idx, key, val) =>
    setMyProducts(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  const updateCustomProduct = (idx, key, val) =>
    setCustomProducts(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  /* ── filtered customers ── */
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.companyName?.toLowerCase().includes(q)
    );
  });

  /* ── submit ── */
  const handleSubmit = async () => {
    setError(null);
    if (!selectedCustomer) return setError('Please select a customer.');
    if (!myProducts.length && !customProducts.length) return setError('Add at least one product.');
    for (const r of myProducts) {
      if (!r.product) return setError('Select a product for every inventory row.');
      if (!r.quantitySold || r.quantitySold < 1) return setError('Quantity must be at least 1.');
      if (!r.salePrice || r.salePrice < 0) return setError('Sale price must be 0 or more.');
    }

    // Auto-set due date to +7 days if there's a balance due but no date chosen
    const autoDate = (() => {
      if (lastDueDate) return lastDueDate;
      const due = Math.max(totalAmount - (Number(paidAmount) || 0), 0);
      if (due > 0) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
      }
      return null;
    })();

    const payload = {
      customer: selectedCustomer._id,
      paymentMethod,
      paidAmount: Number(paidAmount) || 0,
      lastDueDate: autoDate,
      myProducts: myProducts.map(r => ({ product: r.product, quantitySold: Number(r.quantitySold), salePrice: Number(r.salePrice), originalPrice: Number(r.originalPrice) || 0 })),
      customProducts: customProducts.map(r => ({ name: r.name, quantitySold: Number(r.quantitySold), salePrice: Number(r.salePrice), originalPrice: Number(r.originalPrice) })),
    };

    try {
      setLoading(true);
      if (isEdit) await service.updateSale(id, payload);
      else await service.createSale(payload);
      navigate('/sales');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sale.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = selectedCustomer && (myProducts.length || customProducts.length) && !loading;

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)] overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/sales')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Sale' : 'Create New Sale'}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Add products and process customer purchase</p>
              </div>
            </div>
            <button onClick={() => navigate('/sales')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Back to Sales
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
              {error} <button onClick={() => setError(null)} className="float-right font-bold">×</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: main sections */}
            <div className="lg:col-span-2 space-y-6">

              {/* Customer */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Customer</h2>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCustomer.phone}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                      className="text-sm text-red-500 hover:text-red-700">Change</button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                        </svg>
                      </div>
                      <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                        placeholder="Search by name, phone, company…"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredCustomers.length === 0
                        ? <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-4 text-center">No customers found.</p>
                        : filteredCustomers.map(c => (
                          <button key={c._id} type="button" onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{c.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {[c.phone, c.companyName].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            {(c.dueRemainings || 0) > 0 && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium shrink-0">Due</span>
                            )}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Products */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Products from Inventory</h2>
                  <button type="button" onClick={() => setMyProducts(p => [...p, newMyProduct()])}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm">
                    + Add Product
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6">No inventory products added yet.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <div className="col-span-5">Product</div>
                      <div className="col-span-3">Qty</div>
                      <div className="col-span-3">Sale Price</div>
                      <div className="col-span-1"/>
                    </div>
                    {myProducts.map((row, idx) => (
                      <MyProductRow key={idx} row={row} products={products} allProducts={products}
                        onChange={(k, v) => updateMyProduct(idx, k, v)}
                        onRemove={() => setMyProducts(p => p.filter((_, i) => i !== idx))} />
                    ))}
                  </>
                )}
              </div>

              {/* Custom Products */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Products</h2>
                  <button type="button" onClick={() => setCustomProducts(p => [...p, newCustomProd()])}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm">
                    + Add Custom
                  </button>
                </div>
                {customProducts.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6">No custom products added.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <div className="col-span-3">Name</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-3">Sale Price</div>
                      <div className="col-span-3">Cost Price</div>
                      <div className="col-span-1"/>
                    </div>
                    {customProducts.map((row, idx) => (
                      <CustomProductRow key={idx} row={row}
                        onChange={(k, v) => updateCustomProduct(idx, k, v)}
                        onRemove={() => setCustomProducts(p => p.filter((_, i) => i !== idx))} />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: payment + summary */}
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
                <div className="space-y-4">
                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Cash', 'Online'].map(m => (
                        <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                          className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === m ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-gray-300 dark:border-gray-600'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paid amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paid Amount (PKR)</label>
                    <input type="number" min="0" max={totalAmount} value={paidAmount}
                      onChange={e => setPaidAmount(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum: PKR {fmt(totalAmount)}</p>
                  </div>

                  {/* Due date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date (optional)</label>
                    <input type="date" value={lastDueDate} onChange={e => setLastDueDate(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Due summary */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Due Amount</span>
                      <span className={`text-lg font-bold ${dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        PKR {fmt(dueAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        paymentStatus === 'Fully Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>{paymentStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  {[
                    ['Products', `${myProducts.length + customProducts.length} items`],
                    ['Customer', selectedCustomer?.name || 'Not selected'],
                    ['Payment Method', paymentMethod],
                    ['Paid Amount', `PKR ${fmt(paidAmount)}`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-blue-200 dark:border-blue-800/30 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">PKR {fmt(totalAmount)}</span>
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={!canSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Saving…</>
                    : isEdit ? 'Update Sale' : 'Create Sale'
                  }
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  By creating this sale, you agree to the terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}