-- Run once for an existing project. Adds profile details, enrollments, and content permissions.
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
create table if not exists public.enrollments (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, enrolled_at timestamptz not null default now(), unique(student_id, course_id));
alter table public.enrollments enable row level security;
drop policy if exists "Students manage own enrollments" on public.enrollments;
create policy "Students manage own enrollments" on public.enrollments for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "Students update own profile" on public.profiles;
create policy "Students update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create or replace function public.prevent_role_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role is distinct from new.role and current_user not in ('postgres', 'supabase_admin') and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end; $$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute procedure public.prevent_role_change();
drop policy if exists "Admins manage course content" on public.courses;
create policy "Admins manage course content" on public.courses for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'instructor')));
drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'instructor')));
-- Tighten the original broad course policy: students can read, only staff can write.
drop policy if exists "Published courses are visible" on public.courses;
drop policy if exists "Users read published courses" on public.courses;
create policy "Users read published courses" on public.courses for select using (published = true or auth.uid() is not null);
