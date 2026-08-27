'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard, Card, CardHeader, CardTitle, StatBar, Button } from '@/components/ui';

const ACTIVITY = [
  { color: '#2b5fa8', text: "Aarav Mehta's fee payment of ₹12,500 confirmed", time: '2 min ago' },
  { color: '#146b41', text: 'Attendance marked for Grade 8·B (38 present)', time: '18 min ago' },
  { color: '#8a5a00', text: 'Leave request from Priya Sharma approved', time: '1 hr ago' },
  { color: '#2b5fa8', text: 'New admission enquiry: Riya Verma (Grade 5)', time: '2 hr ago' },
  { color: '#b3261e', text: 'Payroll run for July completed — ₹18.4L disbursed', time: '3 hr ago' },
  { color: '#146b41', text: 'Timetable updated for Grade 10·A', time: '5 hr ago' },
  { color: '#8a5a00', text: 'Exam schedule published: Mid Term 2025', time: 'Yesterday' },
  { color: '#2b5fa8', text: '3 substitution requests auto-assigned', time: 'Yesterday' },
];

const EXAMS = [
  { name: 'Mid Term Science', class: 'Grade 9·A', date: '02 Sep 2025' },
  { name: 'Mid Term Maths', class: 'Grade 9·B', date: '03 Sep 2025' },
  { name: 'Unit Test English', class: 'Grade 6·C', date: '04 Sep 2025' },
  { name: 'Mid Term History', class: 'Grade 10·A', date: '05 Sep 2025' },
  { name: 'Unit Test Science', class: 'Grade 7·B', date: '06 Sep 2025' },
];

const OVERDUE = [
  { name: 'Kavya Nair', class: 'Grade 6·C', amount: '₹8,500', days: 12 },
  { name: 'Rohan Desai', class: 'Grade 9·A', amount: '₹15,200', days: 8 },
  { name: 'Sneha Iyer', class: 'Grade 11·B', amount: '₹22,000', days: 5 },
  { name: 'Arjun Pillai', class: 'Grade 7·A', amount: '₹9,800', days: 3 },
  { name: 'Meera Joshi', class: 'Grade 12·C', amount: '₹18,500', days: 2 },
];

const PENDING_ACTIONS = [
  '12 Admissions', '4 Leave Requests', '7 Notifications', '3 Substitutions',
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Good morning, Anita · Wednesday, 27 Aug 2025" />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard title="TOTAL STUDENTS" value="1,248" trend="+3.2%" trendPositive subtitle="vs last year" />
        <KpiCard title="TEACHERS" value="87" trend="+2" trendPositive subtitle="this term" />
        <KpiCard title="FEE COLLECTION" value="₹24.6L" trend="78.4%" trendPositive subtitle="of target" />
        <KpiCard title="ATTENDANCE RATE" value="91.4%" trend="−0.8%" trendPositive={false} subtitle="vs last month" />
      </div>

      {/* Row 2 */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <div>
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-3"
                style={{ borderBottom: i < ACTIVITY.length - 1 ? '1px solid #f2f4f6' : 'none' }}
              >
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#14181c]">{item.text}</p>
                  <p className="mt-0.5 text-[11px] text-[#8a929b]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* At a Glance */}
        <Card>
          <CardHeader>
            <CardTitle>At a Glance</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            <StatBar label="Attendance Today" value={91} displayValue="91%" color="#2b5fa8" />
            <StatBar label="Fee Collection" value={78} displayValue="78%" color="#146b41" />
            <StatBar label="Staff Present" value={88} displayValue="88%" color="#8a5a00" />
            <StatBar label="Homework Submitted" value={64} displayValue="64%" color="#5a45a8" />
          </div>
          <div className="mt-5 border-t border-[#eef0f2] pt-4">
            <p className="mb-3 text-xs font-semibold text-[#14181c]">Pending Actions</p>
            <div className="flex flex-wrap gap-2">
              {PENDING_ACTIONS.map((label) => (
                <span
                  key={label}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ background: '#fdf3e0', color: '#8a5a00' }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="mt-5 grid grid-cols-2 gap-5">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <div>
            {EXAMS.map((exam, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < EXAMS.length - 1 ? '1px solid #f2f4f6' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium text-[#14181c]">{exam.name}</p>
                  <p className="text-[11px] text-[#6b7480]">{exam.class}</p>
                </div>
                <p className="text-xs text-[#8a929b]">{exam.date}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Fee Overdue */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Overdue</CardTitle>
          </CardHeader>
          <div>
            {OVERDUE.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < OVERDUE.length - 1 ? '1px solid #f2f4f6' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium text-[#14181c]">{row.name}</p>
                  <p className="text-[11px] text-[#6b7480]">{row.class}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#b3261e]">{row.amount}</span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: '#fdeceb', color: '#b3261e' }}>
                    {row.days}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
