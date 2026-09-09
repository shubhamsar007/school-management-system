'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Bell, Users, GraduationCap, BookOpen, Clock,
  CheckSquare, FileText, UserPlus, DollarSign, CreditCard, Calendar,
  RefreshCw, Megaphone, FolderOpen, Settings, Shield, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmissionStats } from '@/lib/hooks/use-admissions';
import { useUnreadCount } from '@/lib/hooks/use-comms';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    group: 'PEOPLE',
    items: [
      { label: 'Students', href: '/students', icon: Users },
      { label: 'Teachers & Staff', href: '/teachers', icon: GraduationCap },
    ],
  },
  {
    group: 'ACADEMIC',
    items: [
      { label: 'Academics', href: '/academics', icon: BookOpen },
      { label: 'Timetable', href: '/timetable', icon: Clock },
      { label: 'Attendance', href: '/attendance', icon: CheckSquare },
      { label: 'Examinations', href: '/examinations', icon: FileText },
    ],
  },
  {
    group: 'ADMISSIONS',
    items: [
      { label: 'Admissions Pipeline', href: '/admissions', icon: UserPlus },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { label: 'Fee Management', href: '/finance', icon: DollarSign },
      { label: 'Payroll', href: '/payroll', icon: CreditCard },
    ],
  },
  {
    group: 'HR',
    items: [
      { label: 'Leave Management', href: '/leave', icon: Calendar, badge: 4 },
      { label: 'Substitutions', href: '/substitutions', icon: RefreshCw },
    ],
  },
  {
    group: 'COMMS',
    items: [
      { label: 'Announcements', href: '/announcements', icon: Megaphone },
      { label: 'PTM Meetings', href: '/ptm', icon: MessageSquare },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { label: 'Documents & Files', href: '/documents', icon: FolderOpen },
    ],
  },
  {
    group: 'SETTINGS',
    items: [
      { label: 'Organization', href: '/organization', icon: Settings },
      { label: 'Roles & Permissions', href: '/roles', icon: Shield },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
}

function Sidebar({ collapsed, onToggle, currentPath }: SidebarProps) {
  const sidebarW = collapsed ? 52 : 224;
  const { data: admissionStats } = useAdmissionStats();
  const admissionPending = admissionStats?.applications?.pendingReview ?? 0;
  const { data: unreadData } = useUnreadCount();
  const notifUnread = unreadData?.count ?? 0;

  return (
    /* Outer container: floats the pill inside the oat canvas */
    <div
      className="flex-shrink-0 flex"
      style={{
        padding: '14px 0 14px 14px',
        width: sidebarW + 14,
        transition: 'width 180ms ease',
      }}
    >
      {/* Pill sidebar */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          background: '#fffdf8',
          border: '1px solid #e6e1d5',
          borderRadius: 20,
          transition: 'width 180ms ease',
          boxShadow: '0 1px 4px rgba(44,50,47,0.06)',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            gap: 10,
            padding: collapsed ? '14px 10px 12px' : '14px 13px 12px',
            borderBottom: '1px solid #efece2',
            minHeight: 60,
          }}
        >
          {/* School badge */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              background: '#3f4f45',
              color: '#f1ece0',
              fontFamily: 'var(--font-fraunces)',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div
                className="truncate"
                style={{
                  fontFamily: 'var(--font-fraunces)',
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: '#2c322f',
                }}
              >
                Maple Valley
              </div>
              <div
                className="truncate"
                style={{ fontSize: 10.5, color: '#8d938d' }}
              >
                North Campus · 2024–25
              </div>
            </div>
          )}
        </div>

        {/* Nav scroll area */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '8px 9px 12px' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.group} style={{ marginBottom: 10 }}>
              {!collapsed && (
                <p
                  className="truncate"
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#a9aca4',
                    padding: '6px 7px',
                  }}
                >
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  currentPath.startsWith(item.href + '/');
                const Icon = item.icon;
                // Use live admission pending count for the admissions nav item
                const badgeCount =
                  item.href === '/admissions' ? admissionPending
                  : item.href === '/notifications' ? notifUnread
                  : item.badge;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className="flex items-center relative transition-colors"
                    style={{
                      gap: 10,
                      height: 34,
                      padding: collapsed ? '0 9px' : '0 9px',
                      borderRadius: 11,
                      marginBottom: 2,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#3f6152' : '#6d746e',
                      background: isActive ? '#d8e9de' : 'transparent',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f4f1e9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <Icon
                      size={16}
                      className="flex-shrink-0"
                      style={{ opacity: isActive ? 1 : 0.7 }}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeCount != null && badgeCount > 0 && (
                          <span
                            className="flex-shrink-0 flex items-center justify-center"
                            style={{
                              minWidth: 19,
                              height: 19,
                              padding: '0 6px',
                              borderRadius: 10,
                              background: '#f2e0d2',
                              color: '#8e5334',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badgeCount != null && badgeCount > 0 && (
                      <span
                        className="absolute"
                        style={{
                          top: 6,
                          right: 8,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#b96f4f',
                          display: 'block',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

      </div>
    </div>
  );
}

export { Sidebar };
