'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, idx) => {
    // Don't show raw UUIDs — replace with "Profile"
    const label = UUID_RE.test(seg)
      ? 'Profile'
      : seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = idx === segments.length - 1;
    if (isLast) return { label };
    return { label, href: '/' + segments.slice(0, idx + 1).join('/') };
  });
}

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: '100vh', background: '#ebe7da' }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        currentPath={pathname}
      />
      <div
        className="flex flex-col overflow-hidden flex-1 min-w-0"
        style={{ padding: '14px 14px 0 0' }}
      >
        {/* Inner content wrapper — rounded top to look like a panel */}
        <div
          className="flex flex-col overflow-hidden flex-1"
          style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden' }}
        >
          <Topbar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            breadcrumbs={breadcrumbs}
          />
          <main
            className="flex-1 overflow-y-auto"
            style={{
              background: '#ebe7da',
              padding: '20px 20px 48px',
            }}
          >
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export { AppShell };
