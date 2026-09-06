import * as React from 'react';
import type { SubjectType } from '@/lib/types/academics';

const STYLES: Record<SubjectType, { bg: string; fg: string; label: string }> = {
  CORE:          { bg: '#d8e9de', fg: '#33604a', label: 'Core'          },
  ELECTIVE:      { bg: '#dfeaf1', fg: '#3d6678', label: 'Elective'      },
  CO_CURRICULAR: { bg: '#e6e1ef', fg: '#584a75', label: 'Co-Curricular' },
  LANGUAGE:      { bg: '#f2e0d2', fg: '#8e5334', label: 'Language'      },
};

interface SubjectTypeBadgeProps {
  type: SubjectType | string;
}

function SubjectTypeBadge({ type }: SubjectTypeBadgeProps) {
  const style = STYLES[type as SubjectType] ?? { bg: '#ede9df', fg: '#6d746e', label: type };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '10px',
        fontSize: '10.5px',
        fontWeight: 700,
        background: style.bg,
        color: style.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

export { SubjectTypeBadge };
