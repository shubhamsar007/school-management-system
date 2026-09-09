'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tag,
  Layers,
  Users,
  FileText,
  CreditCard,
  Gift,
  RotateCcw,
  AlertTriangle,
  BarChart2,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/finance', icon: LayoutDashboard },
  { label: 'Fee Heads', href: '/finance/fee-heads', icon: Tag },
  { label: 'Fee Structures', href: '/finance/fee-structures', icon: Layers },
  { label: 'Student Fees', href: '/finance/student-fees', icon: Users },
  { label: 'Invoices', href: '/finance/invoices', icon: FileText },
  { label: 'Payments', href: '/finance/payments', icon: CreditCard },
  { label: 'Concessions', href: '/finance/concessions', icon: Gift },
  { label: 'Refunds', href: '/finance/refunds', icon: RotateCcw },
  { label: 'Overdues', href: '/finance/overdues', icon: AlertTriangle },
  { label: 'Reports', href: '/finance/reports', icon: BarChart2 },
  { label: 'Configuration', href: '/finance/configuration', icon: Settings },
];

export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        paddingTop: 2,
      }}
    >
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
        Fee Management
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/finance'
              ? pathname === '/finance'
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
