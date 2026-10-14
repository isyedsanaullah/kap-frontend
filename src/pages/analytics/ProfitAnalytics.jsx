// src/pages/analytics/ProfitAnalytics.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import service from '../../api/service';

const fmt = (v) => (Number(v) || 0).toLocaleString();
const pct = (v) => `${(Number(v) || 0).toFixed(1)}%`;

/* ─── today / 30 days ago ── */
const toDateStr = (d) => d.toISOString().split('T')[0];
const today = toDateStr(new Date());
const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1 text-gray-700 dark:text-gray-200 border-b pb-1 dark:border-gray-600">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-gray-900 dark:text-white">PKR {fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, color }) => {
  const cls = {
    blue:    'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    amber:   'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300',
    red:     'from-red-500/10 to-pink-500/10 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300',
  }[color] || '';
  return (
    <div className={`bg-gradient-to-br ${cls} border rounded-2xl p-4`}>
      <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

export default function ProfitAnalytics() {
  const [from, setFrom]         = useState(thirtyDaysAgo);
  const [to, setTo]             = useState(today);
  const [summary, setSummary]   = useState(null);
  const [daily, setDaily]       = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const [profitRes, prodRes] = await Promise.all([
        service.getProfit({ fromDate: from, toDate: to }),
        service.getProductProfit({ fromDate: from, toDate: to, limit: 12 }),
      ]);
      setSummary(profitRes?.summary || null);
      setDaily(Array.isArray(profitRes?.dailyBreakdown) ? profitRes.dailyBreakdown : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load profit data');
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const maxProd = products[0]?.totalProfit || 1;

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profit Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Detailed profit breakdown by date range</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} max={to}
                className="text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"/>
              <span className="text-gray-400">→</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} min={from} max={today}
                className="text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none"/>
            </div>
            <button onClick={load} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all">
              Apply
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <>
            {/* KPI Cards */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total Revenue"  value={`PKR ${fmt(summary.totalSales)}`}  color="blue"/>
                <StatCard label="Total Cost"     value={`PKR ${fmt(summary.totalCost)}`}   color="amber"/>
                <StatCard label="Net Profit"     value={`PKR ${fmt(summary.totalProfit)}`} color="emerald" sub={summary.totalProfit >= 0 ? 'Profitable' : 'Loss'}/>
                <StatCard label="Profit Margin"  value={pct(summary.profitMargin)}          color={summary.profitMargin >= 20 ? 'emerald' : summary.profitMargin >= 0 ? 'amber' : 'red'}/>
              </div>
            )}

            {/* Daily Chart */}
            {daily.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Daily Profit Breakdown</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={daily} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:[stroke:#374151]"/>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={60} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                    <Bar dataKey="sales"  name="Revenue" fill="#3b82f6" radius={[3,3,0,0]}/>
                    <Bar dataKey="cost"   name="Cost"    fill="#f59e0b" radius={[3,3,0,0]}/>
                    <Bar dataKey="profit" name="Profit"  fill="#10b981" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Profit trend line */}
            {daily.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Cumulative Profit Trend</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={daily.reduce((acc, d) => {
                    const prev = acc.length > 0 ? acc[acc.length - 1].cumProfit : 0;
                    return [...acc, { ...d, cumProfit: prev + (d.profit || 0) }];
                  }, [])} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[stroke:#374151]"/>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={60} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={(v) => [`PKR ${fmt(v)}`, 'Cumulative Profit']} contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                    <Line type="monotone" dataKey="cumProfit" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="Cumulative Profit"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Product Profit Table */}
            {products.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Top Products by Profit</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map((p, i) => (
                    <div key={p._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <span className="w-6 text-xs text-gray-400 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.productName}</p>
                          <div className="flex items-center gap-4 flex-shrink-0 ml-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Sold: {fmt(p.totalSold)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PKR {fmt(p.totalProfit)}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${p.profitMargin >= 20 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{pct(p.profitMargin)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                            style={{ width: `${Math.max((p.totalProfit / maxProd) * 100, 0)}%` }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!summary && !loading && (
              <div className="text-center py-20 text-gray-500 dark:text-gray-400">No data found for selected range</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}