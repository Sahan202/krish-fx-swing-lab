-- Course sections/modules for grouping lessons.
create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  section_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique (course_id, section_order)
);

alter table public.course_sections enable row level security;

drop policy if exists "Approved students read course sections" on public.course_sections;
create policy "Approved students read course sections"
on public.course_sections for select
using (
  public.is_lms_staff()
  or (
    exists (select 1 from public.profiles where id = auth.uid() and approval_status = 'approved')
    and exists (select 1 from public.enrollments where student_id = auth.uid() and course_id = course_sections.course_id)
  )
);

drop policy if exists "Staff manage course sections" on public.course_sections;
create policy "Staff manage course sections"
on public.course_sections for all
using (public.is_lms_staff())
with check (public.is_lms_staff());

alter table public.lessons add column if not exists section_id uuid references public.course_sections(id) on delete set null;
create index if not exists course_sections_course_order_idx on public.course_sections(course_id, section_order);
create index if not exists lessons_section_id_idx on public.lessons(section_id);
