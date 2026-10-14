// src/pages/ExportReports.jsx
import React, { useState } from 'react';
import service from '../api/service';

const today = new Date().toISOString().split('T')[0];
const thirtyAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const REPORTS = [
  {
    id: 'sales-excel',
    title: 'Sales Report (Excel)',
    desc: 'All sales with invoice, customer, amounts and payment status in spreadsheet format.',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'blue',
    formats: ['xlsx'],
    dateRange: true,
  },
  {
    id: 'sales-pdf',
    title: 'Sales Report (PDF)',
    desc: 'Formatted PDF sales report with invoice-style headers and summaries.',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'rose',
    formats: ['pdf'],
    dateRange: true,
  },
  {
    id: 'payments',
    title: 'Payments Report',
    desc: 'Payment history — applied amounts, methods, and customer balances.',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    color: 'emerald',
    formats: ['xlsx'],
    dateRange: true,
  },
  {
    id: 'products-excel',
    title: 'Product Inventory (Excel)',
    desc: 'Full product list with stock, prices and categories.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: 'violet',
    formats: ['xlsx'],
    dateRange: false,
  },
  {
    id: 'products-pdf',
    title: 'Product Inventory (PDF)',
    desc: 'Formatted PDF inventory report with colour-coded stock levels.',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'rose',
    formats: ['pdf'],
    dateRange: false,
  },
];

const COLOR = {
  blue:   'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  emerald:'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
  violet: 'from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400',
  rose:   'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
};
const BTN = {
  blue:   'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
  emerald:'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
  violet: 'from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
  rose:   'from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700',
};

export default function ExportReports() {
  const [dates, setDates]   = useState({ sales: { from: thirtyAgo, to: today }, payments: { from: thirtyAgo, to: today } });
  const [status, setStatus] = useState({});
  const [toast, setToast]   = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };
  const setRpt    = (id, key, val) => setDates(p => ({ ...p, [id]: { ...p[id], [key]: val } }));
  const setLoading = (id, v) => setStatus(p => ({ ...p, [id]: v }));

  const doExport = async (report) => {
    setLoading(report.id, 'loading');
    try {
      let blob, filename;
      const d = dates[report.id] || {};

      if (report.id === 'sales-excel') {
        blob = await service.exportSales({ fromDate: d.from, toDate: d.to });
        filename = `sales-report-${d.from}-to-${d.to}.xlsx`;
      } else if (report.id === 'sales-pdf') {
        blob = await service.exportSalesPDF({ fromDate: d.from, toDate: d.to });
        filename = `sales-report-${d.from}-to-${d.to}.pdf`;
      } else if (report.id === 'payments') {
        blob = await service.exportPayments({ fromDate: d.from, toDate: d.to });
        filename = `payments-report-${d.from}-to-${d.to}.xlsx`;
      } else if (report.id === 'products-excel') {
        blob = await service.exportProductsExcel();
        filename = `products-inventory.xlsx`;
      } else if (report.id === 'products-pdf') {
        blob = await service.exportProductsPDF();
        filename = `products-inventory.pdf`;
      }

      downloadBlob(blob, filename);
      setLoading(report.id, 'done');
      showToast(`${report.title} downloaded!`);
      setTimeout(() => setLoading(report.id, null), 3000);
    } catch (e) {
      setLoading(report.id, 'error');
      showToast(`Failed to export: ${e.response?.data?.message || e.message}`, false);
      setTimeout(() => setLoading(report.id, null), 3000);
    }
  };

  return (
    <main className="p-3 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={toast.ok ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}/>
            </svg>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download business reports as Excel or PDF files</p>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REPORTS.map(report => {
            const st = status[report.id];
            const c  = COLOR[report.color] || COLOR.blue;
            const b  = BTN[report.color]   || BTN.blue;
            return (
              <div key={report.id} className={`bg-gradient-to-br ${c} border rounded-2xl p-5 flex flex-col gap-4`}>
                {/* Card top */}
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${c.split(' ').slice(2).join(' ')} bg-white/60 dark:bg-black/20`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={report.icon}/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">{report.title}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{report.desc}</p>
                  </div>
                </div>

                {/* Date pickers */}
                {report.dateRange && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                      <input type="date" value={dates[report.id]?.from || thirtyAgo}
                        onChange={e => setRpt(report.id, 'from', e.target.value)}
                        max={dates[report.id]?.to || today}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                      <input type="date" value={dates[report.id]?.to || today}
                        onChange={e => setRpt(report.id, 'to', e.target.value)}
                        min={dates[report.id]?.from} max={today}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                    </div>
                  </div>
                )}

                {/* Format badge + Export button */}
                <div className="flex items-center justify-between gap-3 mt-auto">
                  <div className="flex gap-1">
                    {report.formats.map(f => (
                      <span key={f} className="text-xs font-semibold uppercase px-2 py-0.5 bg-white/70 dark:bg-black/30 rounded-full text-gray-600 dark:text-gray-300">.{f}</span>
                    ))}
                  </div>
                  <button onClick={() => doExport(report)} disabled={st === 'loading'}
                    className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${b} text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60 shadow-sm`}>
                    {st === 'loading' ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : st === 'done' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    )}
                    {st === 'loading' ? 'Generating…' : st === 'done' ? 'Downloaded!' : 'Download'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Tips</h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Sales &amp; Payments exports include a summary totals row at the bottom</li>
            <li>Product PDF report uses colour-coded stock levels (red = out, amber = low, green = ok)</li>
            <li>Large date ranges may take a few seconds to generate</li>
          </ul>
        </div>
      </div>
    </main>
  );
}