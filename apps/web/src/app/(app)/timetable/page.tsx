'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Button, Badge, KpiCard, Dropdown, Pagination, Tabs, DataTable, ExportButton } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';

interface Room { id: string; name: string; building: string; capacity: number; type: string; floor: string; status: string; }
interface Period { id: string; name: string; startTime: string; endTime: string; duration: string; type: string; }

const ROOMS: Room[] = [
  { id: '1', name: 'Room 101', building: 'Block A', capacity: 40, type: 'CLASSROOM', floor: '1st Floor', status: 'ACTIVE' },
  { id: '2', name: 'Room 102', building: 'Block A', capacity: 40, type: 'CLASSROOM', floor: '1st Floor', status: 'ACTIVE' },
  { id: '3', name: 'Lab 201', building: 'Block B', capacity: 30, type: 'LAB', floor: '2nd Floor', status: 'ACTIVE' },
  { id: '4', name: 'Lab 202', building: 'Block B', capacity: 30, type: 'LAB', floor: '2nd Floor', status: 'ACTIVE' },
  { id: '5', name: 'Hall 301', building: 'Block C', capacity: 120, type: 'HALL', floor: '3rd Floor', status: 'ACTIVE' },
  { id: '6', name: 'Room 103', building: 'Block A', capacity: 38, type: 'CLASSROOM', floor: '1st Floor', status: 'ACTIVE' },
  { id: '7', name: 'Room 201', building: 'Block B', capacity: 42, type: 'CLASSROOM', floor: '2nd Floor', status: 'MAINTENANCE' },
  { id: '8', name: 'Library', building: 'Block C', capacity: 60, type: 'HALL', floor: '1st Floor', status: 'ACTIVE' },
];

const PERIODS: Period[] = [
  { id: '1', name: 'Period 1', startTime: '08:00', endTime: '08:45', duration: '45 min', type: 'CLASS' },
  { id: '2', name: 'Period 2', startTime: '08:45', endTime: '09:30', duration: '45 min', type: 'CLASS' },
  { id: '3', name: 'Break', startTime: '09:30', endTime: '10:00', duration: '30 min', type: 'BREAK' },
  { id: '4', name: 'Period 3', startTime: '10:00', endTime: '10:45', duration: '45 min', type: 'CLASS' },
  { id: '5', name: 'Period 4', startTime: '10:45', endTime: '11:30', duration: '45 min', type: 'CLASS' },
  { id: '6', name: 'Period 5', startTime: '11:30', endTime: '12:15', duration: '45 min', type: 'CLASS' },
  { id: '7', name: 'Lunch', startTime: '12:15', endTime: '13:00', duration: '45 min', type: 'LUNCH' },
  { id: '8', name: 'Period 6', startTime: '13:00', endTime: '13:45', duration: '45 min', type: 'CLASS' },
  { id: '9', name: 'Period 7', startTime: '13:45', endTime: '14:30', duration: '45 min', type: 'CLASS' },
  { id: '10', name: 'Period 8', startTime: '14:30', endTime: '15:15', duration: '45 min', type: 'CLASS' },
];

type Cell = { subject: string; teacher: string } | null;
type SlotRow = { label: string; time: string; isBreak?: boolean; breakLabel?: string; cells?: Cell[] };

