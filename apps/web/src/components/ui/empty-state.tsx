'use client';

import * as React from 'react';
import { SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title = 'No results found',
  description = 'Try adjusting your search or filters',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}
    >
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#f2f4f6',
          color: '#8a929b',
        }}
      >
        {icon ?? <SearchX size={24} />}
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#14181c', margin: 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '13px', color: '#6b7480', marginTop: '4px' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

export { EmptyState };
