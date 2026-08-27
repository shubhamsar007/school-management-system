'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#d7dce1] bg-white px-3 text-[13px] text-[#14181c] hover:bg-[#f8f9fa] transition-colors focus:outline-none focus:border-[#2b5fa8]"
        style={{ height: 36 }}
      >
        <span className="text-[#8a929b] font-medium">{label}</span>
        <span className="text-[#6b7480] mx-0.5">|</span>
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={13} className="text-[#8a929b] ml-0.5" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-[#e6e8eb] bg-white py-1 shadow-md"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[13px] text-[#14181c] hover:bg-[#f2f4f6] transition-colors text-left"
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <Check size={12} className="text-[#2b5fa8]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { Dropdown };
export type { DropdownOption };
