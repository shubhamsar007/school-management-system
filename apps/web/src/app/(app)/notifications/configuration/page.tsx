'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  useProviderConfigs,
  useUpsertProviderConfig,
  type NotificationProviderConfig,
} from '@/lib/hooks/use-comms';

// ─── Provider catalogue ───────────────────────────────────────────────────────

const PROVIDER_CATALOGUE: Record<string, {
  label: string;
  icon: string;
  providers: { value: string; label: string; description: string }[];
}> = {
  EMAIL: {
    label: 'Email',
    icon: '✉️',
    providers: [
      { value: 'sendgrid', label: 'SendGrid', description: 'Transactional email via SendGrid API' },
      { value: 'ses', label: 'AWS SES', description: 'Amazon Simple Email Service' },
      { value: 'smtp', label: 'SMTP', description: 'Generic SMTP server' },
    ],
  },
  SMS: {
    label: 'SMS',
    icon: '💬',
    providers: [
      { value: 'twilio', label: 'Twilio', description: 'SMS via Twilio Programmable Messaging' },
      { value: 'msg91', label: 'MSG91', description: 'SMS via MSG91 (India-focused)' },
      { value: 'exotel', label: 'Exotel', description: 'SMS via Exotel' },
    ],
  },
  WHATSAPP: {
    label: 'WhatsApp',
    icon: '📱',
    providers: [
      { value: 'wati', label: 'WATI', description: 'WhatsApp for Teams via WATI' },
      { value: 'meta', label: 'Meta Cloud API', description: 'Official WhatsApp Business Cloud API' },
    ],
  },
  PUSH: {
    label: 'Push',
    icon: '🔔',
    providers: [
      { value: 'fcm', label: 'Firebase FCM', description: 'Push to Android & iOS via Firebase' },
      { value: 'apns', label: 'APNs', description: 'Direct Apple Push Notification service' },
    ],
  },
};

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  channel,
  info,
  configs,
  onToggle,
}: {
  channel: string;
  info: typeof PROVIDER_CATALOGUE[string];
  configs: NotificationProviderConfig[];
  onToggle: (providerName: string, isEnabled: boolean, priority: number) => void;
}) {
  const configMap = Object.fromEntries(configs.filter((c) => c.channel === channel).map((c) => [c.providerName, c]));

  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
      {/* Channel header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e6e8eb] bg-[#f9fafb]">
        <span style={{ fontSize: 20 }}>{info.icon}</span>
        <div>
          <p className="text-sm font-semibold text-[#1a1d23]">{info.label}</p>
          <p className="text-xs text-[#8a929b]">{info.providers.length} provider{info.providers.length > 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Provider rows */}
      <div className="divide-y divide-[#f0f2f5]">
        {info.providers.map((provider, idx) => {
          const config = configMap[provider.value];
          const isEnabled = config?.isEnabled ?? false;

          return (
            <div key={provider.value} className="flex items-center justify-between px-5 py-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-[#1a1d23]">{provider.label}</p>
                <p className="text-xs text-[#8a929b]">{provider.description}</p>
                {isEnabled && (
                  <span className="text-[10px] text-[#166534] bg-[#e8fdf0] px-1.5 py-0.5 rounded-full w-fit mt-0.5">
                    Priority {config?.priority ?? idx + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isEnabled && (
                  <span className="text-xs text-[#166534] font-medium">Active</span>
                )}
                <button
                  onClick={() => onToggle(provider.value, !isEnabled, (config?.priority ?? idx + 1))}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${isEnabled ? 'bg-[#1a1d23]' : 'bg-[#d1d5db]'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${isEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Delivery Policy Panel ────────────────────────────────────────────────────

function DeliveryPolicyPanel() {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e6e8eb] bg-[#f9fafb]">
        <span style={{ fontSize: 20 }}>🔄</span>
        <div>
          <p className="text-sm font-semibold text-[#1a1d23]">Delivery Policies</p>
          <p className="text-xs text-[#8a929b]">Retry and fallback behaviour</p>
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">
        {[
          {
            label: 'Retry Attempts',
            value: '3',
            note: 'Maximum retries before marking permanently failed',
          },
          {
            label: 'Backoff Schedule',
            value: '30s → 2min → 10min',
            note: 'Exponential delay between retry attempts',
          },
          {
            label: 'Channel Fallback',
            value: 'WhatsApp → SMS → In-App',
            note: 'Fallback chain when primary channel fails (Phase 7)',
          },
          {
            label: 'Idempotency Window',
            value: '24 hours',
            note: 'Prevents duplicate notifications for the same event per day',
          },
          {
            label: 'Retry Job Interval',
            value: 'Every 60 seconds',
            note: 'Background cron that re-dispatches due retries',
          },
        ].map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-[#1a1d23]">{row.label}</p>
              <p className="text-xs text-[#8a929b]">{row.note}</p>
            </div>
            <span className="text-sm font-mono text-[#4a5260] shrink-0 bg-[#f0f2f5] px-2 py-1 rounded">
              {row.value}
            </span>
          </div>
        ))}
        <p className="text-xs text-[#8a929b] pt-2 border-t border-[#f0f2f5]">
          Retry parameters are currently fixed. Configurable overrides come in Phase 7.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationConfigurationPage() {
  const { data: configs = [], isLoading } = useProviderConfigs();
  const upsert = useUpsertProviderConfig();

  function handleToggle(channel: string, providerName: string, isEnabled: boolean, priority: number) {
    upsert.mutate({ channel, providerName, isEnabled, priority });
  }

  const enabledCount = configs.filter((c) => c.isEnabled).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuration"
        subtitle="Provider setup, channel credentials, and delivery policies"
      />

      {/* Summary */}
      <div className="flex gap-3">
        {[
          { label: 'Active Providers', value: enabledCount, color: 'bg-[#e8fdf0] text-[#166534]' },
          { label: 'Configured Channels', value: new Set(configs.map((c) => c.channel)).size, color: 'bg-[#e8f4fd] text-[#1a6fa6]' },
        ].map((c) => (
          <div key={c.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${c.color}`}>
            <span>{c.label}:</span>
            <span className="font-semibold">{c.value}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-sm text-[#8a929b]">
          Loading provider configuration…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(PROVIDER_CATALOGUE).map(([channel, info]) => (
            <ProviderCard
              key={channel}
              channel={channel}
              info={info}
              configs={configs}
              onToggle={(providerName, isEnabled, priority) =>
                handleToggle(channel, providerName, isEnabled, priority)
              }
            />
          ))}
          <div className="lg:col-span-2">
            <DeliveryPolicyPanel />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-medium text-amber-800">Credential management</p>
        <p className="text-xs text-amber-700 mt-1">
          Provider API keys and credentials are managed via environment variables on the server.
          Toggle providers on/off here — credentials are configured by your system administrator
          in the server environment. Never enter API keys in this UI.
        </p>
      </div>
    </div>
  );
}
