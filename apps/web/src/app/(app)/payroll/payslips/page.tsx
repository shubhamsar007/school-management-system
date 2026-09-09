'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { Badge, Spinner, Button, DataTable, EmptyState } from '@/components/ui';
import type { ColumnDef } from '@/components/ui';
import {
  payrollApi,
  formatCurrency,
  formatPeriod,
  downloadPayslipPdf,
  type PayrollRun,
  type PayrollRunDetail,
  type PayrollRecord,
} from '@/lib/payroll-api';
import { FileText, Download } from 'lucide-react';

const RECORD_STATUS_BADGE: Record<PayrollRecord['status'], { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }> = {
  PAID: { variant: 'active', label: 'Paid' },
  PENDING: { variant: 'pending', label: 'Pending' },
  HELD: { variant: 'left', label: 'Held' },
};

const RUN_STATUS_BADGE: Record<PayrollRun['status'], { variant: 'active' | 'pending' | 'default' | 'graduated' | 'left'; label: string }> = {
  PAID: { variant: 'active', label: 'Paid' },
  APPROVED: { variant: 'graduated', label: 'Approved' },
  COMPLETED: { variant: 'pending', label: 'Completed' },
  PROCESSING: { variant: 'pending', label: 'Processing' },
  DRAFT: { variant: 'default', label: 'Draft' },
};

