'use client';

import * as React from 'react';
import { BookOpen } from 'lucide-react';
import { type Employee } from '@/lib/hooks/use-teachers';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Assignments tab ──────────────────────────────────────────────────────────

export function AssignmentsTab({ employee }: { employee: Employee }) {
  const assignments = employee.teacherAssignments ?? [];

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<BookOpen size={24} />}
          title="No assignments yet"
          description="Teaching assignments will appear here once added."
        />
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-[#e6e8eb]"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #e6e8eb' }}>
              {['Subject', 'Class', 'Section', 'Academic Year', 'Role', 'From', 'To'].map((h) => (
                <th
                  key={h}
                  style={{ padding: '0 16px', height: 40, fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8a929b', textAlign: 'left', whiteSpace: 'nowrap' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr
                key={a.id}
                style={{ height: 52, borderBottom: '1px solid #f0f2f4' }}
                className="hover:bg-[#fafbfc]"
              >
                <td style={{ padding: '0 16px', fontWeight: 600, fontSize: '13.5px', color: '#14181c', whiteSpace: 'nowrap' }}>
                  {a.subject.name}
                </td>
                <td style={{ padding: '0 16px', fontSize: '13px', color: '#14181c', whiteSpace: 'nowrap' }}>
                  {a.class.name}
                </td>
                <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                  {a.section.name}
                </td>
                <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                  {a.academicYear.name}
                </td>
                <td style={{ padding: '0 16px', whiteSpace: 'nowrap' }}>
                  {a.isClassTeacher
                    ? <Badge variant="active">Class Teacher</Badge>
                    : <Badge variant="default">Subject Teacher</Badge>}
                </td>
                <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                  {formatDate(a.startDate)}
                </td>
                <td style={{ padding: '0 16px', fontSize: '13px', color: '#6b7480', whiteSpace: 'nowrap' }}>
                  {a.endDate ? formatDate(a.endDate) : <span style={{ color: '#c4c9cf' }}>Ongoing</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
