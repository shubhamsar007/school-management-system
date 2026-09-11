'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { useMyPreferences, useUpdateMyPreferences } from '@/lib/hooks/use-comms';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: { key: keyof ChannelPrefs; label: string; description: string; icon: string }[] = [
  { key: 'inAppEnabled', label: 'In-App', description: 'Notifications inside the ERP', icon: '🔔' },
  { key: 'emailEnabled', label: 'Email', description: 'Sent to your registered email address', icon: '✉️' },
  { key: 'smsEnabled', label: 'SMS', description: 'Text message to your mobile number', icon: '💬' },
  { key: 'whatsappEnabled', label: 'WhatsApp', description: 'Message on WhatsApp', icon: '📱' },
  { key: 'pushEnabled', label: 'Push', description: 'Browser and mobile push notifications', icon: '📲' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
];

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'EXAMINATION', label: 'Examinations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'ADMISSIONS', label: 'Admissions' },
  { value: 'HR', label: 'HR & Leave' },
  { value: 'SUBSTITUTION', label: 'Substitutions' },
  { value: 'ANNOUNCEMENT', label: 'Announcements' },
  { value: 'PTM', label: 'Parent-Teacher Meetings' },
  { value: 'GENERAL', label: 'General' },
];

interface ChannelPrefs {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-[#1a1d23]' : 'bg-[#d1d5db]'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e6e8eb] bg-[#f9fafb]">
        <p className="text-sm font-semibold text-[#1a1d23]">{title}</p>
        {description && <p className="text-xs text-[#8a929b] mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const { data: prefs, isLoading } = useMyPreferences();
  const update = useUpdateMyPreferences();

  const [saved, setSaved] = React.useState(false);

  // Local draft — edited freely, saved on button click
  const [draft, setDraft] = React.useState<{
    inAppEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    pushEnabled: boolean;
    language: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    quietDays: string[];
    mutedCategories: string[];
  } | null>(null);

  // Initialise draft when preferences load
  React.useEffect(() => {
    if (prefs && !draft) {
      setDraft({
        inAppEnabled: prefs.inAppEnabled,
        emailEnabled: prefs.emailEnabled,
        smsEnabled: prefs.smsEnabled,
        whatsappEnabled: prefs.whatsappEnabled,
        pushEnabled: prefs.pushEnabled,
        language: prefs.language,
        quietHoursEnabled: prefs.quietHoursEnabled,
        quietHoursStart: prefs.quietHoursStart ?? '22:00',
        quietHoursEnd: prefs.quietHoursEnd ?? '07:00',
        quietDays: prefs.quietDays,
        mutedCategories: prefs.mutedCategories,
      });
    }
  }, [prefs, draft]);

  async function handleSave() {
    if (!draft) return;
    await update.mutateAsync({
      ...draft,
      quietHoursStart: draft.quietHoursEnabled ? draft.quietHoursStart : null,
      quietHoursEnd: draft.quietHoursEnabled ? draft.quietHoursEnd : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  type DraftState = NonNullable<typeof draft>;
  function set<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setDraft((d) => d ? { ...d, [key]: value } : d);
  }

  function toggleDay(day: string) {
    setDraft((d) => {
      if (!d) return d;
      const days = d.quietDays.includes(day)
        ? d.quietDays.filter((dd) => dd !== day)
        : [...d.quietDays, day];
      return { ...d, quietDays: days };
    });
  }

  function toggleCategory(cat: string) {
    setDraft((d) => {
      if (!d) return d;
      const muted = d.mutedCategories.includes(cat)
        ? d.mutedCategories.filter((c) => c !== cat)
        : [...d.mutedCategories, cat];
      return { ...d, mutedCategories: muted };
    });
  }

  if (isLoading || !draft) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Preferences" subtitle="Per-user channel opt-in, language, and quiet hours" />
        <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">
          Loading preferences…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preferences"
        subtitle="Control how and when you receive notifications"
        actions={
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33] disabled:opacity-50"
          >
            {update.isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Preferences'}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Channel Opt-Ins */}
        <Section
          title="Delivery Channels"
          description="Choose which channels you receive notifications through"
        >
          <div className="flex flex-col divide-y divide-[#f0f2f5]">
            {CHANNELS.map((ch) => (
              <div key={ch.key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 18 }}>{ch.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[#1a1d23]">{ch.label}</p>
                    <p className="text-xs text-[#8a929b]">{ch.description}</p>
                  </div>
                </div>
                <Toggle
                  checked={draft[ch.key] as boolean}
                  onChange={(v) => set(ch.key, v)}
                  // IN_APP cannot be fully disabled — it's the fallback
                  disabled={ch.key === 'inAppEnabled'}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8a929b] mt-3 pt-3 border-t border-[#f0f2f5]">
            In-App notifications cannot be disabled — they are the always-available fallback channel.
          </p>
        </Section>

        {/* Language */}
        <Section
          title="Language Preference"
          description="Notifications will be sent in your preferred language when templates are available"
        >
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                type="button"
                onClick={() => set('language', lang.value)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                  draft.language === lang.value
                    ? 'bg-[#1a1d23] text-white border-[#1a1d23]'
                    : 'bg-white text-[#4a5260] border-[#e6e8eb] hover:border-[#1a1d23]'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Quiet Hours */}
        <Section
          title="Quiet Hours"
          description="Pause non-urgent notifications during specific times"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1a1d23]">Enable Quiet Hours</p>
                <p className="text-xs text-[#8a929b]">URGENT and SYSTEM alerts always bypass quiet hours</p>
              </div>
              <Toggle
                checked={draft.quietHoursEnabled}
                onChange={(v) => set('quietHoursEnabled', v)}
              />
            </div>

            {draft.quietHoursEnabled && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#4a5260]">Starts at</label>
                    <input
                      type="time"
                      value={draft.quietHoursStart}
                      onChange={(e) => set('quietHoursStart', e.target.value)}
                      className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#4a5260]">Ends at</label>
                    <input
                      type="time"
                      value={draft.quietHoursEnd}
                      onChange={(e) => set('quietHoursEnd', e.target.value)}
                      className="border border-[#e6e8eb] rounded-lg px-3 py-2 text-sm text-[#1a1d23] focus:outline-none focus:ring-2 focus:ring-[#1a1d23]/10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-[#4a5260]">Also quiet on</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          draft.quietDays.includes(day)
                            ? 'bg-[#1a1d23] text-white border-[#1a1d23]'
                            : 'bg-white text-[#4a5260] border-[#e6e8eb] hover:border-[#1a1d23]'
                        }`}
                      >
                        {DAY_SHORT[day]}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Category Mutes */}
        <Section
          title="Category Preferences"
          description="Mute entire notification categories. URGENT and SYSTEM cannot be muted."
        >
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((cat) => {
              const isMuted = draft.mutedCategories.includes(cat.value);
              return (
                <div key={cat.value} className="flex items-center justify-between py-1.5">
                  <p className={`text-sm ${isMuted ? 'line-through text-[#8a929b]' : 'text-[#1a1d23]'}`}>
                    {cat.label}
                  </p>
                  <div className="flex items-center gap-2">
                    {isMuted && (
                      <span className="text-xs text-[#8a929b] bg-[#f0f2f5] px-1.5 py-0.5 rounded">Muted</span>
                    )}
                    <Toggle
                      checked={!isMuted}
                      onChange={() => toggleCategory(cat.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0f2f5] rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <p className="text-xs text-amber-700">
              URGENT and SYSTEM category notifications are mandated by your school and cannot be muted.
            </p>
          </div>
        </Section>

      </div>

      {/* Bottom save bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-xl border border-[#e6e8eb] bg-white">
        <p className="text-xs text-[#8a929b]">
          Changes take effect immediately for new notifications. Existing notifications are not affected.
        </p>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="px-4 py-2 bg-[#1a1d23] text-white text-sm rounded-lg hover:bg-[#2a2d33] disabled:opacity-50"
        >
          {update.isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
