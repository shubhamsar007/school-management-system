'use client';

import * as React from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportColumn<T> {
  /** Column header label */
  header: string;
  /** Key of the row object, or a function to derive the value */
  accessor: keyof T | ((row: T) => string | number);
}

export interface ExportButtonProps<T> {
  /** Label on the button */
  label?: string;
  /** Rows to export */
  data: T[];
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** Default filename (without extension) */
  filename?: string;
  /** Formats to offer in the dropdown */
  formats?: ExportFormat[];
  className?: string;
}

// ─── CSV builder ──────────────────────────────────────────────────────────────

function toCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = columns.map((c) => escape(c.header)).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val =
          typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
        return escape(val);
      })
      .join(',')
  );

  return [header, ...rows].join('\r\n');
}

// ─── Excel (XLSX) builder ─────────────────────────────────────────────────────
// Builds a minimal XLSX-compatible XML workbook without any external dependency.

function toXLSX<T>(data: T[], columns: ExportColumn<T>[]): string {
  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const headerRow = columns.map((c) => `<Cell><Data ss:Type="String">${esc(c.header)}</Data></Cell>`).join('');
  const dataRows = data.map((row) => {
    const cells = columns.map((c) => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
      const type = typeof val === 'number' ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${esc(val)}</Data></Cell>`;
    });
    return `<Row>${cells.join('')}</Row>`;
  });

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>${headerRow}</Row>
   ${dataRows.join('\n   ')}
  </Table>
 </Worksheet>
</Workbook>`;
}

// ─── Download trigger ─────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Format meta ──────────────────────────────────────────────────────────────

const FORMAT_META: Record<
  ExportFormat,
  { label: string; icon: React.ElementType; ext: string; mime: string }
> = {
  csv: {
    label: 'Export as CSV',
    icon: FileSpreadsheet,
    ext: 'csv',
    mime: 'text/csv;charset=utf-8;',
  },
  excel: {
    label: 'Export as Excel',
    icon: FileSpreadsheet,
    ext: 'xls',
    mime: 'application/vnd.ms-excel',
  },
  pdf: {
    label: 'Export as PDF',
    icon: FileText,
    ext: 'pdf',
    mime: 'application/pdf',
  },
};

// ─── ExportButton ─────────────────────────────────────────────────────────────

export function ExportButton<T>({
  label = 'Export',
  data,
  columns,
  filename = 'export',
  formats = ['csv', 'excel'],
  className,
}: ExportButtonProps<T>) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleExport(format: ExportFormat) {
    setOpen(false);
    const meta = FORMAT_META[format];

    if (format === 'csv') {
      downloadBlob(toCSV(data, columns), `${filename}.${meta.ext}`, meta.mime);
      return;
    }

    if (format === 'excel') {
      downloadBlob(toXLSX(data, columns), `${filename}.${meta.ext}`, meta.mime);
      return;
    }

    if (format === 'pdf') {
      // Basic PDF via browser print — opens print dialog scoped to the data
      const rows = data
        .map(
          (row) =>
            `<tr>${columns
              .map((c) => {
                const val =
                  typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
                return `<td style="padding:6px 10px;border-bottom:1px solid #e6e8eb;font-size:12px;">${val ?? ''}</td>`;
              })
              .join('')}</tr>`
        )
        .join('');

      const headers = columns
        .map(
          (c) =>
            `<th style="padding:6px 10px;text-align:left;font-size:11px;letter-spacing:.05em;color:#8a929b;border-bottom:2px solid #e6e8eb;">${c.header}</th>`
        )
        .join('');

      const html = `<!DOCTYPE html><html><head><title>${filename}</title>
<style>body{font-family:Helvetica,Arial,sans-serif;padding:24px;}table{width:100%;border-collapse:collapse;}@media print{@page{size:landscape;}}</style>
</head><body>
<h2 style="margin:0 0 16px;font-size:18px;">${filename}</h2>
<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>
</body></html>`;

      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  }

  // Single format — no dropdown needed
  if (formats.length === 1) {
    const fmt = formats[0] as ExportFormat;
    const meta = FORMAT_META[fmt];
    return (
      <button
        type="button"
        onClick={() => handleExport(fmt as ExportFormat)}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-md border border-[#d7dce1] bg-white px-3.5 text-sm font-medium text-[#14181c] transition-colors hover:bg-[#f8f9fa]',
          className
        )}
      >
        <Download size={14} />
        {label}
      </button>
    );
  }

  // Multiple formats — dropdown
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#d7dce1] bg-white px-3.5 text-sm font-medium text-[#14181c] transition-colors hover:bg-[#f8f9fa]"
      >
        <Download size={14} />
        {label}
        <ChevronDown
          size={13}
          className={cn('text-[#8a929b] transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-lg border border-[#e6e8eb] bg-white shadow-md">
          {formats.map((fmt) => {
            const meta = FORMAT_META[fmt];
            const Icon = meta.icon;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => handleExport(fmt)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-[#14181c] hover:bg-[#f2f4f6]"
              >
                <Icon size={14} className="flex-shrink-0 text-[#6b7480]" />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
