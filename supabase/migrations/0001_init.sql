-- Jobo Classes schema. Run in Supabase SQL Editor or via supabase CLI.
create extension if not exists "pgcrypto";

-- ===== Tables =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price_inr integer not null default 0,
  thumbnail_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Video metadata is public (for listings); the actual URL lives in video_sources (admin/server only).
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  duration_minutes integer,
  position integer not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.video_sources (
  video_id uuid primary key references public.videos(id) on delete cascade,
  url text not null
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.note_files (
  note_id uuid primary key references public.notes(id) on delete cascade,
  url text not null
);

create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 30,
  position integer not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  question text not null,
  options jsonb not null, -- e.g. ["A","B","C","D"]
  correct_index integer not null,
  marks numeric not null default 1,
  negative_marks numeric not null default 0,
  position integer not null default 0
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  razorpay_order_id text unique,
  razorpay_payment_id text,
  amount_inr integer not null,
  status text not null default 'created' check (status in ('created','paid','failed')),
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_id uuid references public.payments(id),
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  score numeric not null,
  total numeric not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

-- ===== Helper functions =====
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.has_course_access(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from enrollments where user_id = auth.uid() and course_id = cid
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Row Level Security =====
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.videos enable row level security;
alter table public.video_sources enable row level security;
alter table public.notes enable row level security;
alter table public.note_files enable row level security;
alter table public.mock_tests enable row level security;
alter table public.questions enable row level security;
alter table public.payments enable row level security;
alter table public.enrollments enable row level security;
alter table public.test_attempts enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid());

create policy "published courses readable" on public.courses for select using (is_published or public.is_admin());
create policy "admin manage courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());

create policy "video metadata readable" on public.videos for select
  using (exists (select 1 from courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "admin manage videos" on public.videos for all using (public.is_admin()) with check (public.is_admin());
-- URLs: admin only; students get them via server routes (service role) after access check
create policy "admin manage video sources" on public.video_sources for all using (public.is_admin()) with check (public.is_admin());

create policy "note metadata readable" on public.notes for select
  using (exists (select 1 from courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "admin manage notes" on public.notes for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage note files" on public.note_files for all using (public.is_admin()) with check (public.is_admin());

create policy "test metadata readable" on public.mock_tests for select
  using (exists (select 1 from courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "admin manage tests" on public.mock_tests for all using (public.is_admin()) with check (public.is_admin());
-- Questions (incl. answers) admin only; served to students via server route without answers
create policy "admin manage questions" on public.questions for all using (public.is_admin()) with check (public.is_admin());

create policy "own payments" on public.payments for select using (user_id = auth.uid() or public.is_admin());
create policy "own enrollments" on public.enrollments for select using (user_id = auth.uid() or public.is_admin());
create policy "own attempts" on public.test_attempts for select using (user_id = auth.uid() or public.is_admin());
