'use client';

import * as React from 'react';
import { useSubstituteSuggestions, useTimetables } from '@/lib/hooks/use-timetable';
import type { SubstituteCandidate, SubstitutePeriodResult } from '@/lib/hooks/use-timetable';
import { useTeachers } from '@/lib/hooks/use-teachers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

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

function formatTime(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 10, color: '#9ca3af', width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${(value / max) * 100}%`,
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#374151', width: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({ candidate, rank }: { candidate: SubstituteCandidate; rank: number }) {
  const isDisqualified = !!candidate.disqualifiedReason;

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{
        background: isDisqualified ? '#fafbfc' : rank === 1 ? '#f0fdf4' : 'white',
        border: `1.5px solid ${isDisqualified ? '#e6e8eb' : rank === 1 ? '#bbf7d0' : '#e6e8eb'}`,
        opacity: isDisqualified ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 22,
            height: 22,
            background: isDisqualified ? '#e5e7eb' : rank === 1 ? '#22c55e' : '#e0e7ff',
            fontSize: 10,
            fontWeight: 700,
            color: isDisqualified ? '#9ca3af' : rank === 1 ? 'white' : '#4338ca',
          }}
        >
          {rank}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: isDisqualified ? '#9ca3af' : '#111827' }}>
          {candidate.name}
        </span>
        {isDisqualified ? (
          <span
            className="ml-auto rounded-full px-2 py-0.5"
            style={{ background: '#fee2e2', fontSize: 10, color: '#b91c1c', fontWeight: 500 }}
          >
            {candidate.disqualifiedReason}
          </span>
        ) : (
          <span
            className="ml-auto rounded-full px-2.5 py-0.5"
            style={{
              background: rank === 1 ? '#dcfce7' : '#eff6ff',
              fontSize: 11,
              fontWeight: 700,
              color: rank === 1 ? '#15803d' : '#1d4ed8',
            }}
          >
            {candidate.total} pts
          </span>
        )}
      </div>

      {!isDisqualified && (
        <div className="flex flex-col gap-1 pl-7">
          <ScoreBar label="Subject proficiency" value={candidate.subjectProficiency} max={40} color="#3b82f6" />
          <ScoreBar label="Workload balance" value={candidate.workloadScore} max={30} color="#10b981" />
          <ScoreBar label="Fairness" value={candidate.fairnessScore} max={20} color="#f59e0b" />
          <ScoreBar label="Dept. affinity" value={candidate.departmentAffinity} max={10} color="#8b5cf6" />
        </div>
      )}
    </div>
  );
}

// ─── Period result block ──────────────────────────────────────────────────────

function PeriodResultBlock({ result }: { result: SubstitutePeriodResult }) {
  const [expanded, setExpanded] = React.useState(true);
  const qualified = result.candidates.filter((c) => !c.disqualifiedReason);
  const disqualified = result.candidates.filter((c) => !!c.disqualifiedReason);

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 border-b border-[#eef0f2] p-3 text-left"
        style={{ background: '#fafbfc', cursor: 'pointer', border: 'none' }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#14181c' }}>
          {result.entry.periodName}
        </span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          {formatTime(result.entry.startTime)}
          {result.entry.subjectName ? ` · ${result.entry.subjectName}` : ''}
          {` · ${result.entry.sectionName}`}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8a929b' }}>
          {qualified.length} available · {disqualified.length} unavailable
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 8 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="p-3 flex flex-col gap-2">
          {result.candidates.length === 0 ? (
            <p className="text-xs text-center text-[#8a929b] py-4">No candidates found</p>
          ) : (
            result.candidates.map((c, i) => (
              <CandidateCard key={c.candidateId} candidate={c} rank={i + 1} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface SubstitutePanelProps {
  campusId: string;
}

export function SubstitutePanel({ campusId }: SubstitutePanelProps) {
  const [timetableId, setTimetableId] = React.useState('');
  const [teacherId, setTeacherId] = React.useState('');
  const [dayOfWeek, setDayOfWeek] = React.useState('');
  const [date, setDate] = React.useState('');

  const { data: timetables = [] } = useTimetables({ campusId });
  const { data: teachersResp } = useTeachers({ limit: 200, status: 'ACTIVE' });

  const suggestionParams = {
    timetableId: timetableId || null,
    teacherId: teacherId || null,
    dayOfWeek: dayOfWeek ? parseInt(dayOfWeek, 10) : null,
    ...(date ? { date } : {}),
  } as const;
  const { data: suggestions, isLoading, isError } = useSubstituteSuggestions(suggestionParams);

  const timetableOptions = [
    { value: '', label: '— Select timetable —' },
    ...timetables.map((t) => ({ value: t.id, label: `${t.name} [${t.status}]` })),
  ];

  const teacherOptions = [
    { value: '', label: '— Select absent teacher —' },
    ...(teachersResp?.data ?? []).map((t) => ({
      value: t.id,
      label: `${t.person.firstName} ${t.person.lastName}`,
    })),
  ];

  const ready = !!timetableId && !!teacherId && !!dayOfWeek;

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: '#fafbfc', border: '1px solid #e6e8eb' }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Find Substitutes
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Timetable */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Timetable</span>
            <div style={{ position: 'relative' }}>
              <select value={timetableId} onChange={(e) => setTimetableId(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 200 }}>
                {timetableOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          </div>

          {/* Teacher */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Absent Teacher</span>
            <div style={{ position: 'relative' }}>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 180 }}>
                {teacherOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          </div>

          {/* Day */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Day of Week</span>
            <div style={{ position: 'relative' }}>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} style={SELECT_STYLE}>
                <option value="">— Select day —</option>
                {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          </div>

          {/* Date (optional) */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>Date (optional)</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...SELECT_STYLE, minWidth: 140 }}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {!ready && (
        <div className="flex items-center justify-center py-12 text-sm text-[#8a929b]">
          Select a timetable, absent teacher, and day to see substitute suggestions
        </div>
      )}

      {ready && isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-[#8a929b]">
          Computing substitute scores…
        </div>
      )}

      {ready && isError && (
        <div className="flex items-center justify-center py-12 text-sm text-[#8a929b]">
          Failed to compute suggestions. The teacher may not be assigned to any periods on this day.
        </div>
      )}

      {ready && !isLoading && !isError && suggestions && (
        <>
          {suggestions.periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-sm font-medium text-[#4a5260]">No affected periods</p>
              <p className="text-xs text-[#8a929b]">This teacher has no entries in the selected timetable on that day.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p style={{ fontSize: 12, fontWeight: 700, color: '#14181c' }}>
                {suggestions.periods.length} period{suggestions.periods.length !== 1 ? 's' : ''} need coverage
              </p>
              {suggestions.periods.map((r) => (
                <PeriodResultBlock key={r.entry.id} result={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
