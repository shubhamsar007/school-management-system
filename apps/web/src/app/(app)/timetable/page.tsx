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
  useDeleteRoom,
  useDeletePeriod,
  useDeleteBuilding,
  type TimetableRoom,
  type TimetablePeriod,
  type TimetableBuilding,
} from '@/lib/hooks/use-timetable';
import { WeeklyScheduleGrid } from '@/components/shared/weekly-schedule-grid';
import { PeriodTypeBadge } from '@/components/shared/period-type-badge';
import { PeriodModal } from './_components/period-modal';
import { RoomModal } from './_components/room-modal';
import { BuildingModal } from './_components/building-modal';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'timetable', label: 'Timetable View' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'periods', label: 'Periods' },
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
  cursor: 'pointer',
  outline: 'none',
  minWidth: 140,
};

interface ContextBarProps {
  campusId: string;
  onCampusChange: (id: string) => void;
}

function ContextBar({ campusId, onCampusChange }: ContextBarProps) {
  const { data: org } = useOrganization();
  const { data: campuses = [], isLoading } = useCampuses(org?.id);

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
          style={SELECT_STYLE}
          disabled={isLoading}
        >
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

  const totalRooms = rooms?.length ?? 0;
  const totalBuildings = buildings?.length ?? 0;
  const activeCount = activeTimetables?.length ?? 0;

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
    { title: 'CONFLICTS', value: '0', subtitle: 'detected' },
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

interface TimetableViewProps {
  campusId: string;
}

function TimetableView({ campusId }: TimetableViewProps) {
  const [classId, setClassId] = React.useState('');
  const [sectionId, setSectionId] = React.useState('');

  const { data: classes = [] } = useClasses();
  const { data: sections = [] } = useSections(classId || null);
  const { data: periods = [] } = usePeriods(campusId);
  const { data: scheduleDays, isLoading, isError } = useSectionSchedule(sectionId || null);

  // Reset section when class changes
  React.useEffect(() => { setSectionId(''); }, [classId]);

  // Build entry lookup: day → periodId → entry
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

  // Active days (days that have at least one entry)
  const activeDays = React.useMemo(() => {
    if (!scheduleDays) return DAY_ORDER.slice(0, 5);
    const daysWithEntries = new Set(scheduleDays.map((d) => d.day));
    return DAY_ORDER.filter((d) => daysWithEntries.has(d));
  }, [scheduleDays]);

  const classOptions = classes.map((c) => ({ label: c.name, value: c.id }));
  const sectionOptions = sections.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }));

  return (
    <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-[#eef0f2] p-3.5 flex-wrap">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Class</span>
          <div style={{ position: 'relative' }}>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              style={{ ...SELECT_STYLE, minWidth: 120 }}
            >
              <option value="">Select class</option>
              {classOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
          </div>
        </div>

        {classId && (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: '#8a929b', fontWeight: 500 }}>Section</span>
            <div style={{ position: 'relative' }}>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                style={{ ...SELECT_STYLE, minWidth: 120 }}
              >
                <option value="">Select section</option>
                {sectionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8a929b', fontSize: 10 }}>▼</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid or prompt */}
      {!sectionId ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
          Select a class and section to view the timetable
        </div>
      ) : (
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
              Loading schedule…
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
              No active timetable found for this section's campus.
            </div>
          )}
          {!isLoading && !isError && (
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
                {/* Header row */}
                <div style={{ background: '#fafbfc' }} className="px-3 py-2.5" />
                {activeDays.map((d) => (
                  <div
                    key={d}
                    style={{ background: '#fafbfc' }}
                    className="py-2.5 text-center text-xs font-semibold text-[#14181c]"
                  >
                    {d.slice(0, 3)}
                  </div>
                ))}

                {/* Period rows */}
                {periods.map((period) => {
                  const isBreak = period.periodType !== 'CLASS';
                  return (
                    <React.Fragment key={period.id}>
                      {/* Period label cell */}
                      <div
                        style={{ background: isBreak ? '#f6f7f8' : 'white' }}
                        className="px-3 py-2 text-right"
                      >
                        <div className="text-[11px] font-semibold text-[#14181c]">{period.name}</div>
                        <div className="text-[10px] text-[#8a929b]">
                          {formatTime(period.startTime)}
                        </div>
                      </div>

                      {/* Break row: spans all day columns */}
                      {isBreak ? (
                        <div
                          style={{
                            background: '#f6f7f8',
                            gridColumn: `span ${activeDays.length}`,
                          }}
                          className="flex items-center justify-center py-2"
                        >
                          <span className="text-[11px] font-medium text-[#8a929b] tracking-wider">
                            {period.periodType}
                          </span>
                          <span className="ml-2 text-[10px] text-[#b0b7bf]">
                            {formatTime(period.startTime)} – {formatTime(period.endTime)}
                          </span>
                        </div>
                      ) : (
                        /* Class period: one cell per day */
                        activeDays.map((day) => {
                          const entry = entryMap.get(day)?.get(period.id);
                          return (
                            <div
                              key={day}
                              style={{ background: 'white' }}
                              className="p-1.5"
                            >
                              {entry ? (
                                <div className="rounded-lg bg-[#f0f6ff] border border-[#dbe8f5] px-2 py-1.5 h-full">
                                  <div className="text-[11px] font-semibold text-[#2b5fa8] leading-tight">
                                    {entry.subject.name}
                                  </div>
                                  {entry.room && (
                                    <div className="text-[10px] text-[#6b7480] mt-0.5">
                                      {entry.room.name}
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
          )}
        </div>
      )}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [activeTab, setActiveTab] = React.useState('timetable');
  const [campusId, setCampusId] = React.useState('');

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule management across classes, teachers, and rooms"
      />

      <ContextBar campusId={campusId} onCampusChange={setCampusId} />

      {campusId && <KpiRow campusId={campusId} />}

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === 'timetable' && (
        campusId ? (
          <TimetableView campusId={campusId} />
        ) : (
          <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">
            Select a campus to view the timetable
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
