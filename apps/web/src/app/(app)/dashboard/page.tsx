'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { KpiCard, Card, CardHeader, CardTitle, Button } from '@/components/ui';

const ACTIVITY = [
  { color: '#3a7a57', text: "Aarav Mehta's fee payment of ₹12,500 confirmed", time: '2 min ago' },
  { color: '#2e6644', text: 'Attendance marked for Grade 8·B (38 present)', time: '18 min ago' },
  { color: '#9c4e28', text: 'Leave request from Priya Sharma approved', time: '1 hr ago' },
  { color: '#3a6b8a', text: 'New admission enquiry: Riya Verma (Grade 5)', time: '2 hr ago' },
  { color: '#b3261e', text: 'Payroll run for July completed — ₹18.4L disbursed', time: '3 hr ago' },
  { color: '#2e6644', text: 'Timetable updated for Grade 10·A', time: '5 hr ago' },
  { color: '#9c4e28', text: 'Exam schedule published: Mid Term 2025', time: 'Yesterday' },
  { color: '#3a6b8a', text: '3 substitution requests auto-assigned', time: 'Yesterday' },
];

const AGENDA = [
  { time: '09:00', color: '#3a7a57', title: 'Staff morning meeting', where: 'Conference Room A' },
  { time: '10:30', color: '#b8623c', title: 'Grade 10 Parent-Teacher Meet', where: 'Room 204' },
  { time: '12:00', color: '#6b54a8', title: 'Admissions review: 4 applications', where: 'Principal Office' },
  { time: '14:00', color: '#3a7a57', title: 'Timetable committee meeting', where: 'Room 101' },
  { time: '16:30', color: '#b8623c', title: 'End-of-day attendance report', where: 'Admin portal' },
];

const ACTIONS = [
  { count: '12', title: 'Admissions pending review', sub: 'Priority: 3 interview today', tint: '#f2d9c8', fg: '#7d3e1f' },
  { count: '4',  title: 'Leave requests awaiting',  sub: '2 from teaching staff',     tint: '#c8dfc9', fg: '#2a5c37' },
  { count: '7',  title: 'Notifications unread',     sub: 'Finance + HR updates',       tint: '#c8ddf0', fg: '#2a5473' },
];

const CHART_BARS = [
  { day: 'Mon', students: 88, staff: 92 },
  { day: 'Tue', students: 91, staff: 88 },
  { day: 'Wed', students: 87, staff: 95 },
  { day: 'Thu', students: 93, staff: 90 },
  { day: 'Fri', students: 89, staff: 86 },
];

