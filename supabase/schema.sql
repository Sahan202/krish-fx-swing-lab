-- Krish FX Swing Lab LMS database
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  bio text,
  role text not null default 'student' check (role in ('student', 'instructor', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  level text not null default 'Beginner',
  thumbnail_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  vimeo_video_id text,
  lesson_order integer not null default 0,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(student_id, course_id)
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.student_progress enable row level security;
alter table public.enrollments enable row level security;

create policy "Students can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Published courses are visible" on public.courses for select using (published = true or auth.uid() is not null);
create policy "Lessons are visible to signed in users" on public.lessons for select using (auth.uid() is not null);
create policy "Students manage own progress" on public.student_progress for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Students manage own enrollments" on public.enrollments for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Admins manage course content" on public.courses for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'instructor')));
create policy "Admins manage lessons" on public.lessons for all using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'instructor')));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name'); return new; end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.courses (title, slug, description, level, published) values
('Swing Trading Foundations', 'swing-trading-foundations', 'Build a strong foundation in market structure and risk.', 'Beginner', true)
on conflict (slug) do nothing;
