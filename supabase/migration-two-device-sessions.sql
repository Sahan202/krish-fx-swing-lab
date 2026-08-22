-- Allow each student account to use at most two registered devices.
create table if not exists public.active_device_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  session_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id)
);
alter table public.active_device_sessions enable row level security;
drop policy if exists "Users manage own device sessions" on public.active_device_sessions;
create policy "Users manage own device sessions"
on public.active_device_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create index if not exists active_device_sessions_user_idx on public.active_device_sessions(user_id);