export default function PayslipsPage() {
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [loadingRuns, setLoadingRuns] = React.useState(true);
  const [runsError, setRunsError] = React.useState<string | null>(null);

  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [runDetail, setRunDetail] = React.useState<PayrollRunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [expandedRecordId, setExpandedRecordId] = React.useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf]   = React.useState<string | null>(null);
  const [pdfError, setPdfError]               = React.useState<string | null>(null);

  async function handleDownloadPdf(runId: string, employeeId: string, recordId: string) {
    setDownloadingPdf(recordId);
    setPdfError(null);
    try {
      await downloadPayslipPdf(runId, employeeId);
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Failed to download PDF');
    } finally {
      setDownloadingPdf(null);
    }
  }

  React.useEffect(() => {
    async function loadRuns() {
      try {
        const data = await payrollApi.runs.list();
        // Show PAID, APPROVED, COMPLETED runs
        const relevant = data.filter(
          (r) => r.status === 'PAID' || r.status === 'APPROVED' || r.status === 'COMPLETED'
        );
        setRuns(relevant);
      } catch (e) {
        setRunsError(e instanceof Error ? e.message : 'Failed to load payroll runs');
      } finally {
        setLoadingRuns(false);
      }
    }
    loadRuns();
  }, []);

  React.useEffect(() => {
    if (!selectedRunId) {
      setRunDetail(null);
      return;
    }
    async function loadDetail() {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const data = await payrollApi.runs.get(selectedRunId!);
        setRunDetail(data);
      } catch (e) {
        setDetailError(e instanceof Error ? e.message : 'Failed to load run detail');
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedRunId]);

  const records = runDetail?.records ?? [];

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      id: 'employeeId',
      header: 'Employee ID',
      width: '130px',
      cell: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7480' }}>
          {row.employeeId.slice(0, 10)}…
        </span>
      ),
    },
    {
      id: 'working',
      header: 'Working Days',
      align: 'center',
      width: '110px',
      cell: (row) => <span style={{ fontSize: 12 }}>{row.workingDays ?? '—'}</span>,
    },
    {
      id: 'present',
      header: 'Present Days',
      align: 'center',
      width: '110px',
      cell: (row) => <span style={{ fontSize: 12 }}>{row.presentDays ?? '—'}</span>,
    },
    {
      id: 'gross',
      header: 'Gross',
      align: 'right',
      width: '100px',
      cell: (row) => <span style={{ fontSize: 12 }}>{formatCurrency(row.gross)}</span>,
    },
    {
      id: 'deductions',
      header: 'Deductions',
      align: 'right',
      width: '110px',
      cell: (row) => (
        <span style={{ fontSize: 12, color: '#b3261e' }}>{formatCurrency(row.totalDeductions)}</span>
      ),
    },
    {
      id: 'tds',
      header: 'TDS',
      align: 'right',
      width: '90px',
      cell: (row) => {
        const tds = parseFloat(row.tdsAmount ?? '0');
        return (
          <span style={{ fontSize: 12, color: tds > 0 ? '#b3261e' : '#8a929b' }}>
            {tds > 0 ? formatCurrency(tds) : '—'}
          </span>
        );
      },
    },
    {
      id: 'net',
      header: 'Net',
      align: 'right',
      width: '100px',
      cell: (row) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#146b41' }}>{formatCurrency(row.netSalary)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: '90px',
      cell: (row) => {
        const s = RECORD_STATUS_BADGE[row.status] ?? { variant: 'default' as const, label: row.status };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      width: '170px',
      align: 'right',
      cell: (row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            style={{
              fontSize: 12,
              color: '#2b5fa8',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setExpandedRecordId((prev) => (prev === row.id ? null : row.id))}
          >
            {expandedRecordId === row.id ? 'Hide ▲' : 'View ▼'}
          </button>
          <Button
            size="sm"
            variant="ghost"
            disabled={downloadingPdf === row.id}
            onClick={() => selectedRunId && handleDownloadPdf(selectedRunId, row.employeeId, row.id)}
            style={{ padding: '2px 8px', color: '#4a9b6f' }}
          >
            {downloadingPdf === row.id ? <Spinner size="sm" /> : <Download size={13} />}
          </Button>
        </div>
      ),
    },
  ];

  if (loadingRuns) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Payslips"
        subtitle="Employee payslips by payroll run"
      />

      {runsError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 8,
            color: '#b3261e',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {runsError}
        </div>
      )}

      {/* Run selector */}
      <div
        style={{
          padding: '16px 20px',
          marginBottom: 16,
          background: '#fff',
          border: '1px solid #e6e8eb',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7480', marginBottom: 8 }}>
          SELECT PAYROLL RUN
        </div>
        {runs.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7480' }}>
            No completed payroll runs available. Process and complete a payroll run first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {runs.map((run) => {
              const isSelected = selectedRunId === run.id;
              const s = RUN_STATUS_BADGE[run.status] ?? { variant: 'default' as const, label: run.status };
              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRunId(isSelected ? null : run.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${isSelected ? '#3f6152' : '#e6e8eb'}`,
                    background: isSelected ? '#d8e9de' : '#fafbfc',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: '#14181c' }}>
                    {formatPeriod(run.periodStart, run.periodEnd)}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7480' }}>
                    {run._count?.records ?? 0} employees
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payslips table */}
      {!selectedRunId && runs.length > 0 && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#fafbfc',
            border: '1px solid #e6e8eb',
            borderRadius: 12,
            fontSize: 13,
            color: '#8a929b',
          }}
        >
          Select a payroll run above to view payslips.
        </div>
      )}

      {selectedRunId && loadingDetail && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {selectedRunId && detailError && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fde8e7',
            border: '1px solid #f5c6c6',
            borderRadius: 8,
            color: '#b3261e',
            fontSize: 13,
          }}
        >
          {detailError}
        </div>
      )}

      {pdfError && (
        <div
          style={{
            padding: '10px 14px', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 8,
            color: '#b04a3a', fontSize: 13, marginBottom: 12,
          }}
        >
          {pdfError}
        </div>
      )}

      {selectedRunId && runDetail && !loadingDetail && (
        <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #eef0f2' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>
              {formatPeriod(runDetail.periodStart, runDetail.periodEnd)}
            </span>
            <span style={{ fontSize: 12, color: '#8a929b', marginLeft: 12 }}>
              {records.length} employee{records.length !== 1 ? 's' : ''}
            </span>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} style={{ color: '#8a929b' }} />}
              title="No payslips"
              description="This run has no employee records."
            />
          ) : (
            <div>
              {records.map((record) => {
                const isExpanded = expandedRecordId === record.id;
                const earnings = (record.items ?? []).filter(
                  (item) => item.salaryComponent?.componentType === 'EARNING'
                );
                const deductions = (record.items ?? []).filter(
                  (item) => item.salaryComponent?.componentType === 'DEDUCTION'
                );

                return (
                  <div key={record.id} style={{ borderBottom: '1px solid #f4f1e8' }}>
                    {/* Row — rendered via inline table row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '130px 110px 110px 100px 110px 90px 100px 90px 170px',
                        minHeight: 52,
                        alignItems: 'center',
                        background: isExpanded ? '#f8fdf9' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#fbf9f3';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      {columns.map((col) => {
                        const align = col.align;
                        return (
                          <div
                            key={col.id}
                            style={{
                              padding: '0 12px',
                              fontSize: 12,
                              color: '#2c322f',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
                              minHeight: 52,
                            }}
                          >
                            {col.cell ? col.cell(record) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded payslip breakdown */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '16px 24px 20px',
                          background: '#f8fdf9',
                          borderTop: '1px solid #d8e9de',
                        }}
                      >
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#3f6152',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: 10,
                              }}
                            >
                              Earnings
                            </div>
                            {earnings.length === 0 ? (
                              <div style={{ fontSize: 12, color: '#8a929b' }}>No earnings items</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {earnings.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                                  >
                                    <span style={{ color: '#6b7480' }}>
                                      {item.salaryComponent?.name ?? item.salaryComponentId}
                                    </span>
                                    <span style={{ color: '#14181c', fontWeight: 500 }}>
                                      {formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#b3261e',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginBottom: 10,
                              }}
                            >
                              Deductions
                            </div>
                            {deductions.length === 0 ? (
                              <div style={{ fontSize: 12, color: '#8a929b' }}>No deduction items</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {deductions.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}
                                  >
                                    <span style={{ color: '#6b7480' }}>
                                      {item.salaryComponent?.name ?? item.salaryComponentId}
                                    </span>
                                    <span style={{ color: '#b3261e', fontWeight: 500 }}>
                                      {formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* LOP / Loan / TDS summary */}
                        {(parseFloat(record.lopAmount ?? '0') > 0 ||
                          parseFloat(record.totalLoanDeductions ?? '0') > 0 ||
                          parseFloat(record.tdsAmount ?? '0') > 0) && (
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {parseFloat(record.lopAmount ?? '0') > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7480' }}>
                                <span>Loss of Pay (LOP)</span>
                                <span style={{ color: '#b3261e' }}>−{formatCurrency(record.lopAmount!)}</span>
                              </div>
                            )}
                            {parseFloat(record.totalLoanDeductions ?? '0') > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7480' }}>
                                <span>Loan EMI</span>
                                <span style={{ color: '#b3261e' }}>−{formatCurrency(record.totalLoanDeductions!)}</span>
                              </div>
                            )}
                            {parseFloat(record.tdsAmount ?? '0') > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7480' }}>
                                <span>TDS ({record.taxRegime ?? 'NEW'} regime)</span>
                                <span style={{ color: '#b3261e' }}>−{formatCurrency(record.tdsAmount!)}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 12,
                            borderTop: '1px solid #d8e9de',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#2c322f' }}>Net Salary</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#146b41' }}>
                            {formatCurrency(record.netSalary)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {runs.length === 0 && !runsError && (
        <EmptyState
          icon={<FileText size={28} style={{ color: '#8a929b' }} />}
          title="No completed payroll runs"
          description="Process and complete a payroll run to view payslips."
        />
      )}
    </div>
  );
}
