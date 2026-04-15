import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { VendorQuotation } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function cleanHeader(x: string) {
  return x
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, h => h.toUpperCase());
}

function buildStyledHtmlTable(data: any[], title: string = 'Export') {
  if (!data?.length) return '';
  const headers = Object.keys(data[0]);
  const headerStyle = 'font-weight:bold;color:#1B4F72;background:#EAF3FB;';

  const rows = [
    `<tr>${headers.map(h => `<th style="${headerStyle}padding:8px;border:1px solid #CCC;">${cleanHeader(h)}</th>`).join('')}</tr>`,
    ...data.map(row => `<tr>${headers.map(h => `<td style="padding:8px;border:1px solid #CCC;">${row[h] ?? ''}</td>`).join('')}</tr>`) 
  ];

  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>table{border-collapse:collapse;width:100%;font-family:Arial,sans-serif;}th{text-align:left;}</style></head><body><h3>${title}</h3><table>${rows.join('')}</table></body></html>`;
}

export function exportToExcel(data: any[], filename: string) {
  if (!data.length) return;
  const html = buildStyledHtmlTable(data, filename.replace(/\.xls[x]?$/i, ''));
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function exportToPDF(data: any[], title = 'Export') {
  const html = buildStyledHtmlTable(data, title);
  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 400);
}

interface QuotationComparisonPDFOptions {
  poNumber: string;
  poFrom?: string;
  poTo?: string;
  poBudget?: number;
  quotations: VendorQuotation[];
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function exportQuotationComparisonPDF(opts: QuotationComparisonPDFOptions) {
  const { poNumber, poFrom, poTo, poBudget, quotations } = opts;

  const submittedQuotations = quotations.filter(q => q.status === 'submitted');
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build unique activity keys across all quotations
  type ActivityKey = { product: string; crop: string; activity: string; region: string };
  const activityMap = new Map<string, ActivityKey>();
  submittedQuotations.forEach(vq => {
    vq.items.forEach(it => {
      const key = `${vq.region}||${it.product}||${it.crop}||${it.activity}`;
      if (!activityMap.has(key)) {
        activityMap.set(key, { product: it.product, crop: it.crop, activity: it.activity, region: vq.region });
      }
    });
  });

  const activityKeys = Array.from(activityMap.entries()).sort((a, b) => {
    const ak = a[1], bk = b[1];
    return ak.region.localeCompare(bk.region) || ak.product.localeCompare(bk.product) || ak.crop.localeCompare(bk.crop) || ak.activity.localeCompare(bk.activity);
  });

  const vendors = submittedQuotations.map(vq => ({ id: vq.vendorId, name: vq.vendorName, code: vq.vendorCode || '', region: vq.region }));

  // Build a lookup: region||product||crop||activity -> vendorId -> { rate, qty, total, remarks }
  const lookup = new Map<string, Map<string, { rate?: number; qty: number; total: number; remarks?: string; alloc: number }>>();
  submittedQuotations.forEach(vq => {
    vq.items.forEach(it => {
      const key = `${vq.region}||${it.product}||${it.crop}||${it.activity}`;
      if (!lookup.has(key)) lookup.set(key, new Map());
      const vMap = lookup.get(key)!;
      vMap.set(vq.vendorId, {
        rate: it.quotedRate,
        qty: it.quantity || 1,
        total: (it.quotedRate || 0) * (it.quantity || 1),
        remarks: it.remarks,
        alloc: it.allocatedAmount
      });
    });
  });

  // Find lowest rate per activity for highlighting
  const lowestVendor = new Map<string, string>();
  activityKeys.forEach(([key]) => {
    const vMap = lookup.get(key);
    if (!vMap) return;
    let lowestTotal = Infinity;
    let lowestId = '';
    vMap.forEach((entry, vId) => {
      if (entry.total > 0 && entry.total < lowestTotal) {
        lowestTotal = entry.total;
        lowestId = vId;
      }
    });
    if (lowestId) lowestVendor.set(key, lowestId);
  });

  // Grand totals per vendor
  const vendorTotals = new Map<string, number>();
  submittedQuotations.forEach(vq => {
    vendorTotals.set(vq.vendorId, vq.items.reduce((s, it) => s + (it.quotedRate || 0) * (it.quantity || 1), 0));
  });

  // Build vendor header cells
  const vendorHeaderCells = vendors.map(v =>
    `<th style="background:#1B4F72;color:#fff;padding:10px 12px;border:1px solid #14395A;font-size:11px;min-width:110px;text-align:center;">
      <div style="font-weight:bold;">${v.name}</div>
      ${v.code ? `<div style="font-size:9px;opacity:0.8;margin-top:2px;">${v.code}</div>` : ''}
      <div style="font-size:9px;opacity:0.8;">${v.region}</div>
    </th>`
  ).join('');

  // Build activity rows
  let lastRegion = '';
  const activityRows = activityKeys.map(([key, ak]) => {
    const vMap = lookup.get(key) || new Map();
    const regionSeparator = ak.region !== lastRegion
      ? `<tr><td colspan="${4 + vendors.length}" style="background:#1B4F72;color:#fff;font-size:11px;font-weight:bold;padding:6px 12px;letter-spacing:.5px;">
           Region: ${ak.region}
         </td></tr>`
      : '';
    lastRegion = ak.region;

    const vendorCells = vendors.map(v => {
      const entry = vMap.get(v.id);
      const isLowest = lowestVendor.get(key) === v.id;
      if (!entry || !entry.rate) {
        return `<td style="padding:8px 10px;border:1px solid #DDE3ED;text-align:center;color:#9CA3AF;font-size:10px;">—</td>`;
      }
      return `<td style="padding:8px 10px;border:1px solid #DDE3ED;text-align:center;background:${isLowest ? '#F0FDF4' : '#fff'};font-size:10px;">
        ${isLowest ? '<span style="color:#16A34A;font-size:8px;font-weight:bold;">LOWEST ▼ </span>' : ''}
        <div style="font-weight:bold;color:${isLowest ? '#15803D' : '#1B4F72'};">${fmt(entry.rate)}<span style="font-size:8px;color:#6B7280;">/unit</span></div>
        <div style="color:#6B7280;font-size:9px;">×${entry.qty} = <strong>${fmt(entry.total)}</strong></div>
        ${entry.remarks ? `<div style="color:#9CA3AF;font-size:8px;margin-top:2px;">${entry.remarks}</div>` : ''}
      </td>`;
    }).join('');

    const alloc = vMap.size > 0 ? [...vMap.values()][0].alloc : 0;
    return `${regionSeparator}
      <tr style="background:#FAFBFC;">
        <td style="padding:8px 10px;border:1px solid #DDE3ED;font-size:10px;font-weight:600;">${ak.product}</td>
        <td style="padding:8px 10px;border:1px solid #DDE3ED;font-size:10px;">${ak.crop}</td>
        <td style="padding:8px 10px;border:1px solid #DDE3ED;font-size:10px;">${ak.activity}</td>
        <td style="padding:8px 10px;border:1px solid #DDE3ED;font-size:10px;text-align:right;color:#1B4F72;font-weight:600;">${fmt(alloc)}</td>
        ${vendorCells}
      </tr>`;
  }).join('');

  // Grand total row
  const totalCells = vendors.map(v => {
    const total = vendorTotals.get(v.id) || 0;
    return `<td style="padding:10px;border:1px solid #DDE3ED;text-align:center;background:#EBF5FB;font-weight:bold;color:#1B4F72;">${total > 0 ? fmt(total) : '—'}</td>`;
  }).join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quotation Comparison — ${poNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1A1D23; background: #fff; padding: 24px; }
    h1 { font-size: 20px; color: #1B4F72; margin-bottom: 4px; }
    .sub { font-size: 12px; color: #6B7280; margin-bottom: 20px; }
    .meta { display: flex; gap: 32px; margin-bottom: 24px; background: #EBF5FB; border-radius: 8px; padding: 14px 20px; }
    .meta-item { }
    .meta-label { font-size: 9px; text-transform: uppercase; color: #6B7280; letter-spacing: .5px; }
    .meta-value { font-size: 13px; font-weight: bold; color: #1B4F72; margin-top: 2px; }
    table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
    th { text-align: left; }
    .legend { display: flex; gap: 16px; margin-top: 16px; font-size: 10px; color: #6B7280; }
    .legend-item { display: flex; align-items: center; gap: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 2px; }
    .footer { margin-top: 28px; font-size: 9px; color: #9CA3AF; border-top: 1px solid #DDE3ED; padding-top: 10px; }
    @media print {
      body { padding: 10px; }
      @page { size: A3 landscape; margin: 15mm; }
    }
  </style>
</head>
<body>
  <h1>Vendor Quotation Comparison Report</h1>
  <div class="sub">Generated on ${today} &nbsp;·&nbsp; ${submittedQuotations.length} vendor${submittedQuotations.length !== 1 ? 's' : ''} submitted</div>

  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">PO Number</div>
      <div class="meta-value">${poNumber}</div>
    </div>
    ${poFrom ? `<div class="meta-item"><div class="meta-label">Period</div><div class="meta-value">${poFrom} → ${poTo || ''}</div></div>` : ''}
    ${poBudget ? `<div class="meta-item"><div class="meta-label">PO Budget</div><div class="meta-value">${fmt(poBudget)}</div></div>` : ''}
    <div class="meta-item">
      <div class="meta-label">Vendors Compared</div>
      <div class="meta-value">${vendors.length}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Activities</div>
      <div class="meta-value">${activityKeys.length}</div>
    </div>
  </div>

  ${submittedQuotations.length === 0 ? '<p style="color:#9CA3AF;text-align:center;padding:40px;">No submitted quotations to compare.</p>' : `
  <table>
    <thead>
      <tr>
        <th style="background:#1B4F72;color:#fff;padding:10px 12px;border:1px solid #14395A;font-size:11px;">Product</th>
        <th style="background:#1B4F72;color:#fff;padding:10px 12px;border:1px solid #14395A;font-size:11px;">Crop</th>
        <th style="background:#1B4F72;color:#fff;padding:10px 12px;border:1px solid #14395A;font-size:11px;">Activity</th>
        <th style="background:#1B4F72;color:#fff;padding:10px 12px;border:1px solid #14395A;font-size:11px;text-align:right;">Allocated (₹)</th>
        ${vendorHeaderCells}
      </tr>
    </thead>
    <tbody>
      ${activityRows}
      <tr style="background:#EBF5FB;font-weight:bold;">
        <td colspan="4" style="padding:10px 12px;border:1px solid #DDE3ED;font-size:11px;text-align:right;color:#1B4F72;">GRAND TOTAL QUOTED</td>
        ${totalCells}
      </tr>
    </tbody>
  </table>

  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#F0FDF4;border:1px solid #16A34A;"></div> Lowest quoted vendor (recommended)</div>
    <div class="legend-item"><div class="legend-dot" style="background:#EBF5FB;border:1px solid #1B4F72;"></div> Grand total row</div>
  </div>
  `}

  <div class="footer">
    This report is auto-generated from the Ad Campaign Management Portal. All figures are as submitted by vendors.
    Lowest rate is highlighted automatically per activity line. Please verify before awarding.
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1280,height=900');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 600);
}
