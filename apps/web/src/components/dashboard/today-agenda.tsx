'use client';

import * as React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgendaItem {
  time: string;
  color: string;
  title: string;
  where: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TodayAgenda({ items, borderColor = '#ccc5df' }: { items: AgendaItem[]; borderColor?: string }) {
  return (
    <div>
      {items.map((ag, i) => (
        <div
          key={i}
          className="flex gap-3"
          style={{
            padding: '8px 0',
            borderBottom: i < items.length - 1 ? `1px solid ${borderColor}` : 'none',
          }}
        >
          {/* Time */}
          <div style={{
            width: 42, flexShrink: 0,
            fontSize: 11, color: '#8d93a2',
            fontVariantNumeric: 'tabular-nums', paddingTop: 2,
          }}>
            {ag.time}
          </div>

          {/* Color bar */}
          <div style={{
            width: 3, flexShrink: 0,
            borderRadius: 2,
            background: ag.color,
            alignSelf: 'stretch',
          }} />

          {/* Content */}
          <div className="min-w-0">
            <div style={{ fontSize: 12.5, fontWeight: 500, color: '#2c322f', lineHeight: 1.3 }}>
              {ag.title}
            </div>
            <div style={{ fontSize: 11, color: '#8d938d', marginTop: 1 }}>{ag.where}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
