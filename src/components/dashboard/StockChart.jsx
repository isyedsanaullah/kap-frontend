// src/components/dashboard/StockChart.jsx
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'

const COLORS = {
  inStock: { bar: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200/80 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'In Stock' },
  lowStock: { bar: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200/80 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400', label: 'Low Stock' },
  outOfStock: { bar: '#ef4444', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200/80 dark:border-rose-800/40', text: 'text-rose-700 dark:text-rose-400', label: 'Out of Stock' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl px-4 py-2.5 text-xs backdrop-blur-md">
      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.color }} />
        {d.payload.label}
      </p>
      <p className="text-gray-500 dark:text-slate-400 mt-0.5">
        <span className="font-semibold text-gray-800 dark:text-slate-200">{(d.value || 0).toLocaleString()}</span> products
      </p>
    </div>
  )
}

const StockChart = ({ data }) => {
  const navigate = useNavigate()
  const { summary = {}, lowStockProducts = [], outOfStockProducts = [] } = data || {}

  const [activeTab, setActiveTab] = useState('low')
  const inStockCount = summary.inStock ?? 0
  const lowStockCount = summary.lowStock ?? lowStockProducts.length
  const outOfStockCount = summary.outOfStock ?? outOfStockProducts.length
  const totalTracked = inStockCount + lowStockCount + outOfStockCount

  const chartData = useMemo(() => [
    { label: 'In Stock', value: inStockCount, color: COLORS.inStock.bar },
    { label: 'Low Stock', value: lowStockCount, color: COLORS.lowStock.bar },
    { label: 'Out of Stock', value: outOfStockCount, color: COLORS.outOfStock.bar },
  ], [inStockCount, lowStockCount, outOfStockCount])

  const currentProducts = activeTab === 'low' ? lowStockProducts : outOfStockProducts
  const totalCategoryCount = activeTab === 'low' ? lowStockCount : outOfStockCount

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Product Inventory
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Real-time stock health across {totalTracked.toLocaleString()} catalog items
          </p>
        </div>
        <button
          onClick={() => navigate('/stock')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-white/5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-all flex-shrink-0"
        >
          <span>Stock Manager</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Building-style Vertical Bar Chart */}
      <div className="h-44 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 22, right: 12, left: -16, bottom: 0 }} barSize={56}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
            <Bar dataKey="value" radius={[10, 10, 4, 4]}>
              <LabelList
                dataKey="value"
                position="top"
                formatter={(val) => Number(val).toLocaleString()}
                style={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                className="dark:!fill-slate-300"
              />
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {Object.entries(COLORS).map(([key, c]) => {
          const count = summary[key] ?? 0
          const pct = totalTracked > 0 ? ((count / totalTracked) * 100).toFixed(1) : '0'
          return (
            <div key={key} className={`rounded-2xl p-3 border ${c.bg} ${c.border} transition-all`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[11px] font-semibold ${c.text}`}>{c.label}</span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">{pct}%</span>
              </div>
              <div className={`text-lg sm:text-xl font-extrabold ${c.text}`}>
                {Number(count).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Switcher: Low Stock vs Out of Stock */}
      <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-white/5">
        <div className="flex p-1 bg-gray-100/90 dark:bg-slate-800/80 rounded-2xl border border-gray-200/80 dark:border-white/5 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('low')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'low'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Low Stock</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === 'low'
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
              }`}>
              {Number(lowStockCount).toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('out')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'out'
              ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Out of Stock</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${activeTab === 'out'
              ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200'
              : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
              }`}>
              {Number(outOfStockCount).toLocaleString()}
            </span>
          </button>
        </div>
        {/* 25-Product Scrollable List with Redesigned Smooth Scrollbar */}
        <div className="h-[350px] overflow-y-auto custom-scroll pr-1.5 space-y-1.5">
          {currentProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-slate-500">
              <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <p className="text-xs font-semibold">
                {`No ${activeTab === 'low' ? 'low stock' : 'out of stock'} products found`}
              </p>
            </div>
          ) : (
            currentProducts.map((p, index) => {
              const isOut = activeTab === 'out' || (p.stock ?? 0) === 0
              return (
                <button
                  key={p._id || index}
                  type="button"
                  onClick={() => navigate(`/products/${p._id}`)}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 shadow-sm transition-all group text-left cursor-pointer"
                >
                  {/* Left: Rank & Product Details */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-gray-200/70 dark:bg-slate-700/60 text-gray-500 dark:text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                        {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                        {p.category && <span>&bull; {p.category}</span>}
                        {p.price && <span>&bull; PKR {Number(p.price).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stock Badge */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        0 left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        {p.stock} left
                      </span>
                    )}

                    <svg className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer info link */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>Need to restock inventory?</span>
          <button
            onClick={() => navigate('/stock')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Batch Add Stock</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StockChart
