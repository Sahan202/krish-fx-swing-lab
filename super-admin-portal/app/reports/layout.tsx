import type { ReactNode } from 'react';
import { requirePortalPageAccess } from '@/lib/portal-page-access';

export default async function ReportsLayout({ children }: { children: ReactNode }) {
  await requirePortalPageAccess({ permission: 'view_reports' });
  return children;
}
