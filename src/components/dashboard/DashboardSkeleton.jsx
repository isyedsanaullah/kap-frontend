// src/components/dashboard/DashboardSkeleton.jsx
import React from 'react'

const Pulse = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`} />
)

const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <Pulse className="h-3 w-24" />
      <Pulse className="h-9 w-9 rounded-xl" />
    </div>
    <Pulse className="h-7 w-32 mt-1" />
    <Pulse className="h-3 w-20" />
  </div>
)

const DashboardSkeleton = () => {
  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Range picker skeleton */}
        <Pulse className="h-11 w-full rounded-2xl" />

        {/* Stats cards carousel skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Stock bar chart + Overdue cards row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stock chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
            <Pulse className="h-5 w-32" />
            <div className="flex items-end gap-3 h-40 pt-4">
              {[70, 40, 20, 90, 55, 30, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <Pulse className={`w-full rounded-lg`} style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>

          {/* Overdue cards */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>

        {/* Recent sales table skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <Pulse className="h-5 w-28" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Pulse className="h-4 w-16" />
                <Pulse className="h-4 flex-1" />
                <Pulse className="h-4 w-20" />
                <Pulse className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-3">
          <Pulse className="h-5 w-32" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Pulse className="h-9 w-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Pulse className="h-3.5 w-48" />
                  <Pulse className="h-3 w-32" />
                </div>
                <Pulse className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

export default DashboardSkeleton
