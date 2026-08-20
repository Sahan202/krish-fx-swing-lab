-- Run once in the Supabase SQL Editor. Server-side anti-spam rate limiting.
create table if not exists public.signup_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

alter table public.signup_rate_limits enable row level security;

create or replace function public.consume_signup_rate_limit(
  p_bucket_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  entry public.signup_rate_limits;
begin
  if length(coalesce(p_bucket_key, '')) < 16
    or p_max_attempts not between 1 and 100
    or p_window_seconds not between 60 and 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.signup_rate_limits (bucket_key, attempts)
  values (p_bucket_key, 0)
  on conflict (bucket_key) do nothing;

  select * into entry
  from public.signup_rate_limits
  where bucket_key = p_bucket_key
  for update;

  if entry.window_started_at < now() - make_interval(secs => p_window_seconds) then
    update public.signup_rate_limits
    set window_started_at = now(), attempts = 1, updated_at = now()
    where bucket_key = p_bucket_key;
    return true;
  end if;

  if entry.attempts >= p_max_attempts then
    return false;
  end if;

  update public.signup_rate_limits
  set attempts = attempts + 1, updated_at = now()
  where bucket_key = p_bucket_key;
  return true;
end;
$$;

revoke all on function public.consume_signup_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_signup_rate_limit(text, integer, integer) to service_role;
