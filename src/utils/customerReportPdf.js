// src/utils/customerReportPdf.js
// Customer sales report PDF generator with company header & logo
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── Formatting Helpers ───────────────────────────────────── */
const fmt = (v) => (Number(v) || 0).toLocaleString();
const fmtPKR = (v) => `PKR ${fmt(v)}`;
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const FILTER_LABELS = {
  all: 'All Time',
  '1week': 'Last 7 Days',
  '1month': 'Last 30 Days',
  '3months': 'Last 3 Months',
  '6months': 'Last 6 Months',
  '1year': 'Last 1 Year',
  lastN: 'Recent Sales',
  custom: 'Custom Range',
};

const DEFAULT_LOGO_URL =
  'https://res.cloudinary.com/dm1dxc98q/image/upload/v1767645526/company/logo.png';

/**
 * Convert remote or local image URL to base64 data URL for jsPDF addImage.
 * Returns null if network fails so PDF generation never breaks.
 */
async function loadLogoData(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Logo could not be loaded into PDF:', err);
    return null;
  }
}

/**
 * Build Customer Sales Statement / Report PDF Document
 */
export async function buildCustomerReportPdfDoc(reportData, opts = {}) {
  const {
    customer = {},
    sales = [],
    paymentBatches = [],
    summary = {},
    filter = 'all',
    generatedAt = new Date(),
  } = reportData;

  const company = opts.company || reportData.company || {};
  const { lastN, startDate, endDate } = opts;

  // Attempt to load company logo
  const logoUrl = company?.logo || DEFAULT_LOGO_URL;
  const logoData = await loadLogoData(logoUrl);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // ~841.89 pt
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const shopName = company?.shopName || 'Karachi Auto Parts';
  const address = company?.address || 'Main Auto Market, Plaza Square, Karachi';
  const email = company?.email || 'info@karachiautoparts.pk';
  const phone = company?.phone || '+92 300 0000000';
  const tagline = company?.businessDescription || 'Auto Parts Importer & Wholesale Dealer';

  let y = 38;

  // ── Company Logo & Shop Header (Top Left) ──
  const logoSize = 48;
  let textStartX = margin;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, y, logoSize, logoSize);
      textStartX = margin + logoSize + 12;
    } catch {
      // If addImage fails for format reason, keep textStartX
    }
  }

  // Shop Name & Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39); // #111827
  doc.text(shopName, textStartX, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // #6b7280
  if (tagline) {
    doc.text(tagline.slice(0, 48), textStartX, y + 27);
  }

  const contactLine = [phone, email].filter(Boolean).join('  •  ');
  if (address) {
    doc.text(address.slice(0, 52), textStartX, y + 38);
  }
  if (contactLine) {
    doc.text(contactLine.slice(0, 52), textStartX, y + 49);
  }

  // ── Document Title & Meta (Top Right) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('CUSTOMER SALES REPORT', pageWidth - margin, y + 14, { align: 'right' });

  // Period string calculation
  let periodStr = FILTER_LABELS[filter] || 'All Time';
  if (filter === 'custom' && startDate && endDate) {
    periodStr = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
  } else if (filter === 'lastN' && lastN) {
    periodStr = `Last ${lastN} Sales`;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Period: ${periodStr}`, pageWidth - margin, y + 28, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${fmtDateTime(generatedAt)}`, pageWidth - margin, y + 40, { align: 'right' });
  doc.text(`Customer Code: ${customer.code || customer._id?.slice(-6)?.toUpperCase() || 'CUST'}`, pageWidth - margin, y + 51, { align: 'right' });

  y += 62;

  // ── Divider Line ──
  doc.setDrawColor(229, 231, 235); // #e5e7eb
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  y += 14;

  // ── Customer & Account Summary Boxes (Side by Side) ──
  const boxSpacing = 14;
  const boxWidth = (contentWidth - boxSpacing) / 2;
  const boxHeight = 78;

  // Box 1: Customer Details
  doc.setFillColor(249, 250, 251); // #f9fafb
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('CUSTOMER INFORMATION', margin + 12, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(customer.name || 'Walk-in Customer', margin + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${customer.phone || '—'}`, margin + 12, y + 49);
  doc.text(`Company: ${customer.companyName || customer.shopName || '—'}`, margin + 12, y + 62);
  if (customer.address) {
    doc.text(`Address: ${customer.address.slice(0, 36)}`, margin + 12, y + 73);
  }

  // Box 2: Account Statement Summary
  const box2X = margin + boxWidth + boxSpacing;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('STATEMENT FINANCIAL SUMMARY', box2X + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text('Total Invoiced:', box2X + 12, y + 33);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(fmtPKR(summary.totalSales), box2X + boxWidth - 12, y + 33, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Total Received:', box2X + 12, y + 48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(fmtPKR(summary.totalPaid), box2X + boxWidth - 12, y + 48, { align: 'right' });

  // Due row with colored pill
  const isCleared = (summary.totalDue || 0) <= 0;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Outstanding Due:', box2X + 12, y + 66);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(isCleared ? 5 : 220, isCleared ? 150 : 38, isCleared ? 105 : 38);
  doc.text(isCleared ? 'PKR 0 (Cleared)' : fmtPKR(summary.totalDue), box2X + boxWidth - 12, y + 66, { align: 'right' });

  y += boxHeight + 14;

  // ── KPI Quick Metric Cards ──
  const kpiCount = 4;
  const kpiSpacing = 8;
  const kpiWidth = (contentWidth - kpiSpacing * (kpiCount - 1)) / kpiCount;
  const kpiHeight = 36;

  const kpis = [
    { label: 'TOTAL BILLED', val: fmtPKR(summary.totalSales), color: [30, 41, 59] },
    { label: 'TOTAL PAID', val: fmtPKR(summary.totalPaid), color: [5, 150, 105] },
    { label: 'NET DUE', val: fmtPKR(summary.totalDue), color: isCleared ? [5, 150, 105] : [220, 38, 38] },
    { label: 'RECORD COUNT', val: `${summary.saleCount || sales.length} Sales`, color: [79, 70, 229] },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = margin + idx * (kpiWidth + kpiSpacing);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(kx, y, kpiWidth, kpiHeight, 3, 3, 'FD');

    // Accent line on left of each card
    doc.setFillColor(...kpi.color);
    doc.rect(kx, y, 2.5, kpiHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(kpi.label, kx + 8, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, kx + 8, y + 27);
  });

  y += kpiHeight + 18;

  // ── Section 1: Sales / Invoices Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`Sales & Invoices (${sales.length} records):`, margin, y);

  y += 8;

  const salesTableData = sales.map((s, idx) => {
    const saleIdStr = (s._id || '').toString();
    const invNo = s.invoiceNumber || s.invoiceId || (saleIdStr ? `INV-${saleIdStr.slice(-6).toUpperCase()}` : `INV-${idx + 1}`);
    const itemsText = (s.myProducts || [])
      .map((p) => `${p.product?.name || p.name || 'Item'} (×${p.quantity || 1})`)
      .slice(0, 3)
      .join(', ') + ((s.myProducts || []).length > 3 ? '...' : '');

    const due = s.dueAmount ?? Math.max(0, (s.totalAmount || 0) - (s.paidAmount || 0));
    const statusText = due <= 0 ? 'Paid' : (s.paidAmount > 0 ? 'Partial' : 'Unpaid');

    return [
      idx + 1,
      invNo,
      fmtDate(s.createdAt),
      itemsText || '—',
      fmtPKR(s.totalAmount),
      fmtPKR(s.paidAmount),
      fmtPKR(due),
      statusText,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'INVOICE ID', 'DATE', 'ITEMS / PRODUCTS', 'TOTAL (PKR)', 'PAID (PKR)', 'DUE (PKR)', 'STATUS']],
    body: salesTableData,
    foot: [
      [
        { content: `TOTAL BILLED (${sales.length} Invoices)`, colSpan: 4, styles: { fontStyle: 'bold', halign: 'left' } },
        { content: fmtPKR(summary.totalSales), styles: { fontStyle: 'bold', halign: 'right', textColor: [17, 24, 39] } },
        { content: fmtPKR(summary.totalPaid), styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        { content: fmtPKR(summary.totalDue), styles: { fontStyle: 'bold', halign: 'right', textColor: isCleared ? [5, 150, 105] : [220, 38, 38] } },
        { content: isCleared ? 'Cleared' : 'Pending', styles: { fontStyle: 'bold', halign: 'center' } },
      ],
    ],
    theme: 'striped',
    margin: { left: margin, right: margin, bottom: 60 },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 5.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 4.5,
      textColor: [17, 24, 39],
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontSize: 8,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { cellWidth: 58 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 72, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 68, halign: 'right' },
      6: { cellWidth: 68, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 50, halign: 'center' },
    },
    didParseCell: (data) => {
      // Color-code Due and Status in table
      if (data.section === 'body') {
        if (data.column.index === 6) {
          const rowDue = sales[data.row.index]?.dueAmount ?? 0;
          data.cell.styles.textColor = rowDue > 0 ? [220, 38, 38] : [5, 150, 105];
        }
        if (data.column.index === 7) {
          const text = String(data.cell.raw);
          if (text === 'Paid') data.cell.styles.textColor = [5, 150, 105];
          else if (text === 'Partial') data.cell.styles.textColor = [217, 119, 6];
          else data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  let currentY = doc.lastAutoTable.finalY + 18;

  // Check if we need to start a new page for Payments Table
  if (currentY > pageHeight - 160) {
    doc.addPage();
    currentY = 45;
  }

  // ── Section 2: Payments / Receipts Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`Payment Receipts & Settlements (${paymentBatches.length} records):`, margin, currentY);

  currentY += 8;

  if (paymentBatches.length === 0) {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, currentY, contentWidth, 32, 3, 3, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('No payment history recorded during this period.', margin + 14, currentY + 20);
    currentY += 46;
  } else {
    const payRows = paymentBatches.map((b, idx) => [
      idx + 1,
      b.batchId ? `BATCH-${b.batchId.slice(-8).toUpperCase()}` : `PAY-${idx + 1}`,
      fmtDateTime(b.date),
      b.paymentMethod || 'Cash',
      b.receivedBy?.name || 'Admin',
      b.note || '—',
      fmtPKR(b.totalAmount),
    ]);

    const totalBatchReceived = paymentBatches.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'RECEIPT / BATCH', 'DATE & TIME', 'METHOD', 'RECEIVED BY', 'NOTE / REFERENCE', 'AMOUNT PAID (PKR)']],
      body: payRows,
      foot: [
        [
          { content: `TOTAL RECEIVED IN PERIOD (${paymentBatches.length} Payments)`, colSpan: 6, styles: { fontStyle: 'bold', halign: 'left' } },
          { content: fmtPKR(totalBatchReceived), styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        ],
      ],
      theme: 'striped',
      margin: { left: margin, right: margin, bottom: 65 },
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 5.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        cellPadding: 4.5,
        textColor: [17, 24, 39],
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 24, 39],
        fontSize: 8,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 90, fontStyle: 'bold' },
        2: { cellWidth: 95 },
        3: { cellWidth: 55, halign: 'center' },
        4: { cellWidth: 70 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 85, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      },
    });

    currentY = doc.lastAutoTable.finalY + 18;
  }

  // ── Final Statement Status Banner & Signatures ──
  if (currentY > pageHeight - 110) {
    doc.addPage();
    currentY = 45;
  }

  // Settlement banner
  doc.setFillColor(isCleared ? 236 : 254, isCleared ? 253 : 242, isCleared ? 245 : 242);
  doc.setDrawColor(isCleared ? 167 : 254, isCleared ? 243 : 202, isCleared ? 208 : 202);
  doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isCleared ? 6 : 153, isCleared ? 95 : 27, isCleared ? 70 : 27);
  const statusBannerText = isCleared
    ? 'ACCOUNT STATUS: CLEARED — No outstanding balance as of statement date.'
    : `ACCOUNT STATUS: PENDING DUE — Net outstanding balance of ${fmtPKR(summary.totalDue)}.`;
  doc.text(statusBannerText, margin + 14, currentY + 19);

  currentY += 45;

  // ── Signature Blocks ──
  const sigY = Math.max(currentY, pageHeight - 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);

  // Customer signature
  doc.line(margin, sigY, margin + 130, sigY);
  doc.text('Customer Signature', margin + 15, sigY + 10);

  // Authorized signature
  doc.line(pageWidth - margin - 130, sigY, pageWidth - margin, sigY);
  doc.text('Authorized Receiver / Stamp', pageWidth - margin - 125, sigY + 10);

  // ── Universal Multi-page Footers ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);

    // Subtle top border for footer
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    const footerLeft = `${shopName} • Customer Sales Statement`;
    const footerCenter = `Page ${i} of ${totalPages}`;
    const footerRight = `Generated on ${fmtDateTime(new Date())}`;

    doc.text(footerLeft, margin, pageHeight - 14);
    doc.text(footerCenter, pageWidth / 2, pageHeight - 14, { align: 'center' });
    doc.text(footerRight, pageWidth - margin, pageHeight - 14, { align: 'right' });
  }

  // ── Document Metadata ──
  const safeCustomerName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const dateTag = new Date().toISOString().split('T')[0];
  const filename = `${safeCustomerName}_Sales_Statement_${dateTag}.pdf`;

  return { doc, filename };
}

/**
 * Generate and download Customer Sales Report PDF
 */
export async function generateCustomerReportPdf(reportData, opts = {}) {
  const { doc, filename } = await buildCustomerReportPdfDoc(reportData, opts);
  doc.save(filename);
  return { doc, filename };
}

/**
 * Generate Customer Sales Report as File / Blob object for sharing
 */
export async function getCustomerReportPdfFile(reportData, opts = {}) {
  const { doc, filename } = await buildCustomerReportPdfDoc(reportData, opts);
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { doc, blob, file, filename };
}

/* ─── WhatsApp message builder (FILTERS ONLY in text, NO breakdown) ─── */
export function buildWhatsAppMessage(reportData, opts = {}) {
  const { customer = {}, filter = 'all' } = reportData;
  const { lastN, startDate, endDate } = opts;

  let filterText = 'All Time';
  if (filter === 'custom' && startDate && endDate) {
    filterText = `From ${fmtDate(startDate)} to ${fmtDate(endDate)}`;
  } else if (filter === 'lastN' && lastN) {
    filterText = `Last ${lastN} Sales`;
  } else if (filter === '1week') {
    filterText = 'Last 7 Days';
  } else if (filter === '1month') {
    filterText = 'Last 30 Days';
  } else if (filter === '3months') {
    filterText = 'Last 3 Months';
  } else if (filter === '6months') {
    filterText = 'Last 6 Months';
  } else if (filter === '1year') {
    filterText = 'Last 1 Year';
  } else if (FILTER_LABELS[filter]) {
    filterText = FILTER_LABELS[filter];
  }

  // Filter text only (e.g. from date__ to date__) without sales details
  const lines = [
    `📄 *Sales Report Statement*`,
    `👤 *Customer:* ${customer.name || 'Customer'}`,
    `🗓️ *Period:* ${filterText}`,
    ``,
    `📎 Attached: ${customer.name ? `${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_Sales_Statement.pdf` : 'Sales_Statement.pdf'}`,
  ];
  return lines.join('\n');
}

export function openWhatsApp(phone, message) {
  let num = String(phone || '').replace(/\D/g, '');
  if (num.startsWith('0')) num = '92' + num.slice(1);
  if (!num.startsWith('92') && num.length === 10) num = '92' + num;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

/**
 * Share Report with PDF attachment via Web Share API or download + WhatsApp fallback
 */
export async function shareCustomerReportOnWhatsApp({ reportData, opts = {}, message = '' }) {
  const { doc, file, filename } = await getCustomerReportPdfFile(reportData, opts);
  const textMsg = message || buildWhatsAppMessage(reportData, opts);
  const phone = reportData?.customer?.phone || '';

  // 1. Check if browser supports Web Share API with files (Android, iOS, supported desktop apps)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: textMsg,
      });
      return { success: true, mode: 'native_share', filename };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, mode: 'cancelled' };
      }
      console.warn('Native file share failed, falling back to download + web chat:', err);
    }
  }

  // 2. Fallback for Desktop Browsers (e.g. Chrome on Windows without OS share):
  // Download the PDF file directly so user has it immediately, then open WhatsApp chat
  doc.save(filename);
  if (phone) {
    openWhatsApp(phone, textMsg);
  }
  return { success: true, mode: 'downloaded_and_opened', filename };
}

