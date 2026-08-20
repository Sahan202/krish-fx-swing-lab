import { redirect } from 'next/navigation';

export default function LegacyStudentManagementPage() {
  redirect(`${process.env.SUPER_ADMIN_PORTAL_URL ?? 'https://krish-fx-super-admin.vercel.app'}/students`);
}
