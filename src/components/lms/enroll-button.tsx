'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const [isEnrolled, setIsEnrolled] = useState(enrolled); const [loading, setLoading] = useState(false); const router = useRouter();
  async function enroll() { setLoading(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (user) { const { error } = await supabase.from('enrollments').insert({ student_id: user.id, course_id: courseId }); if (!error) { setIsEnrolled(true); router.refresh(); } } setLoading(false); }
  return <button onClick={enroll} disabled={isEnrolled || loading} className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f] disabled:cursor-not-allowed disabled:opacity-60">{isEnrolled ? 'Enrolled' : loading ? 'Enrolling…' : 'Enroll in course'}</button>;
}
