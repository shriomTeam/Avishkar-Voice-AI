import { AuthenticatedWorkspace } from '@/components/authenticated-workspace';
import { requireAuth } from '@/lib/auth/server';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  return (
    <AuthenticatedWorkspace key={auth.user.id} initial={auth}>
      {children}
    </AuthenticatedWorkspace>
  );
}
