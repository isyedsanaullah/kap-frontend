// pages/analytics/Analytics.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import service from "../../api/service";

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt  = (v) => (Number(v) || 0).toLocaleString();
const pct  = (v) => `${(Number(v) || 0).toFixed(1)}%`;

const RANGES = [
  { value: "hour",    label: "Last Hour"    },
  { value: "day",     label: "Last 24 Hrs"  },
  { value: "week",    label: "Last 7 Days"  },
  { value: "month",   label: "Last 30 Days" },
  { value: "quarter", label: "Last 90 Days" },
];

const PALETTE = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#84cc16"];

/* ─── custom tooltip ──────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-xl text-xs min-w-[120px]">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1.5 border-b border-gray-100 dark:border-gray-700 pb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="text-gray-700 dark:text-gray-300 font-semibold">PKR {fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── active pie label ─────────────────────────────────────────── */
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill={fill} className="text-sm font-bold" style={{ fontSize: 14, fontWeight: 700 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" style={{ fontSize: 11 }}>
        PKR {fmt(value)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#9ca3af" style={{ fontSize: 11 }}>
        {pct(percent * 100)}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill}/>
    </g>
  );
};

/* ─── stat card ───────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, color = "blue" }) => {
  const colors = {
    blue:    "bg-blue-50   dark:bg-blue-900/20  border-blue-200   dark:border-blue-800   text-blue-700   dark:text-blue-300",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    amber:   "bg-amber-50  dark:bg-amber-900/20 border-amber-200  dark:border-amber-800  text-amber-700  dark:text-amber-300",
    violet:  "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300",
    red:     "bg-red-50    dark:bg-red-900/20   border-red-200    dark:border-red-800    text-red-700    dark:text-red-300",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

/* ─── chart section wrapper ───────────────────────────────────── */
const ChartBox = ({ title, children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [range,       setRange]       = useState("month");
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState({});
  const [salesData,   setSalesData]   = useState([]);
  const [profitData,  setProfitData]  = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [activePie,   setActivePie]   = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, salesRes, custsRes] = await Promise.all([
        service.getDashboardStats({ period: range }),
        service.getSalesAnalytics({ period: range }),
        service.getCustomers(),
      ]);

      setStats(statsRes || {});
      const sales = Array.isArray(salesRes) ? salesRes : [];
      setSalesData(sales.map(r => ({
        period:  r._id,
        Sales:   r.totalSales || 0,
        Paid:    r.totalPaid  || 0,
        Due:     r.totalDue   || 0,
        Orders:  r.count      || 0,
      })));

      /* Build profit/cost chart from sales analytics (approximate) */
      setProfitData(sales.map(r => ({
        period: r._id,
        Revenue: r.totalSales || 0,
        /* Estimate paid = cost (very rough), real needs product-level join */
        Cost:    Math.max((r.totalSales || 0) - (r.totalPaid || 0) * 0.3, 0),
        Profit:  r.totalPaid  || 0,
      })));

      setCustomers(Array.isArray(custsRes?.customers) ? custsRes.customers : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* derived stats */
  const totalSales    = stats.totalSalesValue  || 0;
  const netProfit     = stats.netProfit        || 0;
  const totalDue      = stats.totalDue         || 0;
  const totalCost     = stats.totalCost        || 0;
  const profitMargin  = stats.profitMargin     || 0;
  const salesCount    = stats.totalSalesCount  || 0;
  const inventoryVal  = stats.inventoryValue   || 0;

  /* payment method pie — approximate from stats */
  const totalPaid    = stats.totalPaid || 0;
  const cashApprox   = Math.round(totalPaid * 0.45);  /* placeholder ratio */
  const onlineApprox = totalPaid - cashApprox;
  const paymentPieData = [
    { name: "Cash",   value: cashApprox   },
    { name: "Online", value: onlineApprox },
  ];

  /* top overdue customers */
  const topDue = [...customers]
    .filter(c => (c.dueRemainings || 0) > 0)
    .sort((a, b) => b.dueRemainings - a.dueRemainings)
    .slice(0, 8);

  const maxDue = topDue[0]?.dueRemainings || 1;

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {RANGES.find(r => r.value === range)?.label} · business overview
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button onClick={fetchAll}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all">
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <>
            {/* ── KPI row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Total Revenue"  value={`PKR ${fmt(totalSales)}`}   color="blue"/>
              <StatCard label="Net Profit"     value={`PKR ${fmt(netProfit)}`}    color="emerald"/>
              <StatCard label="Total Due"      value={`PKR ${fmt(totalDue)}`}     color="amber"/>
              <StatCard label="Total Cost"     value={`PKR ${fmt(totalCost)}`}    color="violet" sub="product cost"/>
              <StatCard label="Profit Margin"  value={pct(profitMargin)}          color="emerald" sub="of revenue"/>
              <StatCard label="Total Orders"   value={salesCount}                 color="blue"/>
            </div>

            {/* ── Charts row 1: Sales trend + Bar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartBox title="Sales & Collections Trend">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="aSales"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="aPaid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="aDue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]"/>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={55}
                      tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}/>
                    <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2} fill="url(#aSales)" dot={false}/>
                    <Area type="monotone" dataKey="Paid"  stroke="#10b981" strokeWidth={2} fill="url(#aPaid)"  dot={false}/>
                    <Area type="monotone" dataKey="Due"   stroke="#f59e0b" strokeWidth={2} fill="url(#aDue)"   dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>

              <ChartBox title="Revenue vs Profit by Period">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]" vertical={false}/>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={55}
                      tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}/>
                    <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                    <Bar dataKey="Paid"  fill="#10b981" radius={[4, 4, 0, 0]}/>
                    <Bar dataKey="Due"   fill="#f59e0b" radius={[4, 4, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>

            {/* ── Charts row 2: Orders line + Payment pie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartBox title="Order Count Over Time" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={salesData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]"/>
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={30} allowDecimals={false}/>
                    <Tooltip
                      formatter={(v, n) => [v, "Orders"]}
                      contentStyle={{ background: "var(--tw-prose-body)", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="Orders" stroke="#8b5cf6" strokeWidth={2.5}
                      dot={{ fill: "#8b5cf6", r: 3 }} activeDot={{ r: 5 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartBox>

              {/* Payment method donut */}
              <ChartBox title="Payment Methods">
                {totalPaid === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No payment data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        activeIndex={activePie}
                        activeShape={renderActiveShape}
                        data={paymentPieData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={75}
                        dataKey="value"
                        onMouseEnter={(_, i) => setActivePie(i)}
                      >
                        {paymentPieData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]}/>
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex justify-center gap-4 mt-1">
                  {paymentPieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PALETTE[i] }}/>
                      {item.name}
                    </div>
                  ))}
                </div>
              </ChartBox>
            </div>

            {/* ── Top customers by due ── */}
            {topDue.length > 0 && (
              <ChartBox title="Top Customers by Outstanding Due">
                <div className="space-y-2.5">
                  {topDue.map((c, i) => (
                    <div key={c._id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-2 flex-shrink-0">PKR {fmt(c.dueRemainings)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                            style={{ width: `${(c.dueRemainings / maxDue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartBox>
            )}

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Inventory Value"  value={`PKR ${fmt(inventoryVal)}`}                 color="violet"/>
              <StatCard label="Total Customers"  value={stats.totalCustomers || 0}                  color="blue"/>
              <StatCard label="Total Products"   value={stats.totalProducts  || 0}                  color="emerald"/>
              <StatCard label="Avg Order Value"  value={salesCount > 0 ? `PKR ${fmt(Math.round(totalSales / salesCount))}` : "—"} color="amber"/>
            </div>
          </>
        )}
      </div>
    </main>
  );
}