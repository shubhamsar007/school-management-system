'use client';

import * as React from 'react';
import { Phone, Mail, Briefcase, Bell, Car, AlertCircle, Star } from 'lucide-react';
import { useGuardians } from '@/lib/hooks/use-students';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';

// ─── Indicator pill ───────────────────────────────────────────────────────────

function Indicator({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        fontSize: '11.5px',
        fontWeight: 600,
        background: active ? '#dbe8dc' : '#f5f6f7',
        color: active ? '#33604a' : '#b0b6bc',
        border: `1px solid ${active ? '#c5d8c8' : '#eef0f2'}`,
      }}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

// ─── Guardian card ─────────────────────────────────────────────────────────────

function GuardianCard({ sg }: { sg: ReturnType<typeof useGuardians>['data'] extends (infer T)[] | undefined ? T : never }) {
  if (!sg) return null;
  const { guardian, relationship, isPrimary, isEmergencyContact, canPickup, canReceiveNotifications } = sg;
  const { person } = guardian;
  const fullName = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  const rel = relationship.charAt(0) + relationship.slice(1).toLowerCase();

  return (
    <div
      className="bg-white rounded-xl border"
      style={{
        borderColor: isPrimary ? '#c5d8c8' : '#e6e8eb',
        boxShadow: isPrimary ? '0 2px 8px rgba(51,96,74,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size="md" />
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#14181c' }}>{fullName}</p>
            <p style={{ fontSize: '12.5px', color: '#8a929b', marginTop: 2 }}>{rel}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {isPrimary && <Badge variant="active">Primary</Badge>}
          {isEmergencyContact && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ fontSize: '10.5px', fontWeight: 700, background: '#fde8e7', color: '#b3261e', border: '1px solid #f7c5c3' }}
            >
              <AlertCircle size={10} /> Emergency
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {person.phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-[#8a929b] flex-shrink-0" />
            <span style={{ fontSize: '13.5px', color: '#14181c' }}>{person.phone}</span>
            {person.alternatePhone && (
              <span style={{ fontSize: '12px', color: '#8a929b' }}>/ {person.alternatePhone}</span>
            )}
          </div>
        )}
        {person.email && (
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-[#8a929b] flex-shrink-0" />
            <span style={{ fontSize: '13.5px', color: '#14181c' }}>{person.email}</span>
          </div>
        )}
        {guardian.occupation && (
          <div className="flex items-center gap-2">
            <Briefcase size={13} className="text-[#8a929b] flex-shrink-0" />
            <span style={{ fontSize: '13px', color: '#6b7480' }}>
              {guardian.occupation}
              {guardian.employer ? ` · ${guardian.employer}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="flex flex-wrap gap-1.5">
        <Indicator icon={Star}  label="Primary Guardian"      active={isPrimary} />
        <Indicator icon={AlertCircle} label="Emergency Contact" active={isEmergencyContact} />
        <Indicator icon={Car}   label="Can Pickup"            active={canPickup} />
        <Indicator icon={Bell}  label="Receives Notifications" active={canReceiveNotifications} />
      </div>

      {/* Education/income if present */}
      {(guardian.education || guardian.annualIncome) && (
        <div
          className="mt-4 pt-4 flex gap-4 flex-wrap"
          style={{ borderTop: '1px solid #f0f2f4' }}
        >
          {guardian.education && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 2 }}>Education</p>
              <p style={{ fontSize: '13px', color: '#14181c' }}>{guardian.education}</p>
            </div>
          )}
          {guardian.annualIncome && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8a929b', marginBottom: 2 }}>Annual Income</p>
              <p style={{ fontSize: '13px', color: '#14181c' }}>
                ₹{guardian.annualIncome.toLocaleString('en-IN')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Parents tab ──────────────────────────────────────────────────────────────

export function ParentsTab({ studentId }: { studentId: string }) {
  const { data: guardians, isLoading } = useGuardians(studentId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e6e8eb] p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-3 mb-5">
              <Skeleton width={34} height={34} className="rounded-full flex-shrink-0" />
              <div>
                <Skeleton height={14} width={140} className="mb-1.5" />
                <Skeleton height={11} width={80} />
              </div>
            </div>
            <Skeleton height={12} width={160} className="mb-2" />
            <Skeleton height={12} width={200} className="mb-4" />
            <div className="flex gap-2">
              {[80, 110, 90, 130].map((w) => <Skeleton key={w} height={24} width={w} className="rounded-full" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!guardians || guardians.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e6e8eb] p-12" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <EmptyState
          icon={<Users size={24} />}
          title="No guardians linked"
          description="Add a parent or guardian using the Add Guardian button."
        />
      </div>
    );
  }

  // Primary first
  const sorted = [...guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {sorted.map((sg) => <GuardianCard key={sg.id} sg={sg} />)}
    </div>
  );
}
