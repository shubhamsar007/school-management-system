'use client';

import * as React from 'react';
import { useTeacherTimetable } from '@/lib/hooks/use-teachers';
import { WeeklyScheduleGrid } from '@/components/shared/weekly-schedule-grid';
import type { ScheduleGridDay } from '@/components/shared/weekly-schedule-grid';

export function TimetableTab({ employeeId }: { employeeId: string }) {
  const { data, isLoading, isError } = useTeacherTimetable(employeeId);

  // The teacher schedule API returns TimetableDay[] from use-teachers which matches
  // ScheduleGridDay shape exactly — same field names, same structure.
  const days = (data ?? []) as ScheduleGridDay[];

  return (
    <WeeklyScheduleGrid
      days={days}
      isLoading={isLoading}
      isError={isError}
      showSection
      showSummary
      emptyTitle="No schedule assigned"
      emptyDescription="This teacher has not been assigned to any periods in the active timetable."
      errorTitle="No active timetable"
      errorDescription="No active timetable was found for this teacher. Create one in the Timetable module."
    />
  );
}
