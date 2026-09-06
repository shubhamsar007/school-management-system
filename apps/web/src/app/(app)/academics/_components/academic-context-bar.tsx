'use client';

import * as React from 'react';
import { useOrganization, useAcademicYears, useCampuses } from '@/lib/hooks/use-academics';

interface AcademicContextBarProps {
  yearId: string;
  campusId: string;
  onYearChange: (id: string) => void;
  onCampusChange: (id: string) => void;
}

const SELECT_STYLE: React.CSSProperties = {
  height: 30,
  padding: '0 28px 0 10px',
  fontSize: '12px',
  fontWeight: 500,
  color: '#2c322f',
  background: '#fff',
  border: '1px solid #e0ddd5',
  borderRadius: 7,
  appearance: 'none',
  cursor: 'pointer',
  outline: 'none',
  minWidth: 140,
};

export function AcademicContextBar({
  yearId,
  campusId,
  onYearChange,
  onCampusChange,
}: AcademicContextBarProps) {
  const { data: org } = useOrganization();
  const { data: years = [], isLoading: yearsLoading } = useAcademicYears(org?.id);
  const { data: campuses = [], isLoading: campusesLoading } = useCampuses(org?.id);

  return (
    <div
      className="flex items-center gap-3 flex-wrap"
      style={{
        padding: '8px 0 16px',
        borderBottom: '1px solid #eef0f2',
        marginBottom: 20,
      }}
    >
      {/* Academic Year selector */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '12px', color: '#8a929b', fontWeight: 500 }}>Academic Year</span>
        <div style={{ position: 'relative' }}>
          <select
            value={yearId}
            onChange={(e) => onYearChange(e.target.value)}
            style={SELECT_STYLE}
            disabled={yearsLoading}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          <span
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#8a929b',
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 18, background: '#e0ddd5' }} />

      {/* Campus selector */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '12px', color: '#8a929b', fontWeight: 500 }}>Campus</span>
        <div style={{ position: 'relative' }}>
          <select
            value={campusId}
            onChange={(e) => onCampusChange(e.target.value)}
            style={SELECT_STYLE}
            disabled={campusesLoading}
          >
            <option value="">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#8a929b',
              fontSize: 10,
            }}
          >
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
