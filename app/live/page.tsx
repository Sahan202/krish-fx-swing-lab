import { redirect } from 'next/navigation';
import LiveClassroom from '@/components/lms/live-classroom';
import { createClient } from '@/lib/supabase/server';
export default async function LivePage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); return <LiveClassroom />; }
