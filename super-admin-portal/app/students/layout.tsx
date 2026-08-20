import type { ReactNode } from 'react';
import { requirePortalPageAccess } from '@/lib/portal-page-access';

export default async function StudentsLayout({ children }: { children: ReactNode }) {
  await requirePortalPageAccess({ permission: 'manage_students' });
  return children;
}
