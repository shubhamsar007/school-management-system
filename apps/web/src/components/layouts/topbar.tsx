'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Check, Bell, Clock, GraduationCap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchDropdown } from '@/components/ui/search-dropdown';

// ─── Term selector ────────────────────────────────────────────────────────────

const TERMS = [
  { label: 'Term 1', value: 1, months: 'Apr – Jul' },
  { label: 'Term 2', value: 2, months: 'Aug – Nov' },
  { label: 'Term 3', value: 3, months: 'Dec – Mar' },
];

function TermDropdown() {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(2);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center transition-colors"
        style={{
          gap: 6, height: 28, padding: '0 9px',
          border: `1px solid ${open ? '#c8c3b3' : '#ded9cc'}`,
          borderRadius: 6, background: open ? '#f5f2e8' : '#fffdf7',
          fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#8a8f88' }}>Term</span>
        <span style={{ fontWeight: 600, color: '#23282a' }}>{selected}</span>
        <ChevronDown size={11} style={{ color: '#a6a89f', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: '#fff', borderRadius: 10,
            border: '1px solid #e6e8eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            minWidth: 160, overflow: 'hidden', zIndex: 9000,
          }}
        >
          <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid #f0f2f4' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a4a9b0' }}>
              Academic Term
            </p>
          </div>
          {TERMS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setSelected(t.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '9px 14px',
                background: selected === t.value ? '#f3f7fc' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: selected === t.value ? 600 : 400, color: '#14181c' }}>
                  {t.label}
                </p>
                <p style={{ fontSize: 11, color: '#8a929b' }}>{t.months}</p>
              </div>
              {selected === t.value && <Check size={13} style={{ color: '#2b5fa8', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: GraduationCap, color: '#dfeaf1', fg: '#4e6a7d', title: 'New admission request', sub: 'Ananya Sharma — Class 8B', time: '10 min ago' },
  { id: 2, icon: AlertCircle,   color: '#fce7f3', fg: '#9d174d', title: 'Fee due overdue',        sub: '3 students in Class 10A',    time: '1 hr ago'  },
  { id: 3, icon: Clock,         color: '#fef3c7', fg: '#92400e', title: 'Term 2 closes in 18 days', sub: '4 report cards pending',  time: '2 hr ago'  },
  { id: 4, icon: GraduationCap, color: '#dcfce7', fg: '#166534', title: 'Student transferred',    sub: 'Rahul Verma → North Campus', time: 'Yesterday' },
];

function NotificationsPanel() {
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(SAMPLE_NOTIFICATIONS.length);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleOpen() {
    setOpen((o) => !o);
    if (!open) setCount(0); // mark all read when panel opens
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={handleOpen}
        className="flex items-center justify-center transition-colors"
        style={{
          width: 28, height: 28,
          border: `1px solid ${open ? '#c8c3b3' : '#ded9cc'}`,
          borderRadius: 6, background: open ? '#f5f2e8' : '#fffdf7', cursor: 'pointer',
        }}
        aria-label="Notifications"
      >
        <Bell size={13} style={{ color: '#6f746e' }} />
      </button>

      {count > 0 && (
        <span
          className="absolute flex items-center justify-center text-white font-bold pointer-events-none"
          style={{
            top: -4, right: -4, minWidth: 15, height: 15,
            padding: '0 3px', borderRadius: 8, fontSize: '9px',
            background: '#b3563a', border: '1.5px solid #faf8f2',
          }}
        >
          {count}
        </span>
      )}

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: '#fff', borderRadius: 10,
            border: '1px solid #e6e8eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            width: 320, overflow: 'hidden', zIndex: 9000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: '1px solid #f0f2f4' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#14181c' }}>Notifications</p>
            <p style={{ fontSize: 11, color: '#8a929b' }}>All caught up</p>
          </div>

          {SAMPLE_NOTIFICATIONS.map((n) => (
            <button
              key={n.id}
              type="button"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
                padding: '10px 14px', background: 'none', border: 'none',
                borderBottom: '1px solid #f5f6f7', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafbfc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 8, background: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <n.icon size={14} style={{ color: n.fg }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#14181c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.title}
                </p>
                <p style={{ fontSize: 11, color: '#8a929b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {n.sub}
                </p>
              </div>
              <p style={{ fontSize: 10, color: '#c4c9cf', flexShrink: 0, paddingTop: 2 }}>{n.time}</p>
            </button>
          ))}

          <div style={{ padding: '8px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#8a929b' }}>Full notification center coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  collapsed: boolean;
  onToggle: () => void;
  breadcrumbs: Breadcrumb[];
  className?: string;
}

function Topbar({ onToggle, breadcrumbs, className }: TopbarProps) {
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const showDropdown = focused && query.length >= 1;

  React.useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  function closeDropdown() {
    setQuery('');
    setFocused(false);
  }

  return (
    <header
      className={cn('flex items-center flex-shrink-0', className)}
      style={{
        height: 46,
        background: '#faf8f2',
        borderBottom: '1px solid #ded9cc',
        padding: '0 12px',
        gap: 10,
      }}
    >
      {/* Hamburger */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex items-center justify-center transition-colors"
        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: '#6f746e', cursor: 'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#efebdf'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 24 24" style={{ width: 14, height: 9, display: 'block' }} fill="none">
          <line x1="2" y1="2" x2="22" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] min-w-0 flex-1">
        <Link href="/dashboard" className="flex-shrink-0 truncate outline-none" style={{ color: '#8a8f88' }}>
          Home
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="flex-shrink-0" style={{ color: '#cbc9bd' }}>/</span>
            {crumb.href && idx < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="truncate outline-none" style={{ color: '#8a8f88' }}>
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate" style={{
                color: idx === breadcrumbs.length - 1 ? '#23282a' : '#8a8f88',
                fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
              }}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Search bar */}
      <div className="relative flex-shrink-0" style={{ width: 300 }}>
        <div
          className="flex items-center gap-2"
          style={{
            height: 28, padding: '0 9px',
            border: `1px solid ${focused ? '#c8c3b3' : '#ded9cc'}`,
            borderRadius: 6, background: '#fffdf7',
            transition: 'border-color 150ms', outline: 'none',
          }}
        >
          <div style={{ width: 10, height: 10, border: '1.5px solid #a6a89f', borderRadius: '50%', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search or jump to…"
            style={{ flex: 1, border: 'none', outline: 'none', boxShadow: 'none', fontSize: 12, color: '#23282a', background: 'transparent' }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Search"
          />
          {!query && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#a6a89f', border: '1px solid #e2ded1', borderRadius: 4, padding: '1px 4px', flexShrink: 0 }}>
              ⌘K
            </span>
          )}
          {query && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a6a89f', lineHeight: 1, padding: 0, flexShrink: 0 }}
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
        {showDropdown && <SearchDropdown query={query} onClose={closeDropdown} />}
      </div>

      {/* Term selector */}
      <TermDropdown />

      {/* Notifications */}
      <NotificationsPanel />
    </header>
  );
}

export { Topbar };
