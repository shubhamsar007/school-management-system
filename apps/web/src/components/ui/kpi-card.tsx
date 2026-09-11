import * as React from 'react';
import { cn } from '@/lib/utils';

type KpiVariant = 'sage' | 'blue' | 'clay' | 'heather' | 'neutral';

const VARIANTS: Record<KpiVariant, { bg: string; border: string; labelFg: string; trendPosFg: string; trendNegFg: string }> = {
  sage:    { bg: '#dbe8dc', border: '#c5d8c8', labelFg: '#33604a', trendPosFg: '#33604a', trendNegFg: '#8c4f31' },
  blue:    { bg: '#dfeaf1', border: '#c9dce7', labelFg: '#4e6a7d', trendPosFg: '#3d6678', trendNegFg: '#8c4f31' },
  clay:    { bg: '#f7e2d5', border: '#eecfbc', labelFg: '#8c4f31', trendPosFg: '#5d7f6b', trendNegFg: '#b3261e' },
  heather: { bg: '#e6e1ef', border: '#d5cee4', labelFg: '#584a75', trendPosFg: '#5d7f6b', trendNegFg: '#b3261e' },
  neutral: { bg: '#fffdf8', border: '#e6e1d5', labelFg: '#6d746e', trendPosFg: '#5d7f6b', trendNegFg: '#b3261e' },
};

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
  /** Secondary info line shown below the value — e.g. "1,141 / 1,248 present" */
  detail?: string;
  /** Makes the entire card a clickable link */
  href?: string;
  onClick?: () => void;
  variant?: KpiVariant;
  className?: string;
}

function KpiCard({
  title,
  value,
  trend,
  trendPositive,
  subtitle,
  detail,
  href,
  onClick,
  variant = 'neutral',
  className,
}: KpiCardProps) {
  const v = VARIANTS[variant];
  const isClickable = !!(href || onClick);

  const cardStyle: React.CSSProperties = {
    background: v.bg,
    border: `1px solid ${v.border}`,
    borderRadius: 18,
    padding: '16px 18px',
    display: 'block',
    textDecoration: 'none',
    transition: isClickable ? 'box-shadow 150ms, border-color 150ms' : undefined,
    cursor: isClickable ? 'pointer' : 'default',
  };

  const inner = (
    <>
      {/* Label */}
      <p style={{
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: v.labelFg,
        marginBottom: 10,
      }}>
        {title}
      </p>

      {/* Value + trend */}
      <div className="flex items-baseline gap-2">
        <p style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '30px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: '#2c322f',
        }}>
          {value}
        </p>
        {trend && (
          <span style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: trendPositive ? v.trendPosFg : v.trendNegFg,
          }}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      {/* Detail line */}
      {detail && (
        <p style={{ fontSize: '11.5px', color: '#6d7870', marginTop: 5, lineHeight: 1.4 }}>
          {detail}
        </p>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p style={{ fontSize: '11.5px', color: '#8d938d', marginTop: detail ? 2 : 6 }}>
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(className)}
        style={cardStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 14px rgba(44,50,47,0.10)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none'; }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      className={cn(className)}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={isClickable ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(44,50,47,0.10)'; } : undefined}
      onMouseLeave={isClickable ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; } : undefined}
    >
      {inner}
    </div>
  );
}

export { KpiCard };
export type { KpiVariant };
