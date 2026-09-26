import { jsPDF } from 'jspdf';
import type { Booking, PrintOrder, Studio } from '../db/types.js';

export function generateBookingReceiptPDF(booking: Booking, studio?: Studio) {
  const doc = new jsPDF();

  // Header banner
  doc.setFillColor(44, 42, 41);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CAINTA PHOTOGRAPHY STUDIO MIS', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('OFFICIAL BOOKING CONFIRMATION & RECEIPT', 14, 26);

  doc.setTextColor(200, 200, 200);
  doc.text(`Issued: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}`, 150, 26);

  // Studio & Customer Details
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Studio Information', 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Studio: ${studio?.name || 'Accredited Cainta Studio'}`, 14, 55, { maxWidth: 90 });
  doc.text(`Location: ${studio?.address || 'Cainta, Rizal'}`, 14, 61, { maxWidth: 90 });
  doc.text(`Contact: ${studio?.contactInfo || studio?.email || 'cainta-studios.ph'}`, 14, 69, { maxWidth: 90 });

  doc.setFont('helvetica', 'bold');
  doc.text('Client Information', 115, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client Name: ${booking.customerName}`, 115, 55, { maxWidth: 85 });
  doc.text(`Email: ${booking.customerEmail}`, 115, 61, { maxWidth: 85 });
  doc.text(`Phone: ${booking.customerPhone || 'N/A'}`, 115, 69, { maxWidth: 85 });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 78, 196, 78);

  // Reservation details
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Summary', 14, 85);

  doc.setFont('helvetica', 'normal');
  doc.text(`Booking Reference ID: ${booking.id}`, 14, 92);
  doc.text(`Scheduled Date: ${booking.bookingDate}`, 14, 99);
  doc.text(`Time Slot: ${booking.timeSlot}`, 14, 106);
  doc.text(`Status: ${booking.status}`, 14, 113);

  // Financial Table
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 120, 182, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item / Description', 18, 126);
  doc.text('Amount (PHP)', 160, 126);

  let y = 138;
  doc.setFont('helvetica', 'normal');
  doc.text('Primary Photography Session / Package', 18, y);
  doc.text(`PHP ${(booking.totalAmount - booking.addons.reduce((a, b) => a + b.price * b.quantity, 0)).toLocaleString()}`, 160, y);

  if (booking.addons && booking.addons.length > 0) {
    booking.addons.forEach(addon => {
      y += 8;
      doc.text(`Addon: ${addon.name} (x${addon.quantity})`, 18, y);
      doc.text(`PHP ${(addon.price * addon.quantity).toLocaleString()}`, 160, y);
    });
  }

  y += 12;
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Contract Amount:', 110, y);
  doc.text(`PHP ${booking.totalAmount.toLocaleString()}`, 160, y);

  y += 7;
  doc.text('Amount Paid / Deposited:', 110, y);
  doc.setTextColor(22, 163, 74);
  doc.text(`PHP ${booking.amountPaid.toLocaleString()}`, 160, y);

  y += 7;
  doc.setTextColor(40, 40, 40);
  doc.text('Remaining Balance Due:', 110, y);
  doc.setTextColor(185, 28, 28);
  doc.text(`PHP ${booking.remainingBalance.toLocaleString()}`, 160, y);

  // Footer Note
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Please present this electronic or printed receipt upon arrival at the studio. Thank you for booking through Cainta Photography Studio MIS!', 14, 260);

  doc.save(`Receipt-${booking.id}.pdf`);
}

export function generatePrintReceiptPDF(order: PrintOrder, studio?: Studio) {
  const doc = new jsPDF();

  // Header banner
  doc.setFillColor(44, 42, 41);
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CAINTA PHOTOGRAPHY STUDIO MIS', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('OFFICIAL PRINT ORDER RECEIPT', 14, 26);

  doc.setTextColor(200, 200, 200);
  doc.text(`Issued: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}`, 150, 26);

  // Studio & Customer Details
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Studio Information', 14, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Studio: ${studio?.name || 'Accredited Cainta Studio'}`, 14, 55, { maxWidth: 90 });
  doc.text(`Location: ${studio?.address || 'Cainta, Rizal'}`, 14, 61, { maxWidth: 90 });

  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 115, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${order.id}`, 115, 55, { maxWidth: 85 });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 115, 61, { maxWidth: 85 });
  doc.text(`Status: ${order.status.toUpperCase()}`, 115, 69, { maxWidth: 85 });

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 74, 196, 74);

  // Financial Table
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 82, 182, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item / Description', 18, 88);
  doc.text('Qty', 130, 88);
  doc.text('Amount (PHP)', 160, 88);

  let y = 100;
  doc.setFont('helvetica', 'normal');
  doc.text('Physical Print Fulfillment', 18, y);
  doc.text(`${order.quantity}`, 130, y);
  doc.text(`PHP ${order.totalAmount.toLocaleString()}`, 160, y);

  y += 12;
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount Paid:', 110, y);
  doc.setTextColor(22, 163, 74);
  doc.text(`PHP ${order.totalAmount.toLocaleString()}`, 160, y);

  if (order.shippingAddress) {
    y += 12;
    doc.setTextColor(40, 40, 40);
    doc.text('Shipping Address:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.shippingAddress, 14, y + 7, { maxWidth: 180 });
  }

  // Footer Note
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing Cainta Photography Studio MIS for your physical prints!', 14, 260);

  doc.save(`Print-Receipt-${order.id}.pdf`);
}

export function generateSalesReportPDF(title: string, data: { date: string; revenue: number }[], totalRevenue: number) {
  const doc = new jsPDF();

  doc.setFillColor(44, 42, 41);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CAINTA PHOTOGRAPHY STUDIO MIS', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text(title.toUpperCase(), 14, 24);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Aggregated Revenue: PHP ${totalRevenue.toLocaleString()}`, 14, 44);

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 52, 182, 9, 'F');
  doc.setFontSize(9);
  doc.text('Date', 20, 58);
  doc.text('Verified Sales (PHP)', 140, 58);

  let y = 68;
  doc.setFont('helvetica', 'normal');
  data.forEach((row, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(row.date, 20, y);
    doc.text(`PHP ${row.revenue.toLocaleString()}`, 140, y);
    y += 7;
  });

  doc.save(`Cainta-MIS-Sales-Report-${new Date().toISOString().substring(0, 10)}.pdf`);
}

