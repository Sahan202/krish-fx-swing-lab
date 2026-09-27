-- Run in Supabase SQL Editor before deploying Batch 5 registration support.
begin;

alter table public.profiles drop constraint if exists profiles_badge_check;
alter table public.profiles add constraint profiles_badge_check check (badge in (1, 2, 3, 4, 5));

alter table public.student_applications drop constraint if exists student_applications_badge_check;
alter table public.student_applications add constraint student_applications_badge_check check (badge in (1, 2, 3, 4, 5));

commit;
