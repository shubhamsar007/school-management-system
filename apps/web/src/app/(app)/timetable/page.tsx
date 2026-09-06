'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  Button,
  Badge,
  KpiCard,
  Tabs,
  DataTable,
  ExportButton,
  Pagination,
  ConfirmDialog,
} from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { KpiSkeleton } from '@/components/ui/skeleton';
import { useOrganization, useCampuses, useClasses, useSections } from '@/lib/hooks/use-academics';
import {
  useBuildings,
  useRooms,
  usePeriods,
  useTimetables,
  useSectionSchedule,
  useRoomSchedule,
  useConflicts,
  useDeleteRoom,
  useDeletePeriod,
  useDeleteBuilding,
  useActivateTimetable,
  useArchiveTimetable,
  useCopyTimetable,
  useAutoGenerate,
  type TimetableRoom,
  type TimetablePeriod,
  type TimetableBuilding,
  type TimetableSummary,
} from '@/lib/hooks/use-timetable';
import { PeriodTypeBadge } from '@/components/shared/period-type-badge';
import { PeriodModal } from './_components/period-modal';
import { RoomModal } from './_components/room-modal';
import { BuildingModal } from './_components/building-modal';
import { CreateTimetableModal } from './_components/create-timetable-modal';
import { BuilderGrid } from './_components/builder-grid';
import { HealthTab } from './_components/health-tab';
import { RulesTab } from './_components/rules-tab';
import { SubstitutePanel } from './_components/substitute-panel';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'builder',    label: 'Builder' },
  { id: 'health',     label: 'Health' },
  { id: 'substitute', label: 'Substitutes' },
  { id: 'timetable',  label: 'Schedule View' },
  { id: 'rules',      label: 'Rules' },
  { id: 'rooms',      label: 'Rooms' },
  { id: 'periods',    label: 'Periods' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
  const [hStr, mStr] = timePart.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

function durationMins(start: string, end: string): string {
  const toMins = (t: string) => {
    const timePart = t.includes('T') ? (t.split('T')[1] ?? '') : t;
    const [h, m] = timePart.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const diff = toMins(end) - toMins(start);
  return diff > 0 ? `${diff} min` : '—';
}

// ─── Context selector ─────────────────────────────────────────────────────────

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
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  cursor: 'pointer',
  outline: 'none',
  boxShadow: 'none',
  minWidth: 140,
};

interface ContextBarProps {
  campusId: string;
  onCampusChange: (id: string) => void;
}

function ContextBar({ campusId, onCampusChange }: ContextBarProps) {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const { data: campuses = [], isLoading: campusLoading } = useCampuses(org?.id);
  const isLoading = orgLoading || campusLoading;

  React.useEffect(() => {
    if (campuses.length > 0 && !campusId) {
      onCampusChange(campuses[0]!.id);
    }
  }, [campuses, campusId, onCampusChange]);

  return (
    <div
      className="flex items-center gap-3 flex-wrap"
      style={{ padding: '8px 0 16px', borderBottom: '1px solid #eef0f2', marginBottom: 20 }}
    >
      <span style={{ fontSize: '12px', color: '#8a929b', fontWeight: 500 }}>Campus</span>
      <div style={{ position: 'relative' }}>
        <select
          value={campusId}
          onChange={(e) => onCampusChange(e.target.value)}
          style={{
            ...SELECT_STYLE,
            color: !campusId ? '#8a929b' : '#2c322f',
            opacity: isLoading ? 0.6 : 1,
          }}
          disabled={isLoading || campuses.length === 0}
        >
          {isLoading ? (
            <option value="">Loading campuses…</option>
          ) : campuses.length === 0 ? (
            <option value="">No campuses found</option>
          ) : (
            campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          )}
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
      {isLoading && (
        <span style={{ fontSize: 11, color: '#b0b7bf' }}>Loading…</span>
      )}
    </div>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

const KPI_VARIANTS = ['sage', 'blue', 'clay', 'heather'] as const;

interface KpiRowProps {
  campusId: string;
}

function KpiRow({ campusId }: KpiRowProps) {
  const { data: buildings, isLoading: bl } = useBuildings(campusId);
  const { data: rooms, isLoading: rl } = useRooms(campusId);
  const { data: activeTimetables, isLoading: tl } = useTimetables({ campusId, status: 'ACTIVE' });
  const activeTimetableId = activeTimetables?.[0]?.id ?? null;
  const { data: conflicts } = useConflicts(activeTimetableId);

  const totalRooms = rooms?.length ?? 0;
  const totalBuildings = buildings?.length ?? 0;
  const activeCount = activeTimetables?.length ?? 0;
  const conflictCount = conflicts?.total ?? 0;

  const loading = bl || rl || tl;

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const kpis = [
    { title: 'BUILDINGS', value: String(totalBuildings), subtitle: 'on this campus' },
    { title: 'TOTAL ROOMS', value: String(totalRooms), subtitle: 'configured' },
    { title: 'ACTIVE TIMETABLES', value: String(activeCount), subtitle: 'this term' },
    { title: 'CONFLICTS', value: String(conflictCount), subtitle: conflictCount > 0 ? 'need resolution' : 'detected' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-4">
      {kpis.map((k, i) => (
        <KpiCard key={k.title} title={k.title} value={k.value} subtitle={k.subtitle} variant={KPI_VARIANTS[i]!} />
      ))}
    </div>
  );
}

// ─── Timetable view tab ───────────────────────────────────────────────────────

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Shared read-only period×day matrix used by both section and room views */
function ScheduleMatrix({
  campusId,
  scheduleDays,
  isLoading,
  isError,
  emptyPrompt,
}: {
  campusId: string;
  scheduleDays: ReturnType<typeof useSectionSchedule>['data'];
  isLoading: boolean;
  isError: boolean;
  emptyPrompt: string;
}) {
  const { data: periods = [] } = usePeriods(campusId);

  const entryMap = React.useMemo(() => {
    type Entry = NonNullable<typeof scheduleDays>[number]['entries'][number];
    const map = new Map<string, Map<string, Entry>>();
    scheduleDays?.forEach((d) => {
      const dayMap = new Map<string, Entry>();
      d.entries.forEach((e) => dayMap.set(e.period.id, e));
      map.set(d.day, dayMap);
    });
    return map;
  }, [scheduleDays]);

  const activeDays = React.useMemo(() => {
    if (!scheduleDays?.length) return DAY_ORDER.slice(0, 5);
    const daysWithEntries = new Set(scheduleDays.map((d) => d.day));
    return DAY_ORDER.filter((d) => daysWithEntries.has(d));
  }, [scheduleDays]);

  if (isLoading) return <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">Loading schedule…</div>;
  if (isError) return <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">No active timetable found for this campus. Activate a timetable first.</div>;
  if (!scheduleDays) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
        {emptyPrompt}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `110px repeat(${activeDays.length}, 1fr)`,
          gap: '1px',
          background: '#e6e8eb',
          minWidth: 600,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ background: '#fafbfc' }} className="px-3 py-2.5" />
        {activeDays.map((d) => (
          <div key={d} style={{ background: '#fafbfc' }} className="py-2.5 text-center text-xs font-semibold text-[#14181c]">
            {d.slice(0, 3)}
          </div>
        ))}
        {periods.map((period) => {
          const isBreak = period.periodType !== 'CLASS';
          return (
            <React.Fragment key={period.id}>
              <div style={{ background: isBreak ? '#f6f7f8' : 'white' }} className="px-3 py-2 text-right">
                <div className="text-[11px] font-semibold text-[#14181c]">{period.name}</div>
                <div className="text-[10px] text-[#8a929b]">{formatTime(period.startTime)}</div>
              </div>
              {isBreak ? (
                <div style={{ background: '#f6f7f8', gridColumn: `span ${activeDays.length}` }} className="flex items-center justify-center py-2">
                  <span className="text-[11px] font-medium text-[#8a929b] tracking-wider">{period.periodType}</span>
                  <span className="ml-2 text-[10px] text-[#b0b7bf]">{formatTime(period.startTime)} – {formatTime(period.endTime)}</span>
                </div>
              ) : (
                activeDays.map((day) => {
                  const entry = entryMap.get(day)?.get(period.id);
                  return (
                    <div key={day} style={{ background: 'white' }} className="p-1.5">
                      {entry ? (
                        <div className="rounded-lg bg-[#f0f6ff] border border-[#dbe8f5] px-2 py-1.5 h-full">
                          <div className="text-[11px] font-semibold text-[#2b5fa8] leading-tight">{entry.subject.name}</div>
                          {entry.room && <div className="text-[10px] text-[#6b7480] mt-0.5">{entry.room.name}</div>}
                          {entry.teacher && (
                            <div className="text-[10px] text-[#8a929b] mt-0.5">
                              {entry.teacher.person.firstName} {entry.teacher.person.lastName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-[#e6e8eb] px-2 py-1.5 h-full flex items-center justify-center">
                          <span className="text-[10px] text-[#c5c9cf]">—</span>
                        </div>
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
  );
}

interface TimetableViewProps {
  campusId: string;
}

function TimetableView({ campusId }: TimetableViewProps) {
  const [viewMode, setViewMode] = React.useState<'section' | 'room'>('section');

  // Section view state
  const [classId, setClassId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');
  const { data: classes = [] } = useClasses();
  const { data: sections = [] } = useSections(classId || null);
  const { data: sectionSchedule, isLoading: secLoading, isError: secError } = useSectionSchedule(sectionId || null);
  React.useEffect(() => { setSectionId(''); }, [classId]);

  // Room view state
  const [roomId, setRoomId] = React.useState('');
  const { data: rooms = [] } = useRooms(campusId);
  const { data: roomSchedule, isLoading: roomLoading, isError: roomError } = useRoomSchedule(roomId || null);

  const VIEW_PILLS = [
    { id: 'section', label: 'Section' },
    { id: 'room', label: 'Room' },
  ] as const;

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-[#eef0f2] p-3.5 flex-wrap">
        {/* Section | Room switcher */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e0ddd5' }}>
          {VIEW_PILLS.map((p) => (
            <button
              key={p.id}
              onClick={() => setViewMode(p.id)}
              style={{
                padding: '4px 14px',
                fontSize: 11,
                fontWeight: 600,
                color: viewMode === p.id ? '#fff' : '#6b7480',
                background: viewMode === p.id ? '#2b5fa8' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Section selectors */}
        {viewMode === 'section' && (
          <>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Class</span>
              <div style={{ position: 'relative' }}>
                <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 120 }}>
                  <option value="">Select class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
              </div>
            </div>
            {classId && (
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Section</span>
                <div style={{ position: 'relative' }}>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 120 }}>
                    <option value="">Select section</option>
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Room selector */}
        {viewMode === 'room' && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Room</span>
            <div style={{ position: 'relative' }}>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={{ ...SELECT_STYLE, minWidth: 160 }}>
                <option value="">Select room</option>
                {rooms.filter((r) => r.status === 'ACTIVE').map((r) => (
                  <option key={r.id} value={r.id}>{r.name}{r.building ? ` · ${r.building.name}` : ''}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="p-4">
        {viewMode === 'section' && (
          <ScheduleMatrix
            campusId={campusId}
            scheduleDays={sectionId ? sectionSchedule : undefined}
            isLoading={secLoading}
            isError={secError}
            emptyPrompt="Select a class and section to view the schedule"
          />
        )}
        {viewMode === 'room' && (
          <ScheduleMatrix
            campusId={campusId}
            scheduleDays={roomId ? roomSchedule : undefined}
            isLoading={roomLoading}
            isError={roomError}
            emptyPrompt="Select a room to view its schedule"
          />
        )}
      </div>
    </div>
  );
}

// ─── Rooms tab ────────────────────────────────────────────────────────────────

const ROOM_TYPE_COLORS: Record<string, 'default' | 'active' | 'graduated' | 'pending'> = {
  CLASSROOM: 'default',
  LAB:       'graduated',
  LIBRARY:   'active',
  AUDITORIUM: 'active',
  STAFF_ROOM: 'default',
  OFFICE:    'default',
  STORE:     'default',
};

interface RoomsTabProps {
  campusId: string;
}

function RoomsTab({ campusId }: RoomsTabProps) {
  const toast = useToast();
  const { data: rooms = [], isLoading } = useRooms(campusId);
  const deleteRoom = useDeleteRoom();

  const [addOpen, setAddOpen] = React.useState(false);
  const [editRoom, setEditRoom] = React.useState<TimetableRoom | null>(null);
  const [deleteRoom_, setDeleteRoom] = React.useState<TimetableRoom | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const paginated = rooms.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<TimetableRoom>[] = [
    { id: 'name', header: 'ROOM NAME', width: '130px', accessor: 'name' },
    {
      id: 'building',
      header: 'BUILDING',
      width: '120px',
      accessor: (r) => r.building?.name ?? '—',
    },
    {
      id: 'capacity',
      header: 'CAPACITY',
      width: '90px',
      align: 'center',
      accessor: (r) => (r.capacity != null ? String(r.capacity) : '—'),
    },
    {
      id: 'type',
      header: 'TYPE',
      width: '120px',
      cell: (r) => (
        <Badge variant={ROOM_TYPE_COLORS[r.roomType] ?? 'default'}>
          {r.roomType.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'active' : r.status === 'MAINTENANCE' ? 'pending' : 'default'}>
          {r.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '90px',
      align: 'right',
      cell: (r) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => setEditRoom(r)}>Edit</button>
          <span className="text-[#d7dce1]">|</span>
          <button className="text-[#b3261e]" onClick={() => setDeleteRoom(r)}>Delete</button>
        </div>
      ),
    },
  ];

  async function handleDelete() {
    if (!deleteRoom_) return;
    try {
      await deleteRoom.mutateAsync({ id: deleteRoom_.id, campusId });
      toast.success(`Room "${deleteRoom_.name}" deleted.`);
      setDeleteRoom(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete room.');
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <div className="flex-1" />
          <ExportButton
            label="Export"
            data={rooms}
            filename="rooms"
            formats={['csv', 'excel']}
            columns={[
              { header: 'Room', accessor: 'name' },
              { header: 'Building', accessor: (r: TimetableRoom) => r.building?.name ?? '' },
              { header: 'Type', accessor: 'roomType' },
              { header: 'Capacity', accessor: (r: TimetableRoom) => r.capacity ?? '' },
              { header: 'Status', accessor: 'status' },
            ]}
          />
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            + Add Room
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
            Loading rooms…
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No rooms configured</p>
            <p className="text-xs text-[#8a929b]">Add a room to get started.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} />
            <div className="border-t border-[#eef0f2] p-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={rooms.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>

      <RoomModal open={addOpen} onClose={() => setAddOpen(false)} campusId={campusId} />
      {editRoom && (
        <RoomModal
          open={!!editRoom}
          onClose={() => setEditRoom(null)}
          campusId={campusId}
          room={editRoom}
        />
      )}
      <ConfirmDialog
        open={!!deleteRoom_}
        onClose={() => setDeleteRoom(null)}
        onConfirm={handleDelete}
        title="Delete Room"
        description={`Delete "${deleteRoom_?.name}"? This cannot be undone. Deletion is blocked if the room is assigned to any timetable entries.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteRoom.isPending}
      />
    </>
  );
}

// ─── Periods tab ──────────────────────────────────────────────────────────────

interface PeriodsTabProps {
  campusId: string;
}

function PeriodsTab({ campusId }: PeriodsTabProps) {
  const toast = useToast();
  const { data: periods = [], isLoading } = usePeriods(campusId);
  const deletePeriod = useDeletePeriod();

  const [addOpen, setAddOpen] = React.useState(false);
  const [editPeriod, setEditPeriod] = React.useState<TimetablePeriod | null>(null);
  const [deletePeriod_, setDeletePeriod] = React.useState<TimetablePeriod | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const paginated = periods.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<TimetablePeriod>[] = [
    { id: 'num', header: '#', width: '50px', align: 'center', accessor: (p) => String(p.periodNumber) },
    { id: 'name', header: 'PERIOD NAME', width: '140px', accessor: 'name' },
    { id: 'start', header: 'START', width: '100px', accessor: (p) => formatTime(p.startTime) },
    { id: 'end', header: 'END', width: '100px', accessor: (p) => formatTime(p.endTime) },
    {
      id: 'duration',
      header: 'DURATION',
      width: '90px',
      align: 'center',
      accessor: (p) => durationMins(p.startTime, p.endTime),
    },
    {
      id: 'type',
      header: 'TYPE',
      width: '110px',
      cell: (p) => <PeriodTypeBadge type={p.periodType} />,
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '90px',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]">
          <button onClick={() => setEditPeriod(p)}>Edit</button>
          <span className="text-[#d7dce1]">|</span>
          <button className="text-[#b3261e]" onClick={() => setDeletePeriod(p)}>Delete</button>
        </div>
      ),
    },
  ];

  async function handleDelete() {
    if (!deletePeriod_) return;
    try {
      await deletePeriod.mutateAsync({ id: deletePeriod_.id, campusId });
      toast.success(`Period "${deletePeriod_.name}" deleted.`);
      setDeletePeriod(null);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to delete period.');
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
          <div className="flex-1" />
          <ExportButton
            label="Export"
            data={periods}
            filename="periods"
            formats={['csv']}
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Start', accessor: (p: TimetablePeriod) => formatTime(p.startTime) },
              { header: 'End', accessor: (p: TimetablePeriod) => formatTime(p.endTime) },
              { header: 'Type', accessor: 'periodType' },
            ]}
          />
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            + Add Period
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
            Loading periods…
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-medium text-[#4a5260]">No periods configured</p>
            <p className="text-xs text-[#8a929b]">Add period slots to build your school day.</p>
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={paginated} />
            <div className="border-t border-[#eef0f2] p-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={periods.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </div>

      <PeriodModal open={addOpen} onClose={() => setAddOpen(false)} campusId={campusId} />
      {editPeriod && (
        <PeriodModal
          open={!!editPeriod}
          onClose={() => setEditPeriod(null)}
          campusId={campusId}
          period={editPeriod}
        />
      )}
      <ConfirmDialog
        open={!!deletePeriod_}
        onClose={() => setDeletePeriod(null)}
        onConfirm={handleDelete}
        title="Delete Period"
        description={`Delete "${deletePeriod_?.name}"? Deletion is blocked if this period is used in any timetable entries.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deletePeriod.isPending}
      />
    </>
  );
}

// ─── Builder tab ─────────────────────────────────────────────────────────────

interface BuilderTabProps {
  campusId: string;
}

function BuilderTab({ campusId }: BuilderTabProps) {
  const toast = useToast();
  const [timetableId, setTimetableId] = React.useState('');
  const [classId, setClassId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [activateConfirm, setActivateConfirm] = React.useState(false);
  const [archiveConfirm, setArchiveConfirm] = React.useState(false);

  // Copy timetable state
  const [copyOpen, setCopyOpen] = React.useState(false);
  const [copyName, setCopyName] = React.useState('');

  // Auto-generate state
  const [autoOpen, setAutoOpen] = React.useState(false);
  const [periodsPerWeek, setPeriodsPerWeek] = React.useState('5');

  const { data: timetables = [], isLoading: ttLoading } = useTimetables({ campusId });
  const activate = useActivateTimetable();
  const archive = useArchiveTimetable();
  const copyTimetable = useCopyTimetable();
  const autoGenerate = useAutoGenerate();
  const { data: classes = [] } = useClasses();
  const { data: sections = [] } = useSections(classId || null);

  const selectedTimetable = timetables.find((t) => t.id === timetableId) ?? null;

  // Auto-select first DRAFT timetable
  React.useEffect(() => {
    if (!timetableId && timetables.length > 0) {
      const draft = timetables.find((t) => t.status === 'DRAFT') ?? timetables[0];
      if (draft) setTimetableId(draft.id);
    }
  }, [timetables, timetableId]);

  React.useEffect(() => { setSectionId(''); }, [classId]);

  // Reset copy name when opening
  React.useEffect(() => {
    if (copyOpen && selectedTimetable) {
      setCopyName(`${selectedTimetable.name} (Copy)`);
    }
  }, [copyOpen, selectedTimetable]);

  const classOptions = classes.map((c) => ({ label: c.name, value: c.id }));
  const sectionOptions = sections.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }));

  const timetableOptions = [
    { label: ttLoading ? 'Loading…' : '— Select timetable —', value: '' },
    ...timetables.map((t) => ({
      label: `${t.name} [${t.status}] · ${t.academicYear.name}`,
      value: t.id,
    })),
  ];

  async function handleActivate() {
    if (!timetableId) return;
    try {
      await activate.mutateAsync(timetableId);
      toast.success('Timetable activated. Previous active timetable was archived.');
      setActivateConfirm(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to activate.');
    }
  }

  async function handleArchive() {
    if (!timetableId) return;
    try {
      await archive.mutateAsync(timetableId);
      toast.success('Timetable archived.');
      setArchiveConfirm(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to archive.');
    }
  }

  async function handleCopy() {
    if (!timetableId || !copyName.trim()) return;
    try {
      const result = await copyTimetable.mutateAsync({ id: timetableId, name: copyName.trim() });
      toast.success(`Duplicated as "${result.name}" with ${result.copiedEntries} entries.`);
      setTimetableId(result.id);
      setCopyOpen(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to duplicate timetable.');
    }
  }

  async function handleAutoGenerate() {
    if (!timetableId) return;
    const ppw = parseInt(periodsPerWeek, 10);
    if (!ppw || ppw < 1 || ppw > 10) {
      toast.error('Periods per week must be between 1 and 10.');
      return;
    }
    try {
      const result = await autoGenerate.mutateAsync({ id: timetableId, periodsPerWeek: ppw });
      toast.success(`Auto-generated ${result.created} entries from ${result.assignments} assignments. ${result.skipped} slots skipped.`);
      setAutoOpen(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Auto-generation failed.');
    }
  }

  const isDraft = selectedTimetable?.status === 'DRAFT';
  const isActive = selectedTimetable?.status === 'ACTIVE';

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        {/* ── Timetable selector bar ── */}
        <div
          className="flex items-center gap-3 flex-wrap border-b border-[#eef0f2] p-3.5"
          style={{ background: '#fafbfc' }}
        >
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <select
              value={timetableId}
              onChange={(e) => setTimetableId(e.target.value)}
              style={{ ...SELECT_STYLE, width: '100%', minWidth: 0 }}
            >
              {timetableOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
          </div>

          {selectedTimetable && (
            <Badge variant={
              selectedTimetable.status === 'ACTIVE' ? 'active' :
              selectedTimetable.status === 'DRAFT' ? 'pending' : 'default'
            }>
              {selectedTimetable.status}
            </Badge>
          )}

          <div className="flex-1" />

          <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
            + New Draft
          </Button>
          {selectedTimetable && (
            <Button variant="secondary" size="sm" onClick={() => { setCopyOpen((v) => !v); setAutoOpen(false); }} disabled={copyTimetable.isPending}>
              Duplicate
            </Button>
          )}
          {isDraft && (
            <Button variant="secondary" size="sm" onClick={() => { setAutoOpen((v) => !v); setCopyOpen(false); }} disabled={autoGenerate.isPending}>
              Auto-Generate
            </Button>
          )}
          {isDraft && (
            <Button variant="primary" size="sm" onClick={() => setActivateConfirm(true)} disabled={activate.isPending}>
              Activate
            </Button>
          )}
          {(isDraft || isActive) && (
            <Button variant="ghost" size="sm" onClick={() => setArchiveConfirm(true)} disabled={archive.isPending}>
              Archive
            </Button>
          )}
        </div>

        {/* ── Duplicate panel ── */}
        {copyOpen && (
          <div
            className="flex items-center gap-3 flex-wrap border-b border-[#eef0f2] px-3.5 py-2.5"
            style={{ background: '#fffbeb' }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>Duplicate as</span>
            <input
              type="text"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              placeholder="New timetable name"
              style={{
                ...SELECT_STYLE,
                minWidth: 220,
                height: 30,
                padding: '0 10px',
                appearance: 'auto',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCopy(); }}
            />
            <Button variant="primary" size="sm" onClick={handleCopy} disabled={!copyName.trim() || copyTimetable.isPending}>
              {copyTimetable.isPending ? 'Creating…' : 'Create Copy'}
            </Button>
            <button
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setCopyOpen(false)}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Auto-generate panel ── */}
        {autoOpen && isDraft && (
          <div
            className="flex items-center gap-3 flex-wrap border-b border-[#eef0f2] px-3.5 py-2.5"
            style={{ background: '#f0fdf4' }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>Auto-Generate</span>
            <span style={{ fontSize: 11, color: '#4b5563' }}>Periods per week per assignment</span>
            <input
              type="number"
              min={1}
              max={10}
              value={periodsPerWeek}
              onChange={(e) => setPeriodsPerWeek(e.target.value)}
              style={{ ...SELECT_STYLE, minWidth: 70, width: 70, padding: '0 10px', appearance: 'auto' }}
            />
            <Button variant="primary" size="sm" onClick={handleAutoGenerate} disabled={autoGenerate.isPending}>
              {autoGenerate.isPending ? 'Generating…' : 'Generate'}
            </Button>
            <button
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setAutoOpen(false)}
            >
              Cancel
            </button>
            <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 4 }}>
              Uses teacher assignments · respects availability & scheduling rules
            </span>
          </div>
        )}

        {/* ── Section selector ── */}
        <div className="flex items-center gap-3 flex-wrap border-b border-[#eef0f2] px-3.5 py-2.5">
          <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Section</span>
          <div style={{ position: 'relative' }}>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              style={{ ...SELECT_STYLE, minWidth: 110 }}
            >
              <option value="">Class</option>
              {classOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
          </div>
          {classId && (
            <div style={{ position: 'relative' }}>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={{ ...SELECT_STYLE, minWidth: 110 }}
              >
                <option value="">Section</option>
                {sectionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        <div className="p-4">
          {!timetableId ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-sm font-medium text-[#4a5260]">No timetable selected</p>
              <p className="text-xs text-[#8a929b]">Select a timetable above or create a new draft.</p>
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                + Create Draft Timetable
              </Button>
            </div>
          ) : !sectionId ? (
            <div className="flex items-center justify-center py-16 text-sm text-[#8a929b]">
              Select a class and section to start building
            </div>
          ) : (
            selectedTimetable && (
              <BuilderGrid
                timetable={selectedTimetable}
                campusId={campusId}
                classId={classId}
                sectionId={sectionId}
                academicYearId={selectedTimetable.academicYearId}
              />
            )
          )}
        </div>
      </div>

      <CreateTimetableModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        campusId={campusId}
        onCreated={(id) => setTimetableId(id)}
      />

      <ConfirmDialog
        open={activateConfirm}
        onClose={() => setActivateConfirm(false)}
        onConfirm={handleActivate}
        title="Activate Timetable"
        description="Activate this timetable? The current active timetable (if any) will be automatically archived."
        confirmLabel="Activate"
        variant="primary"
        loading={activate.isPending}
      />
      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Archive Timetable"
        description="Archive this timetable? It will no longer be used for scheduling or attendance."
        confirmLabel="Archive"
        variant="danger"
        loading={archive.isPending}
      />
    </>
  );
}

// ─── Health page tab ──────────────────────────────────────────────────────────

interface HealthPageTabProps {
  campusId: string;
}

function HealthPageTab({ campusId }: HealthPageTabProps) {
  const { data: timetables = [], isLoading } = useTimetables({ campusId });
  const [timetableId, setTimetableId] = React.useState('');

  // Auto-select active timetable, fallback to first
  React.useEffect(() => {
    if (!timetableId && timetables.length > 0) {
      const active = timetables.find((t) => t.status === 'ACTIVE') ?? timetables[0];
      if (active) setTimetableId(active.id);
    }
  }, [timetables, timetableId]);

  const selectedTimetable = timetables.find((t) => t.id === timetableId) ?? null;

  const timetableOptions = [
    { label: isLoading ? 'Loading…' : '— Select timetable —', value: '' },
    ...timetables.map((t) => ({
      label: `${t.name} [${t.status}] · ${t.academicYear.name}`,
      value: t.id,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Timetable picker */}
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Timetable</span>
        <div style={{ position: 'relative' }}>
          <select
            value={timetableId}
            onChange={(e) => setTimetableId(e.target.value)}
            style={{ ...SELECT_STYLE, minWidth: 280 }}
          >
            {timetableOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
        </div>
        {selectedTimetable && (
          <Badge variant={selectedTimetable.status === 'ACTIVE' ? 'active' : selectedTimetable.status === 'DRAFT' ? 'pending' : 'default'}>
            {selectedTimetable.status}
          </Badge>
        )}
      </div>

      {!selectedTimetable ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
          {isLoading ? 'Loading timetables…' : 'No timetable selected'}
        </div>
      ) : (
        <HealthTab timetable={selectedTimetable} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [activeTab, setActiveTab] = React.useState('builder');
  const [campusId, setCampusId] = React.useState('');

  // Show skeleton KPIs while campus is resolving so the page doesn't look empty
  const { data: org, isLoading: orgLoading } = useOrganization();
  const { isLoading: campusLoading } = useCampuses(org?.id);
  const kpiLoading = orgLoading || campusLoading;

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule management across classes, teachers, and rooms"
      />

      <ContextBar campusId={campusId} onCampusChange={setCampusId} />

      {kpiLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : campusId ? (
        <KpiRow campusId={campusId} />
      ) : null}

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === 'builder' && (
        campusId ? (
          <BuilderTab campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to use the builder
          </div>
        )
      )}

      {activeTab === 'health' && (
        campusId ? (
          <HealthPageTab campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to view health
          </div>
        )
      )}

      {activeTab === 'timetable' && (
        campusId ? (
          <TimetableView campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to view the timetable
          </div>
        )
      )}

      {activeTab === 'substitute' && (
        campusId ? (
          <SubstitutePanel campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to use substitute suggestions
          </div>
        )
      )}

      {activeTab === 'rules' && (
        campusId ? (
          <RulesTab campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to manage scheduling rules
          </div>
        )
      )}

      {activeTab === 'rooms' && (
        campusId ? (
          <RoomsTab campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to manage rooms
          </div>
        )
      )}

      {activeTab === 'periods' && (
        campusId ? (
          <PeriodsTab campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to manage periods
          </div>
        )
      )}
    </div>
  );
}
