'use client';

import * as React from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, LayoutDashboard, Users, BookOpen, Clock, FileText, X } from 'lucide-react';
import { useStudents } from '@/lib/hooks/use-students';

// ─── Quick-nav shortcuts ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',        href: '/dashboard',  Icon: LayoutDashboard },
  { label: 'Students',         href: '/students',   Icon: GraduationCap   },
  { label: 'Teachers & Staff', href: '/teachers',   Icon: Users           },
  { label: 'Academics',        href: '/academics',  Icon: BookOpen        },
  { label: 'Timetable',        href: '/timetable',  Icon: Clock           },
  { label: 'Examinations',     href: '/exams',      Icon: FileText        },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch students when query is long enough
  const { data } = useStudents(
    debouncedQuery.length >= 2 ? { search: debouncedQuery, limit: 6 } : {},
  );
  const studentResults = debouncedQuery.length >= 2 ? (data?.data ?? []) : [];

  // Nav items filtered by query
  const navResults = query.length === 0
    ? NAV_ITEMS
    : NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  // Combined results for keyboard navigation
  const allResults = [
    ...studentResults.map((s) => ({ type: 'student' as const, id: s.id, label: s.name, sub: s.admissionNumber, href: `/students/${s.id}` })),
    ...navResults.map((n) => ({ type: 'nav' as const, id: n.href, label: n.label, sub: '', href: n.href, Icon: n.Icon })),
  ];

  // Reset when opened
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setDebouncedQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Reset active index when results change
  React.useEffect(() => { setActive(0); }, [debouncedQuery]);

  // Lock scroll
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, allResults.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && allResults[active]) {
        navigate(allResults[active]!.href);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, allResults]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  if (!open || typeof document === 'undefined') return null;

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,28,0.45)', backdropFilter: 'blur(2px)' }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 560,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          margin: '0 16px',
        }}
      >
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #f0f0ee' }}>
          <Search size={16} style={{ color: '#8a929b', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, or jump to a page…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#14181c',
              background: 'transparent',
              lineHeight: 1.4,
            }}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a929b', display: 'flex', alignItems: 'center', padding: 0 }}
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {/* Student results */}
          {studentResults.length > 0 && (
            <Section label="Students">
              {studentResults.map((s, i) => {
                const idx = i;
                const isActive = active === idx;
                const enrollment = s.enrollments?.[0];
                return (
                  <ResultRow
                    key={s.id}
                    isActive={isActive}
                    onClick={() => navigate(`/students/${s.id}`)}
                    onMouseEnter={() => setActive(idx)}
                    left={<AvatarCircle name={s.name} />}
                    label={s.name}
                    sub={enrollment ? `${enrollment.class.name} · ${enrollment.section.name} · ${s.admissionNumber}` : s.admissionNumber}
                  />
                );
              })}
            </Section>
          )}

          {/* Searching but no results yet */}
          {debouncedQuery.length >= 2 && studentResults.length === 0 && data !== undefined && (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#8a929b' }}>
              No students found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {/* Navigation */}
          {navResults.length > 0 && (
            <Section label={query ? 'Pages' : 'Quick Navigation'}>
              {navResults.map((n, i) => {
                const idx = studentResults.length + i;
                const isActive = active === idx;
                return (
                  <ResultRow
                    key={n.href}
                    isActive={isActive}
                    onClick={() => navigate(n.href)}
                    onMouseEnter={() => setActive(idx)}
                    left={<NavIcon Icon={n.Icon} />}
                    label={n.label}
                    sub=""
                  />
                );
              })}
            </Section>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #f0f0ee', display: 'flex', gap: 12 }}>
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([key, action]) => (
            <span key={key} style={{ fontSize: 11, color: '#a4a9b0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: '#f4f5f6', border: '1px solid #e0e2e5', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace', color: '#6b7480' }}>
                {key}
              </kbd>
              {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a4a9b0', padding: '10px 14px 4px' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({
  isActive, onClick, onMouseEnter, left, label, sub,
}: {
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  left: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        background: isActive ? '#f4f7fb' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {left}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#14181c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        {sub && <p style={{ fontSize: 11, color: '#8a929b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
    </button>
  );
}

function AvatarCircle({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#ede9fe', '#fce7f3', '#e0f2fe'];
  const fgs    = ['#1e40af', '#166534', '#92400e', '#5b21b6', '#9d174d', '#0369a1'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  const idx = Math.abs(h) % colors.length;
  return (
    <span style={{ width: 28, height: 28, borderRadius: '50%', background: colors[idx], color: fgs[idx], fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials}
    </span>
  );
}

function NavIcon({ Icon }: { Icon: React.ElementType }) {
  return (
    <span style={{ width: 28, height: 28, borderRadius: 7, background: '#f4f5f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={14} style={{ color: '#6b7480' }} />
    </span>
  );
}
