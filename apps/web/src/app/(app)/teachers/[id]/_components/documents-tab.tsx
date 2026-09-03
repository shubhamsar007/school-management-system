'use client';

import * as React from 'react';
import { FileText, Download, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useEmployeeDocuments } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function mimeLabel(mimeType: string): string {
  if (mimeType.includes('pdf'))  return 'PDF';
  if (mimeType.includes('image')) return 'Image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))   return 'Excel';
  return 'File';
}

function docTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc }: { doc: import('@/lib/hooks/use-teachers').EmployeeDocument }) {
  const expired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
  const expiringSoon =
    !expired &&
    doc.expiryDate &&
    new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div
      className="flex items-start gap-3 hover:bg-[#fafbfc] transition-colors"
      style={{ padding: '14px 20px', borderBottom: '1px solid #f5f6f7' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, background: '#f0f4f8' }}
      >
        <FileText size={16} style={{ color: '#3d6678' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Doc type + file name */}
            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
              {docTypeLabel(doc.documentType)}
            </p>
            <p
              className="truncate"
              style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 1 }}
            >
              {doc.file.originalName}
            </p>
          </div>

          {/* Verification badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <VerificationIcon status={doc.verificationStatus} />
            <Badge variant={verificationVariant(doc.verificationStatus)}>
              {doc.verificationStatus.charAt(0) +
                doc.verificationStatus.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-2">
          <span style={{ fontSize: '12px', color: '#8a929b' }}>
            {mimeLabel(doc.file.mimeType)} · {formatBytes(doc.file.sizeBytes)}
          </span>
          <span style={{ fontSize: '12px', color: '#8a929b' }}>
            Uploaded {formatDate(doc.createdAt)}
          </span>
          {doc.verifiedAt && (
            <span style={{ fontSize: '12px', color: '#33604a' }}>
              Verified {formatDate(doc.verifiedAt)}
            </span>
          )}
          {doc.expiryDate && (
            <span
              className="flex items-center gap-1"
              style={{ fontSize: '12px', color: expired ? '#b3261e' : expiringSoon ? '#c47c2c' : '#8a929b' }}
            >
              {(expired || expiringSoon) && <AlertTriangle size={11} />}
              {expired ? 'Expired' : 'Expires'} {formatDate(doc.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Download button */}
      <button
        className="flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-[#f0f4f8] transition-colors"
        style={{ width: 32, height: 32 }}
        title="Download"
      >
        <Download size={14} style={{ color: '#8a929b' }} />
      </button>
    </div>
  );
}

// ─── Documents tab ────────────────────────────────────────────────────────────

export function DocumentsTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useEmployeeDocuments(employeeId);
  const docs = data ?? [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-[#f5f6f7]">
            <Skeleton width={38} height={38} className="rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height={13} width={160} className="mb-1.5" />
              <Skeleton height={11} width={240} />
            </div>
            <Skeleton height={20} width={70} className="rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<FileText size={24} />}
          title="No documents uploaded"
          description="ID proofs, certificates, contracts, and other employee documents will appear here."
        />
      </div>
    );
  }

  const verified  = docs.filter((d) => d.verificationStatus === 'VERIFIED').length;
  const pending   = docs.filter((d) => d.verificationStatus === 'PENDING').length;
  const expiring  = docs.filter(
    (d) =>
      d.expiryDate &&
      new Date(d.expiryDate) > new Date() &&
      new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  ).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total documents', value: docs.length },
          { label: 'Verified',        value: verified },
          { label: 'Pending review',  value: pending },
          ...(expiring > 0 ? [{ label: 'Expiring soon', value: expiring }] : []),
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div
        className="bg-white rounded-xl border border-[#e6e8eb]"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Document Register</p>
        </div>
        {docs.map((doc) => (
          <DocumentRow key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}
