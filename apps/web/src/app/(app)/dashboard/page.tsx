'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard, Card, CardHeader, CardTitle, StatBar, Button } from '@/components/ui';

const ACTIVITY = [
  { color: '#5d7f6b', text: "Aarav Mehta's fee payment of ₹12,500 confirmed", time: '2 min ago' },
  { color: '#33604a', text: 'Attendance marked for Grade 8·B (38 present)', time: '18 min ago' },
  { color: '#8c4f31', text: 'Leave request from Priya Sharma approved', time: '1 hr ago' },
  { color: '#4e6a7d', text: 'New admission enquiry: Riya Verma (Grade 5)', time: '2 hr ago' },
  { color: '#b3261e', text: 'Payroll run for July completed — ₹18.4L disbursed', time: '3 hr ago' },
  { color: '#33604a', text: 'Timetable updated for Grade 10·A', time: '5 hr ago' },
  { color: '#8c4f31', text: 'Exam schedule published: Mid Term 2025', time: 'Yesterday' },
  { color: '#4e6a7d', text: '3 substitution requests auto-assigned', time: 'Yesterday' },
];

const AGENDA = [
  { time: '09:00', color: '#5d7f6b', title: 'Staff morning meeting', where: 'Conference Room A' },
  { time: '10:30', color: '#c98b5f', title: 'Grade 10 Parent-Teacher Meet', where: 'Room 204' },
  { time: '12:00', color: '#7b6ca8', title: 'Admissions review: 4 applications', where: 'Principal Office' },
  { time: '14:00', color: '#5d7f6b', title: 'Timetable committee meeting', where: 'Room 101' },
  { time: '16:30', color: '#c98b5f', title: 'End-of-day attendance report', where: 'Admin portal' },
];

