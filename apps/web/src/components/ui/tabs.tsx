'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn('flex items-center overflow-x-auto', className)}
      role="tablist"
      style={{
        background: '#f5f2e8',
        border: '1px solid #ded9cc',
        borderRadius: 12,
        padding: '0 6px',
        height: 38,
        gap: 2,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 whitespace-nowrap outline-none transition-colors"
            style={{
              height: 30,
              padding: '0 11px',
              borderRadius: 8,
              fontSize: '12.5px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#2c322f' : '#6d746e',
              background: isActive ? '#fffdf8' : 'transparent',
              border: isActive ? '1px solid #e6e1d5' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 2px rgba(44,50,47,0.06)' : 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="inline-flex items-center justify-center"
                style={{
                  minWidth: 17,
                  height: 16,
                  padding: '0 5px',
                  borderRadius: 8,
                  background: isActive ? '#dbe8dc' : '#ede9df',
                  color: isActive ? '#33604a' : '#8d938d',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
