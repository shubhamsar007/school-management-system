'use client';

import * as React from 'react';
import { KpiCard, KpiSkeleton, Badge } from '@/components/ui';
import { useAcademicsStats, useClasses } from '@/lib/hooks/use-academics';

interface OverviewTabProps {
  yearId: string;
}

export function OverviewTab({ yearId }: OverviewTabProps) {
  const { data: stats, isLoading: statsLoading } = useAcademicsStats(yearId || undefined);
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  return (
    <div>
      {/* ── KPI Row 1 — Structure ── */}
      {statsLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard
            title="Total Classes"
            value={String(stats?.totalClasses ?? 0)}
            variant="sage"
            subtitle="active"
          />
          <KpiCard
            title="Total Sections"
            value={String(stats?.totalSections ?? 0)}
            variant="blue"
            subtitle="active"
          />
          <KpiCard
            title="Total Subjects"
            value={String(stats?.totalSubjects ?? 0)}
            variant="heather"
            subtitle="active"
          />
          <KpiCard
            title="Total Students"
            value={String(stats?.totalStudents ?? 0)}
            variant="clay"
            subtitle={yearId ? 'enrolled this year' : 'enrolled'}
          />
        </div>
      )}

      {/* ── KPI Row 2 — Insights ── */}
      {statsLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KpiCard
            title="Avg Class Size"
            value={String(stats?.avgClassSize ?? 0)}
            variant="neutral"
            subtitle="students per section"
          />
          <KpiCard
            title="Sections Near Capacity"
            value={String(stats?.sectionsNearCapacity ?? 0)}
            variant="clay"
            subtitle="≥ 80% full"
          />
          {yearId ? (
            <KpiCard
              title="Classes Without Subjects"
              value={String(stats?.classesWithoutSubjects ?? 0)}
              variant={stats?.classesWithoutSubjects ? 'clay' : 'neutral'}
              subtitle={yearId ? 'no subjects assigned' : 'select a year to check'}
            />
          ) : (
            <KpiCard
              title="Classes Without Subjects"
              value="—"
              variant="neutral"
              subtitle="select a year to check"
            />
          )}
        </div>
      )}

      {/* ── Class Strength Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#e6e8eb] bg-white shadow-sm">
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eef0f2',
            fontSize: '12px',
            fontWeight: 600,
            color: '#4a5260',
          }}
        >
          Class Strength Summary
        </div>

        {/* Table header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 80px 80px 80px 120px 80px',
            background: '#fbf9f3',
            borderBottom: '1px solid #efece2',
          }}
        >
          {['CLASS', 'SECTIONS', 'STUDENTS', 'AVG SIZE', 'UTILISATION', 'STATUS'].map((h) => (
            <div
              key={h}
              style={{
                height: 36,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.09em',
                color: '#a9aca4',
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {classesLoading ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#8a929b' }}>
            Loading…
          </div>
        ) : classes.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#8a929b' }}>
            No classes found. Add your first class to get started.
          </div>
        ) : (
          classes.map((cls) => {
            const sections = cls.sections?.length ?? 0;
            const students = cls._count?.studentEnrollments ?? 0;
            const avgSize = sections > 0 ? Math.round(students / sections) : 0;
            const totalCapacity = cls.sections?.reduce((sum, s) => sum + (s.capacity ?? 0), 0) ?? 0;
            const util = totalCapacity > 0 ? Math.round((students / totalCapacity) * 100) : 0;

            return (
              <div
                key={cls.id}
                className="grid"
                style={{
                  gridTemplateColumns: '1fr 80px 80px 80px 120px 80px',
                  minHeight: 48,
                  borderBottom: '1px solid #f4f1e8',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fbf9f3'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, fontWeight: 500, color: '#14181c' }}>
                  {cls.name}
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#8a929b', fontFamily: 'monospace' }}>{cls.code}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>{sections}</div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>{students}</div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13, color: '#2c322f' }}>{avgSize}</div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
                  {totalCapacity > 0 ? (
                    <>
                      <div style={{ flex: 1, height: 6, background: '#eef0f2', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(util, 100)}%`,
                            background: util >= 95 ? '#e84040' : util >= 80 ? '#e89040' : '#5d7f6b',
                            borderRadius: 3,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#8a929b', minWidth: 28 }}>{util}%</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#c5c0b6' }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <Badge variant={cls.status === 'ACTIVE' ? 'active' : 'inactive'}>
                    {cls.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
