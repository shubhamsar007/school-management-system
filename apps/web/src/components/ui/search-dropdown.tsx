'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import { useStudents } from '@/lib/hooks/use-students';
import { Avatar } from '@/components/ui/avatar';

const QUICK_CHIPS = [
  { label: 'Contact',   tab: 'personal'   },
  { label: 'Documents', tab: 'documents'  },
  { label: 'History',   tab: 'history'    },
];

interface SearchDropdownProps {
  query: string;
  onClose: () => void;
}

export function SearchDropdown({ query, onClose }: SearchDropdownProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // Debounce
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data } = useStudents(
    debouncedQuery.length >= 1 ? { search: debouncedQuery, limit: 8 } : {},
  );
  const students = debouncedQuery.length >= 1 ? (data?.data ?? []) : [];

  if (debouncedQuery.length < 1) return null;

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  if (students.length === 0 && data !== undefined) {
    return (
      <div style={{
        position: 'absolute', top: '100%', right: 0, marginTop: 6,
        width: 340, background: '#fff', borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #e6e8eb',
        padding: '20px 16px', textAlign: 'center', zIndex: 9000,
      }}>
        <p style={{ fontSize: 13, color: '#8a929b' }}>No students found for &ldquo;{debouncedQuery}&rdquo;.</p>
      </div>
    );
  }

  if (students.length === 0) return null;

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 6,
      width: 340, background: '#fff', borderRadius: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #e6e8eb',
      overflow: 'hidden', zIndex: 9000,
    }}>
      {/* Results header */}
      <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid #f0f2f4' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a4a9b0' }}>
          Students
        </p>
      </div>

      {students.map((student) => {
        const isHovered = hoveredId === student.id;
        const enrollment = student.enrollments[0];
        return (
          <div
            key={student.id}
            onMouseEnter={() => setHoveredId(student.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              borderBottom: '1px solid #f0f2f4',
              background: isHovered ? '#f8fafb' : '#fff',
              transition: 'background 100ms',
            }}
          >
            {/* Name row — click to open profile */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => navigate(`/students/${student.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px 8px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <Avatar name={student.name} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="hover:underline" style={{ fontSize: '13.5px', fontWeight: 600, color: '#14181c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.name}
                </p>
                <p style={{ fontSize: '11.5px', color: '#8a929b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {enrollment
                    ? `${enrollment.class.name} · Sec ${enrollment.section.name} · ${student.admissionNumber}`
                    : student.admissionNumber}
                </p>
              </div>
            </button>

            {/* Quick chips on hover */}
            {isHovered && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px 10px', flexWrap: 'wrap' }}>
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.tab}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); navigate(`/students/${student.id}?tab=${chip.tab}`); }}
                    style={{
                      fontSize: '11px', fontWeight: 500, color: '#4e6a7d',
                      background: '#dfeaf1', border: 'none', borderRadius: 5,
                      padding: '3px 8px', cursor: 'pointer',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
                {student.person.phone && (
                  <span style={{ fontSize: '11px', color: '#8a929b', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
                    <Phone size={10} />
                    {student.person.phone}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
