'use client';

import * as React from 'react';
import { Star, Target, TrendingUp } from 'lucide-react';
import { usePerformanceReviews } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reviewStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'COMPLETED': return 'active';
    case 'DRAFT':     return 'pending';
    default:          return 'default';
  }
}

function goalStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'ACHIEVED':     return 'active';
    case 'IN_PROGRESS':  return 'pending';
    case 'NOT_ACHIEVED': return 'left';
    default:             return 'default';
  }
}

// ─── Star rating display ──────────────────────────────────────────────────────

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = value >= i + 1;
        const half   = !filled && value > i;
        return (
          <Star
            key={i}
            size={13}
            style={{
              color: filled || half ? '#f59e0b' : '#e5e7eb',
              fill:  filled ? '#f59e0b' : half ? 'url(#half)' : 'none',
            }}
          />
        );
      })}
      <span style={{ fontSize: '12px', color: '#6b7480', marginLeft: 4 }}>{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: import('@/lib/hooks/use-teachers').PerformanceReview }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-[#fafbfc] transition-colors rounded-xl"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#14181c' }}>{review.reviewType}</p>
            <Badge variant={reviewStatusVariant(review.status)}>
              {review.status.charAt(0) + review.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <p style={{ fontSize: '12.5px', color: '#6b7480', marginTop: 3 }}>
            Reviewed on {formatDate(review.reviewDate)} · by {review.reviewedBy}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {review.overallRating != null && <StarRating value={review.overallRating} />}
          <span style={{ fontSize: '11.5px', color: '#8a929b' }}>{open ? 'Collapse' : 'Expand'}</span>
        </div>
      </button>

      {/* Details */}
      {open && (
        <div style={{ borderTop: '1px solid #f0f2f4', padding: '16px 20px' }} className="space-y-4">
          {review.remarks && (
            <p style={{ fontSize: '13px', color: '#6b7480', lineHeight: 1.6 }}>{review.remarks}</p>
          )}

          {/* Criteria */}
          {review.criteria.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 8 }}>
                Criteria
              </p>
              <div className="space-y-2">
                {review.criteria.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: '#fafbfc' }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{c.criteriaName}</p>
                      {c.remarks && <p style={{ fontSize: '12px', color: '#8a929b' }}>{c.remarks}</p>}
                    </div>
                    <StarRating value={c.rating} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {review.goals.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 8 }}>
                Goals
              </p>
              <div className="space-y-2">
                {review.goals.map((g) => (
                  <div key={g.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2" style={{ background: '#fafbfc' }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#14181c' }}>{g.goal}</p>
                      {g.target && <p style={{ fontSize: '12px', color: '#8a929b' }}>{g.target}</p>}
                    </div>
                    <Badge variant={goalStatusVariant(g.status)}>
                      {g.status.replace('_', ' ').charAt(0) + g.status.replace('_', ' ').slice(1).toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Performance tab ──────────────────────────────────────────────────────────

export function PerformanceTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = usePerformanceReviews(employeeId);
  const reviews = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex justify-between">
              <div><Skeleton height={14} width={140} className="mb-2" /><Skeleton height={11} width={200} /></div>
              <Skeleton height={20} width={80} className="rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<TrendingUp size={24} />}
          title="No performance reviews"
          description="Performance reviews will appear here once created."
        />
      </div>
    );
  }

  // Average rating
  const rated   = reviews.filter((r) => r.overallRating != null);
  const avgRating = rated.length
    ? rated.reduce((s, r) => s + (r.overallRating ?? 0), 0) / rated.length
    : null;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Total reviews', value: reviews.length.toString() },
          { label: 'Average rating', value: avgRating != null ? `${avgRating.toFixed(1)} / 5` : '—' },
          { label: 'Goals set', value: reviews.reduce((s, r) => s + r.goals.length, 0).toString() },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e6e8eb] px-4 py-3 flex items-center gap-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#14181c' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#8a929b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
      </div>
    </div>
  );
}
