import type { ReactNode } from 'react';
import { requirePortalPageAccess } from '@/lib/portal-page-access';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requirePortalPageAccess();
  return children;
}
