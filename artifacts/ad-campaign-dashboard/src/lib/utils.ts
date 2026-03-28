import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
