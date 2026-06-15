-- Announcements table for homepage marquee
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "active announcements readable" on public.announcements
  for select using (is_active or public.is_admin());

create policy "admin manage announcements" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- Add explanation column to questions
alter table public.questions add column if not exists explanation text;
