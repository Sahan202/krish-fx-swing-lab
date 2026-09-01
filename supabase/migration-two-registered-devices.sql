-- Allow each account to register at most two devices while preserving one active session.
create table if not exists public.lms_registered_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_ip_address text,
  user_agent text,
  primary key (user_id, device_id_hash),
  constraint lms_registered_devices_hash_check check (device_id_hash ~ '^[a-f0-9]{64}$')
);

alter table public.active_sessions
  add column if not exists device_id_hash text;

alter table public.lms_registered_devices enable row level security;

drop policy if exists "Users view own registered devices" on public.lms_registered_devices;
create policy "Users view own registered devices"
  on public.lms_registered_devices
  for select
  using (auth.uid() = user_id);

create or replace function public.register_lms_device(
  p_device_hash text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  registered_count integer;
begin
  if current_user_id is null or p_device_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  -- Serialize registrations per user so concurrent logins cannot exceed the limit.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if exists (
    select 1 from public.lms_registered_devices
    where user_id = current_user_id and device_id_hash = p_device_hash
  ) then
    update public.lms_registered_devices
      set last_seen_at = now(),
          last_ip_address = left(p_ip_address, 128),
          user_agent = left(p_user_agent, 512)
      where user_id = current_user_id and device_id_hash = p_device_hash;
    return true;
  end if;

  select count(*) into registered_count
  from public.lms_registered_devices
  where user_id = current_user_id;

  if registered_count >= 2 then
    return false;
  end if;

  insert into public.lms_registered_devices (
    user_id, device_id_hash, last_ip_address, user_agent
  ) values (
    current_user_id, p_device_hash, left(p_ip_address, 128), left(p_user_agent, 512)
  );

  return true;
end;
$$;

revoke all on function public.register_lms_device(text, text, text) from public;
grant execute on function public.register_lms_device(text, text, text) to authenticated;

create index if not exists lms_registered_devices_user_last_seen_idx
  on public.lms_registered_devices (user_id, last_seen_at desc);