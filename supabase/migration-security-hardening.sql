-- Production security hardening for Krish FX Swing Lab.
-- Run this once in the Supabase SQL Editor after the earlier migrations.

-- A user may edit normal profile fields, but cannot grant themselves a role,
-- change their approval state, or change their own badge through the browser API.
create or replace function public.prevent_protected_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user not in ('postgres', 'supabase_admin')
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    new.role := old.role;
    new.approval_status := old.approval_status;
    new.badge := old.badge;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields
before update on public.profiles
for each row execute procedure public.prevent_protected_profile_changes();

-- Reusable staff check.  Security-definer avoids RLS recursion while only
-- returning a boolean about the currently authenticated user.
create or replace function public.is_lms_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('instructor', 'admin', 'super_admin')
  );
$$;

-- Students must not be able to read unpublished course drafts.
drop policy if exists "Published courses are visible" on public.courses;
drop policy if exists "Users read published courses" on public.courses;
create policy "Published courses or staff read courses"
on public.courses for select
using (published = true or public.is_lms_staff());

-- Only staff can create/change content.  Include the dedicated super_admin role.
drop policy if exists "Admins manage course content" on public.courses;
create policy "Staff manage course content"
on public.courses for all
using (public.is_lms_staff())
with check (public.is_lms_staff());

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Staff manage lessons"
on public.lessons for all
using (public.is_lms_staff())
with check (public.is_lms_staff());

-- A lesson is visible only to approved students enrolled in its published course,
-- or to staff. This also prevents VdoCipher IDs being enumerated through the API.
drop policy if exists "Lessons are visible to signed in users" on public.lessons;
create policy "Approved enrolled students read lessons"
on public.lessons for select
using (
  public.is_lms_staff()
  or (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and approval_status = 'approved'
    )
    and exists (
      select 1 from public.enrollments
      where student_id = auth.uid() and course_id = lessons.course_id
    )
    and exists (
      select 1 from public.courses
      where id = lessons.course_id and published = true
    )
  )
);
