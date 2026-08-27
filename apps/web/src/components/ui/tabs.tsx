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
      className={cn('flex items-center border-b border-[#e6e8eb]', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors whitespace-nowrap outline-none',
              isActive
                ? 'font-semibold text-[#2b5fa8]'
                : 'font-normal text-[#6b7480] hover:text-[#14181c]',
            )}
            style={{ marginBottom: '-1px' }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  fontSize: '11px',
                  color: '#6b7480',
                  background: '#f2f4f6',
                  padding: '0 6px',
                  minWidth: '18px',
                  height: '18px',
                  lineHeight: '18px',
                }}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  background: '#2b5fa8',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Tabs };