function MiniBar({ pct, color, track }: { pct: number; color: string; track: string }) {
  return (
    <div style={{ height: 6, borderRadius: 4, background: track, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 400ms ease' }} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      <PageHeader title="Dashboard" subtitle="Good morning, Anita · Mon 31 Aug 2025" />

      {/* KPI row */}
      <div className="grid grid-cols-4" style={{ gap: 14 }}>
        <KpiCard title="TOTAL STUDENTS" value="1,248" trend="+3.2%" trendPositive subtitle="vs last year"   variant="sage" />
        <KpiCard title="TEACHERS"       value="87"    trend="+2"    trendPositive subtitle="this term"      variant="blue" />
        <KpiCard title="FEE COLLECTION" value="₹24.6L" trend="78.4%" trendPositive subtitle="of target"    variant="clay" />
        <KpiCard title="ATTENDANCE"     value="91.4%"  trend="−0.8%" trendPositive={false} subtitle="vs last month" variant="heather" />
      </div>

      {/* Row 2 — chart + actions/agenda */}
      <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>

        {/* Attendance bar chart */}
        <Card bg="#dfeaf1" style={{ border: '1px solid #b8d0e0' }}>
          <CardHeader>
            <CardTitle style={{ color: '#2a5473' }}>Attendance this week</CardTitle>
            <div className="flex gap-4" style={{ fontSize: 11, color: '#3d6678' }}>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 9, height: 9, borderRadius: 3, background: '#2e7a52' }} />
                Students
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 9, height: 9, borderRadius: 3, background: '#b8623c' }} />
                Staff
              </div>
            </div>
          </CardHeader>

          <div style={{ position: 'relative', height: 148, paddingBottom: 28, borderBottom: '1px solid #b8d0e0' }}>
            <div className="flex items-end h-full gap-3">
              {CHART_BARS.map((c) => (
                <div key={c.day} className="flex-1 flex flex-col items-center h-full" style={{ justifyContent: 'flex-end' }}>
                  <div className="flex items-end gap-1 w-full justify-center" style={{ flex: 1 }}>
                    <div style={{
                      width: 20, height: `${c.students}%`,
                      background: '#2e7a52',
                      borderRadius: '5px 5px 2px 2px',
                      minHeight: 4,
                    }} />
                    <div style={{
                      width: 20, height: `${c.staff}%`,
                      background: '#b8623c',
                      borderRadius: '5px 5px 2px 2px',
                      minHeight: 4,
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 7,
                    fontSize: 10.5, color: '#5c7488', fontWeight: 500,
                    left: 0, right: 0, textAlign: 'center',
                  }}>
                    {c.day}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-8 pt-3">
            {[
              { label: 'AVG STUDENT', value: '91.4%' },
              { label: 'AVG STAFF',   value: '90.2%' },
              { label: 'THIS WEEK',   value: '5 days' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', color: '#4e6a7d', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 17, fontWeight: 600, marginTop: 2, color: '#1e3d4f' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col" style={{ gap: 14 }}>
          {/* Needs action */}
          <Card bg="#f5dfd0" style={{ border: '1px solid #e5c4ad' }}>
            <CardTitle style={{ color: '#7d3e1f', marginBottom: 12 }}>Needs your action</CardTitle>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {ACTIONS.map((a) => (
                <div
                  key={a.title}
                  className="flex items-center cursor-pointer"
                  style={{
                    gap: 11,
                    background: '#fffdf8',
                    border: '1px solid #e6e1d5',
                    borderRadius: 12,
                    padding: '10px 12px',
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#c9c4ba'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e6e1d5'; }}
                >
                  <div className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 30, height: 30, borderRadius: 9, background: a.tint, color: a.fg, fontSize: 13, fontWeight: 700 }}>
                    {a.count}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2c322f' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#8d938d', marginTop: 1 }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize: 18, color: '#b8b2a8', lineHeight: 1 }}>›</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Today agenda */}
          <Card bg="#e6e1ef" style={{ border: '1px solid #ccc5df', flex: 1 }}>
            <CardTitle style={{ color: '#4a3a6a', marginBottom: 12 }}>Today · Mon 31 Aug</CardTitle>
            <div>
              {AGENDA.map((ag, i) => (
                <div key={i} className="flex gap-3" style={{
                  padding: '8px 0',
                  borderBottom: i < AGENDA.length - 1 ? '1px solid #ccc5df' : 'none',
                }}>
                  <div style={{ width: 44, flexShrink: 0, fontSize: 11, color: '#8d93a2', fontVariantNumeric: 'tabular-nums' }}>
                    {ag.time}
                  </div>
                  <div style={{ width: 3, flexShrink: 0, borderRadius: 2, background: ag.color, alignSelf: 'stretch' }} />
                  <div className="min-w-0">
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#2c322f' }}>{ag.title}</div>
                    <div style={{ fontSize: 11, color: '#8d938d', marginTop: 1 }}>{ag.where}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Row 3 — activity + mini modules */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

        {/* Upcoming exams */}
        <Card bg="#d8e9d9" style={{ border: '1px solid #b2ceB6' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#1e5034' }}>Upcoming Exams</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#3a7a57', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 11 }}>
            {[
              { label: 'Mid Term Science',  value: '02 Sep', pct: 80, color: '#2a6e48', track: '#aecab4' },
              { label: 'Mid Term Maths',    value: '03 Sep', pct: 60, color: '#2a6e48', track: '#aecab4' },
              { label: 'Unit Test English', value: '04 Sep', pct: 40, color: '#2a6e48', track: '#aecab4' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#1e3a28' }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#3d6b50' }}>{r.value}</div>
                </div>
                <MiniBar pct={r.pct} color={r.color} track={r.track} />
              </div>
            ))}
          </div>
        </Card>

        {/* Fee collection */}
        <Card bg="#d5e8f2" style={{ border: '1px solid #adcfe2' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#1a4a63' }}>Fee Collection</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2a6080', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 11 }}>
            {[
              { label: 'Q1 Collected', value: '₹18.4L', pct: 92, color: '#2a608a', track: '#9bc3de' },
              { label: 'Q2 Collected', value: '₹14.2L', pct: 71, color: '#2a608a', track: '#9bc3de' },
              { label: 'Overdue',      value: '₹3.2L',  pct: 16, color: '#b3261e', track: '#eeb5b2' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#1a3346' }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#2a4e6a' }}>{r.value}</div>
                </div>
                <MiniBar pct={r.pct} color={r.color} track={r.track} />
              </div>
            ))}
          </div>
        </Card>

        {/* Fee overdue */}
        <Card bg="#f2ddd0" style={{ border: '1px solid #e0bfaa' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <CardTitle style={{ color: '#7a3018' }}>Fee Overdue</CardTitle>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: '#9c4e28', cursor: 'pointer' }}>View all</span>
          </div>
          <div className="flex flex-col" style={{ gap: 11 }}>
            {[
              { label: 'Kavya Nair · 6C',  value: '₹8,500',  pct: 70, color: '#b8623c', track: '#e8c4b0' },
              { label: 'Rohan Desai · 9A', value: '₹15,200', pct: 85, color: '#b8623c', track: '#e8c4b0' },
              { label: 'Sneha Iyer · 11B', value: '₹22,000', pct: 55, color: '#b8623c', track: '#e8c4b0' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between" style={{ marginBottom: 5 }}>
                  <div style={{ fontSize: 12.5, color: '#3a1a0c' }}>{r.label}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9c4e28' }}>{r.value}</div>
                </div>
                <MiniBar pct={r.pct} color={r.color} track={r.track} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <span style={{ fontSize: 12, color: '#5d7f6b', fontWeight: 600, cursor: 'pointer' }}>View all</span>
        </CardHeader>
        <div className="grid grid-cols-2" style={{ gap: '0 32px' }}>
          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3"
              style={{
                padding: '10px 0',
                borderBottom: i < ACTIVITY.length - 2 ? '1px solid #efece2' : 'none',
              }}
            >
              <div
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.color, flexShrink: 0, marginTop: 5,
                }}
              />
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: 12.5, color: '#2c322f', lineHeight: 1.4 }}>{item.text}</p>
                <p style={{ fontSize: 10.5, color: '#a9aca4', marginTop: 2 }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
