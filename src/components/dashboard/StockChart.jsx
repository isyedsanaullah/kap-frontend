// src/components/dashboard/StockChart.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'

const COLORS = {
  inStock:    { bar: '#22c55e', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'In Stock' },
  lowStock:   { bar: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-400',    label: 'Low Stock' },
  outOfStock: { bar: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30',        text: 'text-red-700 dark:text-red-400',        label: 'Out of Stock' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-semibold text-gray-800 dark:text-gray-100">{d.payload.label}</p>
      <p className="text-gray-500 dark:text-gray-400">{d.value} products</p>
    </div>
  )
}

const ProductRow = ({ name, stock, id, type }) => {
  const navigate = useNavigate()
  const col = COLORS[type]
  return (
    <button
      onClick={() => navigate(`/products/${id}`)}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {name}
      </span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${col.bg} ${col.text}`}>
        {stock} left
      </span>
    </button>
  )
}

const OutRow = ({ name, id }) => {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/products/${id}`)}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left group"
    >
      <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {name}
      </span>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        Out of stock
      </span>
    </button>
  )
}

const StockChart = ({ data }) => {
  const navigate = useNavigate()
  const { summary = {}, lowStockProducts = [], outOfStockProducts = [] } = data || {}

  const chartData = useMemo(() => [
    { label: 'In Stock',     value: summary.inStock    || 0, color: COLORS.inStock.bar },
    { label: 'Low Stock',    value: summary.lowStock   || 0, color: COLORS.lowStock.bar },
    { label: 'Out of Stock', value: summary.outOfStock || 0, color: COLORS.outOfStock.bar },
  ], [summary])

  const tabs = [
    { key: 'low', label: `Low Stock (${summary.lowStock || 0})`, products: lowStockProducts, type: 'lowStock' },
    { key: 'out', label: `Out of Stock (${summary.outOfStock || 0})`, products: outOfStockProducts, type: 'outOfStock' },
  ]
  const [activeTab, setActiveTab] = React.useState('low')
  const current = tabs.find(t => t.key === activeTab)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Product Inventory</h2>
        <button
          onClick={() => navigate('/products')}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View All →
        </button>
      </div>

      {/* Bar Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 4, left: -20, bottom: 0 }} barSize={48}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-gray-500 dark:text-gray-400"
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="value" position="top" style={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }} className="text-gray-700 dark:text-gray-300" />
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(COLORS).map(([key, c]) => (
          <div key={key} className={`rounded-xl px-3 py-2 text-center ${c.bg}`}>
            <div className={`text-lg font-bold ${c.text}`}>
              {summary[key] ?? 0}
            </div>
            <div className={`text-xs ${c.text} opacity-80`}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs: Low Stock / Out of Stock */}
      <div>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/60 rounded-xl mb-3">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === t.key
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {current?.products.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">No products in this category</p>
          ) : activeTab === 'low' ? (
            current.products.map(p => <ProductRow key={p._id} id={p._id} name={p.name} stock={p.stock} type="lowStock" />)
          ) : (
            current.products.map(p => <OutRow key={p._id} id={p._id} name={p.name} />)
          )}
        </div>
      </div>
    </div>
  )
}

export default StockChart
