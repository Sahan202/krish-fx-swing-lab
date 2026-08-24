-- Per-student lesson/video allowlists. Existing enrolled students keep their
-- full-course access until a super admin configures an allowlist for a course.
create table if not exists public.student_video_permissions (
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);
create index if not exists student_video_permissions_lesson_idx on public.student_video_permissions (lesson_id);
alter table public.student_video_permissions enable row level security;

drop policy if exists "Students read own video permissions" on public.student_video_permissions;
create policy "Students read own video permissions" on public.student_video_permissions for select using (student_id = auth.uid());
drop policy if exists "Super admins read video permissions" on public.student_video_permissions;
create policy "Super admins read video permissions" on public.student_video_permissions for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));
drop policy if exists "Super admins grant video permissions" on public.student_video_permissions;
create policy "Super admins grant video permissions" on public.student_video_permissions for insert with check (
  granted_by = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  and exists (select 1 from public.profiles where id = student_id and role = 'student')
);
drop policy if exists "Super admins revoke video permissions" on public.student_video_permissions;
create policy "Super admins revoke video permissions" on public.student_video_permissions for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));

create or replace function public.can_access_lesson(target_lesson_id uuid, target_course_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_lms_staff() or (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'student' and approval_status = 'approved')
    and exists (select 1 from public.enrollments where student_id = auth.uid() and course_id = target_course_id)
    and exists (select 1 from public.courses where id = target_course_id and published = true)
    and (
      not exists (
        select 1 from public.student_video_permissions permission
        join public.lessons configured_lesson on configured_lesson.id = permission.lesson_id
        where permission.student_id = auth.uid() and configured_lesson.course_id = target_course_id
      )
      or exists (select 1 from public.student_video_permissions where student_id = auth.uid() and lesson_id = target_lesson_id)
    )
  );
$$;
revoke all on function public.can_access_lesson(uuid, uuid) from public;
grant execute on function public.can_access_lesson(uuid, uuid) to authenticated;
drop policy if exists "Approved enrolled students read lessons" on public.lessons;
drop policy if exists "Students read permitted lessons" on public.lessons;
create policy "Students read permitted lessons" on public.lessons for select using (public.can_access_lesson(id, course_id));
