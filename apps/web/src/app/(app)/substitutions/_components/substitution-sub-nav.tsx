'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  UserCheck,
  Calendar,
  History,
  BarChart2,
  Users,
  Clock,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview',         href: '/substitutions',                icon: LayoutDashboard },
  { label: "Today's Coverage", href: '/substitutions/today',          icon: CalendarCheck },
  { label: 'Requests',         href: '/substitutions/requests',       icon: ClipboardList },
  { label: 'Assignments',      href: '/substitutions/assignments',    icon: UserCheck },
  { label: 'Calendar',         href: '/substitutions/calendar',       icon: Calendar },
  { label: 'History',          href: '/substitutions/history',        icon: History },
  { label: 'Analytics',        href: '/substitutions/analytics',      icon: BarChart2 },
  { label: 'Pools',            href: '/substitutions/pools',          icon: Users },
  { label: 'Availability',     href: '/substitutions/availability',   icon: Clock },
  { label: 'Configuration',    href: '/substitutions/configuration',  icon: Settings },
];

export function SubstitutionSubNav() {
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
        Substitutions
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/substitutions'
              ? pathname === '/substitutions'
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
