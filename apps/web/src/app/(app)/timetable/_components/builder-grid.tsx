'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { periodTypeColor } from '@/components/shared/period-type-badge';
import { usePeriods, useTimetableFull, useMoveEntry } from '@/lib/hooks/use-timetable';
import type { TimetableFullEntry, TimetablePeriod, TimetableSummary } from '@/lib/hooks/use-timetable';
import { useToast } from '@/components/ui/toast';
import { EntryModal } from './entry-modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function teacherName(t: TimetableFullEntry['teacher']): string {
  if (!t) return '';
  return `${t.person.firstName} ${t.person.lastName}`;
}

function formatTime(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

// ─── Cell components ──────────────────────────────────────────────────────────

interface FilledCellProps {
  entry: TimetableFullEntry;
  editable: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function FilledCell({ entry, editable, isDragging, onClick, onDragStart, onDragEnd }: FilledCellProps) {
  return (
    <button
      disabled={!editable}
      onClick={editable ? onClick : undefined}
      draggable={editable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="w-full h-full text-left rounded-lg px-2 py-1.5 transition-all"
      style={{
        background: '#eef4fb',
        border: '1.5px solid #c5d9ee',
        cursor: editable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        minHeight: 64,
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {entry.subject ? (
        <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', lineHeight: 1.3 }}>
          {entry.subject.name}
        </p>
      ) : (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontStyle: 'italic' }}>
          No subject
        </p>
      )}
      {entry.teacher && (
        <p style={{ fontSize: 10, color: '#475569', marginTop: 2, lineHeight: 1.3 }}>
          {teacherName(entry.teacher)}
        </p>
      )}
      {entry.room && (
        <p style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{entry.room.name}</p>
      )}
      {editable && !isDragging && (
        <p style={{ fontSize: 9, color: '#93c5fd', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          drag or click to edit
        </p>
      )}
    </button>
  );
}

interface EmptyCellProps {
  editable: boolean;
  isDropTarget: boolean;
  onClick: () => void;
}

function EmptyCell({ editable, isDropTarget, onClick }: EmptyCellProps) {
  if (!editable) {
    return (
      <div
        className="w-full h-full rounded-lg flex items-center justify-center"
        style={{ minHeight: 64, border: '1px dashed #e2e8f0' }}
      >
        <span style={{ fontSize: 10, color: '#cbd5e1' }}>—</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="w-full h-full rounded-lg flex flex-col items-center justify-center gap-1 transition-all group"
      style={{
        minHeight: 64,
        border: isDropTarget ? '2px dashed #2b5fa8' : '1px dashed #c5d9ee',
        background: isDropTarget ? '#f0f6ff' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.1s',
      }}
    >
      <Plus size={14} className={isDropTarget ? 'text-[#2b5fa8]' : 'text-[#93c5fd] group-hover:text-[#2b5fa8]'} />
      <span
        style={{
          fontSize: 9,
          color: isDropTarget ? '#2b5fa8' : '#93c5fd',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
        className={isDropTarget ? '' : 'group-hover:text-[#2b5fa8]'}
      >
        {isDropTarget ? 'Drop here' : 'Add'}
      </span>
    </button>
  );
}

// ─── Period label ─────────────────────────────────────────────────────────────

function PeriodLabel({ period }: { period: TimetablePeriod }) {
  const isBreak = period.periodType !== 'CLASS';
  const color = isBreak ? periodTypeColor(period.periodType) : null;
  return (
    <div
      className="text-right pr-2 flex flex-col justify-center"
      style={{
        background: isBreak ? color!.bg : 'white',
        minHeight: 64,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: isBreak ? color!.fg : '#14181c',
          lineHeight: 1.2,
        }}
      >
        {period.name}
      </p>
      <p style={{ fontSize: 10, color: isBreak ? color!.fg : '#8a929b', marginTop: 2, opacity: 0.8 }}>
        {formatTime(period.startTime)}
      </p>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface BuilderGridProps {
  timetable: TimetableSummary;
  campusId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
}

export function BuilderGrid({
  timetable,
  campusId,
  classId,
  sectionId,
  academicYearId,
}: BuilderGridProps) {
  const toast = useToast();
  const { data: periods = [], isLoading: periodsLoading } = usePeriods(campusId);
  const { data: fullTimetable, isLoading: ttLoading } = useTimetableFull(timetable.id);
  const moveEntry = useMoveEntry();

  const isEditable = timetable.status === 'DRAFT';

  // Modal state
  type AddTarget = { dayOfWeek: number; period: TimetablePeriod };
  const [addTarget, setAddTarget] = React.useState<AddTarget | null>(null);
  const [editEntry, setEditEntry] = React.useState<TimetableFullEntry | null>(null);

  // DnD state
  const [dragEntry, setDragEntry] = React.useState<TimetableFullEntry | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ dayOfWeek: number; periodId: string } | null>(null);

  // Build entry lookup: dayOfWeek → periodId → entry
  const entryMap = React.useMemo(() => {
    const map = new Map<number, Map<string, TimetableFullEntry>>();
    for (const entry of fullTimetable?.entries ?? []) {
      if (entry.sectionId !== sectionId) continue;
      let dayMap = map.get(entry.dayOfWeek);
      if (!dayMap) { dayMap = new Map(); map.set(entry.dayOfWeek, dayMap); }
      dayMap.set(entry.period.id, entry);
    }
    return map;
  }, [fullTimetable?.entries, sectionId]);

  // Determine which days have at least one entry (show all 5 by default)
  const visibleDays = React.useMemo(() => {
    const hasSat = [...entryMap.keys()].includes(6);
    return hasSat ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
  }, [entryMap]);

  // Handle drop on a cell
  async function handleDrop(dayOfWeek: number, periodId: string) {
    if (!dragEntry) return;
    setDropTarget(null);

    // Same slot — no-op
    if (dragEntry.dayOfWeek === dayOfWeek && dragEntry.period.id === periodId) {
      setDragEntry(null);
      return;
    }

    try {
      await moveEntry.mutateAsync({
        timetableId: timetable.id,
        entryId: dragEntry.id,
        dayOfWeek,
        periodId,
      });
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message ?? 'Failed to move entry.');
    } finally {
      setDragEntry(null);
    }
  }

  if (periodsLoading || ttLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
        Loading builder…
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-sm font-medium text-[#4a5260]">No periods configured</p>
        <p className="text-xs text-[#8a929b]">
          Go to the Periods tab and add period slots before building the timetable.
        </p>
      </div>
    );
  }

  const colCount = visibleDays.length;

  return (
    <>
      <div className="overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `110px repeat(${colCount}, minmax(110px, 1fr))`,
            gap: '1px',
            background: '#e6e8eb',
            borderRadius: 10,
            overflow: 'hidden',
            minWidth: 600,
          }}
        >
          {/* ── Header row ── */}
          <div style={{ background: '#f8f9fa', padding: '8px 0' }} />
          {visibleDays.map((d, i) => (
            <div
              key={d}
              style={{ background: '#f8f9fa' }}
              className="flex flex-col items-center justify-center py-2"
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: '#14181c' }}>{DAY_SHORT[i]}</p>
              <p style={{ fontSize: 10, color: '#8a929b' }}>{DAY_NAMES[i]?.slice(0, 3)}</p>
            </div>
          ))}

          {/* ── Period rows ── */}
          {periods.map((period) => {
            const isBreak = period.periodType !== 'CLASS';
            const breakColor = isBreak ? periodTypeColor(period.periodType) : null;

            return (
              <React.Fragment key={period.id}>
                {/* Period label */}
                <div style={{ background: isBreak ? breakColor!.bg : 'white' }}>
                  <PeriodLabel period={period} />
                </div>

                {isBreak ? (
                  /* Break spans all day columns */
                  <div
                    style={{
                      gridColumn: `span ${colCount}`,
                      background: breakColor!.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 40,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: breakColor!.fg,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {period.periodType} · {formatTime(period.startTime)} – {formatTime(period.endTime)}
                    </span>
                  </div>
                ) : (
                  /* One cell per day */
                  visibleDays.map((dayNum) => {
                    const entry = entryMap.get(dayNum)?.get(period.id);
                    const isThisDragging = !!dragEntry && entry?.id === dragEntry.id;
                    const isThisDropTarget =
                      !!dropTarget &&
                      dropTarget.dayOfWeek === dayNum &&
                      dropTarget.periodId === period.id;
                    const canDrop = isEditable && !!dragEntry && !entry;

                    return (
                      <div
                        key={dayNum}
                        style={{
                          background: isThisDropTarget ? '#f0f6ff' : 'white',
                          padding: 4,
                          transition: 'background 0.1s',
                        }}
                        onDragOver={(e) => {
                          if (canDrop || isThisDragging) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (!isThisDragging) {
                              setDropTarget({ dayOfWeek: dayNum, periodId: period.id });
                            }
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDropTarget(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (canDrop) void handleDrop(dayNum, period.id);
                        }}
                      >
                        {entry ? (
                          <FilledCell
                            entry={entry}
                            editable={isEditable}
                            isDragging={isThisDragging}
                            onClick={() => setEditEntry(entry)}
                            onDragStart={() => setDragEntry(entry)}
                            onDragEnd={() => {
                              setDragEntry(null);
                              setDropTarget(null);
                            }}
                          />
                        ) : (
                          <EmptyCell
                            editable={isEditable}
                            isDropTarget={isThisDropTarget}
                            onClick={() => setAddTarget({ dayOfWeek: dayNum, period })}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Drag hint */}
      {isEditable && (
        <p className="mt-2 text-center text-xs text-[#b0b7bf]">
          Drag entries to move them to a different slot
        </p>
      )}

      {/* Editable hint for non-draft */}
      {!isEditable && (
        <p className="mt-3 text-center text-xs text-[#8a929b]">
          This timetable is {timetable.status.toLowerCase()} — editing is only available on DRAFT timetables.
        </p>
      )}

      {/* Add entry modal */}
      {addTarget && (
        <EntryModal
          mode="add"
          open={!!addTarget}
          onClose={() => setAddTarget(null)}
          timetableId={timetable.id}
          campusId={campusId}
          classId={classId}
          sectionId={sectionId}
          academicYearId={academicYearId}
          dayOfWeek={addTarget.dayOfWeek}
          period={addTarget.period}
        />
      )}

      {/* Edit entry modal */}
      {editEntry && (
        <EntryModal
          mode="edit"
          open={!!editEntry}
          onClose={() => setEditEntry(null)}
          timetableId={timetable.id}
          campusId={campusId}
          classId={classId}
          sectionId={sectionId}
          academicYearId={academicYearId}
          entry={editEntry}
          periods={periods}
        />
      )}
    </>
  );
}
