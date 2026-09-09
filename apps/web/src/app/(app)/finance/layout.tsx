import * as React from 'react';
import { FinanceSubNav } from './_components/finance-sub-nav';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 min-h-full">
      <FinanceSubNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
