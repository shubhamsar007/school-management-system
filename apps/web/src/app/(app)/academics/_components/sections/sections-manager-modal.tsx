'use client';

import * as React from 'react';
import { Modal, Button, Badge, Spinner } from '@/components/ui';
import { useSections } from '@/lib/hooks/use-academics';
import type { AcademicClass, Section } from '@/lib/types/academics';
import { AddSectionModal } from './add-section-modal';
import { EditSectionModal } from './edit-section-modal';
import { DeleteSectionDialog } from './delete-section-dialog';

interface SectionsManagerModalProps {
  open: boolean;
  onClose: () => void;
  cls: AcademicClass;
}

export function SectionsManagerModal({ open, onClose, cls }: SectionsManagerModalProps) {
  const { data: sections = [], isLoading } = useSections(open ? cls.id : null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Section | null>(null);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`${cls.name} — Sections`}
        description={`Manage sections for ${cls.name} · ${cls.code}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button variant="primary" onClick={() => setAddOpen(true)}>+ Add Section</Button>
          </>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : sections.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#8a929b',
              fontSize: 13,
            }}
          >
            <p style={{ marginBottom: 8 }}>No sections yet.</p>
            <p>Click <strong>+ Add Section</strong> to create the first section for {cls.name}.</p>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: '1fr 100px 80px 80px 100px',
                background: '#fbf9f3',
                borderRadius: '8px 8px 0 0',
                border: '1px solid #efece2',
                borderBottom: 'none',
              }}
            >
              {['SECTION', 'CAMPUS', 'CAPACITY', 'STUDENTS', 'ACTIONS'].map((h, i) => (
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
                    justifyContent: i === 4 ? 'flex-end' : 'flex-start',
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Table body */}
            <div style={{ border: '1px solid #efece2', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              {sections.map((section, idx) => {
                const students = section._count?.studentEnrollments ?? 0;
                const capacity = section.capacity ?? 0;
                const util = capacity > 0 ? Math.round((students / capacity) * 100) : 0;
                const nearCapacity = capacity > 0 && util >= 80;

                return (
                  <div
                    key={section.id}
                    className="grid"
                    style={{
                      gridTemplateColumns: '1fr 100px 80px 80px 100px',
                      minHeight: 48,
                      borderBottom: idx < sections.length - 1 ? '1px solid #f4f1e8' : 'none',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fbf9f3'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* Section name + code */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#14181c' }}>{section.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8a929b' }}>{section.code}</span>
                      {nearCapacity && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#8e5334', background: '#f2e0d2', padding: '1px 6px', borderRadius: 10 }}>
                          Near Full
                        </span>
                      )}
                    </div>

                    {/* Campus */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: '#6b7480' }}>
                      {section.campus?.name ?? '—'}
                    </div>

                    {/* Capacity */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: '#2c322f' }}>
                      {section.capacity ?? '—'}
                    </div>

                    {/* Students */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: '#2c322f' }}>
                      {students}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 12px', gap: 8, fontSize: 12, fontWeight: 500, color: '#2b5fa8' }}>
                      <button
                        className="hover:underline cursor-pointer"
                        onClick={() => setEditTarget(section)}
                      >
                        Edit
                      </button>
                      <span style={{ color: '#d7dce1' }}>|</span>
                      <button
                        className="hover:underline cursor-pointer text-[#b3261e]"
                        onClick={() => setDeleteTarget(section)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 11, color: '#8a929b', marginTop: 12 }}>
              {sections.length} section{sections.length !== 1 ? 's' : ''} · Status badges reflect current enrolment vs capacity
            </p>
          </div>
        )}
      </Modal>

      <AddSectionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classId={cls.id}
        className={cls.name}
      />

      {editTarget && (
        <EditSectionModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          classId={cls.id}
          section={editTarget}
        />
      )}

      {deleteTarget && (
        <DeleteSectionDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          classId={cls.id}
          section={deleteTarget}
        />
      )}
    </>
  );
}
