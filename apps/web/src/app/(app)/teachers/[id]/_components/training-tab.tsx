'use client';

import * as React from 'react';
import { Award, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useTrainingRecords } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function verificationVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'VERIFIED':  return 'active';
    case 'REJECTED':  return 'left';
    default:          return 'pending';
  }
}

function VerificationIcon({ status }: { status: string }) {
  if (status === 'VERIFIED') return <CheckCircle size={13} style={{ color: '#33604a' }} />;
  if (status === 'REJECTED') return <XCircle size={13} style={{ color: '#b3261e' }} />;
  return <Clock size={13} style={{ color: '#8a929b' }} />;
}

const TRAINING_TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  INTERNAL:     { bg: '#dfeaf1', fg: '#3d6678' },
  EXTERNAL:     { bg: '#dcfce7', fg: '#166534' },
  ONLINE:       { bg: '#ede9fe', fg: '#5b21b6' },
  CERTIFICATION:{ bg: '#fef3c7', fg: '#92400e' },
  WORKSHOP:     { bg: '#fce7f3', fg: '#9d174d' },
};

// ─── Training card ────────────────────────────────────────────────────────────

function TrainingCard({ record }: { record: import('@/lib/hooks/use-teachers').TrainingRecord }) {
  const color   = TRAINING_TYPE_COLORS[record.trainingType] ?? { bg: '#f3f4f6', fg: '#6b7280' };
  const expired = record.expiryDate && new Date(record.expiryDate) < new Date();

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb] hover:border-[#c8d0d9] transition-colors"
      style={{ padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 40, height: 40, background: color.bg }}
        >
          <Award size={18} style={{ color: color.fg }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#14181c' }}>{record.title}</p>
              {record.provider && (
                <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 1 }}>{record.provider}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div
                className="rounded-full px-2 py-0.5"
                style={{ background: color.bg }}
              >
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: color.fg }}>
                  {record.trainingType.charAt(0) + record.trainingType.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <VerificationIcon status={record.verificationStatus} />
                <Badge variant={verificationVariant(record.verificationStatus)}>
                  {record.verificationStatus.charAt(0) + record.verificationStatus.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <span style={{ fontSize: '12px', color: '#8a929b' }}>
              {formatDate(record.startDate)}
              {record.endDate ? ` – ${formatDate(record.endDate)}` : ''}
            </span>
            {record.durationHours && (
              <span style={{ fontSize: '12px', color: '#8a929b' }}>
                {record.durationHours}h
              </span>
            )}
            {record.expiryDate && (
              <span
                className="flex items-center gap-1"
                style={{ fontSize: '12px', color: expired ? '#b3261e' : '#8a929b' }}
              >
                {expired && <AlertTriangle size={11} />}
                Expires {formatDate(record.expiryDate)}
                {expired && ' (expired)'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Training tab ─────────────────────────────────────────────────────────────

export function TrainingTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useTrainingRecords(employeeId);
  const records = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start gap-3">
              <Skeleton width={40} height={40} className="rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton height={14} width={200} className="mb-2" />
                <Skeleton height={11} width={140} className="mb-2" />
                <Skeleton height={11} width={180} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Award size={24} />}
          title="No training records"
          description="Training programmes, certifications, and professional development will be tracked here."
        />
      </div>
    );
  }

  const totalHours = records.reduce((s, r) => s + (r.durationHours ?? 0), 0);
  const verified   = records.filter((r) => r.verificationStatus === 'VERIFIED').length;
  const expiring   = records.filter(
    (r) => r.expiryDate && new Date(r.expiryDate) > new Date() &&
           new Date(r.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total programmes', value: records.length },
          { label: 'Hours trained',    value: totalHours || '—' },
          { label: 'Verified',         value: verified },
          ...(expiring > 0 ? [{ label: 'Expiring soon', value: expiring }] : []),
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {records.map((r) => <TrainingCard key={r.id} record={r} />)}
      </div>
    </div>
  );
}
