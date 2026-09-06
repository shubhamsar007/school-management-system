'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  Button,
  Badge,
  Avatar,
  KpiCard,
  KpiSkeleton,
  Pagination,
  Tabs,
  DataTable,
  ExportButton,
} from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  useOrganization,
  useCampuses,
  useAcademicYears,
} from '@/lib/hooks/use-academics';
import {
  useAttendanceOverview,
  useLeaveRequests,
  useStudentAttendance,
  useEmployeeAttendanceList,
  useApproveLeaveRequest,
  useAttendanceCorrections,
  type LeaveRequest,
  type StudentAttendanceRecord,
  type EmployeeAttendanceRecord,
} from '@/lib/hooks/use-attendance';
import { MarkStudentAttendanceModal } from './_components/mark-student-modal';
import { MarkEmployeeAttendanceModal } from './_components/mark-employee-modal';
import { LeaveRequestModal } from './_components/leave-request-modal';
import { RejectLeaveModal } from './_components/reject-leave-modal';
import { SessionsTab } from './_components/sessions-tab';
import { AnalyticsTab } from './_components/analytics-tab';
import { CorrectionsTab } from './_components/corrections-tab';
import { StudentHistoryCalendar } from './_components/student-history-calendar';
import { Modal } from '@/components/ui/modal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(val: string | null | undefined): string {
  if (!val) return '—';
  // val may be a full ISO string or HH:MM
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return val;
  } catch {
    return val;
  }
}

const STU_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = {
  PRESENT: 'active',
  ABSENT: 'left',
  LATE: 'pending',
  HALF_DAY: 'default',
  EXCUSED: 'default',
};

const EMP_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = {
  PRESENT: 'active',
  ABSENT: 'left',
  ON_LEAVE: 'pending',
  HALF_DAY: 'default',
  LATE: 'pending',
  WORK_FROM_HOME: 'active',
  HOLIDAY: 'default',
};

