-- Additive, repeatable migration from the former live-video/WebRTC model to Zoom.
-- Existing live rows and speaker-request history are intentionally preserved.
begin;

alter table public.live_sessions add column if not exists zoom_join_url text;
alter table public.live_sessions alter column vdocipher_live_id drop not null;

create index if not exists live_sessions_course_status_scheduled_idx
  on public.live_sessions (course_id, status, scheduled_at);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'live_sessions_zoom_join_url_https_check'
      and conrelid = 'public.live_sessions'::regclass
  ) then
    alter table public.live_sessions
      add constraint live_sessions_zoom_join_url_https_check
      check (zoom_join_url is null or zoom_join_url ~* '^https://([a-z0-9-]+\.)*(zoom\.us|zoomgov\.com)(/|$)') not valid;
  end if;
end $$;

alter table public.live_sessions validate constraint live_sessions_zoom_join_url_https_check;
alter table public.live_sessions enable row level security;

commit;
