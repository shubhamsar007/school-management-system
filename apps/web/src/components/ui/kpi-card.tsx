import * as React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
  className?: string;
}

function KpiCard({ title, value, trend, trendPositive, subtitle, className }: KpiCardProps) {
  return (
    <div
      className={cn('bg-white rounded-xl border border-[#e6e8eb]', className)}
      style={{
        padding: '16px 18px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#8a929b',
          marginBottom: '8px',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: '26px',
          fontWeight: 600,
          color: '#14181c',
          lineHeight: 1.2,
          marginBottom: trend || subtitle ? '6px' : 0,
        }}
      >
        {value}
      </p>
      {(trend || subtitle) && (
        <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
          {trend && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: trendPositive ? '#146b41' : '#b3261e',
              }}
            >
              {trendPositive ? '↑' : '↓'} {trend}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: '12px', color: '#8a929b' }}>{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { KpiCard };
