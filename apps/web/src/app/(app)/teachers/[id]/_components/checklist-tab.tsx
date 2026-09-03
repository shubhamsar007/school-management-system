'use client';

import * as React from 'react';
import { ClipboardList, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import {
  useOnboarding,
  useOffboarding,
  useUpdateOnboardingTask,
  useUpdateOffboardingTask,
} from '@/lib/hooks/use-teachers';
import type { OnboardingTask, OffboardingTask } from '@/lib/hooks/use-teachers';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exitTypeLabel(type: string) {
  const labels: Record<string, string> = {
    RESIGNATION:  'Resignation',
    TERMINATION:  'Termination',
    RETIREMENT:   'Retirement',
    CONTRACT_END: 'Contract End',
    OTHER:        'Other',
  };
  return labels[type] ?? type;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span style={{ fontSize: '12px', color: '#8a929b' }}>{done} of {total} tasks complete</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: pct === 100 ? '#33604a' : '#14181c' }}>{pct}%</span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#e6e8eb' }}>
        <div
          className="rounded-full transition-all"
          style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#33604a' : '#3d6678' }}
        />
      </div>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  isToggling,
}: {
  task: OnboardingTask | OffboardingTask;
  onToggle: (taskId: string, isCompleted: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 hover:bg-[#fafbfc] transition-colors"
      style={{ padding: '11px 16px', borderBottom: '1px solid #f5f6f7' }}
    >
      <button
        className="flex-shrink-0 mt-0.5 disabled:opacity-50"
        disabled={isToggling}
        onClick={() => onToggle(task.id, !task.isCompleted)}
        title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.isCompleted
          ? <CheckCircle size={18} style={{ color: '#33604a' }} />
          : <Circle size={18} style={{ color: '#c8d0d9' }} />
        }
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            style={{
              fontSize: '13.5px',
              fontWeight: 500,
              color: task.isCompleted ? '#8a929b' : '#14181c',
              textDecoration: task.isCompleted ? 'line-through' : 'none',
            }}
          >
            {task.taskName}
          </p>
          {task.isRequired && !task.isCompleted && (
            <span style={{ fontSize: '11px', color: '#c47c2c', fontWeight: 600 }}>Required</span>
          )}
        </div>

        {task.isCompleted && (task.completedBy || task.completedAt) && (
          <p style={{ fontSize: '11.5px', color: '#8a929b', marginTop: 1 }}>
            Done{task.completedBy ? ` by ${task.completedBy}` : ''}
            {task.completedAt ? ` · ${formatDate(task.completedAt)}` : ''}
          </p>
        )}
        {task.remarks && (
          <p style={{ fontSize: '11.5px', color: '#8a929b', marginTop: 1 }}>{task.remarks}</p>
        )}
      </div>
    </div>
  );
}

// ─── Task category group ──────────────────────────────────────────────────────

