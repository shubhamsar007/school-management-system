import * as React from 'react';
import { PayrollSubNav } from './_components/payroll-sub-nav';

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 min-h-full">
      <PayrollSubNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
