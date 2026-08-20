import Link from 'next/link';
import { serviceClient } from '@/lib/admin-audit';
import AdminManager from './admin-manager';
export const dynamic = 'force-dynamic';
export default async function AdminsPage() {
  const client = serviceClient(); const [{ data: profiles }, { data: permissions }, { data: users }] = await Promise.all([client.from('profiles').select('id,full_name,role').eq('role', 'admin'), client.from('admin_permissions').select('*'), client.auth.admin.listUsers({ perPage: 1000 })]);
  const permissionMap = new Map((permissions ?? []).map(item => [item.user_id, item])); const emailMap = new Map((users?.users ?? []).map(user => [user.id, user.email ?? null]));
  const admins = (profiles ?? []).map(profile => ({ id: profile.id, full_name: profile.full_name, email: emailMap.get(profile.id) ?? null, permissions: { manage_students: Boolean(permissionMap.get(profile.id)?.manage_students), manage_content: Boolean(permissionMap.get(profile.id)?.manage_content), manage_applications: Boolean(permissionMap.get(profile.id)?.manage_applications), view_reports: Boolean(permissionMap.get(profile.id)?.view_reports) } }));
  return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm text-blue-300">← Super Admin Dashboard</Link><p className="mt-8 text-sm font-bold uppercase tracking-[.2em] text-blue-400">Team access</p><h1 className="mt-2 text-4xl font-bold">Main Admin management</h1><p className="mt-3 max-w-2xl text-slate-400">Create Main Admin accounts, grant only the permissions they need, and review every action in the audit report.</p><AdminManager admins={admins} /></div></main>;
}
