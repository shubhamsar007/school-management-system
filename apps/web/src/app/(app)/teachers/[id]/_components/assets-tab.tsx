'use client';

import * as React from 'react';
import { Laptop, Package, CheckCircle } from 'lucide-react';
import { useEmployeeAssets } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function conditionVariant(condition: string): BadgeProps['variant'] {
  switch (condition) {
    case 'GOOD':    return 'active';
    case 'FAIR':    return 'pending';
    case 'POOR':
    case 'DAMAGED': return 'left';
    default:        return 'default';
  }
}

const ASSET_TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  LAPTOP:      { bg: '#dfeaf1', fg: '#3d6678' },
  DESKTOP:     { bg: '#dfeaf1', fg: '#3d6678' },
  PHONE:       { bg: '#dcfce7', fg: '#166534' },
  TABLET:      { bg: '#dcfce7', fg: '#166534' },
  ID_CARD:     { bg: '#fef3c7', fg: '#92400e' },
  KEY:         { bg: '#f3f4f6', fg: '#6b7280' },
  FURNITURE:   { bg: '#ede9fe', fg: '#5b21b6' },
};

// ─── Asset row ────────────────────────────────────────────────────────────────

function AssetRow({ asset }: { asset: import('@/lib/hooks/use-teachers').EmployeeAsset }) {
  const color    = ASSET_TYPE_COLORS[asset.assetType] ?? { bg: '#f3f4f6', fg: '#6b7280' };
  const returned = !!asset.returnedDate;

  return (
    <div
      className="flex items-start gap-3 hover:bg-[#fafbfc] transition-colors"
      style={{ padding: '14px 20px', borderBottom: '1px solid #f5f6f7', opacity: returned ? 0.65 : 1 }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, background: color.bg }}
      >
        <Package size={16} style={{ color: color.fg }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c' }}>
                {asset.assetType.charAt(0) + asset.assetType.slice(1).toLowerCase().replace('_', ' ')}
              </p>
              {asset.assetCode && (
                <span style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#8a929b' }}>{asset.assetCode}</span>
              )}
              {returned && (
                <span className="flex items-center gap-1" style={{ fontSize: '11.5px', color: '#33604a' }}>
                  <CheckCircle size={11} /> Returned
                </span>
              )}
            </div>
            {asset.description && (
              <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 1 }}>{asset.description}</p>
            )}
          </div>
          <Badge variant={conditionVariant(returned && asset.returnCondition ? asset.returnCondition : asset.condition)}>
            {(returned && asset.returnCondition ? asset.returnCondition : asset.condition).charAt(0) +
              (returned && asset.returnCondition ? asset.returnCondition : asset.condition).slice(1).toLowerCase()}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
          <span style={{ fontSize: '12px', color: '#8a929b' }}>
            Issued {formatDate(asset.issueDate)}
            {asset.issuedBy ? ` by ${asset.issuedBy}` : ''}
          </span>
          {asset.returnedDate
            ? <span style={{ fontSize: '12px', color: '#33604a' }}>Returned {formatDate(asset.returnedDate)}</span>
            : asset.expectedReturn
            ? <span style={{ fontSize: '12px', color: '#8a929b' }}>Expected return {formatDate(asset.expectedReturn)}</span>
            : null}
        </div>
      </div>
    </div>
  );
}

// ─── Assets tab ───────────────────────────────────────────────────────────────

export function AssetsTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useEmployeeAssets(employeeId);
  const assets = data ?? [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-[#f5f6f7]">
            <Skeleton width={38} height={38} className="rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton height={13} width={140} className="mb-1.5" />
              <Skeleton height={11} width={200} />
            </div>
            <Skeleton height={20} width={60} className="rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<Laptop size={24} />}
          title="No assets assigned"
          description="Assets issued to this employee — laptops, ID cards, keys — will be tracked here."
        />
      </div>
    );
  }

  const active   = assets.filter((a) => !a.returnedDate).length;
  const returned = assets.filter((a) => !!a.returnedDate).length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Currently held', value: active },
          { label: 'Returned',       value: returned },
          { label: 'Total issued',   value: assets.length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e6e8eb]" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f2f4' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>Asset Register</p>
        </div>
        {assets
          .slice()
          .sort((a, b) => (a.returnedDate ? 1 : 0) - (b.returnedDate ? 1 : 0))
          .map((asset) => <AssetRow key={asset.id} asset={asset} />)}
      </div>
    </div>
  );
}