export interface PDFMonthlyDataRow {
  month: string;
  fullName: string;
  revenue: number;
  prevRevenue: number;
  momGrowthPct: number;
  target: number;
  bookings: number;
  completed: number;
  avgBookingValue: number;
}

export interface PDFAnalyticsSummary {
  totalRev: number;
  totalBookings: number;
  totalCompleted: number;
  avgMonthlyRev: number;
  avgOrderValue: number;
  completionRate: string;
  momGrowthPct: number;
  peakMonth?: string;
  peakRevenue?: number;
}

export function generateStudioAnalyticsPDF(
  studioName: string,
  timeframeName: string,
  monthlyData: PDFMonthlyDataRow[],
  summary: PDFAnalyticsSummary,
  categoryBreakdown?: Array<{ name: string; bookings: number; revenue: number }>
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Top header banner
  doc.setFillColor(44, 42, 41);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CAINTA PHOTOGRAPHY STUDIO MIS', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('STUDIO REVENUE & BOOKING TREND AUDIT RECORD', 14, 24);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`, 135, 24);

  // Studio & Timeframe subheader
  let y = 46;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(studioName, 14, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Reporting Period: ${timeframeName}  |  Certified Studio Owner Record`, 14, y + 6);

  // KPI Summary Boxes
  y += 14;
  const boxWidth = 43;
  const boxHeight = 22;

  // Box 1: Total Revenue
  doc.setFillColor(250, 248, 246);
  doc.setDrawColor(220, 215, 210);
  doc.roundedRect(14, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 110, 105);
  doc.text('TOTAL REVENUE', 18, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text(`PHP ${summary.totalRev.toLocaleString()}`, 18, y + 14);
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Verified Gross Intake', 18, y + 19);

  // Box 2: Total Bookings
  doc.setFillColor(250, 248, 246);
  doc.roundedRect(61, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 110, 105);
  doc.text('BOOKINGS LOGGED', 65, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`${summary.totalBookings} Sessions`, 65, y + 14);
  doc.setFontSize(6.5);
  doc.setTextColor(22, 163, 74);
  doc.text(`${summary.completionRate}% shoot fulfillment`, 65, y + 19);

  // Box 3: Avg Booking Value (AOV)
  doc.setFillColor(250, 248, 246);
  doc.roundedRect(108, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 110, 105);
  doc.text('AVG VALUE (AOV)', 112, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`PHP ${summary.avgOrderValue.toLocaleString()}`, 112, y + 14);
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Per completed booking', 112, y + 19);

  // Box 4: MoM Growth
  doc.setFillColor(250, 248, 246);
  doc.roundedRect(155, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 110, 105);
  doc.text('MoM GROWTH', 159, y + 6);
  doc.setFontSize(11);
  if (summary.momGrowthPct >= 0) {
    doc.setTextColor(22, 163, 74);
    doc.text(`+${summary.momGrowthPct.toFixed(1)}%`, 159, y + 14);
  } else {
    doc.setTextColor(225, 29, 72);
    doc.text(`${summary.momGrowthPct.toFixed(1)}%`, 159, y + 14);
  }
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Active vs Prior Month', 159, y + 19);

  // Table Section: Monthly Revenue and Booking Trends
  y += boxHeight + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Monthly Revenue & Booking Trend Trajectory', 14, y);

  y += 5;
  // Table Header row
  doc.setFillColor(44, 42, 41);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Month / Period', 18, y + 5.5);
  doc.text('Revenue (PHP)', 62, y + 5.5);
  doc.text('Target (PHP)', 96, y + 5.5);
  doc.text('MoM Growth', 126, y + 5.5);
  doc.text('Bookings', 150, y + 5.5);
  doc.text('Completed', 168, y + 5.5);
  doc.text('Avg Session', 183, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  monthlyData.forEach((row, i) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(252, 250, 248);
      doc.rect(14, y, 182, 7, 'F');
    }

    doc.setTextColor(40, 40, 40);
    doc.text(row.fullName || row.month, 18, y + 5);
    doc.text(`PHP ${row.revenue.toLocaleString()}`, 62, y + 5);
    doc.setTextColor(120, 120, 120);
    doc.text(`PHP ${row.target.toLocaleString()}`, 96, y + 5);

    // MoM Growth text color
    if (row.momGrowthPct >= 0) {
      doc.setTextColor(22, 163, 74);
      doc.text(`+${row.momGrowthPct}%`, 126, y + 5);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text(`${row.momGrowthPct}%`, 126, y + 5);
    }

    doc.setTextColor(40, 40, 40);
    doc.text(`${row.bookings}`, 150, y + 5);
    doc.text(`${row.completed}`, 168, y + 5);
    doc.text(`PHP ${row.avgBookingValue.toLocaleString()}`, 183, y + 5);

    y += 7;
  });

  // Total Summary Row
  doc.setFillColor(240, 235, 230);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('AGGREGATED TOTALS:', 18, y + 5.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`PHP ${summary.totalRev.toLocaleString()}`, 62, y + 5.5);
  const totalTarget = monthlyData.reduce((acc, r) => acc + r.target, 0);
  doc.setTextColor(80, 80, 80);
  doc.text(`PHP ${totalTarget.toLocaleString()}`, 96, y + 5.5);
  doc.text(`${summary.momGrowthPct >= 0 ? '+' : ''}${summary.momGrowthPct.toFixed(1)}%`, 126, y + 5.5);
  doc.text(`${summary.totalBookings}`, 150, y + 5.5);
  doc.text(`${summary.totalCompleted}`, 168, y + 5.5);
  doc.text(`PHP ${summary.avgOrderValue.toLocaleString()}`, 183, y + 5.5);

  y += 14;

  // Category Breakdown Section if space permits
  if (categoryBreakdown && categoryBreakdown.length > 0 && y <= 230) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Service Package & Category Revenue Contribution', 14, y);
    y += 4;

    doc.setFillColor(230, 225, 220);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    doc.text('Service Category', 18, y + 4.5);
    doc.text('Bookings', 110, y + 4.5);
    doc.text('Revenue Generated (PHP)', 145, y + 4.5);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    categoryBreakdown.forEach((cat, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(252, 250, 248);
        doc.rect(14, y, 182, 5.5, 'F');
      }
      doc.setTextColor(40, 40, 40);
      doc.text(cat.name, 18, y + 4);
      doc.text(`${cat.bookings} sessions`, 110, y + 4);
      doc.text(`PHP ${cat.revenue.toLocaleString()}`, 145, y + 4);
      y += 5.5;
    });
  }

  // Footer stamp & certification notice
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 275, 196, 275);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Cainta Photography Studio MIS • Confidential Official Owner Record • Verified GCash & Studio Collections',
    14,
    280
  );
  doc.text(
    `Page 1 of 1 • System ID: ${studioName.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString().slice(-6)}`,
    150,
    280
  );

  const cleanStudioName = studioName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = new Date().toISOString().substring(0, 10);
  doc.save(`${cleanStudioName}_Revenue_Booking_Trends_${dateStamp}.pdf`);
}

export function generateBookingsDateRangePDF(studioName: string, bookings: Booking[], startDate: string, endDate: string) {
  const filtered = bookings.filter(b => {
    if (!b.bookingDate) return false;
    return b.bookingDate >= startDate && b.bookingDate <= endDate;
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(44, 42, 41);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CAINTA PHOTOGRAPHY STUDIO MIS', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('BOOKING DATE RANGE AUDIT REPORT', 14, 24);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Studio: ${studioName}`, 14, 46);
  doc.text(`Period: ${startDate} to ${endDate} (${filtered.length} bookings)`, 14, 52);

  let y = 62;
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(9);
  doc.text('Date', 16, y + 6);
  doc.text('Customer', 45, y + 6);
  doc.text('Status', 105, y + 6);
  doc.text('Total (PHP)', 140, y + 6);
  doc.text('Balance', 175, y + 6);

  y += 12;
  doc.setFont('helvetica', 'normal');
  filtered.forEach(b => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(b.bookingDate, 16, y);
    doc.text(b.customerName, 45, y, { maxWidth: 55 });
    doc.text(b.status, 105, y);
    doc.text(`PHP ${b.totalAmount.toLocaleString()}`, 140, y);
    doc.text(`PHP ${b.remainingBalance.toLocaleString()}`, 175, y);
    y += 8;
  });

  doc.save(`${studioName.replace(/[^a-zA-Z0-9]/g, '_')}_Bookings_${startDate}_to_${endDate}.pdf`);
}

