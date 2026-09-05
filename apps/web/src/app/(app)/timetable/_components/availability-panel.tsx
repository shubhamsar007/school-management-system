'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useTeacherAvailability, useSetTeacherAvailability } from '@/lib/hooks/use-timetable';
import type { TeacherAvailabilityDay } from '@/lib/hooks/use-timetable';

const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

interface AvailabilityPanelProps {
  teacherId: string;
}

export function AvailabilityPanel({ teacherId }: AvailabilityPanelProps) {
  const toast = useToast();
  const { data: availability, isLoading } = useTeacherAvailability(teacherId);
  const setAvailability = useSetTeacherAvailability();

  const [local, setLocal] = React.useState<TeacherAvailabilityDay[]>([]);
  const [dirty, setDirty] = React.useState(false);

  // Sync remote → local on load
  React.useEffect(() => {
    if (availability) {
      setLocal(availability.map((d) => ({ ...d })));
      setDirty(false);
    }
  }, [availability]);

  function toggleDay(dayOfWeek: number) {
    setLocal((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, isAvailable: !d.isAvailable } : d,
      ),
    );
    setDirty(true);
  }

  function setNote(dayOfWeek: number, note: string) {
    setLocal((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, note: note || null } : d)),
    );
    setDirty(true);
  }

  async function handleSave() {
    try {
      await setAvailability.mutateAsync({
        teacherId,
        availability: local.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          isAvailable: d.isAvailable,
          ...(d.note ? { note: d.note } : {}),
        })),
      });
      toast.success('Availability saved.');
      setDirty(false);
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save availability.');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-[#8a929b]">
        Loading availability…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {local.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{
              background: day.isAvailable ? '#f0fdf4' : '#fafbfc',
              border: `1.5px solid ${day.isAvailable ? '#bbf7d0' : '#e6e8eb'}`,
            }}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleDay(day.dayOfWeek)}
              className="relative flex-shrink-0"
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: day.isAvailable ? '#22c55e' : '#d1d5db',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: day.isAvailable ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>

            {/* Day label */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: day.isAvailable ? '#15803d' : '#6b7280',
                width: 80,
                flexShrink: 0,
              }}
            >
              {DAY_LABELS[day.dayOfWeek]}
            </span>

            <span
              style={{
                fontSize: 11,
                color: day.isAvailable ? '#16a34a' : '#9ca3af',
                width: 80,
                flexShrink: 0,
              }}
            >
              {day.isAvailable ? 'Available' : 'Unavailable'}
            </span>

            {/* Note input */}
            <input
              type="text"
              value={day.note ?? ''}
              onChange={(e) => setNote(day.dayOfWeek, e.target.value)}
              placeholder="Add note (optional)"
              style={{
                flex: 1,
                fontSize: 11,
                color: '#374151',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '2px 0',
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!dirty || setAvailability.isPending}
        >
          {setAvailability.isPending ? 'Saving…' : 'Save Availability'}
        </Button>
      </div>
    </div>
  );
}