const ACTIONS = [
  { count: '12', title: 'Admissions pending review', sub: 'Priority: 3 interview today', tint: '#f2e0d2', fg: '#8e5334' },
  { count: '4', title: 'Leave requests awaiting', sub: '2 from teaching staff', tint: '#dfe7d9', fg: '#3f6152' },
  { count: '7', title: 'Notifications unread', sub: 'Finance + HR updates', tint: '#dfeaf1', fg: '#3d6678' },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <PageHeader title="Dashboard" subtitle="Good morning, Anita · Mon 31 Aug 2025" />

      {/* KPI row */}
      <div className="grid grid-cols-4" style={{ gap: 14 }}>
        <KpiCard title="TOTAL STUDENTS" value="1,248" trend="+3.2%" trendPositive subtitle="vs last year" variant="sage" />
        <KpiCard title="TEACHERS" value="87" trend="+2" trendPositive subtitle="this term" variant="blue" />
        <KpiCard title="FEE COLLECTION" value="₹24.6L" trend="78.4%" trendPositive subtitle="of target" variant="clay" />
        <KpiCard title="ATTENDANCE RATE" value="91.4%" trend="−0.8%" trendPositive={false} subtitle="vs last month" variant="heather" />
      </div>

      {/* Row 2 */}
      <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
        {/* Attendance chart card */}
        <Card bg="#dfeaf1" style={{ border: '1px solid #c9dce7' }}>
          <CardHeader>
            <CardTitle style={{ color: '#3d6678' }}>Attendance this week</CardTitle>
            <div className="flex gap-4 text-[11px]" style={{ color: '#4e6a7d' }}>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#4e7a63' }} />
                Students
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#c98b5f' }} />
                Staff
              </div>
            </div>
          </CardHeader>
          {/* Bar chart */}
          <div className="flex items-end gap-3" style={{ height: 140, paddingBottom: 24, borderBottom: '1px solid #c9dce7', position: 'relative' }}>
            {[
              { day: 'Mon', h1: 88, h2: 92 },
              { day: 'Tue', h1: 91, h2: 88 },
              { day: 'Wed', h1: 87, h2: 95 },
              { day: 'Thu', h1: 93, h2: 90 },
              { day: 'Fri', h1: 89, h2: 86 },
            ].map((c) => (
              <div key={c.day} className="flex-1 flex flex-col items-center" style={{ height: '100%', justifyContent: 'flex-end' }}>
                <div className="flex items-end gap-1 w-full justify-center" style={{ height: '100%' }}>
                  <div style={{ width: 18, height: `${c.h1}%`, background: '#4e7a63', borderRadius: '5px 5px 2px 2px' }} />
                  <div style={{ width: 18, height: `${c.h2}%`, background: '#c98b5f', borderRadius: '5px 5px 2px 2px' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 6, fontSize: 10.5, color: '#8d938d' }}>{c.day}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 pt-3">
            {[
              { label: 'AVG STUDENT', value: '91.4%' },
              { label: 'AVG STAFF', value: '90.2%' },
              { label: 'THIS WEEK', value: '5 days' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#5c7488' }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3, color: '#2c322f' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col" style={{ gap: 14 }}>
          {/* Actions card */}
          <Card bg="#f7e2d5" style={{ border: '1px solid #eecfbc' }}>
            <CardTitle style={{ color: '#8c4f31', marginBottom: 12 }}>Needs your action</CardTitle>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {ACTIONS.map((a) => (
                <div
                  key={a.title}
                  className="flex items-center cursor-pointer"
                  style={{
                    gap: 11,
                    background: '#fffdf8',
                    border: '1px solid #e6e1d5',
                    borderRadius: 13,
                    padding: '10px 12px',
                  }}
                >
                  <div className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 28, height: 28, borderRadius: 9, background: a.tint, color: a.fg, fontSize: 12, fontWeight: 700 }}>
                    {a.count}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2c322f' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#8d938d' }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize: 16, color: '#a9aca4' }}>›</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Agenda */}
          <Card bg="#e6e1ef" style={{ border: '1px solid #d5cee4', flex: 1 }}>
            <CardTitle style={{ color: '#584a75', marginBottom: 12 }}>Today · Mon 31 Aug</CardTitle>
            <div>
              {AGENDA.map((ag, i) => (
                <div key={i} className="flex gap-3" style={{ padding: '8px 0', borderBottom: i < AGENDA.length - 1 ? '1px solid #d5cee4' : 'none' }}>
                  <div style={{ width: 44, flexShrink: 0, fontSize: 11, color: '#8d938d', fontVariantNumeric: 'tabular-nums' }}>{ag.time}</div>
                  <div style={{ width: 3, flexShrink: 0, borderRadius: 2, background: ag.color }} />
                  <div className="min-w-0">
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#2c322f' }}>{ag.title}</div>
                    <div style={{ fontSize: 11, color: '#8d938d' }}>{ag.where}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3 — mini modules */}
      <div className="grid grid-cols-3" style={{ gap: 14 }}>
        <Card bg="#dbe8dc" style={{ border: '1px solid #c5d8c8' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#33604a' }}>Upcoming Exams</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5d7f6b', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {[{ label: 'Mid Term Science', value: '02 Sep', pct: 80 }, { label: 'Mid Term Maths', value: '03 Sep', pct: 60 }, { label: 'Unit Test English', value: '04 Sep', pct: 40 }].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#2c322f' }}>{r.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6d746e' }}>{r.value}</div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: '#4e7a63', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card bg="#dfeaf1" style={{ border: '1px solid #c9dce7' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#3d6678' }}>Fee Collection</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#4e6a7d', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {[{ label: 'Q1 Collected', value: '₹18.4L', pct: 92 }, { label: 'Q2 Collected', value: '₹14.2L', pct: 71 }, { label: 'Overdue', value: '₹3.2L', pct: 16 }].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#2c322f' }}>{r.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6d746e' }}>{r.value}</div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: '#4e7a8a', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card bg="#f7e2d5" style={{ border: '1px solid #eecfbc' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#8c4f31' }}>Fee Overdue</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8c4f31', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {[{ label: 'Kavya Nair · 6C', value: '₹8,500', pct: 70 }, { label: 'Rohan Desai · 9A', value: '₹15,200', pct: 85 }, { label: 'Sneha Iyer · 11B', value: '₹22,000', pct: 55 }].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#2c322f' }}>{r.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8c4f31' }}>{r.value}</div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.pct}%`, background: '#c98b5f', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
