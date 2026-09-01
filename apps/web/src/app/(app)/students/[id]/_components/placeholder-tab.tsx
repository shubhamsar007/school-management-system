'use client';

import * as React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderTabProps {
  title: string;
  description?: string;
}

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d5d0c5] bg-[#fafaf8] py-24 px-8 text-center"
    >
      <div
        className="flex items-center justify-center mb-4 rounded-2xl"
        style={{ width: 56, height: 56, background: '#f0ede5', color: '#8d938d' }}
      >
        <Construction size={24} />
      </div>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#2c322f', marginBottom: 6 }}>
        {title}
      </p>
      <p style={{ fontSize: '13px', color: '#8d938d', maxWidth: 340 }}>
        {description ?? `The ${title} section is part of a dedicated module and will be available in an upcoming release.`}
      </p>
    </div>
  );
}
