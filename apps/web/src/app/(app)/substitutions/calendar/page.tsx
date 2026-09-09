'use client';

import * as React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layouts/page-header';
import { useSubstitutionRequests } from '@/lib/substitution-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sun
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function coverageColor(rate: number): string {
  if (rate === 0) return 'transparent';
  if (rate >= 90) return '#dcfce7';
  if (rate >= 70) return '#fef9c3';
  return '#fee2e2';
}

function coverageText(rate: number): string {
  if (rate >= 90) return '#146b41';
  if (rate >= 70) return '#8a5a00';
  return '#b3261e';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoverageCalendarPage() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());

  // Fetch all requests for this month
  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const monthEnd   = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;

  const { data, isLoading } = useSubstitutionRequests({ limit: 200 });

  // Build a map: dateStr → { required, covered }
  const dayMap = React.useMemo(() => {
    const map: Record<string, { required: number; covered: number }> = {};
    if (!data?.data) return map;
    for (const req of data.data) {
      const d = req.date.slice(0, 10);
      if (!map[d]) map[d] = { required: 0, covered: 0 };
      const assignments = req.assignments ?? [];
      const active = assignments.filter((a) => a.status !== 'CANCELLED');
      const confirmed = assignments.filter((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED');
      map[d].required += active.length;
      map[d].covered  += confirmed.length;
    }
    return map;
  }, [data]);

  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month); // 0 = Sun

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <div>
      <PageHeader
        title="Coverage Calendar"
        subtitle="Monthly substitution coverage overview"
      />

      <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
        {/* Calendar nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e8eb]">
          <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg border border-[#e6e8eb] text-sm hover:bg-[#f4f1e9]">← Prev</button>
          <h2 className="text-base font-semibold text-[#14181c]">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg border border-[#e6e8eb] text-sm hover:bg-[#f4f1e9]">Next →</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#e6e8eb]">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-[#8a929b]">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Leading blank cells */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[80px] border-b border-r border-[#f3f4f6]" />
          ))}

          {/* Day cells */}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const info = dayMap[dateStr];
            const isToday = dateStr === now.toISOString().slice(0, 10);
            const rate = info && info.required > 0 ? Math.round((info.covered / info.required) * 100) : 0;

            return (
              <Link
                key={day}
                href={`/substitutions/today`}
                className="min-h-[80px] p-2 border-b border-r border-[#f3f4f6] flex flex-col gap-1 hover:bg-[#f4f1e9] transition-colors"
                style={{ background: info ? coverageColor(rate) : undefined }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: isToday ? '#2b5fa8' : '#14181c',
                    textDecoration: isToday ? 'underline' : undefined,
                  }}
                >
                  {day}
                </span>
                {isLoading && <span className="text-xs text-[#8a929b]">…</span>}
                {info && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold" style={{ color: coverageText(rate) }}>
                      {rate}% covered
                    </span>
                    <span className="text-xs text-[#6b7480]">
                      {info.covered}/{info.required} periods
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 px-5 py-3 border-t border-[#e6e8eb]">
          <span className="text-xs text-[#6b7480] font-semibold">Coverage:</span>
          {[
            { label: '≥ 90% (Good)', bg: '#dcfce7', text: '#146b41' },
            { label: '70–89% (Moderate)', bg: '#fef9c3', text: '#8a5a00' },
            { label: '< 70% (Low)', bg: '#fee2e2', text: '#b3261e' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded" style={{ background: l.bg, border: '1px solid #e6e8eb' }} />
              <span className="text-xs" style={{ color: l.text }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
