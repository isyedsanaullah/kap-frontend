// src/components/ui/Pagination.jsx
import React, { useState } from 'react';

/**
 * Beautiful, reusable Pagination component.
 *
 * Props:
 *  currentPage  : number  (1-indexed)
 *  totalPages   : number
 *  totalItems   : number  (optional, for "Showing X–Y of Z")
 *  pageSize     : number  (optional)
 *  onPageChange : (page: number) => void
 *  className    : string  (optional extra wrapper class)
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const [jumpValue, setJumpValue] = useState('');

  if (totalPages <= 1) return null;

  const from = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const to   = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  /* Build visible page numbers: always show 1, last, and ±2 around current */
  const getPages = () => {
    const pages = new Set();
    pages.add(1);
    pages.add(totalPages);
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.add(i);
    }
    const sorted = [...pages].sort((a, b) => a - b);

    // Insert ellipsis markers
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…');
      result.push(sorted[i]);
    }
    return result;
  };

  const pages = getPages();

  /* Handle jump-to-page */
  const handleJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpValue('');
    }
  };

  const btnBase =
    'min-w-[2.25rem] h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150';
  const btnActive =
    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-105';
  const btnInactive =
    'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300';
  const btnDisabled =
    'opacity-40 cursor-not-allowed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400';

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      {/* Info text */}
      <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
        {from && to && totalItems ? (
          <>
            Showing <span className="font-semibold text-gray-900 dark:text-white">{from}–{to}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
          </>
        ) : (
          <>Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span></>
        )}
      </p>

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`${btnBase} px-2 ${currentPage === 1 ? btnDisabled : btnInactive}`}
          aria-label="First page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
          </svg>
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} px-2 ${currentPage === 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 dark:text-gray-500 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} px-3 ${p === currentPage ? btnActive : btnInactive}`}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        {/* Go-to-page input */}
        <form onSubmit={handleJump} className="flex items-center gap-1 ml-1">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder="#"
            className="w-12 h-9 text-center text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Go to page number"
          />
          <button
            type="submit"
            disabled={!jumpValue}
            className={`${btnBase} px-2 ${!jumpValue ? btnDisabled : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
            aria-label="Go to page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </form>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} px-2 ${currentPage === totalPages ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`${btnBase} px-2 ${currentPage === totalPages ? btnDisabled : btnInactive}`}
          aria-label="Last page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