const SCHEDULE: SlotRow[] = [
  { label: 'Period 1', time: '08:00–08:45', cells: [{ subject: 'Mathematics', teacher: 'Ravi Kumar' }, { subject: 'Science', teacher: 'Priya Sharma' }, { subject: 'English', teacher: 'Ananya Das' }, { subject: 'Mathematics', teacher: 'Ravi Kumar' }, { subject: 'History', teacher: 'Suresh Menon' }] },
  { label: 'Period 2', time: '08:45–09:30', cells: [{ subject: 'Science', teacher: 'Priya Sharma' }, { subject: 'English', teacher: 'Ananya Das' }, { subject: 'Mathematics', teacher: 'Ravi Kumar' }, { subject: 'Science', teacher: 'Priya Sharma' }, { subject: 'Mathematics', teacher: 'Ravi Kumar' }] },
  { label: 'Break', time: '09:30–10:00', isBreak: true, breakLabel: 'BREAK' },
  { label: 'Period 3', time: '10:00–10:45', cells: [{ subject: 'History', teacher: 'Suresh Menon' }, { subject: 'Mathematics', teacher: 'Ravi Kumar' }, { subject: 'Biology', teacher: 'Lakshmi Nair' }, { subject: 'English', teacher: 'Ananya Das' }, { subject: 'Science', teacher: 'Priya Sharma' }] },
  { label: 'Period 4', time: '10:45–11:30', cells: [{ subject: 'English', teacher: 'Ananya Das' }, { subject: 'Biology', teacher: 'Lakshmi Nair' }, { subject: 'History', teacher: 'Suresh Menon' }, { subject: 'Biology', teacher: 'Lakshmi Nair' }, { subject: 'PE', teacher: 'Kiran Bhat' }] },
  { label: 'Period 5', time: '11:30–12:15', cells: [{ subject: 'PE', teacher: 'Kiran Bhat' }, { subject: 'Drawing', teacher: 'Deepa Rao' }, { subject: 'PE', teacher: 'Kiran Bhat' }, { subject: 'Drawing', teacher: 'Deepa Rao' }, { subject: 'English', teacher: 'Ananya Das' }] },
  { label: 'Lunch', time: '12:15–13:00', isBreak: true, breakLabel: 'LUNCH' },
  { label: 'Period 6', time: '13:00–13:45', cells: [{ subject: 'Biology', teacher: 'Lakshmi Nair' }, { subject: 'History', teacher: 'Suresh Menon' }, { subject: 'Drawing', teacher: 'Deepa Rao' }, { subject: 'PE', teacher: 'Kiran Bhat' }, { subject: 'Drawing', teacher: 'Deepa Rao' }] },
];

const DAYS = ['Mon 25/8', 'Tue 26/8', 'Wed 27/8', 'Thu 28/8', 'Fri 29/8'];
const CLASS_OPTIONS = [{ label: 'Grade 8·B', value: 'grade8b' }, { label: 'Grade 9·A', value: 'grade9a' }, { label: 'Grade 10·A', value: 'grade10a' }];
const TABS = [{ id: 'timetable', label: 'Timetable View' }, { id: 'rooms', label: 'Rooms', count: 24 }, { id: 'periods', label: 'Periods', count: 10 }];

const TYPE_BADGE: Record<string, 'active' | 'default'> = { CLASSROOM: 'default', LAB: 'graduated' as 'default', HALL: 'active', CLASS: 'active', BREAK: 'default', LUNCH: 'default' };

