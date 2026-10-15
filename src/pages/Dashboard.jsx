// pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import service from "../api/service";
import StatCardsCarousel from "../components/dashboard/StatCardsCarousel";
import StockChart from "../components/dashboard/StockChart";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt      = (v) => (Number(v) || 0).toLocaleString();
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const timeAgo  = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)       return "Just now";
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
  return fmtDate(d);
};

const RANGES = [
  { value: "hour",    label: "Last Hour"    },
  { value: "day",     label: "Last 24 Hrs"  },
  { value: "week",    label: "Last 7 Days"  },
  { value: "month",   label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
];

/* ── Chart Tooltip ────────────────────────────────────────── */
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

/* ── Activity Icon ────────────────────────────────────────── */
const ActivityIcon = ({ type }) => {
  const icons = {
    sale:      { bg: "bg-blue-100 dark:bg-blue-900/30",    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-600 dark:text-blue-400" },
    customer:  { bg: "bg-purple-100 dark:bg-purple-900/30",icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "text-purple-600 dark:text-purple-400" },
    warning:   { bg: "bg-amber-100 dark:bg-amber-900/30",  icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-amber-600 dark:text-amber-400" },
    error:     { bg: "bg-red-100 dark:bg-red-900/30",      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-red-600 dark:text-red-400" },
    payment:   { bg: "bg-green-100 dark:bg-green-900/30",  icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-600 dark:text-green-400" },
  };
  const c = icons[type] || icons.sale;
  return (
    <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl ${c.bg}`}>
      <svg className={`w-4.5 h-4.5 ${c.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
      </svg>
    </div>
  );
};

/* ── Overdue Summary Cards ────────────────────────────────── */
const OverdueSummaryCards = ({ stats, customers, navigate }) => {
  const overdueCustomers = customers.filter(c => (c.dueRemainings || 0) > 0);
  const totalDue         = overdueCustomers.reduce((s, c) => s + (c.dueRemainings || 0), 0);
  const top              = overdueCustomers.slice(0, 4);

  const metaCards = [
    {
      label: "Total Due",
      value: `PKR ${fmt(stats.totalDue || 0)}`,
      sub: "Across all sales",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "text-amber-600 dark:text-amber-400",
      bg:    "bg-amber-50 dark:bg-amber-900/20 border-amber-200/80 dark:border-amber-800/40",
      iconBg:"bg-amber-100 dark:bg-amber-900/40",
    },
    {
      label: "Overdue Customers",
      value: overdueCustomers.length,
      sub: "Customers with balance",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      color: "text-orange-600 dark:text-orange-400",
      bg:    "bg-orange-50 dark:bg-orange-900/20 border-orange-200/80 dark:border-orange-800/40",
      iconBg:"bg-orange-100 dark:bg-orange-900/40",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Overdue Payments</h2>
        <button onClick={() => navigate('/due-reminders')} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
          View All →
        </button>
      </div>

      {/* Summary meta cards */}
      <div className="grid grid-cols-2 gap-3">
        {metaCards.map(c => (
          <div key={c.label} className={`rounded-xl p-3 border ${c.bg} flex flex-col gap-2`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
              <svg className={`w-4 h-4 ${c.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
              </svg>
            </div>
            <div>
              <div className={`text-base font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top overdue customer list */}
      {top.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Top Overdue</p>
          {top.map((c, i) => (
            <button
              key={c._id}
              onClick={() => navigate(`/customers/${c._id}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
            >
              <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {c.name}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">
                PKR {fmt(c.dueRemainings)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500">
          🎉 No overdue payments
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [range,      setRange]      = useState("week");
  const [stats,      setStats]      = useState({});
  const [customers,  setCustomers]  = useState([]);
  const [analytics,  setAnalytics]  = useState([]);
  const [activity,   setActivity]   = useState([]);
  const [stockData,  setStockData]  = useState({});
  const [loading,    setLoading]    = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, custsRes, analyticsRes, activityRes, stockRes] = await Promise.all([
        service.getDashboardStats({ period: range }),
        service.getCustomers(),
        service.getSalesAnalytics({ period: range }),
        service.getRecentActivity(),
        service.getStockSummary(),
      ]);
      setStats(statsRes || {});
      setCustomers(Array.isArray(custsRes?.customers) ? custsRes.customers : []);
      setAnalytics(Array.isArray(analyticsRes) ? analyticsRes : []);
      setActivity(activityRes?.activities || []);
      setStockData(stockRes || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const profitMargin = stats.profitMargin ?? 0;
  const recentSales  = Array.isArray(stats.recentSales) ? stats.recentSales : [];
  const chartData    = analytics.map(row => ({
    period: row._id,
    Sales:  row.totalSales || 0,
    Paid:   row.totalPaid  || 0,
    Due:    row.totalDue   || 0,
  }));

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Range Picker ── */}
        <div className="w-full p-1 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/60 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-1">
            {RANGES.map(r => {
              const isActive = r.value === range;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isActive
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/80 dark:border-gray-600/60"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/40"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Stats Cards Carousel ── */}
        <StatCardsCarousel stats={stats} profitMargin={profitMargin} />

        {/* ── Stock Chart + Overdue Payments ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StockChart data={stockData} />
          <OverdueSummaryCards stats={stats} customers={customers} navigate={navigate} />
        </div>

        {/* ── Recent Sales (full-width, clickable rows) ── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Sales</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click any row to view details</p>
            </div>
            <button onClick={() => navigate("/sales")} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
              View all →
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No sales in this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {["Invoice", "Customer", "Amount", "Paid", "Due", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentSales.map(sale => {
                    const due  = Math.max((sale.totalAmount || 0) - (sale.paidAmount || 0), 0);
                    const paid = due <= 0;
                    return (
                      <tr
                        key={sale._id}
                        onClick={() => navigate(`/sales/${sale._id}`)}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                          {sale.invoiceNumber || `INV-${sale._id?.slice(-5).toUpperCase()}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[140px] truncate">
                          {sale.customer?.name || "Cash"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          PKR {fmt(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                          PKR {fmt(sale.paidAmount || 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {due > 0 ? (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">PKR {fmt(due)}</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            paid
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {paid ? "Paid" : "Partial"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                          {fmtDate(sale.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Sales Trend Chart ── */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
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

        {/* ── Recent Activity Feed ── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest events across the system</p>
            </div>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {activity.length} events
            </span>
          </div>

          {activity.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activity.map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => item.link && navigate(item.link)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
                >
                  <ActivityIcon type={item.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </span>
                    {item.meta && (
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{item.meta}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}