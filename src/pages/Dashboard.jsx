// pages/Dashboard.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import service from "../api/service";
import StatCardsCarousel from "../components/dashboard/StatCardsCarousel";
import StockChart from "../components/dashboard/StockChart";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const timeAgo = (d) => {
  if (!d) return "";
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const RANGES = [
  { value: "hour", label: "Last Hour" },
  { value: "day", label: "Last 24 Hrs" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
];

/* ── Chart Tooltip ────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-xl text-xs backdrop-blur-md">
      <p className="font-bold text-gray-800 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3 py-0.5">
          <span className="flex items-center gap-1.5 font-medium" style={{ color: p.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}:
          </span>
          <span className="font-mono font-bold text-gray-900 dark:text-white">
            PKR {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Overdue Payments Section (Top 10 Customers) ──────────── */
const OverdueSummaryCards = ({ stats, customers, navigate }) => {
  // Use accurate database aggregation if returned by backend, fallback to client-side sort
  const topOverdue = useMemo(() => {
    if (Array.isArray(stats.topOverdueCustomers) && stats.topOverdueCustomers.length > 0) {
      return stats.topOverdueCustomers.slice(0, 10);
    }
    return customers
      .filter(c => (c.dueRemainings || 0) > 0)
      .sort((a, b) => (b.dueRemainings || 0) - (a.dueRemainings || 0))
      .slice(0, 10);
  }, [stats.topOverdueCustomers, customers]);

  const totalOverdueAmount = stats.allTimeTotalDue ?? stats.totalDue ?? 0;
  const overdueCount = stats.totalOverdueCustomersCount ?? customers.filter(c => (c.dueRemainings || 0) > 0).length;

  // Maximum due among top 10 for relative progress bar calculation
  const maxDue = useMemo(() => {
    if (!topOverdue.length) return 1;
    return Math.max(...topOverdue.map(c => Number(c.dueRemainings) || 0), 1);
  }, [topOverdue]);

  const metaCards = [
    {
      label: "Total Outstanding Due",
      value: `PKR ${fmt(totalOverdueAmount)}`,
      sub: "Across all customer sales",
      icon: (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200/80 dark:border-amber-800/40",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      label: "Overdue Accounts",
      value: Number(overdueCount).toLocaleString(),
      sub: "Customers with balances",
      icon: (
        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      border: "border-orange-200/80 dark:border-orange-800/40",
      iconBg: "bg-orange-100 dark:bg-orange-900/40",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Top Overdue Payments
            </h2>
          </div>
        </div>
        <button
          onClick={() => navigate('/due-reminders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-white/5 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all flex-shrink-0"
        >
          <span>All Due Reminders</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Meta Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {metaCards.map(c => (
          <div key={c.label} className={`rounded-2xl p-3.5 border ${c.bg} ${c.border} flex flex-col gap-2 transition-all`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg} flex-shrink-0`}>
              {c.icon}
            </div>
            <div>
              <div className={`text-base sm:text-lg font-extrabold ${c.color} truncate`}>{c.value}</div>
              <div className="text-[11px] font-semibold text-gray-600 dark:text-slate-300">{c.label}</div>
              <div className="text-[10px] text-gray-400 dark:text-slate-500">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 10 Overdue Customers List Header */}
      <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-white/5">
        {/* Top 10 Scrollable List (Height matched with StockChart for clean dashboard symmetry) */}
        <div className="h-[560px] overflow-y-auto custom-scroll pr-1.5 space-y-2">
          {topOverdue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-emerald-600 dark:text-emerald-400">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No overdue balances</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">All customer accounts are fully paid!</p>
            </div>
          ) : (
            topOverdue.map((c, i) => {
              const due = Number(c.dueRemainings) || 0;
              const ratio = Math.min((due / maxDue) * 100, 100);

              // Distinct ranking style for top 3 vs others
              const rankStyles = [
                "bg-amber-500 text-white font-black shadow-sm shadow-amber-500/30",         // Rank 1
                "bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white font-bold",   // Rank 2
                "bg-amber-700/80 text-white font-bold",                                     // Rank 3
              ];
              const rankCls = rankStyles[i] || "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-semibold";

              return (
                <button
                  key={c._id || i}
                  type="button"
                  onClick={() => navigate(`/customers/${c._id}`)}
                  className="w-full relative overflow-hidden rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 p-3 text-left transition-all group shadow-sm cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    {/* Left: Rank & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${rankCls}`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                          {c.companyName || c.phone || "Customer Account"}
                          {c.unpaidInvoicesCount ? ` • ${c.unpaidInvoicesCount} invoices` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Right: Balance & Arrow */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <span className="block text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                          PKR {fmt(due)}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          Outstanding
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                  {/* Relative Balance Bar */}
                  <div className="mt-2.5 w-full bg-gray-200/80 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${i === 0 ? "bg-amber-500" : i < 3 ? "bg-amber-500/80" : "bg-amber-600/50"
                        }`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
        {/* Footer info */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>{topOverdue.length} top debtor accounts displayed</span>
          <button
            onClick={() => navigate('/due-reminders')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Send Payment Reminders</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Recent Activity Category Badge & SVG Icon ───────────── */
const getActivityCategoryMeta = (category, action) => {
  switch (category) {
    case "LOGIN":
      return {
        label: "Login",
        badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/40",
        iconBg: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
        actionCls: "bg-indigo-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        ),
      };
    case "SALE":
      return {
        label: "Sale",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/40",
        iconBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
        actionCls: "bg-emerald-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        ),
      };
    case "PAYMENT":
      return {
        label: "Payment",
        badgeBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/40",
        iconBg: "bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400",
        actionCls: "bg-teal-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m0 0v1.5a.75.75 0 00.75.75H3m18-3a.75.75 0 00-.75.75v.75m.75 0H21m0 0v1.5a.75.75 0 01-.75.75h-.75M3 13.5v1.5A.75.75 0 003.75 16h.75m16.5-2.5v1.5a.75.75 0 01-.75.75h-.75M3 12h18M3 9.75h18" />
          </svg>
        ),
      };
    case "STOCK":
      return {
        label: "Stock Addition",
        badgeBg: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200/80 dark:border-violet-800/40",
        iconBg: "bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400",
        actionCls: "bg-violet-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        ),
      };
    case "PRODUCT":
      return {
        label: "Product",
        badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/40",
        iconBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
        actionCls: action === "DELETE" ? "bg-rose-500 text-white" : action === "UPDATE" ? "bg-blue-500 text-white" : "bg-emerald-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        ),
      };
    case "CUSTOMER":
      return {
        label: "Customer",
        badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/40",
        iconBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
        actionCls: action === "DELETE" ? "bg-rose-500 text-white" : action === "UPDATE" ? "bg-sky-500 text-white" : "bg-emerald-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        ),
      };
    case "EMPLOYEE":
      return {
        label: "Employee",
        badgeBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/40",
        iconBg: "bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
        actionCls: action === "DELETE" ? "bg-rose-500 text-white" : action === "UPDATE" ? "bg-purple-500 text-white" : "bg-emerald-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        ),
      };
    case "PROFILE":
      return {
        label: "Profile",
        badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200/80 dark:border-fuchsia-800/40",
        iconBg: "bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400",
        actionCls: "bg-fuchsia-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      };
    default:
      return {
        label: "General",
        badgeBg: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-white/10",
        iconBg: "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300",
        actionCls: "bg-gray-500 text-white",
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
};

/* ── Redesigned SaaS Recent Activity Feed ─────────────────── */
const RecentActivitySection = ({ activity = [], navigate }) => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = [
    { key: "ALL", label: "All Activity" },
    { key: "SALE", label: "Sales" },
    { key: "PAYMENT", label: "Payments" },
    { key: "STOCK", label: "Stock Additions" },
    { key: "PRODUCT", label: "Products" },
    { key: "CUSTOMER", label: "Customers" },
    { key: "EMPLOYEE", label: "Employees" },
    { key: "LOGIN", label: "User Logins" },
  ];

  // Strictly filter only allowed activities (double verification on client)
  const filteredActivity = useMemo(() => {
    const allowed = activity.filter(item => {
      const cat = (item.category || "").toUpperCase();
      return ["LOGIN", "SALE", "PAYMENT", "STOCK", "PRODUCT", "CUSTOMER", "EMPLOYEE", "PROFILE"].includes(cat);
    });

    if (selectedCategory === "ALL") return allowed;
    return allowed.filter(item => (item.category || "").toUpperCase() === selectedCategory);
  }, [activity, selectedCategory]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Recent System Activity
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {filteredActivity.length} Events
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Real-time audit log of authenticated user logins, CRUD transactions, payments, and stock additions
          </p>
        </div>

        <button
          onClick={() => navigate('/notifications')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-white/5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-all self-start sm:self-auto flex-shrink-0"
        >
          <span>All Notifications</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Mobile View: Clean Dropdown Selector */}
      <div className="sm:hidden relative w-full">
        <label htmlFor="activity-category-select" className="sr-only">
          Select Activity Category
        </label>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-500 dark:text-indigo-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
        </div>
        <select
          id="activity-category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full appearance-none bg-gray-100/90 dark:bg-slate-800/90 border border-gray-200/80 dark:border-white/10 rounded-2xl py-3 pl-10 pr-10 text-xs font-bold text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm cursor-pointer transition-all"
        >
          {categories.map(cat => (
            <option
              key={cat.key}
              value={cat.key}
              className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-200 py-1.5"
            >
              {cat.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400 dark:text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Desktop / Tablet View: Full Width Grid Tabs */}
      <div className="hidden sm:block w-full p-1 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 rounded-2xl backdrop-blur-sm shadow-sm">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-1 w-full">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`w-full py-2 sm:py-2.5 px-2 rounded-xl text-xs font-semibold whitespace-nowrap text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer ${isActive
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/80 dark:border-white/10 font-bold"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700/40"
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Records Table / Feed */}
      {filteredActivity.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-slate-300">No activity recorded for this filter</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Actions taken across sales, products, logins, and inventory will appear here.</p>
        </div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto custom-scroll pr-1 divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5 rounded-2xl">
          {filteredActivity.map((item, idx) => {
            const meta = getActivityCategoryMeta(item.category, item.action);
            const userInitial = item.user?.name ? item.user.name[0].toUpperCase() : "U";

            return (
              <div
                key={item.id || idx}
                onClick={() => item.link && navigate(item.link)}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors ${item.link ? "cursor-pointer group" : ""
                  }`}
              >
                {/* Left: Icon, Category Pill, Title & Description */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category SVG Icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
                    {meta.icon}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${meta.badgeBg}`}>
                        {meta.label}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Performed by user tag */}
                    {item.user && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                        <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-slate-700 text-[9px] font-bold text-gray-700 dark:text-slate-300 flex items-center justify-center">
                          {userInitial}
                        </span>
                        <span>{item.user.name}</span>
                        {item.user.role && (
                          <span className="text-[10px] uppercase font-semibold text-gray-400 dark:text-slate-500">
                            ({item.user.role})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Timestamp & Action Link */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-white/5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300" title={fmtDateTime(item.createdAt)}>
                    {timeAgo(item.createdAt)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                    {fmtDate(item.createdAt)}
                  </span>
                  {item.link && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-all mt-0.5">
                      View
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("week");
  const [stats, setStats] = useState({});
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [activity, setActivity] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, custsRes, analyticsRes, activityRes, stockRes] = await Promise.all([
        service.getDashboardStats({ period: range }).catch(err => { console.error("Stats error:", err); return {}; }),
        service.getCustomers().catch(err => { console.error("Customers error:", err); return { customers: [] }; }),
        service.getSalesAnalytics({ period: range }).catch(err => { console.error("Analytics error:", err); return []; }),
        service.getRecentActivity().catch(err => { console.warn("Activity error:", err); return { activities: [] }; }),
        service.getStockSummary().catch(err => { console.warn("Stock summary error:", err); return {}; }),
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
  const recentSales = Array.isArray(stats.recentSales) ? stats.recentSales : [];
  const chartData = analytics.map(row => ({
    period: row._id,
    Sales: row.totalSales || 0,
    Paid: row.totalPaid || 0,
    Due: row.totalDue || 0,
  }));

  if (loading) return <DashboardSkeleton />;

  return (
    <main className="p-3 sm:p-5 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Range Picker ── */}
        <div className="w-full p-1 bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 rounded-2xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {RANGES.map(r => {
              const isActive = r.value === range;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRange(r.value)}
                  className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer ${isActive
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/80 dark:border-white/10"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-slate-700/40"
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

        {/* ── Section 1 & 2: Product Inventory (25 items + custom scroll) + Top 10 Overdue Customers ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockChart data={stockData} />
          <OverdueSummaryCards stats={stats} customers={customers} navigate={navigate} />
        </div>

        {/* ── Recent Sales (full-width, clickable rows) ── */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Recent Sales</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Click any transaction row to open sale details</p>
            </div>
            <button
              onClick={() => navigate("/sales")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-white/5 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-all flex-shrink-0"
            >
              <span>View All Sales</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No sales recorded for this period</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Transactions added will appear here in real-time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/40">
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-right">Total Amount</th>
                    <th className="px-4 py-3.5 text-right">Paid</th>
                    <th className="px-4 py-3.5 text-right">Balance Due</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {recentSales.map(s => {
                    const total = Number(s.totalAmount) || 0;
                    const paid = Number(s.paidAmount) || 0;
                    const due = Math.max(total - paid, 0);
                    const isFullyPaid = due <= 0;
                    const isPartial = paid > 0 && due > 0;

                    return (
                      <tr
                        key={s._id}
                        onClick={() => navigate(`/sales/${s._id}`)}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          {s.invoiceNumber || s._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-800 dark:text-slate-200">
                          {s.customer?.name || "Cash Customer"}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400">
                          {fmtDate(s.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                          PKR {fmt(total)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          PKR {fmt(paid)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {due > 0 ? `PKR ${fmt(due)}` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Paid
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Unpaid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Sales Trend Chart (when data available) ── */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-gray-900 dark:text-white text-base">Sales Trend</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Total Sales vs. Collections for {RANGES.find(r => r.value === range)?.label}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:[stroke:#334155]" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={65} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gSales)" dot={false} />
                <Area type="monotone" dataKey="Paid" stroke="#10b981" strokeWidth={2.5} fill="url(#gPaid)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Section 3: Redesigned Recent Activity (SaaS Table, filtered only to user login, CRUD, payment, profile, employee, stock) ── */}
        <RecentActivitySection activity={activity} navigate={navigate} />

      </div>
    </main>
  );
}