function CategoryGroup({
  category,
  tasks,
  onToggle,
  isToggling,
}: {
  category: string;
  tasks: (OnboardingTask | OffboardingTask)[];
  onToggle: (taskId: string, isCompleted: boolean) => void;
  isToggling: boolean;
}) {
  const done = tasks.filter((t) => t.isCompleted).length;
  return (
    <div className="mb-4">
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: '#f5f6f7', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #e6e8eb' }}
      >
        <p style={{ fontSize: '11.5px', fontWeight: 700, color: '#8a929b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {category}
        </p>
        <span style={{ fontSize: '11.5px', color: '#8a929b' }}>{done}/{tasks.length}</span>
      </div>
      <div className="bg-white border border-t-0 border-[#e6e8eb] rounded-b-xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} isToggling={isToggling} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ChecklistSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <Skeleton height={13} width={200} className="mb-4" />
        <Skeleton height={6} className="rounded-full mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-[#f5f6f7]">
            <Skeleton width={18} height={18} className="rounded-full flex-shrink-0" />
            <Skeleton height={13} width={220} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onboarding panel ─────────────────────────────────────────────────────────

function OnboardingPanel({ employeeId }: { employeeId: string }) {
  const { data: onboarding, isLoading } = useOnboarding(employeeId);
  const { mutate: toggleTask, isPending } = useUpdateOnboardingTask(employeeId);

  if (isLoading) return <ChecklistSkeleton />;

  if (!onboarding) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="No onboarding checklist"
          description="Onboarding has not been initiated for this employee yet."
        />
      </div>
    );
  }

  const tasks = onboarding.tasks;
  const done  = tasks.filter((t) => t.isCompleted).length;

  // Group by category
  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#e6e8eb] px-5 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#14181c' }}>Onboarding Checklist</p>
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{ background: onboarding.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7', fontSize: '11.5px', fontWeight: 600, color: onboarding.status === 'COMPLETED' ? '#166534' : '#92400e' }}
          >
            {onboarding.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <ProgressBar done={done} total={tasks.length} />
        {onboarding.completedAt && (
          <p style={{ fontSize: '12px', color: '#33604a', marginTop: 8 }}>
            Completed on {formatDate(onboarding.completedAt)}
          </p>
        )}
      </div>

      {/* Task groups */}
      {categories.map((cat) => (
        <CategoryGroup
          key={cat}
          category={cat}
          tasks={tasks.filter((t) => t.category === cat)}
          onToggle={(taskId, isCompleted) => toggleTask({ taskId, isCompleted })}
          isToggling={isPending}
        />
      ))}
    </div>
  );
}

// ─── Offboarding panel ────────────────────────────────────────────────────────

function OffboardingPanel({ employeeId }: { employeeId: string }) {
  const { data: offboarding, isLoading } = useOffboarding(employeeId);
  const { mutate: toggleTask, isPending } = useUpdateOffboardingTask(employeeId);

  if (isLoading) return <ChecklistSkeleton />;

  if (!offboarding) {
    return (
      <div className="rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-20 px-8 text-center">
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="No offboarding checklist"
          description="Offboarding has not been initiated for this employee yet."
        />
      </div>
    );
  }

  const tasks = offboarding.tasks;
  const done  = tasks.filter((t) => t.isCompleted).length;
  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-[#e6e8eb] px-5 py-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-1">
          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#14181c' }}>Offboarding Checklist</p>
          <span
            className="rounded-full px-2.5 py-0.5"
            style={{ background: offboarding.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2', fontSize: '11.5px', fontWeight: 600, color: offboarding.status === 'COMPLETED' ? '#166534' : '#991b1b' }}
          >
            {offboarding.status === 'COMPLETED' ? 'Completed' : offboarding.status === 'INITIATED' ? 'Initiated' : offboarding.status}
          </span>
        </div>

        {/* Exit details */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-3" style={{ fontSize: '12.5px', color: '#6b7480' }}>
          <span>Exit type: {exitTypeLabel(offboarding.exitType)}</span>
          <span>Exit date: {formatDate(offboarding.exitDate)}</span>
          <span>Last working day: {formatDate(offboarding.lastWorkingDate)}</span>
        </div>

        {offboarding.reason && (
          <div className="flex items-start gap-1.5 mb-3 rounded-lg px-3 py-2" style={{ background: '#fff7ed' }}>
            <AlertTriangle size={13} style={{ color: '#c47c2c', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: '12.5px', color: '#6b7480' }}>{offboarding.reason}</p>
          </div>
        )}

        <ProgressBar done={done} total={tasks.length} />
      </div>

      {/* Task groups */}
      {categories.map((cat) => (
        <CategoryGroup
          key={cat}
          category={cat}
          tasks={tasks.filter((t) => t.category === cat)}
          onToggle={(taskId, isCompleted) => toggleTask({ taskId, isCompleted })}
          isToggling={isPending}
        />
      ))}
    </div>
  );
}

// ─── Checklist tab (context-aware) ────────────────────────────────────────────

type Mode = 'onboarding' | 'offboarding';

export function ChecklistTab({ employeeId, employmentStatus }: { employeeId: string; employmentStatus: string }) {
  const showOffboarding = ['EXIT_INITIATED', 'EXITED', 'ARCHIVED'].includes(employmentStatus);
  const showOnboarding  = ['ONBOARDING', 'PROBATION', 'DRAFT'].includes(employmentStatus);

  // If neither clear context, show both with a toggle
  const defaultMode: Mode = showOffboarding ? 'offboarding' : 'onboarding';
  const [mode, setMode] = React.useState<Mode>(defaultMode);

  return (
    <div className="space-y-4">
      {/* Mode toggle — always visible so HR can access both */}
      <div className="flex gap-2">
        {(['onboarding', 'offboarding'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="rounded-lg px-4 py-2 transition-colors"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              background: mode === m ? '#14181c' : '#f5f6f7',
              color:      mode === m ? '#ffffff' : '#8a929b',
            }}
          >
            {m === 'onboarding' ? 'Onboarding' : 'Offboarding'}
          </button>
        ))}
      </div>

      {mode === 'onboarding'
        ? <OnboardingPanel employeeId={employeeId} />
        : <OffboardingPanel employeeId={employeeId} />
      }
    </div>
  );
}
