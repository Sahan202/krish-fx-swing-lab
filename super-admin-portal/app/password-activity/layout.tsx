import type { ReactNode } from 'react';
import { requirePortalPageAccess } from '@/lib/portal-page-access';

export default async function PasswordActivityLayout({ children }: { children: ReactNode }) {
  await requirePortalPageAccess({ superAdminOnly: true });
  return children;
}
