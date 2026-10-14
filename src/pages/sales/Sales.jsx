// pages/sales/Sales.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import service from '../../api/service';
import Pagination from '../../components/ui/Pagination';

const API_BASE = import.meta.env.VITE_API_URL || 'https://kap-new-backend.vercel.app/api';

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    customer: '',
    soldBy: '',
    showOnlyDues: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadInvoice = async (saleId) => {
    try {
      setDownloadingId(saleId);
      const data = await service.generateInvoice(saleId);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `invoice-${saleId.slice(-6)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── Fetch all data ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes, employeesRes] = await Promise.all([
        service.getSales({ getAll: 'true' }),
        service.getCustomersForSale(),
        service.getEmployees(),
      ]);

      const salesList = Array.isArray(salesRes)
        ? salesRes
        : Array.isArray(salesRes?.sales)
        ? salesRes.sales
        : Array.isArray(salesRes?.data)
        ? salesRes.data
        : [];

      const customerList = Array.isArray(customersRes)
        ? customersRes
        : Array.isArray(customersRes?.customers)
        ? customersRes.customers
        : Array.isArray(customersRes?.data)
        ? customersRes.data
        : [];

      const employeeList = Array.isArray(employeesRes?.data)
        ? employeesRes.data
        : Array.isArray(employeesRes)
        ? employeesRes
        : [];

      setSales(salesList);
      setCustomers(customerList);
      setEmployees(employeeList);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err.response?.data?.message || 'Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const formatCurrency = (val) => (Number(val) || 0).toLocaleString();

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCustomerName = (sale) => sale.customer?.name || 'CASH';

  const getSoldBy = (sale) => sale.createdBy?.name || sale.soldBy || '—';

  const getDue = (sale) => Math.max((Number(sale.totalAmount) || 0) - (Number(sale.paidAmount) || 0), 0);

  // ─── Filtering ────────────────────────────────────────────────────────────────
  const filteredSales = sales.filter((sale) => {
    if (filters.showOnlyDues && getDue(sale) <= 0) return false;
    if (filters.customer) {
      const name = getCustomerName(sale).toLowerCase();
      if (!name.includes(filters.customer.toLowerCase())) return false;
    }
    if (filters.soldBy) {
      const by = getSoldBy(sale).toLowerCase();
      if (!by.includes(filters.soldBy.toLowerCase())) return false;
    }
    if (filters.fromDate) {
      if (new Date(sale.createdAt) < new Date(filters.fromDate)) return false;
    }
    if (filters.toDate) {
      const toEnd = new Date(filters.toDate);
      toEnd.setHours(23, 59, 59, 999);
      if (new Date(sale.createdAt) > toEnd) return false;
    }
    return true;
  });

  // ─── Summary stats ────────────────────────────────────────────────────────────
  const totalSales = filteredSales.reduce((s, sale) => s + (Number(sale.totalAmount) || 0), 0);
  const totalReceived = filteredSales.reduce((s, sale) => s + (Number(sale.paidAmount) || 0), 0);
  const totalDues = filteredSales.reduce((s, sale) => s + getDue(sale), 0);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setCurrentPage(1); // reset to page 1 on any filter change
  };

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const pagedSales  = filteredSales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ─── Export ───────────────────────────────────────────────────────────────────
  const handleExportPage = async (format) => {
    try {
      const saleIds = pagedSales.map(s => s._id).join(',');
      if (!saleIds) return alert('No sales on this page to export.');

      let blob, filename;
      if (format === 'xlsx') {
        blob = await service.exportSales({ saleIds });
        filename = `sales-page-${currentPage}-${new Date().toISOString().split('T')[0]}.xlsx`;
      } else {
        blob = await service.exportSalesPDF({ saleIds });
        filename = `sales-page-${currentPage}-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export page sales');
    }
  };

  // ─── Customer datalist options ────────────────────────────────────────────────
  const customerNames = [...new Set(sales.map(getCustomerName))];
  const employeeNames = [...new Set(employees.map((e) => e.name).filter(Boolean))];

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)] overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales History</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Track and manage all your sales transactions</p>
            </div>
            <button
              onClick={() => navigate('/sales/new')}
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Create New Sale
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {error}
              <button onClick={() => setError(null)} className="float-right font-bold">×</button>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 text-gray-500 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* From Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From Date</label>
                <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To Date</label>
                <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange}
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              {/* Customer */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Customer</label>
                <input type="text" name="customer" value={filters.customer} onChange={handleFilterChange}
                  placeholder="Search customer..." list="customers-list"
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <datalist id="customers-list">
                  {customerNames.map((c, i) => <option key={i} value={c} />)}
                </datalist>
              </div>

              {/* Sold By */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sold By</label>
                <input type="text" name="soldBy" value={filters.soldBy} onChange={handleFilterChange}
                  placeholder="Salesperson..." list="soldby-list"
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <datalist id="soldby-list">
                  {employeeNames.map((e, i) => <option key={i} value={e} />)}
                </datalist>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <label className="inline-flex items-center cursor-pointer gap-2">
                <input type="checkbox" name="showOnlyDues" checked={filters.showOnlyDues} onChange={handleFilterChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show only sales with pending dues</span>
              </label>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  Showing {Math.min((currentPage-1)*PAGE_SIZE+1, filteredSales.length)}–{Math.min(currentPage*PAGE_SIZE, filteredSales.length)} of {filteredSales.length} sales
                </span>
                <button
                  type="button"
                  onClick={() => handleExportPage('xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs font-semibold uppercase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Page (Excel)
                </button>
                <button
                  type="button"
                  onClick={() => handleExportPage('pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs font-semibold uppercase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export Page (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm opacity-90 truncate">Total Sales</p>
                  <p className="text-base sm:text-2xl font-bold mt-1 truncate">PKR {formatCurrency(totalSales)}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 sm:w-10 sm:h-10 opacity-80 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6-3-3h1.5a3 3 0 1 0 0-6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm opacity-90 truncate">Received</p>
                  <p className="text-base sm:text-2xl font-bold mt-1 truncate">PKR {formatCurrency(totalReceived)}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 sm:w-10 sm:h-10 opacity-80 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 14.25 6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
                </svg>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-3 sm:p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm opacity-90 truncate">Pending Dues</p>
                  <p className="text-base sm:text-2xl font-bold mt-1 truncate">PKR {formatCurrency(totalDues)}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7 sm:w-10 sm:h-10 opacity-80 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sales Results ({filteredSales.length})
                </h2>
                <button
                  onClick={handleExportPage}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export to Excel
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">No sales found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {["Customer", "Total", "Due", "Date", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {pagedSales.map((sale) => {
                      const due = getDue(sale);
                      const d   = sale.createdAt ? new Date(sale.createdAt) : null;
                      const ddmm = d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` : '—';
                      return (
                        <tr key={sale._id}
                          onClick={() => navigate(`/sales/${sale._id}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[140px] truncate">
                            {getCustomerName(sale)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {formatCurrency(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className={due > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}>
                              {formatCurrency(due)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {ddmm}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(sale._id); }}
                              disabled={downloadingId === sale._id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-sm font-medium disabled:opacity-55"
                            >
                              {downloadingId === sale._id ? (
                                <div className="h-4 w-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"/>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                              )}
                              Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredSales.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Sales;