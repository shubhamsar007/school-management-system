'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Bell,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  CheckSquare,
  FileText,
  UserPlus,
  DollarSign,
  CreditCard,
  Calendar,
  RefreshCw,
  Megaphone,
  FolderOpen,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

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
      { label: 'Notifications', href: '/notifications', icon: Bell, badge: 7 },
    ],
  },
  {
    group: 'PEOPLE',
    items: [
      { label: 'Students', href: '/students', icon: Users },
      { label: 'Teachers & Staff', href: '/staff', icon: GraduationCap },
    ],
  },
  {
    group: 'ACADEMIC',
    items: [
      { label: 'Academics', href: '/academics', icon: BookOpen },
      { label: 'Timetable', href: '/timetable', icon: Clock },
      { label: 'Attendance', href: '/attendance', icon: CheckSquare },
      { label: 'Examinations', href: '/examinations', icon: FileText },
      { label: 'Homework', href: '/homework', icon: BookOpen },
    ],
  },
  {
    group: 'ADMISSIONS',
    items: [
      { label: 'Admissions Pipeline', href: '/admissions', icon: UserPlus, badge: 12 },
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
    group: 'OPERATIONS',
    items: [
      { label: 'Announcements', href: '/announcements', icon: Megaphone },
      { label: 'PTM Scheduling', href: '/ptm', icon: Calendar },
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
  return (
    <aside
      className="flex h-screen flex-col bg-white border-r border-[#e6e8eb] flex-shrink-0 overflow-hidden"
      style={{
        width: collapsed ? 52 : 240,
        transition: 'width 200ms ease',
      }}
    >
      {/* Logo area */}
      <div
        className="flex items-center border-b border-[#e6e8eb] flex-shrink-0"
        style={{ height: 64, padding: collapsed ? '0 10px' : '0 16px' }}
      >
        {!collapsed && (
          <span className="font-bold text-[15px] text-[#14181c] truncate">SchoolMS</span>
        )}
        {collapsed && (
          <span className="font-bold text-[15px] text-[#2b5fa8]">S</span>
        )}
      </div>

      {/* Nav scroll area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="mb-1">
            {/* Group header */}
            {!collapsed && (
              <p
                className="truncate"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: '#a2aab3',
                  padding: '8px 16px 4px',
                  textTransform: 'uppercase',
                }}
              >
                {group.group}
              </p>
            )}
            {/* Group items */}
            {group.items.map((item) => {
              const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 transition-colors relative',
                    isActive
                      ? 'bg-[#eff4fb] text-[#2b5fa8] font-semibold'
                      : 'text-[#6b7480] hover:bg-[#f2f4f6] hover:text-[#14181c]',
                    collapsed ? 'justify-center px-0' : 'px-4'
                  )}
                  style={{
                    height: 38,
                    fontSize: '13.5px',
                    borderRadius: 6,
                    margin: collapsed ? '1px 8px' : '1px 8px',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#fdeceb',
                            color: '#b3261e',
                            borderRadius: '10px',
                            padding: '1px 7px',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span
                      className="absolute top-1 right-1"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#b3261e',
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

      {/* Bottom: collapse button + user */}
      <div className="border-t border-[#e6e8eb] flex-shrink-0">
        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Avatar name="Anita Rao" size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#14181c] truncate">Anita Rao</p>
              <p className="text-[11px] text-[#8a929b] truncate">Administrator</p>
            </div>
          </div>
        )}
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center w-full border-t border-[#e6e8eb] text-[#8a929b] hover:bg-[#f2f4f6] hover:text-[#14181c] transition-colors',
            collapsed ? 'gap-0' : 'gap-2 px-4'
          )}
          style={{ height: 40, fontSize: '12px' }}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
