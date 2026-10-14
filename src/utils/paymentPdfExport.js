// src/utils/paymentPdfExport.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (v) => (Number(v) || 0).toLocaleString();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const DEFAULT_LOGO_URL = 'https://res.cloudinary.com/dm1dxc98q/image/upload/v1767645526/company/logo.png';

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
  } catch {
    return null;
  }
}

/**
 * Generate PDF for Payments History list (supporting single page or full export)
 */
export const generatePaymentsPDFClient = async ({
  paymentEvents = [],
  startDate,
  endDate,
  filterDescription = '',
  company = null,
  filename = 'payments-report.pdf',
  currentPage = 1,
  totalPages = 1,
  isCurrentPageOnly = false,
}) => {
  const logoUrl = company?.logo || DEFAULT_LOGO_URL;
  const logoData = await loadLogoData(logoUrl);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const shopName = company?.shopName || 'Karachi Auto Parts';
  const address  = company?.address || '';
  const email    = company?.email || '';
  const phone    = company?.phone || '';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  let y = 42;

  // Header Title & Logo
  let textStartX = margin;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, y - 5, 46, 46);
      textStartX = margin + 56;
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39); // #111827
  doc.text(shopName, textStartX, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128); // #6b7280
  if (address) {
    doc.text(address.slice(0, 52), textStartX, y + 25);
  }
  if (email || phone) {
    doc.text([email, phone].filter(Boolean).join(' • ').slice(0, 52), textStartX, y + 37);
  }

  // Report Title Right-Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39);

  const reportTitle = isCurrentPageOnly
    ? `PAYMENTS (PAGE ${currentPage} OF ${totalPages})`
    : 'PAYMENTS REPORT';
  doc.text(reportTitle, pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${fmtDateTime(new Date())}`, pageWidth - margin, y + 16, { align: 'right' });

  if (isCurrentPageOnly) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Page ${currentPage} of ${totalPages} Payment History`, pageWidth - margin, y + 28, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
  } else if (startDate && endDate) {
    doc.text(`Period: ${fmtDate(startDate)} – ${fmtDate(endDate)}`, pageWidth - margin, y + 28, { align: 'right' });
  }

  y += 45;

  // Divider Line
  doc.setDrawColor(229, 231, 235); // #e5e7eb
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  y += 15;

  // Prepare table rows
  let totalAmount = 0;
  const tableData = paymentEvents.map((p, idx) => {
    totalAmount += (p.totalAmount || 0);
    const rowNum = isCurrentPageOnly ? ((currentPage - 1) * 25 + idx + 1) : (idx + 1);
    return [
      rowNum,
      fmtDateTime(p.date),
      p.customer?.name || 'Walk-in Customer',
      p.paymentMethod || 'Cash',
      `PKR ${fmt(p.totalAmount)}`,
      p.receivedBy?.name || 'Admin',
    ];
  });

  const footLabel = isCurrentPageOnly
    ? `TOTAL FOR PAGE ${currentPage} OF ${totalPages} (${paymentEvents.length} Payments)`
    : `TOTALS (${paymentEvents.length} Payments)`;

  // Table Generation with autoTable
  autoTable(doc, {
    startY: y,
    head: [['#', 'DATE & TIME', 'CUSTOMER', 'METHOD', 'AMOUNT', 'RECEIVED BY']],
    body: tableData,
    foot: [
      [
        { content: footLabel, colSpan: 4, styles: { fontStyle: 'bold', halign: 'left' } },
        { content: `PKR ${fmt(totalAmount)}`, styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        { content: '', styles: {} },
      ]
    ],
    theme: 'striped',
    margin: { left: margin, right: margin, top: 50, bottom: 50 },
    headStyles: {
      fillColor: [5, 150, 105], // emerald #059669
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [17, 24, 39],
    },
    footStyles: {
      fillColor: [243, 244, 246], // #f3f4f6
      textColor: [17, 24, 39],
      fontSize: 9,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // #f9fafb
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 105 },
      2: { cellWidth: 137 },
      3: { cellWidth: 65, halign: 'center' },
      4: { cellWidth: 90, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 90 },
    },
    didDrawPage: () => {
      // Page Footer on all pages
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);

      const footerLabel = isCurrentPageOnly
        ? `${shopName} • Payment History (Page ${currentPage} of ${totalPages}) • Doc Page ${pageNumber}`
        : `${shopName} • Payments Report • Page ${pageNumber}`;

      doc.text(footerLabel, pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.text(`Generated on ${fmtDateTime(new Date())}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    },
  });

  doc.save(filename);
};

/**
 * Generate PDF for a Single Payment Receipt / Voucher
 */
export const generateSinglePaymentPDF = async ({
  batch,
  company = null,
  filename = 'payment-receipt.pdf',
}) => {
  const logoUrl = company?.logo || DEFAULT_LOGO_URL;
  const logoData = await loadLogoData(logoUrl);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const shopName = company?.shopName || 'Karachi Auto Parts';
  const address  = company?.address || '';
  const email    = company?.email || '';
  const phone    = company?.phone || '';

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  let y = 42;

  // Header Title & Logo
  let textStartX = margin;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, y - 5, 46, 46);
      textStartX = margin + 56;
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39);
  doc.text(shopName, textStartX, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  if (address) doc.text(address.slice(0, 52), textStartX, y + 25);
  if (email || phone) doc.text([email, phone].filter(Boolean).join(' • ').slice(0, 52), textStartX, y + 37);

  // Right Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(5, 150, 105);
  doc.text('PAYMENT RECEIPT', pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const dateStr = fmtDateTime(batch?.date);
  doc.text(`Date & Time: ${dateStr}`, pageWidth - margin, y + 16, { align: 'right' });
  doc.text(`Batch ID: ${batch?.batchId?.slice(-10) || '—'}`, pageWidth - margin, y + 28, { align: 'right' });

  y += 45;

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  y += 18;

  // Customer & Payment Info Boxes (Side by side)
  const boxWidth = (pageWidth - (margin * 2) - 15) / 2;
  const boxHeight = 70;

  // Box 1: Customer Details
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 4, 4, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('CUSTOMER INFORMATION', margin + 12, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(batch?.customer?.name || 'Walk-in Customer', margin + 12, y + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(batch?.customer?.phone || 'No phone provided', margin + 12, y + 49);
  if (batch?.customer?.address) {
    doc.text(batch.customer.address, margin + 12, y + 62);
  }

  // Box 2: Payment Details
  const box2X = margin + boxWidth + 15;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 4, 4, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('PAYMENT DETAILS', box2X + 12, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(`Method: `, box2X + 12, y + 33);
  doc.setFont('helvetica', 'bold');
  doc.text(`${batch?.paymentMethod || 'Cash'}`, box2X + 55, y + 33);

  doc.setFont('helvetica', 'normal');
  doc.text(`Received By: `, box2X + 12, y + 48);
  doc.setFont('helvetica', 'bold');
  doc.text(`${batch?.receivedBy?.name || 'Admin'}`, box2X + 75, y + 48);

  if (batch?.note) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text(`Ref / Note: "${batch.note}"`, box2X + 12, y + 63);
  }

  y += boxHeight + 15;

  // Amount Received Banner
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 36, 4, 4, 'F');
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 36, 4, 4, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('TOTAL AMOUNT RECEIVED:', margin + 16, y + 22);

  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105);
  doc.text(`PKR ${fmt(batch?.totalAmount)}`, pageWidth - margin - 16, y + 24, { align: 'right' });

  y += 50;

  // Table of Sales Fulfilled by this payment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`Sales Fulfilled by this Payment (${batch?.allocations?.length || 0} sales):`, margin, y);

  y += 8;

  const allocationsData = (batch?.allocations || []).map((a, idx) => {
    const saleIdStr = (a.sale?._id || a.sale || '').toString();
    const invNo = a.sale?.invoiceNumber || (saleIdStr ? `INV-${saleIdStr.slice(-6).toUpperCase()}` : 'INV-—');
    const isCleared = (a.saleDueAfter || 0) <= 0;
    return [
      idx + 1,
      invNo,
      `PKR ${fmt(a.appliedAmount)}`,
      `PKR ${fmt(a.saleDueBefore)}`,
      `PKR ${fmt(a.saleDueAfter)}`,
      isCleared ? 'Cleared' : `PKR ${fmt(a.saleDueAfter)} Due`,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'INVOICE ID', 'APPLIED AMOUNT', 'DUE BEFORE', 'DUE AFTER', 'STATUS']],
    body: allocationsData,
    foot: [
      [
        { content: `TOTAL APPLIED (${batch?.allocations?.length || 0} Sales)`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } },
        { content: `PKR ${fmt(batch?.totalAmount)}`, styles: { fontStyle: 'bold', halign: 'right', textColor: [5, 150, 105] } },
        { content: '', colSpan: 3, styles: {} },
      ]
    ],
    theme: 'striped',
    margin: { left: margin, right: margin, bottom: 70 },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [17, 24, 39],
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontSize: 9,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 100, fontStyle: 'bold' },
      2: { cellWidth: 105, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      3: { cellWidth: 95, halign: 'right' },
      4: { cellWidth: 95, halign: 'right' },
      5: { cellWidth: 92, halign: 'center', fontStyle: 'bold' },
    },
    didDrawPage: () => {
      // Signatures
      const finalY = pageHeight - 60;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.5);
      doc.line(margin, finalY - 5, margin + 140, finalY - 5);
      doc.text('Customer Signature', margin + 20, finalY + 8);

      doc.line(pageWidth - margin - 140, finalY - 5, pageWidth - margin, finalY - 5);
      doc.text('Authorized Receiver Signature', pageWidth - margin - 130, finalY + 8);

      doc.text(`${shopName} • Payment Receipt • Page ${doc.internal.getNumberOfPages()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    },
  });

  doc.save(filename);
};
