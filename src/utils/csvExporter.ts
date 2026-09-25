import type { Booking } from '../db/types.js';

export interface MonthlyDataRow {
  month: string;
  fullName: string;
  revenue: number;
  prevRevenue: number;
  momGrowthPct: number;
  target: number;
  bookings: number;
  completed: number;
  pending: number;
  avgBookingValue: number;
}

export interface AnalyticsSummaryData {
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

export interface ExportAnalyticsOptions {
  studioName: string;
  timeframeName: string;
  monthlyData: MonthlyDataRow[];
  summary: AnalyticsSummaryData;
  bookings?: Booking[];
  includeIndividualBookings?: boolean;
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports studio revenue and booking trend data as an RFC-4180 compliant CSV
 * with UTF-8 Byte Order Mark (BOM) for seamless Microsoft Excel and Google Sheets compatibility.
 */
export function exportStudioAnalyticsCSV({
  studioName,
  timeframeName,
  monthlyData,
  summary,
  bookings = [],
  includeIndividualBookings = false
}: ExportAnalyticsOptions): void {
  const lines: string[] = [];

  // Metadata Section
  lines.push([escapeCSV('STUDIO ANALYTICS & BOOKING TREND REPORT'), escapeCSV('')].join(','));
  lines.push([escapeCSV('Studio Name:'), escapeCSV(studioName)].join(','));
  lines.push([escapeCSV('Reporting Period:'), escapeCSV(timeframeName)].join(','));
  lines.push([escapeCSV('Generated Date:'), escapeCSV(new Date().toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'medium' }))].join(','));
  lines.push([escapeCSV('MIS System:'), escapeCSV('Cainta Photography Studio Management Information System')].join(','));
  lines.push(''); // blank separator

  // Section 1: Executive KPI Summary
  lines.push([escapeCSV('--- EXECUTIVE PERFORMANCE SUMMARY ---')].join(','));
  lines.push([
    escapeCSV('Total Revenue (PHP)'),
    escapeCSV('Total Bookings Logged'),
    escapeCSV('Completed Sessions'),
    escapeCSV('Session Completion Rate (%)'),
    escapeCSV('Average Monthly Revenue (PHP)'),
    escapeCSV('Average Booking Value (AOV - PHP)'),
    escapeCSV('Current MoM Growth Rate (%)'),
    escapeCSV('Peak Performance Month')
  ].join(','));

  lines.push([
    escapeCSV(summary.totalRev),
    escapeCSV(summary.totalBookings),
    escapeCSV(summary.totalCompleted),
    escapeCSV(`${summary.completionRate}%`),
    escapeCSV(summary.avgMonthlyRev),
    escapeCSV(summary.avgOrderValue),
    escapeCSV(`${summary.momGrowthPct >= 0 ? '+' : ''}${summary.momGrowthPct.toFixed(1)}%`),
    escapeCSV(`${summary.peakMonth || 'N/A'} (PHP ${(summary.peakRevenue || 0).toLocaleString()})`)
  ].join(','));
  lines.push(''); // blank separator

  // Section 2: Monthly Breakdown (Revenue & Booking Trends)
  lines.push([escapeCSV('--- MONTHLY REVENUE & BOOKING TRENDS ---')].join(','));
  lines.push([
    escapeCSV('Month Code'),
    escapeCSV('Calendar Period'),
    escapeCSV('Gross Revenue (PHP)'),
    escapeCSV('Prior Month Revenue (PHP)'),
    escapeCSV('Revenue Target (PHP)'),
    escapeCSV('Target Variance (PHP)'),
    escapeCSV('MoM Revenue Growth (%)'),
    escapeCSV('Total Bookings'),
    escapeCSV('Completed Sessions'),
    escapeCSV('Pending/In-Progress Sessions'),
    escapeCSV('Avg Value per Session (PHP)')
  ].join(','));

  monthlyData.forEach(row => {
    const variance = row.revenue - row.target;
    lines.push([
      escapeCSV(row.month),
      escapeCSV(row.fullName),
      escapeCSV(row.revenue),
      escapeCSV(row.prevRevenue),
      escapeCSV(row.target),
      escapeCSV(variance),
      escapeCSV(`${row.momGrowthPct >= 0 ? '+' : ''}${row.momGrowthPct}%`),
      escapeCSV(row.bookings),
      escapeCSV(row.completed),
      escapeCSV(row.pending),
      escapeCSV(row.avgBookingValue)
    ].join(','));
  });

