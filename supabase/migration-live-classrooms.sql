-- Secure live-class data model. Apply this migration in Supabase before use.
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  vdocipher_live_id text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.live_speaker_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','approved','connected','ended','rejected','cancelled')),
  offer jsonb,
  answer jsonb,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists live_one_open_request_per_student on public.live_speaker_requests(session_id,student_id) where status in ('waiting','approved','connected');
create unique index if not exists live_one_active_speaker on public.live_speaker_requests(session_id) where status in ('approved','connected');
alter table public.live_sessions enable row level security;
alter table public.live_speaker_requests enable row level security;
-- No direct policies: both LMS and portal use authorized server routes.
