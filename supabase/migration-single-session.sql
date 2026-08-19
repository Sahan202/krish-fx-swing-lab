create table if not exists public.active_sessions (user_id uuid primary key references auth.users(id) on delete cascade, session_id uuid not null, updated_at timestamptz not null default now());
alter table public.active_sessions enable row level security;
drop policy if exists "Users manage own active session" on public.active_sessions;
create policy "Users manage own active session" on public.active_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