export default function TimetablePage() {
  const [activeTab, setActiveTab] = React.useState('timetable');
  const [selectedClass, setSelectedClass] = React.useState('grade8b');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);

  const roomColumns: ColumnDef<Room>[] = [
    { id: 'name', header: 'ROOM NAME', width: '120px', accessor: 'name' },
    { id: 'building', header: 'BUILDING', width: '100px', accessor: 'building' },
    { id: 'capacity', header: 'CAPACITY', width: '90px', align: 'center', accessor: (r) => r.capacity },
    { id: 'type', header: 'TYPE', width: '110px', cell: (r) => <Badge variant={r.type === 'LAB' ? 'graduated' : r.type === 'HALL' ? 'active' : 'default'}>{r.type}</Badge> },
    { id: 'floor', header: 'FLOOR', width: '100px', accessor: 'floor' },
    { id: 'status', header: 'STATUS', width: '90px', cell: (r) => <Badge variant={r.status === 'ACTIVE' ? 'active' : 'pending'}>{r.status}</Badge> },
    { id: 'actions', header: 'ACTIONS', width: '80px', align: 'right', cell: () => <div className="flex justify-end gap-1.5 text-xs font-medium text-[#2b5fa8]"><button>Edit</button><span className="text-[#d7dce1]">|</span><button>Delete</button></div> },
  ];

  const periodColumns: ColumnDef<Period>[] = [
    { id: 'name', header: 'PERIOD NAME', width: '130px', accessor: 'name' },
    { id: 'startTime', header: 'START TIME', width: '110px', accessor: 'startTime' },
    { id: 'endTime', header: 'END TIME', width: '110px', accessor: 'endTime' },
    { id: 'duration', header: 'DURATION', width: '100px', align: 'center', accessor: 'duration' },
    { id: 'type', header: 'TYPE', width: '90px', cell: (r) => <Badge variant={TYPE_BADGE[r.type] ?? 'default'}>{r.type}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Schedule management across buildings and rooms"
        actions={<Button variant="primary">+ Add Entry</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-4">
        <KpiCard title="BUILDINGS" value="3" subtitle="campuses" />
        <KpiCard title="TOTAL ROOMS" value="24" subtitle="configured" />
        <KpiCard title="ACTIVE TIMETABLES" value="8" subtitle="this term" />
        <KpiCard title="CONFLICTS" value="0" subtitle="resolved" />
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === 'timetable' && (
        <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#eef0f2] p-3.5">
            <Dropdown label="Class" value={selectedClass} options={CLASS_OPTIONS} onChange={setSelectedClass} />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">‹</Button>
              <span className="text-sm text-[#14181c]">25 Aug – 29 Aug 2025</span>
              <Button variant="secondary" size="sm">›</Button>
            </div>
          </div>
          <div className="overflow-x-auto p-4">
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', gap: '1px', background: '#e6e8eb', minWidth: 700 }}>
              {/* Header */}
              <div style={{ background: '#fafbfc' }} className="px-3 py-2.5" />
              {DAYS.map((d) => (
                <div key={d} style={{ background: '#fafbfc' }} className="py-2.5 text-center text-xs font-semibold text-[#14181c]">{d}</div>
              ))}
              {/* Rows */}
              {SCHEDULE.map((slot) => (
                <React.Fragment key={slot.label + slot.time}>
                  <div style={{ background: 'white' }} className="px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold text-[#14181c]">{slot.label}</div>
                    <div className="text-[10px] text-[#8a929b]">{slot.time}</div>
                  </div>
                  {slot.isBreak ? (
                    <div style={{ background: '#f6f7f8', gridColumn: 'span 5' }} className="flex items-center justify-center py-3 text-xs font-medium text-[#8a929b]">
                      {slot.breakLabel}
                    </div>
                  ) : (
                    slot.cells?.map((cell, ci) => (
                      <div key={ci} style={{ background: 'white' }} className="rounded-lg border border-[#e6e8eb] p-2 m-0.5">
                        {cell ? (
                          <>
                            <div className="text-xs font-semibold text-[#14181c]">{cell.subject}</div>
                            <div className="text-[11px] text-[#6b7480]">{cell.teacher}</div>
                          </>
                        ) : (
                          <div className="text-[11px] text-[#a2aab3]">—</div>
                        )}
                      </div>
                    ))
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <div className="flex-1" />
            <ExportButton label="Export" data={ROOMS} filename="rooms" formats={['csv', 'excel']}
              columns={[{ header: 'Room', accessor: 'name' }, { header: 'Building', accessor: 'building' }, { header: 'Capacity', accessor: (r: Room) => r.capacity }]} />
          </div>
          <DataTable columns={roomColumns} data={ROOMS} />
          <div className="border-t border-[#eef0f2] p-3">
            <Pagination page={page} pageSize={pageSize} total={ROOMS.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}

      {activeTab === 'periods' && (
        <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eef0f2] p-3.5">
            <div className="flex-1" />
            <ExportButton label="Export" data={PERIODS} filename="periods" formats={['csv']}
              columns={[{ header: 'Name', accessor: 'name' }, { header: 'Start', accessor: 'startTime' }, { header: 'End', accessor: 'endTime' }]} />
          </div>
          <DataTable columns={periodColumns} data={PERIODS} />
          <div className="border-t border-[#eef0f2] p-3">
            <Pagination page={page} pageSize={pageSize} total={PERIODS.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}
    </div>
  );
}
