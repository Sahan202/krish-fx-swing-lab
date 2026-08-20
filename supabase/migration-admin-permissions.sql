-- Run once in Supabase SQL Editor.
-- 1) Add a dedicated super_admin role.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'instructor', 'admin', 'super_admin'));

-- 2) Fine-grained permissions for Main Admin accounts.
create table if not exists public.admin_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  manage_students boolean not null default false,
  manage_content boolean not null default false,
  manage_applications boolean not null default false,
  view_reports boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_permissions enable row level security;

-- IMPORTANT: replace the email with YOUR current Super Admin email, then run it.
-- update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL@gmail.com');
