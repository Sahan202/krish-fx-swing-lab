-- Run once after migration-audit-logs.sql. Adds role labels for the unified LMS activity report.
alter table public.admin_audit_logs add column if not exists actor_role text;
create index if not exists admin_audit_logs_actor_role_idx on public.admin_audit_logs (actor_role);
