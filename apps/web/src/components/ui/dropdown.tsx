'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

function Dropdown({ label, value, options, onChange, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 transition-colors"
        style={{
          height: 28,
          padding: '0 9px',
          border: '1px solid #ded9cc',
          borderRadius: 6,
          background: '#fffdf7',
          fontSize: 12,
          color: '#23282a',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c8c3b3'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ded9cc'; }}
      >
        <span style={{ color: '#8a8f88' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{selected?.label ?? value}</span>
        <div style={{ width: 0, height: 0, borderLeft: '3.5px solid transparent', borderRight: '3.5px solid transparent', borderTop: '4.5px solid #a6a89f' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1"
          style={{
            minWidth: 160,
            borderRadius: 8,
            border: '1px solid #e6e1d5',
            background: '#fffdf8',
            boxShadow: '0 4px 16px rgba(44,50,47,0.12)',
            padding: '4px 0',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex w-full items-center gap-2 transition-colors text-left"
              style={{
                padding: '6px 12px',
                fontSize: 12.5,
                color: '#2c322f',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f4f1e9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <Check size={11} style={{ color: '#5d7f6b', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropdown };
export type { DropdownOption };
