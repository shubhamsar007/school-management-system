'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Bell, ChevronDown, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

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

function Topbar({ collapsed: _collapsed, onToggle, breadcrumbs, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-3 bg-white border-b border-[#e6e8eb] px-5 flex-shrink-0',
        className
      )}
      style={{ height: 64 }}
    >
      {/* Menu toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center rounded-md border border-[#e6e8eb] text-[#6b7480] hover:bg-[#f2f4f6] transition-colors flex-shrink-0"
        style={{ width: 32, height: 32 }}
        aria-label="Toggle sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-[13px] min-w-0">
        <Link href="/" className="flex items-center text-[#8a929b] hover:text-[#2b5fa8] transition-colors flex-shrink-0">
          <Home size={14} />
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className="text-[#d7dce1] flex-shrink-0">/</span>
            {crumb.href && idx < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="text-[#6b7480] hover:text-[#2b5fa8] transition-colors truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className={cn('truncate', idx === breadcrumbs.length - 1 ? 'text-[#14181c] font-medium' : 'text-[#6b7480]')}>
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Campus selector */}
      <button
        className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#d7dce1] bg-white px-3 text-[13px] text-[#14181c] hover:bg-[#f8f9fa] transition-colors flex-shrink-0"
        style={{ height: 36 }}
      >
        <span className="text-[#8a929b] font-medium">Campus</span>
        <span className="text-[#d7dce1] mx-0.5">|</span>
        <span>North Campus</span>
        <ChevronDown size={13} className="text-[#8a929b] ml-0.5" />
      </button>

      {/* Notification bell */}
      <div className="relative flex-shrink-0">
        <button
          className="flex items-center justify-center rounded-md border border-[#e6e8eb] text-[#6b7480] hover:bg-[#f2f4f6] transition-colors"
          style={{ width: 36, height: 36 }}
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-bold"
          style={{
            width: 17,
            height: 17,
            fontSize: '10px',
            backgroundColor: '#b3261e',
          }}
        >
          7
        </span>
      </div>

      {/* User profile */}
      <button
        className="hidden sm:flex items-center gap-2 rounded-md px-2 hover:bg-[#f2f4f6] transition-colors flex-shrink-0"
        style={{ height: 36 }}
      >
        <Avatar name="Anita Rao" size="sm" />
        <div className="text-left">
          <p className="text-[13px] font-medium text-[#14181c] leading-none">Anita Rao</p>
          <p className="text-[11px] text-[#8a929b] leading-none mt-0.5">Administrator</p>
        </div>
        <ChevronDown size={13} className="text-[#8a929b]" />
      </button>
    </header>
  );
}

export { Topbar };
