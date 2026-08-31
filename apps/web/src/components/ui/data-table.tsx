'use client';

import * as React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableSkeleton } from './skeleton';
import { EmptyState } from './empty-state';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cell?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

type SortDir = 'asc' | 'desc';

function getCellValue<T>(row: T, col: ColumnDef<T>): React.ReactNode {
  if (col.cell) return col.cell(row);
  if (typeof col.accessor === 'function') return col.accessor(row);
  const val = row[col.accessor as keyof T];
  if (val === null || val === undefined) return '—';
  return String(val);
}

function getSortKey<T>(row: T, col: ColumnDef<T>): string | number {
  if (typeof col.accessor === 'function') return '';
  const val = row[col.accessor as keyof T];
  if (typeof val === 'number') return val;
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase();
}

function DataTable<T extends object>({
  columns,
  data,
  selectable = false,
  onSelectionChange,
  loading = false,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  const handleSort = (colId: string) => {
    setSortCol((prev) => {
      if (prev === colId) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return colId;
      }
      setSortDir('asc');
      return colId;
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortCol) return data;
    const col = columns.find((c) => c.id === sortCol);
    if (!col || !col.sortable) return data;
    return [...data].sort((a, b) => {
      const av = getSortKey(a, col);
      const bv = getSortKey(b, col);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortCol, sortDir, columns]);

  const allSelected = sortedData.length > 0 && selected.size === sortedData.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const all = new Set(sortedData.map((_, i) => i));
      setSelected(all);
      onSelectionChange?.(sortedData);
    }
  };

  const toggleRow = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      onSelectionChange?.(sortedData.filter((_, i) => next.has(i)));
      return next;
    });
  };

  const gridCols = [
    ...(selectable ? ['44px'] : []),
    ...columns.map((c) => c.width ?? '1fr'),
  ].join(' ');

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length + (selectable ? 1 : 0)} />;
  }

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'center') return 'justify-center text-center';
    if (align === 'right') return 'justify-end text-right';
    return 'justify-start text-left';
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      {/* Header */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: gridCols,
          background: '#fbf9f3',
          borderBottom: '1px solid #efece2',
          minWidth: 'max-content',
        }}
      >
        {selectable && (
          <div className="flex items-center justify-center px-3" style={{ height: 40 }}>
            <div
              onClick={toggleAll}
              className="cursor-pointer"
              style={{
                width: 15,
                height: 15,
                border: `1.5px solid ${someSelected || allSelected ? '#5d7f6b' : '#c5c0b6'}`,
                background: allSelected ? '#5d7f6b' : someSelected ? '#d8e9de' : 'transparent',
                borderRadius: 5,
              }}
            />
          </div>
        )}
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn('flex items-center gap-1 px-3', alignClass(col.align), col.sortable && 'cursor-pointer select-none')}
            style={{ height: 40 }}
            onClick={col.sortable ? () => handleSort(col.id) : undefined}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: sortCol === col.id ? '#5d7f6b' : '#a9aca4',
              }}
            >
              {col.header}
            </span>
            {col.sortable && (
              <span style={{ color: '#a9aca4', lineHeight: 1 }}>
                {sortCol === col.id ? (
                  sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
                ) : (
                  <ArrowUpDown size={10} />
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      {sortedData.length === 0 ? (
        emptyState ?? <EmptyState />
      ) : (
        <div style={{ minWidth: 'max-content' }}>
          {sortedData.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={cn('grid transition-colors')}
              style={{
                gridTemplateColumns: gridCols,
                minHeight: 52,
                borderBottom: '1px solid #f4f1e8',
                background: selected.has(rowIdx) ? '#dbe8dc' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!selected.has(rowIdx)) (e.currentTarget as HTMLElement).style.background = '#fbf9f3';
              }}
              onMouseLeave={(e) => {
                if (!selected.has(rowIdx)) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {selectable && (
                <div className="flex items-center justify-center px-3">
                  <div
                    onClick={() => toggleRow(rowIdx)}
                    className="cursor-pointer"
                    style={{
                      width: 15,
                      height: 15,
                      border: `1.5px solid ${selected.has(rowIdx) ? '#5d7f6b' : '#c5c0b6'}`,
                      background: selected.has(rowIdx) ? '#5d7f6b' : 'transparent',
                      borderRadius: 5,
                    }}
                  />
                </div>
              )}
              {columns.map((col) => (
                <div
                  key={col.id}
                  className={cn('flex items-center px-3', alignClass(col.align))}
                  style={{ minHeight: 52, fontSize: '12.5px', color: '#2c322f' }}
                >
                  {getCellValue(row, col)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { DataTable };
