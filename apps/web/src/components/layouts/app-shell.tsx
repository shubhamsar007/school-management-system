'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, idx) => {
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = idx === segments.length - 1;
    if (isLast) {
      return { label };
    }
    const href = '/' + segments.slice(0, idx + 1).join('/');
    return { label, href };
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
    <div className="flex h-screen overflow-hidden bg-[#f6f7f8]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        currentPath={pathname}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 overflow-y-auto" style={{ padding: '28px 32px 48px' }}>
          <div style={{ maxWidth: 1360, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