  // Totals Row
  const totalTarget = monthlyData.reduce((acc, r) => acc + r.target, 0);
  const totalVariance = summary.totalRev - totalTarget;
  lines.push([
    escapeCSV('TOTAL / SUMMARY'),
    escapeCSV(`${monthlyData.length} Months Aggregated`),
    escapeCSV(summary.totalRev),
    escapeCSV(''),
    escapeCSV(totalTarget),
    escapeCSV(totalVariance),
    escapeCSV(`${summary.momGrowthPct >= 0 ? '+' : ''}${summary.momGrowthPct.toFixed(1)}%`),
    escapeCSV(summary.totalBookings),
    escapeCSV(summary.totalCompleted),
    escapeCSV(summary.totalBookings - summary.totalCompleted),
    escapeCSV(summary.avgOrderValue)
  ].join(','));
  lines.push(''); // blank separator

  // Optional Section 3: Individual Booking Records
  if (includeIndividualBookings && bookings.length > 0) {
    lines.push([escapeCSV('--- DETAILED BOOKING TRANSACTION LOG ---')].join(','));
    lines.push([
      escapeCSV('Booking ID'),
      escapeCSV('Scheduled Date'),
      escapeCSV('Time Slot'),
      escapeCSV('Customer Name'),
      escapeCSV('Customer Email'),
      escapeCSV('Customer Phone'),
      escapeCSV('Booking Status'),
      escapeCSV('Addons Count'),
      escapeCSV('Total Amount (PHP)'),
      escapeCSV('Amount Paid (PHP)'),
      escapeCSV('Remaining Balance (PHP)')
    ].join(','));

    bookings.forEach(b => {
      lines.push([
        escapeCSV(b.id),
        escapeCSV(b.bookingDate),
        escapeCSV(b.timeSlot),
        escapeCSV(b.customerName),
        escapeCSV(b.customerEmail),
        escapeCSV(b.customerPhone || 'N/A'),
        escapeCSV(b.status),
        escapeCSV(b.addons?.length || 0),
        escapeCSV(b.totalAmount),
        escapeCSV(b.amountPaid),
        escapeCSV(b.remainingBalance)
      ].join(','));
    });
    lines.push('');
  }

  // Generate File & Trigger Browser Download
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanStudioName = studioName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateStamp = new Date().toISOString().substring(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanStudioName}_Revenue_Booking_Trends_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBookingsDateRangeCSV(studioName: string, bookings: Booking[], startDate: string, endDate: string) {
  const filtered = bookings.filter(b => {
    if (!b.bookingDate) return false;
    return b.bookingDate >= startDate && b.bookingDate <= endDate;
  });

  const lines: string[] = [];
  lines.push([escapeCSV('STUDIO BOOKING DATE RANGE REPORT'), escapeCSV('')].join(','));
  lines.push([escapeCSV('Studio Name:'), escapeCSV(studioName)].join(','));
  lines.push([escapeCSV('Date Range:'), escapeCSV(`${startDate} to ${endDate}`)].join(','));
  lines.push([escapeCSV('Total Bookings Exported:'), escapeCSV(filtered.length)].join(','));
  lines.push('');

  lines.push([
    escapeCSV('Booking ID'),
    escapeCSV('Date'),
    escapeCSV('Time Slot'),
    escapeCSV('Customer Name'),
    escapeCSV('Email'),
    escapeCSV('Phone'),
    escapeCSV('Status'),
    escapeCSV('Payment Status'),
    escapeCSV('Total (PHP)'),
    escapeCSV('Paid (PHP)'),
    escapeCSV('Balance (PHP)')
  ].join(','));

  filtered.forEach(b => {
    lines.push([
      escapeCSV(b.id),
      escapeCSV(b.bookingDate),
      escapeCSV(b.timeSlot),
      escapeCSV(b.customerName),
      escapeCSV(b.customerEmail),
      escapeCSV(b.customerPhone || 'N/A'),
      escapeCSV(b.status),
      escapeCSV(b.paymentStatus),
      escapeCSV(b.totalAmount),
      escapeCSV(b.amountPaid),
      escapeCSV(b.remainingBalance)
    ].join(','));
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanStudioName = studioName.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanStudioName}_Bookings_${startDate}_to_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
