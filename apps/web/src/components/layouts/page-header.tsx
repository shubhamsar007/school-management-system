import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-end justify-between', className)}
      style={{ marginBottom: 20 }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)',
            fontSize: '22px',
            fontWeight: 600,
            letterSpacing: '-0.015em',
            color: '#2c322f',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '11.5px',
              color: '#8d938d',
              marginTop: 3,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}

export { PageHeader };
