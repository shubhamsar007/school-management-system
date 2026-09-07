'use client';

import * as React from 'react';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Button, Spinner } from '@/components/ui';
import {
  useConfigOptions,
  useSeatConfigs,
  useCreateSeatConfig,
  useUpdateSeatConfig,
  useDeleteSeatConfig,
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
  type SeatConfig,
  type DocumentType,
} from '@/lib/hooks/use-admissions';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white">
      <div className="border-b border-[#f0ede4] px-5 py-4">
        <h3 className="text-sm font-semibold text-[#14181c]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#8a929b]">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? '#3f6152' : '#d1d5db' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ─── Seat Configuration Section ───────────────────────────────────────────────

function SeatRow({ config, onDelete }: { config: SeatConfig; onDelete: (id: string) => void }) {
  const update = useUpdateSeatConfig();
  const [editing, setEditing] = React.useState(false);
  const [total, setTotal] = React.useState(String(config.totalSeats));
  const [reserved, setReserved] = React.useState(String(config.reservedSeats));

  const available = config.totalSeats - config.reservedSeats - config.enrolledCount;
  const utilPct = config.totalSeats > 0
    ? Math.round((config.enrolledCount / config.totalSeats) * 100)
    : 0;

  const handleSave = () => {
    const t = parseInt(total, 10);
    const r = parseInt(reserved, 10);
    if (isNaN(t) || t < 1 || isNaN(r) || r < 0) return;
    update.mutate(
      { id: config.id, totalSeats: t, reservedSeats: r },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="flex items-center gap-4 border-b border-[#f4f1e9] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#14181c]">{config.className}</span>
          <span className="text-xs text-[#8a929b]">·</span>
          <span className="text-xs text-[#6b7480]">{config.academicYearName}</span>
        </div>
        {/* Utilisation bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#f4f1e9]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(utilPct, 100)}%`,
                background: utilPct >= 90 ? '#b96f4f' : utilPct >= 70 ? '#d4a96a' : '#3f6152',
              }}
            />
          </div>
          <span className="text-[11px] text-[#8a929b]">
            {config.enrolledCount} enrolled · {Math.max(available, 0)} available
          </span>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] text-[#8a929b]">Total</span>
            <input
              type="number"
              min={1}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="w-16 rounded border border-[#d4d9e1] px-2 py-1 text-xs focus:border-[#3f6152] focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] text-[#8a929b]">Reserved</span>
            <input
              type="number"
              min={0}
              value={reserved}
              onChange={(e) => setReserved(e.target.value)}
              className="w-16 rounded border border-[#d4d9e1] px-2 py-1 text-xs focus:border-[#3f6152] focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5 pt-4">
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="rounded bg-[#3f6152] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {update.isPending ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setTotal(String(config.totalSeats)); setReserved(String(config.reservedSeats)); }}
              className="rounded px-2 py-1 text-xs text-[#6b7480] hover:text-[#14181c]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-[#14181c]">{config.totalSeats}</div>
            <div className="text-[10px] text-[#8a929b]">total seats</div>
          </div>
          {config.reservedSeats > 0 && (
            <div className="text-right">
              <div className="text-sm font-semibold text-[#d4a96a]">{config.reservedSeats}</div>
              <div className="text-[10px] text-[#8a929b]">reserved</div>
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-[#2b5fa8] hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(config.id)}
            className="text-[#8a929b] transition-colors hover:text-[#b96f4f]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function SeatConfigSection() {
  const { data: configs = [], isLoading } = useSeatConfigs();
  const { data: options } = useConfigOptions();
  const create = useCreateSeatConfig();
  const deleteCfg = useDeleteSeatConfig();

  const [showAdd, setShowAdd] = React.useState(false);
  const [classId, setClassId] = React.useState('');
  const [yearId, setYearId] = React.useState('');
  const [totalSeats, setTotalSeats] = React.useState('');
  const [reservedSeats, setReservedSeats] = React.useState('0');
  const [addError, setAddError] = React.useState('');

  const handleAdd = () => {
    if (!classId || !yearId || !totalSeats) {
      setAddError('Class, academic year, and total seats are required.');
      return;
    }
    const total = parseInt(totalSeats, 10);
    const reserved = parseInt(reservedSeats, 10) || 0;
    if (isNaN(total) || total < 1) { setAddError('Total seats must be at least 1.'); return; }
    setAddError('');
    create.mutate(
      { classId, academicYearId: yearId, totalSeats: total, reservedSeats: reserved },
      {
        onSuccess: () => {
          setShowAdd(false);
          setClassId(''); setYearId(''); setTotalSeats(''); setReservedSeats('0');
        },
        onError: (err) => setAddError(err.message),
      },
    );
  };

  return (
    <SectionCard
      title="Seat Configuration"
      subtitle="Set capacity limits per class and academic year. Enrolled count is live from applications."
    >
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : configs.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-[#8a929b]">No seat configurations yet.</p>
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1" /> Add Configuration
          </Button>
        </div>
      ) : (
        <div>
          {configs.map((c) => (
            <SeatRow
              key={c.id}
              config={c}
              onDelete={(id) => deleteCfg.mutate(id)}
            />
          ))}
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#2b5fa8]"
            >
              <Plus size={13} /> Add configuration
            </button>
          )}
        </div>
      )}

      {showAdd && (
        <div className="mt-4 rounded-lg border border-[#e6e8eb] bg-[#fafafa] p-4">
          <p className="mb-3 text-xs font-semibold text-[#14181c]">New Seat Configuration</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded border border-[#d4d9e1] bg-white px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              >
                <option value="">Select class…</option>
                {options?.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Academic Year</label>
              <select
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className="w-full rounded border border-[#d4d9e1] bg-white px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              >
                <option value="">Select year…</option>
                {options?.academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Total Seats</label>
              <input
                type="number"
                min={1}
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                placeholder="e.g. 40"
                className="w-full rounded border border-[#d4d9e1] px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Reserved Seats</label>
              <input
                type="number"
                min={0}
                value={reservedSeats}
                onChange={(e) => setReservedSeats(e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded border border-[#d4d9e1] px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              />
            </div>
          </div>
          {addError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#b96f4f]">
              <AlertCircle size={12} /> {addError}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={handleAdd} disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setAddError(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Document Types Section ───────────────────────────────────────────────────

function DocumentTypeRow({ dt, onDelete }: { dt: DocumentType; onDelete: (id: string) => void }) {
  const update = useUpdateDocumentType();
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(dt.name);
  const [description, setDescription] = React.useState(dt.description ?? '');

  const handleToggleRequired = () =>
    update.mutate({ id: dt.id, isRequired: !dt.isRequired });

  const handleToggleActive = () =>
    update.mutate({ id: dt.id, isActive: !dt.isActive });

  const handleSaveName = () => {
    if (!name.trim()) return;
    const payload: Parameters<typeof update.mutate>[0] = { id: dt.id, name: name.trim() };
    if (description.trim()) payload.description = description.trim();
    update.mutate(payload, { onSuccess: () => setEditing(false) });
  };

  return (
    <div
      className="flex items-start gap-3 border-b border-[#f4f1e9] py-3 last:border-0"
      style={{ opacity: dt.isActive ? 1 : 0.5 }}
    >
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="space-y-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-[#d4d9e1] px-2.5 py-1 text-sm focus:border-[#3f6152] focus:outline-none"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded border border-[#d4d9e1] px-2.5 py-1 text-xs text-[#6b7480] focus:border-[#3f6152] focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleSaveName}
                disabled={update.isPending}
                className="rounded bg-[#3f6152] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                {update.isPending ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setName(dt.name); setDescription(dt.description ?? ''); }}
                className="rounded px-2 py-1 text-xs text-[#6b7480]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-[#14181c]">{dt.name}</span>
              {dt.isRequired && (
                <span className="rounded-full bg-[#f2e0d2] px-2 py-0.5 text-[10px] font-semibold text-[#8e5334]">
                  Required
                </span>
              )}
            </div>
            {dt.description && (
              <p className="mt-0.5 text-xs text-[#8a929b]">{dt.description}</p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-[#8a929b]">Required</span>
          <Toggle checked={dt.isRequired} onChange={handleToggleRequired} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-[#8a929b]">Active</span>
          <Toggle checked={dt.isActive} onChange={handleToggleActive} />
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-[#2b5fa8] hover:underline"
          >
            Edit
          </button>
        )}
        <button
          onClick={() => onDelete(dt.id)}
          className="text-[#8a929b] transition-colors hover:text-[#b96f4f]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function DocumentTypesSection() {
  const { data: types = [], isLoading } = useDocumentTypes();
  const create = useCreateDocumentType();
  const deleteDt = useDeleteDocumentType();

  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isRequired, setIsRequired] = React.useState(false);
  const [addError, setAddError] = React.useState('');

  const handleAdd = () => {
    if (!name.trim()) { setAddError('Name is required.'); return; }
    setAddError('');
    const payload: Parameters<typeof create.mutate>[0] = { name: name.trim(), isRequired };
    if (description.trim()) payload.description = description.trim();
    create.mutate(
      payload,
      {
        onSuccess: () => { setShowAdd(false); setName(''); setDescription(''); setIsRequired(false); },
        onError: (err) => setAddError(err.message),
      },
    );
  };

  return (
    <SectionCard
      title="Document Types"
      subtitle="Define which documents applicants must upload. Toggle Required to block approval until uploaded."
    >
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : types.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-[#8a929b]">No document types configured.</p>
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1" /> Add Document Type
          </Button>
        </div>
      ) : (
        <div>
          {types.map((dt) => (
            <DocumentTypeRow
              key={dt.id}
              dt={dt}
              onDelete={(id) => deleteDt.mutate(id)}
            />
          ))}
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#2b5fa8]"
            >
              <Plus size={13} /> Add document type
            </button>
          )}
        </div>
      )}

      {showAdd && (
        <div className="mt-4 rounded-lg border border-[#e6e8eb] bg-[#fafafa] p-4">
          <p className="mb-3 text-xs font-semibold text-[#14181c]">New Document Type</p>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Birth Certificate"
                className="w-full rounded border border-[#d4d9e1] px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[#6b7480]">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded border border-[#d4d9e1] px-2.5 py-1.5 text-sm focus:border-[#3f6152] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={isRequired} onChange={setIsRequired} />
              <span className="text-xs text-[#6b7480]">Required for approval</span>
            </div>
          </div>
          {addError && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#b96f4f]">
              <AlertCircle size={12} /> {addError}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button variant="primary" onClick={handleAdd} disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setAddError(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SettingsTab() {
  return (
    <div className="space-y-5">
      <SeatConfigSection />
      <DocumentTypesSection />
    </div>
  );
}
