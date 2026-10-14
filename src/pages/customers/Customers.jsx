// src/pages/customers/Customers.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import service from "../../api/service";
import Pagination from "../../components/ui/Pagination";
import { useOffline } from "../../context/OfflineContext";
import { cacheCustomer } from "../../db/localDB";

const fmt = (v) => (Number(v) || 0).toLocaleString();

const getInitial   = (name) => (name ? name.charAt(0).toUpperCase() : "?");
const avatarColors = [
  "from-blue-500 to-blue-600","from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600","from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600","from-cyan-500 to-sky-600",
];
const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

export default function Customers() {
  const navigate = useNavigate();
  const { isOnline, addDraft, DRAFT_TYPES } = useOffline();
  const [customers,         setCustomers]         = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState("");
  const [dueOnly,           setDueOnly]           = useState(false);
  const [error,             setError]             = useState(null);
  const [currentPage,       setCurrentPage]       = useState(1);
  const PAGE_SIZE = 12;

  /* ── modal states ── */
  const [showAddModal,       setShowAddModal]       = useState(false);
  const [showEditModal,      setShowEditModal]      = useState(false);
  const [showReceiveModal,   setShowReceiveModal]   = useState(false);
  const [selectedCustomer,   setSelectedCustomer]   = useState(null);

  /* ── form states ── */
  const [addForm,     setAddForm]     = useState({ name:"", phone:"", address:"", companyName:"" });
  const [editForm,    setEditForm]    = useState({ name:"", phone:"", address:"", companyName:"" });
  const [receiveForm, setReceiveForm] = useState({ amount:"", paymentMethod:"Cash", note:"" });
  const [adding,    setAdding]    = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [receiving, setReceiving] = useState(false);

  /* ── fetch ALL customers (no limit) ── */
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res  = await service.getCustomersForSale();
      const list = Array.isArray(res?.customers) ? res.customers
                 : Array.isArray(res) ? res : [];
      setCustomers(list);
      setFilteredCustomers(list);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch customers");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  useEffect(() => {
    let list = customers;
    // text search across name, phone, company, address
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    }
    // due-only toggle
    if (dueOnly) list = list.filter(c => (c.dueRemainings || 0) > 0);
    setFilteredCustomers(list);
    setCurrentPage(1);
  }, [search, dueOnly, customers]);

  /* ── pagination ── */
  const totalPages  = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pagedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* ── add customer ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return setError('Name is required');

    if (!isOnline) {
      /* OFFLINE — save as draft + local cache */
      const localId = `draft_cust_${Date.now()}`;
      await cacheCustomer({ ...addForm, _id: localId, _isDraft: true, createdAt: new Date().toISOString(), dueRemainings: 0 });
      await addDraft(DRAFT_TYPES.CREATE_CUSTOMER, addForm, `New Customer: ${addForm.name}`);
      setShowAddModal(false);
      setAddForm({ name:"", phone:"", address:"", companyName:"" });
      return;
    }

    try {
      setAdding(true);
      const created = await service.createCustomer(addForm);
      await cacheCustomer(created);           // cache locally too
      await fetchCustomers();
      setShowAddModal(false);
      setAddForm({ name:"", phone:"", address:"", companyName:"" });
    } catch (err) { setError(err.response?.data?.message || "Failed to add customer"); }
    finally { setAdding(false); }
  };

  /* ── edit customer ── */
  const openEdit = (c) => {
    setSelectedCustomer(c);
    setEditForm({ name: c.name||"", phone: c.phone||"", address: c.address||"", companyName: c.companyName||"" });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return setError("Name is required");
    try {
      setEditing(true);
      await service.updateCustomer(selectedCustomer._id, editForm);
      await fetchCustomers();
      setShowEditModal(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to update customer"); }
    finally { setEditing(false); }
  };

  /* ── receive payment ── */
  const openReceive = (c) => {
    setSelectedCustomer(c);
    setReceiveForm({ amount:"", paymentMethod:"Cash", note:"" });
    setShowReceiveModal(true);
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    if (!receiveForm.amount || Number(receiveForm.amount) <= 0) return setError("Enter a valid amount");

    const paymentData = {
      customerId:    selectedCustomer._id,
      amount:        Number(receiveForm.amount),
      paymentMethod: receiveForm.paymentMethod,
      note:          receiveForm.note,
    };

    if (!isOnline) {
      /* OFFLINE — save as draft */
      await addDraft(
        DRAFT_TYPES.RECEIVE_PAYMENT,
        paymentData,
        `Receive PKR ${Number(receiveForm.amount).toLocaleString()} from ${selectedCustomer.name}`
      );
      setShowReceiveModal(false);
      return;
    }

    try {
      setReceiving(true);
      await service.receivePayment(paymentData);
      await fetchCustomers();
      setShowReceiveModal(false);
    } catch (err) { setError(err.response?.data?.message || "Failed to receive payment"); }
    finally { setReceiving(false); }
  };

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)] overflow-x-auto">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-0.5 text-sm">
                {loading ? "Loading..." : `Total ${customers.length} customers`}
              </p>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Search + Due toggle row */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                </svg>
              </div>
              <input placeholder="Search name, phone, company, address…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${dueOnly ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                onClick={() => setDueOnly(p => !p)}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${dueOnly ? 'translate-x-5' : ''}`}/>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Due Only</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
            {error} <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 dark:text-white text-xl">Customer Directory</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredCustomers.length} of {customers.length}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No customers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedCustomers.map(customer => (
              <div key={customer._id}
                onClick={() => navigate(`/customers/${customer._id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-0.5 duration-200 overflow-hidden cursor-pointer group">

                {/* Top */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getColor(customer.name)} rounded-full flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold text-lg">{getInitial(customer.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{customer.name || "Unnamed"}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{customer.phone || "No phone"}</p>
                    </div>
                    {(customer.dueRemainings||0) > 0 && (
                      <span className="shrink-0 text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                        Due
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 pt-4 pb-3 space-y-2">
                  {customer.companyName && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{customer.companyName}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Balance</span>
                    <span className={`text-lg font-bold ${(customer.dueRemainings||0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      PKR {fmt(customer.dueRemainings || 0)}
                    </span>
                  </div>
                </div>

                {/* Receive button — only when due > 0 */}
                {(customer.dueRemainings||0) > 0 && (
                  <div className="px-5 pb-4">
                    <button
                      onClick={e => { e.stopPropagation(); openReceive(customer); }}
                      className="w-full py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors">
                      Receive ₨
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredCustomers.length > PAGE_SIZE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            className="mt-2"
          />
        )}
      </div>

      {/* ── Add Customer Modal ─────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">Add New Customer</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { name:"name", label:"Name *", required:true },
                { name:"phone", label:"Phone" },
                { name:"address", label:"Address" },
                { name:"companyName", label:"Company Name" },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input type="text" value={addForm[f.name]} required={f.required}
                    onChange={e => setAddForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
                  {adding ? "Adding…" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ────────────────────────── */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {[
                { name:"name", label:"Name *", required:true },
                { name:"phone", label:"Phone" },
                { name:"address", label:"Address" },
                { name:"companyName", label:"Company Name" },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                  <input type="text" value={editForm[f.name]} required={f.required}
                    onChange={e => setEditForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={editing} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-50">
                  {editing ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receive Payment Modal ──────────────────────── */}
      {showReceiveModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold dark:text-white">Receive Payment</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Customer: {selectedCustomer.name} — Due: PKR {fmt(selectedCustomer.dueRemainings)}
                </p>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleReceive} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (PKR) *</label>
                <input type="number" min="1" max={selectedCustomer.dueRemainings} required value={receiveForm.amount}
                  onChange={e => setReceiveForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="0"/>
                <p className="text-xs text-gray-500 mt-1">Max: PKR {fmt(selectedCustomer.dueRemainings)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method *</label>
                <select required value={receiveForm.paymentMethod}
                  onChange={e => setReceiveForm(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
                <input type="text" value={receiveForm.note}
                  onChange={e => setReceiveForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReceiveModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                <button type="submit" disabled={receiving} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50">
                  {receiving ? "Processing…" : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
