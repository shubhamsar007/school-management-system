import * as React from 'react';
import { NotificationSubNav } from './_components/notification-sub-nav';

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 min-h-full">
      <NotificationSubNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
