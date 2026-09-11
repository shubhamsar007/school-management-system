'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, FileText, Zap, Activity, Sliders, Settings, BarChart2, Clock, MessageSquare } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Inbox',              href: '/notifications',                   icon: Bell },
  { label: 'Templates',          href: '/notifications/templates',         icon: FileText },
  { label: 'Automation',         href: '/notifications/automation',        icon: Zap },
  { label: 'Scheduled Messages', href: '/notifications/scheduled',         icon: Clock },
  { label: 'Delivery Logs',      href: '/notifications/delivery-logs',     icon: Activity },
  { label: 'Analytics',          href: '/notifications/analytics',         icon: BarChart2 },
  { label: 'Preferences',        href: '/notifications/preferences',       icon: Sliders },
  { label: 'Configuration',      href: '/notifications/configuration',     icon: Settings },
  { label: 'Inbound',            href: '/notifications/inbound',           icon: MessageSquare },
];

export function NotificationSubNav() {
  const pathname = usePathname();

  return (
    <div style={{ width: 200, flexShrink: 0, paddingTop: 2 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#6d746e',
          textTransform: 'uppercase',
          padding: '0 10px 10px',
        }}
      >
        Notifications
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/notifications'
              ? pathname === '/notifications'
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#2c322f' : '#6d746e',
                background: isActive ? '#d8e9de' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#f4f1e9';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#2c322f';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#6d746e';
                }
              }}
            >
              <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
