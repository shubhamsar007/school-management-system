'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import {
  usePools,
  useCreatePool,
  useUpdatePool,
  useDeletePool,
  usePoolMembers,
  useAddPoolMember,
  useRemovePoolMember,
} from '@/lib/substitution-api';
import type { SubstitutePool, SubstitutePoolMember } from '@/lib/substitution-api';
import { Plus, Pencil, Trash2, Users, UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';

// ─── Create / Edit Pool modal ─────────────────────────────────────────────────

function PoolModal({
  pool,
  onClose,
}: {
  pool?: SubstitutePool;
  onClose: () => void;
}) {
  const create = useCreatePool();
  const update = useUpdatePool();
  const [name, setName]           = React.useState(pool?.name ?? '');
  const [description, setDesc]    = React.useState(pool?.description ?? '');
  const [isActive, setIsActive]   = React.useState(pool?.isActive ?? true);
  const [bonusPts, setBonusPts]   = React.useState(pool?.poolBonusPts ?? 5);
  const [error, setError]         = React.useState('');

  const isEditing = !!pool;
  const isPending = create.isPending || update.isPending;

  const handleSubmit = () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    const dto = { name: name.trim(), description: description.trim() || null, isActive, poolBonusPts: bonusPts };
    if (isEditing) {
      update.mutate({ id: pool.id, ...dto } as any, { onSuccess: onClose, onError: (e: Error) => setError(e.message) });
    } else {
      create.mutate(dto as any, { onSuccess: onClose, onError: (e: Error) => setError(e.message) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="rounded-2xl bg-white shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-[#14181c] mb-4">{isEditing ? 'Edit Pool' : 'Create Pool'}</h2>

        <label className="block text-xs font-medium text-[#4a5260] mb-1">Pool name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Science Substitutes"
          className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8] mb-3"
        />

        <label className="block text-xs font-medium text-[#4a5260] mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Optional description…"
          rows={2}
          className="w-full rounded-lg border border-[#e6e8eb] px-3 py-2 text-sm outline-none focus:border-[#2b5fa8] resize-none mb-3"
        />

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium text-[#4a5260]">Scoring bonus</p>
            <p className="text-xs text-[#6b7480]">Extra pts for pool members</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bonusPts}
              onChange={(e) => setBonusPts(Number(e.target.value))}
              min={0}
              max={20}
              className="w-16 rounded-lg border border-[#e6e8eb] px-2 py-1.5 text-sm text-right outline-none focus:border-[#2b5fa8]"
            />
            <span className="text-xs text-[#6b7480]">pts</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[#4a5260]">Active</span>
          <button
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive(!isActive)}
            className="relative inline-flex items-center rounded-full transition-colors"
            style={{ width: 36, height: 20, background: isActive ? '#2b5fa8' : '#d1d5db' }}
          >
            <span
              className="inline-block rounded-full bg-white transition-transform"
              style={{ width: 16, height: 16, transform: isActive ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {error && <p className="text-xs text-[#b3261e] mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[#e6e8eb] text-[#4a5260] hover:bg-[#f4f1e9]">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#2b5fa8] disabled:opacity-50"
          >
            {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Pool'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pool members panel ───────────────────────────────────────────────────────

function PoolMembersPanel({ pool }: { pool: SubstitutePool }) {
  const { data: members, isLoading } = usePoolMembers(pool.id);
  const addMember    = useAddPoolMember();
  const removeMember = useRemovePoolMember();
  const [employeeId, setEmployeeId] = React.useState('');
  const [addError, setAddError]     = React.useState('');

  const handleAdd = () => {
    const trimmed = employeeId.trim();
    if (!trimmed) return;
    setAddError('');
    addMember.mutate(
      { poolId: pool.id, employeeId: trimmed },
      {
        onSuccess: () => setEmployeeId(''),
        onError: (e: Error) => setAddError(e.message),
      },
    );
  };

  return (
    <div className="border-t border-[#f3f4f6] px-5 py-4 bg-[#fafbfc]">
      {/* Add member */}
      <div className="flex gap-2 mb-3">
        <input
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Employee ID to add…"
          className="flex-1 rounded-lg border border-[#e6e8eb] px-3 py-1.5 text-sm outline-none focus:border-[#2b5fa8] bg-white"
        />
        <button
          onClick={handleAdd}
          disabled={addMember.isPending || !employeeId.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2b5fa8] disabled:opacity-50"
        >
          <UserPlus size={12} />
          Add
        </button>
      </div>
      {addError && <p className="text-xs text-[#b3261e] mb-2">{addError}</p>}

      {/* Member list */}
      {isLoading ? (
        <p className="text-xs text-[#8a929b] py-2">Loading members…</p>
      ) : !members || members.length === 0 ? (
        <p className="text-xs text-[#8a929b] py-2">No members yet. Add an employee ID above.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {(members as SubstitutePoolMember[]).map((m) => {
            const name = m.employee
              ? `${m.employee.person.firstName} ${m.employee.person.lastName}`
              : m.employeeId;
            return (
              <div key={m.employeeId} className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2 border border-[#e6e8eb]">
                <Avatar name={name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#14181c] truncate">{name}</p>
                  {m.employee?.department && (
                    <p className="text-xs text-[#6b7480]">{m.employee.department.name}</p>
                  )}
                </div>
                <button
                  onClick={() => removeMember.mutate({ poolId: pool.id, employeeId: m.employeeId })}
                  disabled={removeMember.isPending}
                  className="p-1 rounded hover:bg-[#fee2e2] text-[#6b7480] hover:text-[#b3261e]"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pool card ────────────────────────────────────────────────────────────────

function PoolCard({ pool, onEdit }: { pool: SubstitutePool; onEdit: (p: SubstitutePool) => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const deletePool = useDeletePool();

  return (
    <div className="rounded-xl border border-[#e6e8eb] bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3">
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{ width: 40, height: 40, background: pool.isActive ? '#eff6ff' : '#f4f4f4' }}
        >
          <Users size={18} color={pool.isActive ? '#2b5fa8' : '#9ca3af'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#14181c]">{pool.name}</span>
            <Badge variant={pool.isActive ? 'active' : 'left'}>{pool.isActive ? 'Active' : 'Inactive'}</Badge>
            <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: '#dcfce7', color: '#146b41' }}>
              +{pool.poolBonusPts} pts bonus
            </span>
          </div>
          {pool.description && <p className="text-xs text-[#6b7480] mt-0.5 truncate">{pool.description}</p>}
          <p className="text-xs text-[#8a929b] mt-0.5">{pool.memberCount ?? 0} member{(pool.memberCount ?? 0) !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(pool)}
            className="p-1.5 rounded-lg hover:bg-[#f4f1e9] text-[#6b7480]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deletePool.mutate(pool.id)}
            disabled={deletePool.isPending}
            className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#6b7480] hover:text-[#b3261e]"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[#f4f1e9] text-[#6b7480]"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && <PoolMembersPanel pool={pool} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoolsPage() {
  const { data: pools, isLoading, isError } = usePools();
  const [showCreate, setShowCreate]   = React.useState(false);
  const [editTarget, setEditTarget]   = React.useState<SubstitutePool | null>(null);

  const active   = (pools ?? []).filter((p) => p.isActive);
  const inactive = (pools ?? []).filter((p) => !p.isActive);

  return (
    <div>
      <PageHeader
        title="Substitute Pools"
        subtitle="Group pre-approved substitutes · Pool members receive a scoring bonus"
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2b5fa8]"
          >
            <Plus size={14} />
            New Pool
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-sm text-[#8a929b]">Loading pools…</div>
      )}
      {isError && (
        <div className="flex items-center justify-center py-20 text-sm text-[#b3261e]">Failed to load pools.</div>
      )}

      {pools && pools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Users size={36} color="#d1d5db" />
          <p className="text-sm text-[#8a929b]">No pools yet. Create one to group pre-approved substitutes.</p>
          <button onClick={() => setShowCreate(true)} className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#2b5fa8]">
            Create First Pool
          </button>
        </div>
      )}

      {pools && pools.length > 0 && (
        <div className="flex flex-col gap-4">
          {active.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b7480] mb-2">Active pools ({active.length})</p>
              <div className="flex flex-col gap-3">
                {active.map((p) => (
                  <PoolCard key={p.id} pool={p} onEdit={setEditTarget} />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b7480] mb-2">Inactive pools ({inactive.length})</p>
              <div className="flex flex-col gap-3">
                {inactive.map((p) => (
                  <PoolCard key={p.id} pool={p} onEdit={setEditTarget} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && <PoolModal onClose={() => setShowCreate(false)} />}
      {editTarget && <PoolModal pool={editTarget} onClose={() => setEditTarget(null)} />}
    </div>
  );
}
