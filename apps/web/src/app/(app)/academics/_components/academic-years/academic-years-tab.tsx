'use client';

import * as React from 'react';
import { Badge, Button, SearchBar } from '@/components/ui';
import { useOrganization, useAcademicYears } from '@/lib/hooks/use-academics';
import type { AcademicYear } from '@/lib/types/academics';
import { AddAcademicYearModal } from './add-academic-year-modal';
import { EditAcademicYearModal } from './edit-academic-year-modal';
import { SetCurrentYearDialog } from './set-current-year-dialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(status: string): 'active' | 'pending' | 'inactive' | 'default' {
  if (status === 'ACTIVE')    return 'active';
  if (status === 'UPCOMING')  return 'pending';
  if (status === 'COMPLETED') return 'inactive';
  return 'default';
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AcademicYearsTab() {
  const { data: org } = useOrganization();
  const { data: years = [], isLoading } = useAcademicYears(org?.id);
  const [search, setSearch] = React.useState('');
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<AcademicYear | null>(null);
  const [currentTarget, setCurrentTarget] = React.useState<AcademicYear | null>(null);

  const filtered = search
    ? years.filter(
        (y) =>
          y.name.toLowerCase().includes(search.toLowerCase()) ||
          y.code.toLowerCase().includes(search.toLowerCase()),
      )
    : years;

  const COL = '1fr 130px 120px 120px 90px 110px 130px';

  const headers = ['YEAR NAME', 'CODE', 'START DATE', 'END DATE', 'STATUS', 'CURRENT', 'ACTIONS'];

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <SearchBar
            placeholder="Search academic years…"
            value={search}
            onChange={setSearch}
            className="w-64"
          />
          <div className="flex-1" />
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            + Add Academic Year
          </Button>
        </div>

        {/* Table header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: COL,
            background: '#fbf9f3',
            borderBottom: '1px solid #efece2',
          }}
        >
          {headers.map((h, i) => (
            <div
              key={h}
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.09em',
                color: '#a9aca4',
                justifyContent: i >= 5 ? 'flex-end' : 'flex-start',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Table body */}
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: 13 }}>
            Loading academic years…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#4a5260', marginBottom: 6 }}>
              {search ? 'No results found' : 'No academic years yet'}
            </p>
            <p style={{ fontSize: 13, color: '#8a929b', marginBottom: 20 }}>
              {search
                ? 'Try a different search term.'
                : 'Create your first academic year to get started.'}
            </p>
            {!search && (
              <Button variant="primary" onClick={() => setAddOpen(true)}>
                + Add Academic Year
              </Button>
            )}
          </div>
        ) : (
          filtered.map((year, idx) => (
            <div
              key={year.id}
              className="grid"
              style={{
                gridTemplateColumns: COL,
                minHeight: 52,
                borderBottom: idx < filtered.length - 1 ? '1px solid #f4f1e8' : 'none',
                background: year.isCurrent ? '#f6fbf6' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!year.isCurrent) (e.currentTarget as HTMLElement).style.background = '#fbf9f3';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = year.isCurrent ? '#f6fbf6' : 'transparent';
              }}
            >
              {/* Year name */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#14181c' }}>{year.name}</span>
              </div>

              {/* Code */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7480' }}>{year.code}</span>
              </div>

              {/* Start date */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 12, color: '#2c322f' }}>
                {formatDate(year.startDate)}
              </div>

              {/* End date */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 12, color: '#2c322f' }}>
                {formatDate(year.endDate)}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                <Badge variant={statusVariant(year.status)}>
                  {year.status.charAt(0) + year.status.slice(1).toLowerCase()}
                </Badge>
              </div>

              {/* Current */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 14px' }}>
                {year.isCurrent ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#33604a',
                      background: '#d8e9de',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: 8 }}>●</span> Current
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#c5c0b6' }}>—</span>
                )}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  padding: '0 14px',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <button
                  className="hover:underline cursor-pointer text-[#2b5fa8]"
                  onClick={() => setEditTarget(year)}
                >
                  Edit
                </button>
                {!year.isCurrent && (
                  <>
                    <span style={{ color: '#d7dce1' }}>|</span>
                    <button
                      className="hover:underline cursor-pointer text-[#2b5fa8]"
                      onClick={() => setCurrentTarget(year)}
                    >
                      Set Current
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info note */}
      <p style={{ fontSize: 11, color: '#8a929b', marginTop: 10, paddingLeft: 2 }}>
        Academic years are never deleted — use status to archive completed years.
      </p>

      <AddAcademicYearModal open={addOpen} onClose={() => setAddOpen(false)} />

      {editTarget && (
        <EditAcademicYearModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          year={editTarget}
        />
      )}

      {currentTarget && (
        <SetCurrentYearDialog
          open={!!currentTarget}
          onClose={() => setCurrentTarget(null)}
          year={currentTarget}
        />
      )}
    </>
  );
}
