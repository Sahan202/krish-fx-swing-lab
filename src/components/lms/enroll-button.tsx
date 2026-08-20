'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function enroll() {
    setLoading(true); setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { error: enrollmentError } = await supabase.from('enrollments').insert({ student_id: user.id, course_id: courseId });
    if (enrollmentError && enrollmentError.code !== '23505') {
      setError('Could not enroll you right now. Please try again.'); setLoading(false); return;
    }
    setIsEnrolled(true);
    // Immediately retry protected lesson/video requests with the new enrollment.
    window.location.reload();
  }

  return <div className="text-right"><button onClick={enroll} disabled={isEnrolled || loading} className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f] disabled:cursor-not-allowed disabled:opacity-60">{isEnrolled ? 'Enrolled' : loading ? 'Enrolling…' : 'Enroll in course'}</button>{error && <p className="mt-2 text-xs text-rose-300">{error}</p>}</div>;
}
