import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serviceClient, type Permission } from './admin-audit';

type PortalPermissions = Record<Permission, boolean>;

const noPermissions: PortalPermissions = {
  manage_students: false,
  manage_content: false,
  manage_applications: false,
  view_reports: false,
};

/**
 * Server-component authorization guard. This runs before any service-role
 * query, so protected page data is never rendered for an unauthenticated user.
 */
export async function requirePortalPageAccess(options: {
  permission?: Permission;
  superAdminOnly?: boolean;
} = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Portal authentication is not configured.');

  const cookieStore = await cookies();
  const auth = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Server components only verify an existing session; refreshes are handled
      // by the browser and do not need to write cookies while rendering.
      setAll: (_items: { name: string; value: string; options: CookieOptions }[]) => {},
    },
  });
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect('/login');

  const client = serviceClient();
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role;
  if (role !== 'admin' && role !== 'super_admin') redirect('/login?reason=not-authorized');
  if (options.superAdminOnly && role !== 'super_admin') redirect('/dashboard?reason=access-denied');

  let permissions = noPermissions;
  if (role === 'super_admin') {
    permissions = {
      manage_students: true,
      manage_content: true,
      manage_applications: true,
      view_reports: true,
    };
  } else {
    const { data } = await client
      .from('admin_permissions')
      .select('manage_students,manage_content,manage_applications,view_reports')
      .eq('user_id', user.id)
      .maybeSingle();
    permissions = { ...noPermissions, ...(data ?? {}) };
  }

  if (options.permission && !permissions[options.permission]) {
    redirect('/dashboard?reason=access-denied');
  }

  return { user, role, permissions };
}
