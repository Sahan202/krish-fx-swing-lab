-- Run once in Supabase SQL Editor. Super Admin audit trail.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs (actor_id);
alter table public.admin_audit_logs enable row level security;
-- No browser policies: entries are written/read only by secure Super Admin server routes.
