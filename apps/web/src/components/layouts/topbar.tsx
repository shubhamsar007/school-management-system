'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette } from '@/components/ui/command-palette';

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
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Global Ctrl+K / ⌘K shortcut
  React.useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

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
      {/* Hamburger toggle */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 flex items-center justify-center transition-colors"
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          color: '#6f746e',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#efebdf'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        aria-label="Toggle sidebar"
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: 14, height: 9, display: 'block' }}
          fill="none"
        >
          <line x1="2" y1="2" x2="22" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] min-w-0 flex-1">
        <Link href="/dashboard" className="flex-shrink-0 truncate" style={{ color: '#8a8f88' }}>
          Home
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="flex-shrink-0" style={{ color: '#cbc9bd' }}>/</span>
            {crumb.href && idx < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="truncate"
                style={{ color: '#8a8f88' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="truncate"
                style={{
                  color: idx === breadcrumbs.length - 1 ? '#23282a' : '#8a8f88',
                  fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                }}
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Search / command palette trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 flex-shrink-0 transition-colors"
        style={{
          height: 28,
          width: 220,
          padding: '0 9px',
          border: '1px solid #ded9cc',
          borderRadius: 6,
          background: '#fffdf7',
          cursor: 'pointer',
          gap: 8,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c8c3b3'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ded9cc'; }}
        aria-label="Open search"
      >
        <div
          style={{
            width: 10,
            height: 10,
            border: '1.5px solid #a6a89f',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: '#9a9e96', flex: 1, textAlign: 'left' }}>
          Search or jump to…
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#a6a89f',
            border: '1px solid #e2ded1',
            borderRadius: 4,
            padding: '1px 4px',
          }}
        >
          ⌘K
        </span>
      </button>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Term selector */}
      <button
        className="flex items-center flex-shrink-0 transition-colors"
        style={{
          gap: 6,
          height: 28,
          padding: '0 9px',
          border: '1px solid #ded9cc',
          borderRadius: 6,
          background: '#fffdf7',
          fontSize: 12,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c8c3b3'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ded9cc'; }}
      >
        <span style={{ color: '#8a8f88' }}>Term</span>
        <span style={{ fontWeight: 600, color: '#23282a' }}>2</span>
        <ChevronDown size={11} style={{ color: '#a6a89f' }} />
      </button>

      {/* Notification bell */}
      <div className="relative flex-shrink-0">
        <button
          className="flex items-center justify-center transition-colors"
          style={{
            width: 28,
            height: 28,
            border: '1px solid #ded9cc',
            borderRadius: 6,
            background: '#fffdf7',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c8c3b3'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ded9cc'; }}
          aria-label="Notifications"
        >
          <div
            style={{
              width: 11,
              height: 11,
              border: '1.5px solid #6f746e',
              borderRadius: '3px 3px 5px 5px',
            }}
          />
        </button>
        <span
          className="absolute flex items-center justify-center text-white font-bold"
          style={{
            top: -4,
            right: -4,
            minWidth: 15,
            height: 15,
            padding: '0 3px',
            borderRadius: 8,
            fontSize: '9px',
            background: '#b3563a',
            border: '1.5px solid #faf8f2',
          }}
        >
          7
        </span>
      </div>
    </header>
  );
}

export { Topbar };
