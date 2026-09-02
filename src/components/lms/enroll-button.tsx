'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEnrollmentGuide, setShowEnrollmentGuide] = useState(false);
  const router = useRouter();

  const guideKey = `krish-enrollment-guide-seen-${courseId}`;

  useEffect(() => {
    if (!enrolled && !window.localStorage.getItem(guideKey)) {
      setShowEnrollmentGuide(true);
      window.localStorage.setItem(guideKey, 'true');
    }
  }, [enrolled, guideKey]);

  function dismissGuide() {
    setShowEnrollmentGuide(false);
  }

  async function enroll() {
    setShowEnrollmentGuide(false);
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

  return <div className="relative text-right">{showEnrollmentGuide && !isEnrolled && <div className="fixed inset-0 z-40 grid place-items-center p-4 sm:p-6"><div aria-hidden="true" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" /><div role="dialog" aria-modal="true" aria-labelledby="enrollment-guide-title" className="relative w-full max-w-sm rounded-2xl border border-cyan-300/25 bg-[#0b1b31] p-5 text-left shadow-2xl shadow-black/40 sm:p-6"><p id="enrollment-guide-title" className="!text-sm !font-bold !text-white">Start your course here</p><p className="!mt-1 !text-xs !leading-5 !text-slate-300">Click the Enroll in course button to activate your lesson access.</p><button type="button" onClick={dismissGuide} className="!mt-4 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 !text-xs !font-bold !text-cyan-200">Got it</button></div></div>}<button onClick={enroll} disabled={isEnrolled || loading} className="rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f] disabled:cursor-not-allowed disabled:opacity-60">{isEnrolled ? 'Enrolled' : loading ? 'Enrolling\u2026' : 'Enroll in course'}</button>{error && <p className="mt-2 text-xs text-rose-300">{error}</p>}</div>;
}
