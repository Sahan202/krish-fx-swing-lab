-- Student application and approval workflow.
alter table public.profiles add column if not exists whatsapp_number text;
alter table public.profiles add column if not exists badge integer check (badge in (1, 2));
alter table public.profiles add column if not exists approval_status text not null default 'approved' check (approval_status in ('pending', 'approved', 'rejected'));
create index if not exists profiles_approval_status_idx on public.profiles (approval_status);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name, whatsapp_number, badge, approval_status) values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'whatsapp_number', nullif(new.raw_user_meta_data->>'badge', '')::integer, 'pending'); return new; end; $$;