const LV_STATUS: Record<string, 'active' | 'left' | 'pending' | 'default'> = {
  PENDING: 'pending',
  APPROVED: 'active',
  REJECTED: 'left',
  CANCELLED: 'default',
};

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const toast = useToast();

  // ── Core state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState('students');
  const [selectedDate, setSelectedDate] = React.useState(todayISO());
  const [campusId, setCampusId] = React.useState('');
  const [academicYearId, setAcademicYearId] = React.useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = React.useState('');

  // ── Modal state ───────────────────────────────────────────────
  const [markStudentOpen, setMarkStudentOpen] = React.useState(false);
  const [markEmployeeOpen, setMarkEmployeeOpen] = React.useState(false);
  const [leaveRequestOpen, setLeaveRequestOpen] = React.useState(false);
  const [rejectModal, setRejectModal] = React.useState<{
    open: boolean;
    requestId: string;
    employeeName: string;
  }>({ open: false, requestId: '', employeeName: '' });
  const [historyModal, setHistoryModal] = React.useState<{
    open: boolean;
    studentId: string;
    studentName: string;
  }>({ open: false, studentId: '', studentName: '' });
  const [historyYear, setHistoryYear] = React.useState(() => new Date().getFullYear());
  const [historyMonth, setHistoryMonth] = React.useState(() => new Date().getMonth() + 1);

  // ── Pagination ────────────────────────────────────────────────
  const [stuPage, setStuPage] = React.useState(1);
  const [stuPageSize, setStuPageSize] = React.useState(25);
  const [empPage, setEmpPage] = React.useState(1);
  const [empPageSize, setEmpPageSize] = React.useState(25);
  const [lvPage, setLvPage] = React.useState(1);
  const [lvPageSize, setLvPageSize] = React.useState(25);

  // ── Org / campus / academic years ─────────────────────────────
  const { data: org } = useOrganization();
  const { data: campuses = [] } = useCampuses(org?.id);
  const { data: academicYears = [] } = useAcademicYears(org?.id);

  // Auto-select first campus and active/first academic year
  React.useEffect(() => {
    const first = campuses[0];
    if (first && !campusId) setCampusId(first.id);
  }, [campuses, campusId]);

  React.useEffect(() => {
    if (academicYears.length > 0 && !academicYearId) {
      const active = academicYears.find((y) => y.status === 'ACTIVE') ?? academicYears[0];
      if (active) setAcademicYearId(active.id);
    }
  }, [academicYears, academicYearId]);

  // ── Data hooks ────────────────────────────────────────────────
  const { data: overview, isLoading: overviewLoading } = useAttendanceOverview(
    campusId || undefined,
    selectedDate,
  );

  const { data: leaveRequests = [], isLoading: leaveLoading } = useLeaveRequests(
    leaveStatusFilter ? { status: leaveStatusFilter } : undefined,
  );

  const { data: studentAtt = [], isLoading: stuLoading } = useStudentAttendance({
    date: selectedDate,
    ...(campusId ? {} : {}), // campus not supported in student attendance filter directly
  });

  const { data: employeeAtt = [], isLoading: empLoading } = useEmployeeAttendanceList({
    date: selectedDate,
    ...(campusId ? { campusId } : {}),
  });

  const approve = useApproveLeaveRequest();

  const { data: pendingCorrections = [] } = useAttendanceCorrections({ status: 'PENDING' });

  // ── Derived ───────────────────────────────────────────────────
  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
  const pendingCorrectionsCount = pendingCorrections.length;

  const tabs = [
    { id: 'students', label: 'Student Attendance' },
    { id: 'employees', label: 'Staff Attendance' },
    {
      id: 'leave',
      label: 'Leave Requests',
      ...(pendingLeaveCount > 0 ? { count: pendingLeaveCount } : {}),
    },
    { id: 'sessions', label: 'Sessions' },
    { id: 'analytics', label: 'Analytics' },
    {
      id: 'corrections',
      label: 'Corrections',
      ...(pendingCorrectionsCount > 0 ? { count: pendingCorrectionsCount } : {}),
    },
  ];

  // ── Paginated slices ──────────────────────────────────────────
  const stuSlice = studentAtt.slice((stuPage - 1) * stuPageSize, stuPage * stuPageSize);
  const empSlice = employeeAtt.slice((empPage - 1) * empPageSize, empPage * empPageSize);
  const lvSlice = leaveRequests.slice((lvPage - 1) * lvPageSize, lvPage * lvPageSize);

  // ── Column defs ───────────────────────────────────────────────
  const studentColumns: ColumnDef<StudentAttendanceRecord>[] = [
    {
      id: 'student',
      header: 'STUDENT',
      width: 'minmax(180px,1.6fr)',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={`${r.student.person.firstName} ${r.student.person.lastName}`}
            size="md"
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>
              {r.student.person.firstName} {r.student.person.lastName}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'DATE',
      width: '110px',
      cell: (r) => <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.date)}</span>,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '110px',
      cell: (r) => (
        <Badge variant={STU_STATUS[r.status] ?? 'default'}>{statusLabel(r.status)}</Badge>
      ),
    },
    {
      id: 'checkIn',
      header: 'CHECK IN',
      width: '90px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatTime(r.checkInTime)}</span>
      ),
    },
    {
      id: 'remarks',
      header: 'REMARKS',
      width: '160px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{r.remarks || '—'}</span>
      ),
    },
    {
      id: 'history',
      header: '',
      width: '100px',
      align: 'right',
      cell: (r) => (
        <button
          onClick={() => {
            setHistoryModal({
              open: true,
              studentId: r.studentId,
              studentName: `${r.student.person.firstName} ${r.student.person.lastName}`,
            });
            setHistoryYear(new Date().getFullYear());
            setHistoryMonth(new Date().getMonth() + 1);
          }}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#2b5fa8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          View History
        </button>
      ),
    },
  ];

  const empColumns: ColumnDef<EmployeeAttendanceRecord>[] = [
    {
      id: 'employee',
      header: 'EMPLOYEE',
      width: 'minmax(180px,1.6fr)',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={`${r.employee.person.firstName} ${r.employee.person.lastName}`}
            size="md"
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>
              {r.employee.person.firstName} {r.employee.person.lastName}
            </div>
            <div style={{ fontSize: '11px', color: '#8a929b' }}>{r.employee.employeeNumber}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'DATE',
      width: '110px',
      cell: (r) => <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.date)}</span>,
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '130px',
      cell: (r) => (
        <Badge variant={EMP_STATUS[r.status] ?? 'default'}>{statusLabel(r.status)}</Badge>
      ),
    },
    {
      id: 'checkIn',
      header: 'CHECK IN',
      width: '90px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatTime(r.checkInTime)}</span>
      ),
    },
    {
      id: 'checkOut',
      header: 'CHECK OUT',
      width: '90px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatTime(r.checkOutTime)}</span>
      ),
    },
    {
      id: 'workHours',
      header: 'HOURS',
      width: '70px',
      align: 'center',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>
          {r.workHours != null ? `${r.workHours}h` : '—'}
        </span>
      ),
    },
    {
      id: 'remarks',
      header: 'REMARKS',
      width: '130px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{r.remarks || '—'}</span>
      ),
    },
  ];

  const leaveColumns: ColumnDef<LeaveRequest>[] = [
    {
      id: 'employee',
      header: 'EMPLOYEE',
      width: 'minmax(160px,1.4fr)',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            name={`${r.employee.person.firstName} ${r.employee.person.lastName}`}
            size="md"
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#14181c' }}>
              {r.employee.person.firstName} {r.employee.person.lastName}
            </div>
            <div style={{ fontSize: '11px', color: '#8a929b' }}>{r.employee.employeeNumber}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'leaveType',
      header: 'LEAVE TYPE',
      width: '120px',
      cell: (r) => <span style={{ fontSize: '12px' }}>{r.leaveType.name}</span>,
    },
    {
      id: 'from',
      header: 'FROM',
      width: '100px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.startDate)}</span>
      ),
    },
    {
      id: 'to',
      header: 'TO',
      width: '100px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{formatDate(r.endDate)}</span>
      ),
    },
    {
      id: 'days',
      header: 'DAYS',
      width: '60px',
      align: 'center',
      cell: (r) => <span style={{ fontSize: '12px', fontWeight: 500 }}>{r.totalDays}</span>,
    },
    {
      id: 'reason',
      header: 'REASON',
      width: '150px',
      cell: (r) => (
        <span style={{ fontSize: '12px', color: '#6b7480' }}>{r.reason || '—'}</span>
      ),
    },
    {
      id: 'status',
      header: 'STATUS',
      width: '100px',
      cell: (r) => (
        <Badge variant={LV_STATUS[r.status] ?? 'default'}>{statusLabel(r.status)}</Badge>
      ),
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      width: '120px',
      align: 'right',
      cell: (r) =>
        r.status === 'PENDING' ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button
              style={{ fontSize: '12px', fontWeight: 500, color: '#146b41', cursor: 'pointer', background: 'none', border: 'none' }}
              onClick={() => {
                approve.mutate(
                  { id: r.id },
                  {
                    onSuccess: () => toast.success('Leave request approved'),
                    onError: () => toast.error('Failed to approve leave request'),
                  },
                );
              }}
            >
              Approve
            </button>
            <span style={{ color: '#d7dce1' }}>|</span>
            <button
              style={{ fontSize: '12px', fontWeight: 500, color: '#b3261e', cursor: 'pointer', background: 'none', border: 'none' }}
              onClick={() =>
                setRejectModal({
                  open: true,
                  requestId: r.id,
                  employeeName: `${r.employee.person.firstName} ${r.employee.person.lastName}`,
                })
              }
            >
              Reject
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#8a929b' }}>—</span>
        ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={`Attendance for ${formatDate(selectedDate)}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                height: 36,
                border: '1px solid #d7dce1',
                borderRadius: 6,
                padding: '0 10px',
                fontSize: '13px',
                color: '#14181c',
              }}
            />
            {activeTab === 'students' && (
              <ExportButton
                label="Export"
                data={studentAtt}
                filename="student-attendance"
                formats={['csv', 'excel']}
                columns={[
                  { header: 'Student', accessor: (r) => `${r.student.person.firstName} ${r.student.person.lastName}` },
                  { header: 'Status', accessor: 'status' },
                  { header: 'Date', accessor: 'date' },
                  { header: 'Remarks', accessor: (r) => r.remarks ?? '' },
                ]}
              />
            )}
            {activeTab === 'employees' && (
              <ExportButton
                label="Export"
                data={employeeAtt}
                filename="staff-attendance"
                formats={['csv', 'excel']}
                columns={[
                  { header: 'Employee', accessor: (r) => `${r.employee.person.firstName} ${r.employee.person.lastName}` },
                  { header: 'Employee No', accessor: (r) => r.employee.employeeNumber },
                  { header: 'Status', accessor: 'status' },
                  { header: 'Date', accessor: 'date' },
                ]}
              />
            )}
            {activeTab === 'leave' && (
              <ExportButton
                label="Export"
                data={leaveRequests}
                filename="leave-requests"
                formats={['csv', 'excel']}
                columns={[
                  { header: 'Employee', accessor: (r) => `${r.employee.person.firstName} ${r.employee.person.lastName}` },
                  { header: 'Leave Type', accessor: (r) => r.leaveType.name },
                  { header: 'From', accessor: 'startDate' },
                  { header: 'To', accessor: 'endDate' },
                  { header: 'Days', accessor: 'totalDays' },
                  { header: 'Status', accessor: 'status' },
                ]}
              />
            )}
            {activeTab === 'students' && (
              <Button variant="primary" onClick={() => setMarkStudentOpen(true)}>
                Mark Attendance
              </Button>
            )}
            {activeTab === 'employees' && (
              <Button variant="primary" onClick={() => setMarkEmployeeOpen(true)}>
                Mark Attendance
              </Button>
            )}
            {activeTab === 'leave' && (
              <Button variant="primary" onClick={() => setLeaveRequestOpen(true)}>
                New Request
              </Button>
            )}
          </div>
        }
      />

      {/* ── Context selectors ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
          padding: '12px 16px',
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Academic Year
          </span>
          <select
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            style={{
              height: 32,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 8px',
              fontSize: '13px',
              color: '#14181c',
            }}
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', color: '#6b7480', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Campus
          </span>
          <select
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            style={{
              height: 32,
              border: '1px solid #d7dce1',
              borderRadius: 6,
              padding: '0 8px',
              fontSize: '13px',
              color: '#14181c',
            }}
          >
            <option value="">All Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Section ───────────────────────────────────────── */}
      {overviewLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Students strip */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7480', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Students
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
              <KpiCard title="TOTAL" value={String(overview?.students.total ?? 0)} />
              <KpiCard
                title="PRESENT"
                value={String(overview?.students.present ?? 0)}
                subtitle={`${overview?.students.rate ?? 0}% rate`}
              />
              <KpiCard title="ABSENT" value={String(overview?.students.absent ?? 0)} />
              <KpiCard title="LATE" value={String(overview?.students.late ?? 0)} />
              <KpiCard title="HALF DAY" value={String(overview?.students.halfDay ?? 0)} />
              <KpiCard title="EXCUSED" value={String(overview?.students.excused ?? 0)} />
            </div>
          </div>

          {/* Staff strip */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b7480', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Staff
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
              <KpiCard title="TOTAL" value={String(overview?.staff.total ?? 0)} />
              <KpiCard
                title="PRESENT"
                value={String(overview?.staff.present ?? 0)}
                subtitle={`${overview?.staff.rate ?? 0}% rate`}
              />
              <KpiCard title="ABSENT" value={String(overview?.staff.absent ?? 0)} />
              <KpiCard title="ON LEAVE" value={String(overview?.staff.onLeave ?? 0)} />
              <KpiCard title="LATE" value={String(overview?.staff.late ?? 0)} />
            </div>
          </div>
        </>
      )}

      {/* ── Alerts panel ──────────────────────────────────────── */}
      {(overview?.alerts.pendingLeaveRequests ?? 0) > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: '#fffbf0',
            border: '1px solid #f5c842',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: '13px', color: '#7a5c00' }}>
            <strong>Requires Attention:</strong>{' '}
            {overview?.alerts.pendingLeaveRequests} leave{' '}
            {overview?.alerts.pendingLeaveRequests === 1 ? 'request' : 'requests'} pending approval
          </span>
          <button
            onClick={() => setActiveTab('leave')}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#2b5fa8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: 4,
            }}
          >
            Review now
          </button>
        </div>
      )}

      {/* ── Tabs + Table ──────────────────────────────────────── */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* ── New tab panels (rendered outside the shared table container) ── */}
      {activeTab === 'sessions' && campusId && academicYearId && (
        <SessionsTab campusId={campusId} academicYearId={academicYearId} />
      )}
      {activeTab === 'analytics' && campusId && academicYearId && (
        <AnalyticsTab campusId={campusId} academicYearId={academicYearId} />
      )}
      {activeTab === 'corrections' && (
        <CorrectionsTab campusId={campusId} />
      )}

      {(activeTab === 'students' || activeTab === 'employees' || activeTab === 'leave') && (
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 10,
          border: '1px solid #e6e8eb',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Tab-specific filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid #eef0f2',
            padding: '10px 14px',
          }}
        >
          {activeTab === 'leave' && (
            <select
              value={leaveStatusFilter}
              onChange={(e) => setLeaveStatusFilter(e.target.value)}
              style={{
                height: 32,
                border: '1px solid #d7dce1',
                borderRadius: 6,
                padding: '0 8px',
                fontSize: '13px',
                color: '#14181c',
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
          <div style={{ flex: 1 }} />
        </div>

        {/* Tables */}
        {activeTab === 'students' && (
          stuLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              Loading student attendance…
            </div>
          ) : stuSlice.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              No student attendance records for this date.
              <br />
              <button
                style={{ marginTop: 12, fontSize: '12px', color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setMarkStudentOpen(true)}
              >
                Mark attendance now
              </button>
            </div>
          ) : (
            <DataTable columns={studentColumns} data={stuSlice} selectable />
          )
        )}

        {activeTab === 'employees' && (
          empLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              Loading staff attendance…
            </div>
          ) : empSlice.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              No staff attendance records for this date.
              <br />
              <button
                style={{ marginTop: 12, fontSize: '12px', color: '#2b5fa8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setMarkEmployeeOpen(true)}
              >
                Mark attendance now
              </button>
            </div>
          ) : (
            <DataTable columns={empColumns} data={empSlice} selectable />
          )
        )}

        {activeTab === 'leave' && (
          leaveLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              Loading leave requests…
            </div>
          ) : lvSlice.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#8a929b', fontSize: '13px' }}>
              No leave requests found.
            </div>
          ) : (
            <DataTable columns={leaveColumns} data={lvSlice} />
          )
        )}

        {/* Pagination */}
        <div style={{ borderTop: '1px solid #eef0f2', padding: '10px 14px' }}>
          {activeTab === 'students' && (
            <Pagination
              page={stuPage}
              pageSize={stuPageSize}
              total={studentAtt.length}
              onPageChange={setStuPage}
              onPageSizeChange={setStuPageSize}
            />
          )}
          {activeTab === 'employees' && (
            <Pagination
              page={empPage}
              pageSize={empPageSize}
              total={employeeAtt.length}
              onPageChange={setEmpPage}
              onPageSizeChange={setEmpPageSize}
            />
          )}
          {activeTab === 'leave' && (
            <Pagination
              page={lvPage}
              pageSize={lvPageSize}
              total={leaveRequests.length}
              onPageChange={setLvPage}
              onPageSizeChange={setLvPageSize}
            />
          )}
        </div>
      </div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      <MarkStudentAttendanceModal
        open={markStudentOpen}
        onClose={() => setMarkStudentOpen(false)}
        campusId={campusId}
        academicYearId={academicYearId}
        date={selectedDate}
      />

      <MarkEmployeeAttendanceModal
        open={markEmployeeOpen}
        onClose={() => setMarkEmployeeOpen(false)}
        campusId={campusId}
        date={selectedDate}
      />

      <LeaveRequestModal
        open={leaveRequestOpen}
        onClose={() => setLeaveRequestOpen(false)}
      />

      <RejectLeaveModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: '', employeeName: '' })}
        requestId={rejectModal.requestId}
        employeeName={rejectModal.employeeName}
      />

      {/* Student history calendar modal */}
      <Modal
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false, studentId: '', studentName: '' })}
        title={`Attendance History — ${historyModal.studentName}`}
        size="md"
      >
        {historyModal.studentId && (
          <StudentHistoryCalendar
            studentId={historyModal.studentId}
            year={historyYear}
            month={historyMonth}
            onMonthChange={(y, m) => {
              setHistoryYear(y);
              setHistoryMonth(m);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
