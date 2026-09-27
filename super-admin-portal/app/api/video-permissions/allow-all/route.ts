import { NextRequest, NextResponse } from 'next/server';
import { audit, requireSuperAdmin, serviceClient } from '@/lib/admin-audit';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperAdmin(request);
    if (!actor) return NextResponse.json({ error: 'Super Admin access is required.' }, { status: 403 });
    const body = await request.json();
    const courseId = body?.courseId;
    if (typeof courseId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
      return NextResponse.json({ error: 'A valid course is required.' }, { status: 400 });
    }
    const db = serviceClient();
    const { data: course, error: courseError } = await db.from('courses').select('id').eq('id', courseId).maybeSingle();
    if (courseError) throw courseError;
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    const lessonIds: string[] = [];
    // Paginate so courses exceeding the API row limit are fully included.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from('lessons').select('id').eq('course_id', courseId).order('id').range(offset, offset + 499);
      if (error) throw error;
      lessonIds.push(...(data ?? []).map((lesson) => lesson.id));
      if (!data || data.length < 500) break;
    }
    if (lessonIds.length) {
      // No course allowlist means normal full-course access; enrollment still applies.
      const { error } = await db.from('student_video_permissions').delete().in('lesson_id', lessonIds);
      if (error) throw error;
    }
    await audit(actor, 'VIDEO_PERMISSIONS_ALLOWED_ALL', 'course', courseId, { lessonCount: lessonIds.length });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not allow all videos. Please try again.' }, { status: 500 });
  }
}
