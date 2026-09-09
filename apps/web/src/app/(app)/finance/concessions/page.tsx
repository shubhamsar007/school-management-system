'use client';

import * as React from 'react';
import { PageHeader } from '@/components/layouts/page-header';
import { EmptyState } from '@/components/ui';

export default function ConcessionsPage() {
  return (
    <div>
      <PageHeader
        title="Concessions & Scholarships"
        subtitle="Manage student concessions, waivers, and scholarships"
      />

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: '#fff8e6',
          border: '1px solid #ffe8a0',
          fontSize: 13,
          color: '#7a5700',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>🚧</span>
        <span>Concessions module is coming in the next release.</span>
      </div>

      <EmptyState
        title="Concessions & Scholarships — Coming Soon"
        description="This module will allow you to manage fee waivers, discounts, and scholarships with a built-in approval workflow."
      />

      {/* Feature preview */}
      <div
        style={{
          marginTop: 32,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        {[
          {
            title: 'Discount Requests',
            description:
              'Students or parents can request fee discounts that go through an approval workflow.',
          },
          {
            title: 'Scholarships',
            description:
              'Define merit, need-based, sports, sibling, staff, and government scholarships.',
          },
          {
            title: 'Fee Waivers',
            description:
              'Grant full or partial waivers on specific fee heads for eligible students.',
          },
          {
            title: 'Approval Workflow',
            description:
              'Multi-level approval chain: requested → approved → applied to invoice.',
          },
          {
            title: 'Concession Reports',
            description:
              'View total concessions granted by type, class, or academic year.',
          },
          {
            title: 'Audit Trail',
            description:
              'Full history of every concession decision with approver details and timestamps.',
          },
        ].map(({ title, description }) => (
          <div
            key={title}
            style={{
              background: '#fffdf8',
              border: '1px solid #e6e1d5',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#2c322f',
                marginBottom: 6,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 12, color: '#6d746e', lineHeight: 1.5 }}>{description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
