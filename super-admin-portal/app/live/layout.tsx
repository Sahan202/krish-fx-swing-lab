import type { ReactNode } from 'react';
import { requirePortalPageAccess } from '@/lib/portal-page-access';
export default async function LiveLayout({children}:{children:ReactNode}){await requirePortalPageAccess({permission:'manage_content'});return children;}
