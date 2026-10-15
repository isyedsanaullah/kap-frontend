// pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import service from "../api/service";
import StatCardsCarousel from "../components/dashboard/StatCardsCarousel";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";

const fmt  = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

const RANGES = [
  { value: "hour",    label: "Last Hour"    },
  { value: "day",     label: "Last 24 Hrs"  },
  { value: "week",    label: "Last 7 Days"  },
  { value: "month",   label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
];



/* tiny custom tooltip for recharts */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: PKR {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [range,    setRange]    = useState("week");
  const [stats,    setStats]    = useState({});
  const [products, setProducts] = useState([]);
  const [customers,setCustomers]= useState([]);
  const [analytics,setAnalytics]= useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, prodsRes, custsRes, analyticsRes] = await Promise.all([
        service.getDashboardStats({ period: range }),
        service.getProducts({ limit: 200 }),
        service.getCustomers(),
        service.getSalesAnalytics({ period: range }),
      ]);
      setStats(statsRes || {});
      setProducts(Array.isArray(prodsRes?.products) ? prodsRes.products : []);
      setCustomers(Array.isArray(custsRes?.customers) ? custsRes.customers : []);
      setAnalytics(Array.isArray(analyticsRes) ? analyticsRes : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const profitMargin   = stats.profitMargin ?? (stats.totalSalesValue > 0 ? ((stats.netProfit / stats.totalSalesValue) * 100).toFixed(1) : 0);
  const recentSales    = Array.isArray(stats.recentSales) ? stats.recentSales : [];
  const lowStock       = products.filter(p => (p.stock || 0) < 5);
  const overdueCustomers = customers.filter(c => (c.dueRemainings || 0) > 0);

  /* chart data — label the _id nicely */
  const chartData = analytics.map(row => ({
    period:     row._id,
    Sales:      row.totalSales || 0,
    Paid:       row.totalPaid  || 0,
    Due:        row.totalDue   || 0,
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Range Picker ── */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl backdrop-blur-sm w-full sm:w-auto">
          {RANGES.map(r => {
            const isActive = r.value === range;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isActive
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/80 dark:border-gray-600/60"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* ── Statistics Cards Carousel ── */}
        <StatCardsCarousel stats={stats} profitMargin={profitMargin} />

        {/* ── Sales Trend Chart ── */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]"/>
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={60} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{ fontSize: "12px" }}/>
                <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2} fill="url(#gSales)" dot={false}/>
                <Area type="monotone" dataKey="Paid"  stroke="#10b981" strokeWidth={2} fill="url(#gPaid)"  dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Bottom: Recent Sales + Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Sales Table */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Sales</h2>
              <button onClick={() => navigate("/sales")} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all →</button>
            </div>
            {recentSales.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">No sales in this period</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      {["Invoice","Customer","Amount","Status","Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentSales.map(sale => {
                      const due = (sale.totalAmount || 0) - (sale.paidAmount || 0);
                      const paid = due <= 0;
                      return (
                        <tr key={sale._id}
                          onClick={() => navigate(`/sales/${sale._id}`)}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-300">
                            {sale.invoiceNumber || `INV-${sale._id?.slice(-5).toUpperCase()}`}
                          </td>
                          <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[120px] truncate">
                            {sale.customer?.name || "Cash"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            PKR {fmt(sale.totalAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paid
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                              {paid ? "Paid" : `Due ${fmt(due)}`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{fmtDate(sale.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column: alerts */}
          <div className="space-y-4">
            {/* Low Stock */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Low Stock</h2>
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2 py-0.5 rounded-full">{lowStock.length}</span>
                  <button onClick={() => navigate('/stock?filter=low')} className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium">View All →</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-44 overflow-y-auto custom-scroll">
                {lowStock.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">All stocked up ✓</p>
                ) : lowStock.slice(0, 8).map(p => (
                  <div key={p._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer"
                    onClick={() => navigate(`/products/${p._id}`)}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku || "—"}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      p.stock <= 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                   : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {p.stock}
                    </span>
                  </div>
                ))}
              </div>
              {lowStock.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => navigate('/stock')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    Manage Stock & Restock
                  </button>
                </div>
              )}
            </div>

            {/* Overdue Payments */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-amber-600 dark:text-amber-400">Overdue Payments</h2>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">{overdueCustomers.length}</span>
                  <button onClick={() => navigate('/due-reminders')} className="text-xs text-amber-500 dark:text-amber-400 hover:underline font-medium">View All →</button>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-44 overflow-y-auto custom-scroll">
                {overdueCustomers.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">No overdue payments ✓</p>
                ) : overdueCustomers.slice(0, 5).map(c => (
                  <div key={c._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer"
                    onClick={() => navigate(`/customers/${c._id}`)}>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</p>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 ml-2 flex-shrink-0">PKR {fmt(c.dueRemainings)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}