-- Run once in Supabase SQL Editor.
-- Deleting a student profile also deletes the matching Supabase Auth user.
create or replace function public.delete_student_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.role = 'student' then
    -- Remove the approved application record as well. Otherwise its unique
    -- email blocks this deleted student from submitting a fresh application.
    delete from public.student_applications
    where lower(email) = lower((select email from auth.users where id = old.id));
    delete from auth.users where id = old.id;
  end if;
  return old;
end;
$$;

drop trigger if exists delete_student_auth_after_profile_delete on public.profiles;
create trigger delete_student_auth_after_profile_delete
after delete on public.profiles
for each row execute procedure public.delete_student_auth_user();
