import { AppShell } from '@/components/layouts/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
